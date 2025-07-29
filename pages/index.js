import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { marked } from 'marked';

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialResponse, setInitialResponse] = useState('');
  const [refinedResponse, setRefinedResponse] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [experienceRating, setExperienceRating] = useState(0);
  const [recommendRating, setRecommendRating] = useState(0);
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // References for scrolling
  const sectionsRef = useRef({});
  
  const profiles = [
    { 
      id: 'startup', 
      name: 'Startup Tech Lead',
      description: 'Fast-paced environment with focus on rapid iteration and growth'
    },
    { 
      id: 'enterprise', 
      name: 'Enterprise Manager',
      description: 'Established organization with complex stakeholder management'
    },
    { 
      id: 'product', 
      name: 'Product Manager',
      description: 'User-focused role balancing business needs and technical constraints'
    }
  ];

  useEffect(() => {
    // Generate a unique session ID when the component mounts
    const uniqueId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(uniqueId);
    console.log(`Session initialized with ID: ${uniqueId}`);
    
    // Retrieve email from localStorage if available
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);
  
  // Scroll to section when step changes
  useEffect(() => {
    const sectionRef = sectionsRef.current[`step${step}`];
    if (sectionRef) {
      sectionRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const getInitialObjectives = async () => {
    setLoading(true);
    setError(null);
    console.log('Requesting initial objectives from Claude...');
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Suggest 5 effective 90-day objectives for a manager at a tech company. Each objective should be specific, measurable, and impactful. Format your response as a markdown list with a brief explanation for each objective that includes why it matters and how to measure success.",
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch from Claude API');
      }
      
      const data = await response.json();
      setInitialResponse(data.response);
      console.log('Received initial objectives from Claude');
      
      // Log initial objectives to Airtable
      await logToAirtable({
        sessionId,
        initialResponse: data.response
      });
      
      setStep(2);
    } catch (error) {
      console.error('Error fetching initial objectives:', error);
      setError(`Error generating objectives: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getRefinedObjectives = async () => {
    if (!selectedProfile) {
      setError('Please select a profile first');
      return;
    }

    setLoading(true);
    setError(null);
    const profile = profiles.find(p => p.id === selectedProfile);
    console.log(`Requesting refined objectives for profile: ${profile.name}...`);
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `I've selected the role of ${profile.name} (${profile.description}). Based on this specific role and its context, please refine the following 90-day objectives to be more relevant, specific, and impactful. Focus on the unique challenges and opportunities of this role:\n\n${initialResponse}`,
          sessionId,
          context: {
            initialResponse,
            selectedProfile: profile.name,
            profileDescription: profile.description
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch refined objectives');
      }
      
      const data = await response.json();
      setRefinedResponse(data.response);
      console.log('Received refined objectives from Claude');
      
      // Log to Airtable when we get refined objectives
      await logToAirtable({
        sessionId,
        initialResponse,
        selectedProfile: profile.name,
        profileDescription: profile.description,
        refinedResponse: data.response
      });
      
      setStep(3);
    } catch (error) {
      console.error('Error fetching refined objectives:', error);
      setError(`Error refining objectives: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const submitRatings = async () => {
    if (experienceRating === 0 || recommendRating === 0) {
      setError('Please provide both ratings');
      return;
    }

    setLoading(true);
    setError(null);
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
      setError(`Error submitting ratings: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailReport = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`Sending email report to: ${email}`);
    
    // Save email to localStorage for convenience
    localStorage.setItem('userEmail', email);
    
    try {
      const profile = profiles.find(p => p.id === selectedProfile);
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sessionId,
          initialResponse,
          refinedResponse,
          selectedProfile: profile?.name,
          profileDescription: profile?.description,
          experienceRating,
          recommendRating
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      await logToAirtable({
        sessionId,
        email
      });
      
      console.log('Email sent successfully');
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(`Error sending email: ${error.message}. Please try again.`);
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable error details:', errorData);
      }
      
      const result = await response.json();
      console.log('Airtable log result:', result);
      return result;
    } catch (error) {
      console.error('Error logging to Airtable:', error);
      // Don't fail the main flow if Airtable logging fails
      return null;
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
              aria-label={`Rating ${num} out of 10`}
            >
              {num}
            </button>
          ))}
        </div>
        <div className={styles.ratingLabels}>
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        {value > 0 && (
          <div className={styles.selectedRating}>
            You selected: <strong>{value}/10</strong>
          </div>
        )}
      </div>
    );
  };

  const restartFlow = () => {
    // Keep the session ID but reset all other state
    setStep(1);
    setInitialResponse('');
    setRefinedResponse('');
    setSelectedProfile('');
    setExperienceRating(0);
    setRecommendRating(0);
    setSubmitSuccess(false);
    setError(null);
    // Don't reset email to improve user experience
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
        
        {/* Progress indicator */}
        <div className={styles.progressContainer}>
          {[1, 2, 3, 4].map(stepNum => (
            <div 
              key={stepNum}
              className={`${styles.progressStep} ${step >= stepNum ? styles.completed : ''} ${step === stepNum ? styles.current : ''}`}
            >
              <div className={styles.stepNumber}>{stepNum}</div>
              <div className={styles.stepLabel}>
                {stepNum === 1 && "Generate"}
                {stepNum === 2 && "Refine"}
                {stepNum === 3 && "Rate"}
                {stepNum === 4 && "Complete"}
              </div>
            </div>
          ))}
        </div>
        
        {/* Error display */}
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.dismissButton}
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Initial Generation */}
        <div 
          className={`${styles.section} ${step !== 1 ? styles.completedSection : ''}`}
          ref={el => sectionsRef.current.step1 = el}
        >
          <h2>Step 1: Generate Initial Objectives</h2>
          <p className={styles.description}>
            Get personalized 90-day objectives for a tech manager role. Our AI will suggest effective goals that can be accomplished in the next quarter.
          </p>
          {step === 1 ? (
            <button 
              className={styles.button}
              onClick={getInitialObjectives}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Generating...
                </>
              ) : 'Generate Objectives'}
            </button>
          ) : (
            <div className={styles.completedStep}>
              <span className={styles.checkmark}>✓</span>
              <span>Initial objectives generated</span>
            </div>
          )}
        </div>

        {/* Step 2: Refinement */}
        {step >= 2 && (
          <div 
            className={`${styles.section} ${step > 2 ? styles.completedSection : ''}`}
            ref={el => sectionsRef.current.step2 = el}
          >
            <h2>Step 2: Refine for Your Role</h2>
            
            {/* Initial objectives display */}
            <div className={styles.responseContainer}>
              <h3>Initial Objectives</h3>
              <div 
                className={styles.responseBox}
                dangerouslySetInnerHTML={{ __html: marked(initialResponse) }} 
              />
            </div>
            
            {step === 2 && (
              <>
                <p>Select your profile to get objectives tailored to your specific role:</p>
                <div className={styles.profileContainer}>
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className={`${styles.profileCard} ${selectedProfile === profile.id ? styles.selectedCard : ''}`}
                      onClick={() => setSelectedProfile(profile.id)}
                    >
                      <h3>{profile.name}</h3>
                      <p>{profile.description}</p>
                    </div>
                  ))}
                </div>
                <button 
                  className={styles.button}
                  onClick={getRefinedObjectives}
                  disabled={loading || !selectedProfile}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Refining...
                    </>
                  ) : 'Refine Objectives'}
                </button>
              </>
            )}
            
            {step > 2 && (
              <div className={styles.completedStep}>
                <span className={styles.checkmark}>✓</span>
                <span>Objectives refined for {profiles.find(p => p.id === selectedProfile)?.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Ratings */}
        {step >= 3 && (
          <div 
            className={`${styles.section} ${step > 3 ? styles.completedSection : ''}`}
            ref={el => sectionsRef.current.step3 = el}
          >
            <h2>Step 3: Rate Your Experience</h2>
            
            {/* Refined objectives display */}
            <div className={styles.responseContainer}>
              <h3>Refined Objectives for {profiles.find(p => p.id === selectedProfile)?.name}</h3>
              <div 
                className={styles.responseBox}
                dangerouslySetInnerHTML={{ __html: marked(refinedResponse) }} 
              />
            </div>
            
            {step === 3 && (
              <>
                <div className={styles.ratingsContainer}>
                  {renderRatingScale(experienceRating, setExperienceRating, 'How satisfied are you with these objectives?')}
                  {renderRatingScale(recommendRating, setRecommendRating, 'Would you recommend this tool to others?')}
                </div>
                <button 
                  className={styles.button}
                  onClick={submitRatings}
                  disabled={loading || experienceRating === 0 || recommendRating === 0}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Submitting...
                    </>
                  ) : 'Submit Ratings'}
                </button>
              </>
            )}
            
            {step > 3 && (
              <div className={styles.completedStep}>
                <span className={styles.checkmark}>✓</span>
                <span>Ratings submitted: Experience {experienceRating}/10, Recommend {recommendRating}/10</span>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Email Report */}
        {step === 4 && (
          <div 
            className={styles.section}
            ref={el => sectionsRef.current.step4 = el}
          >
            <h2>Step 4: Get Your Personalized Report</h2>
            
            {!submitSuccess ? (
              <>
                <p>Enter your email to receive a copy of your objectives:</p>
                <div className={styles.emailInputContainer}>
                  <input 
                    type="email"
                    placeholder="your@email.com"
                    className={styles.emailInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email address"
                  />
                  <button 
                    className={styles.button}
                    onClick={sendEmailReport}
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <span className={styles.spinner}></span>
                        Sending...
                      </>
                    ) : 'Send Report'}
                  </button>
                </div>
                <p className={styles.emailDisclaimer}>
                  We'll only use your email to send this report and won't share it with third parties.
                </p>
              </>
            ) : (
              <div className={styles.successContainer}>
                <div className={styles.successIcon}>✓</div>
                <h3>Thank You!</h3>
                <p>Your personalized objectives have been sent to <strong>{email}</strong>.</p>
                <p>We appreciate your feedback and hope you found this tool valuable.</p>
                <button 
                  className={styles.secondaryButton}
                  onClick={restartFlow}
                >
                  Generate New Objectives
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Powered by Vercel API Setup Demo</p>
        <p>© {new Date().getFullYear()} | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
      </footer>
    </div>
  );
}