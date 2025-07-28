import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialResponse, setInitialResponse] = useState('');
  const [refinedResponse, setRefinedResponse] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [experienceRating, setExperienceRating] = useState(0);
  const [recommendRating, setRecommendRating] = useState(0);
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const profiles = [
    { id: 'startup', name: 'Startup Tech Lead' },
    { id: 'enterprise', name: 'Enterprise Manager' },
    { id: 'product', name: 'Product Manager' }
  ];

  useEffect(() => {
    // Generate a unique session ID when the component mounts
    const uniqueId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(uniqueId);
    console.log(`Session initialized with ID: ${uniqueId}`);
  }, []);

  const getInitialObjectives = async () => {
    setLoading(true);
    console.log('Requesting initial objectives from Claude...');
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Suggest 5 effective 90-day objectives for a manager at a tech company. Format your response as a markdown list with brief explanations for each objective.",
          sessionId
        })
      });

      if (!response.ok) throw new Error('Failed to fetch from Claude API');
      
      const data = await response.json();
      setInitialResponse(data.response);
      console.log('Received initial objectives from Claude');
      setStep(2);
    } catch (error) {
      console.error('Error fetching initial objectives:', error);
      alert('Error fetching objectives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRefinedObjectives = async () => {
    if (!selectedProfile) {
      alert('Please select a profile first');
      return;
    }

    setLoading(true);
    console.log(`Requesting refined objectives for profile: ${selectedProfile}...`);
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `I've selected the role of ${profiles.find(p => p.id === selectedProfile).name}. Based on this role, please refine the following 90-day objectives to be more specific and relevant:\n\n${initialResponse}`,
          sessionId,
          context: {
            initialResponse,
            selectedProfile
          }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch refined objectives');
      
      const data = await response.json();
      setRefinedResponse(data.response);
      console.log('Received refined objectives from Claude');
      
      // Log to Airtable when we get refined objectives
      await logToAirtable({
        sessionId,
        initialResponse,
        selectedProfile,
        refinedResponse: data.response
      });
      
      setStep(3);
    } catch (error) {
      console.error('Error fetching refined objectives:', error);
      alert('Error refining objectives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitRatings = async () => {
    if (experienceRating === 0 || recommendRating === 0) {
      alert('Please provide both ratings');
      return;
    }

    setLoading(true);
    console.log(`Submitting ratings: Experience=${experienceRating}, Recommend=${recommendRating}`);
    
    try {
      await logToAirtable({
        sessionId,
        experienceRating,
        recommendRating
      });
      
      console.log('Ratings submitted successfully');
      setStep(4);
    } catch (error) {
      console.error('Error submitting ratings:', error);
      alert('Error submitting ratings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReport = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    console.log(`Sending email report to: ${email}`);
    
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sessionId,
          initialResponse,
          refinedResponse,
          selectedProfile: profiles.find(p => p.id === selectedProfile)?.name,
          experienceRating,
          recommendRating
        })
      });

      if (!response.ok) throw new Error('Failed to send email');
      
      await logToAirtable({
        sessionId,
        email
      });
      
      console.log('Email sent successfully');
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logToAirtable = async (data) => {
    console.log('Logging to Airtable:', data);
    
    try {
      const response = await fetch('/api/airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to log to Airtable');
      
      const result = await response.json();
      console.log('Airtable log result:', result);
      return result;
    } catch (error) {
      console.error('Error logging to Airtable:', error);
      // Don't fail the main flow if Airtable logging fails
      return null;
    }
  };

  const renderRatingScale = (value, setValue, label) => {
    return (
      <div className={styles.ratingContainer}>
        <h3>{label}</h3>
        <div className={styles.ratingScale}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              className={`${styles.ratingButton} ${value === num ? styles.selected : ''}`}
              onClick={() => setValue(num)}
            >
              {num}
            </button>
          ))}
        </div>
        <div className={styles.ratingLabels}>
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>90-Day Objectives Generator</title>
        <meta name="description" content="Generate personalized 90-day objectives for tech managers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>90-Day Objectives Generator</h1>

        {step === 1 && (
          <div className={styles.section}>
            <p className={styles.description}>
              Get personalized 90-day objectives for a tech manager role.
            </p>
            <button 
              className={styles.button}
              onClick={getInitialObjectives}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Objectives'}
            </button>
          </div>
        )}

        {step >= 2 && (
          <div className={styles.section}>
            <h2>Initial Objectives</h2>
            <div className={styles.responseBox}>
              <div dangerouslySetInnerHTML={{ __html: initialResponse.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.section}>
            <h2>Refine for Your Role</h2>
            <p>Select your profile to get more tailored objectives:</p>
            <div className={styles.profileContainer}>
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  className={`${styles.profileButton} ${selectedProfile === profile.id ? styles.selected : ''}`}
                  onClick={() => setSelectedProfile(profile.id)}
                >
                  {profile.name}
                </button>
              ))}
            </div>
            <button 
              className={styles.button}
              onClick={getRefinedObjectives}
              disabled={loading || !selectedProfile}
            >
              {loading ? 'Refining...' : 'Refine Objectives'}
            </button>
          </div>
        )}

        {step >= 3 && (
          <div className={styles.section}>
            <h2>Refined Objectives for {profiles.find(p => p.id === selectedProfile)?.name}</h2>
            <div className={styles.responseBox}>
              <div dangerouslySetInnerHTML={{ __html: refinedResponse.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.section}>
            <h2>Rate Your Experience</h2>
            {renderRatingScale(experienceRating, setExperienceRating, 'How satisfied are you with these objectives?')}
            {renderRatingScale(recommendRating, setRecommendRating, 'Would you recommend this tool to others?')}
            <button 
              className={styles.button}
              onClick={submitRatings}
              disabled={loading || experienceRating === 0 || recommendRating === 0}
            >
              {loading ? 'Submitting...' : 'Submit Ratings'}
            </button>
          </div>
        )}

        {step === 4 && !submitSuccess && (
          <div className={styles.section}>
            <h2>Get Your Personalized Report</h2>
            <p>Enter your email to receive a copy of your objectives:</p>
            <input 
              type="email"
              placeholder="your@email.com"
              className={styles.emailInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              className={styles.button}
              onClick={sendEmailReport}
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        )}

        {submitSuccess && (
          <div className={styles.section}>
            <h2>Thank You!</h2>
            <p>Your personalized objectives have been sent to your email.</p>
            <p>We appreciate your feedback and hope you found this tool valuable.</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Powered by Vercel API Setup Demo</p>
      </footer>
    </div>
  );
}