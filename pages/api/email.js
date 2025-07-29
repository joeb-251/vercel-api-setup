import nodemailer from 'nodemailer';
import { marked } from 'marked';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    email, 
    sessionId, 
    initialResponse, 
    refinedResponse,
    selectedProfile,
    experienceRating,
    recommendRating
  } = req.body;

  console.log(`API: /email sending report to ${email} for session ${sessionId}`);

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check for required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM_EMAIL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        return res.status(500).json({ error: `Server configuration error: ${envVar} not set` });
      }
    }

    // Create email transport - fixed method name from createTransporter to createTransport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Prepare email content - added defensive checks for nullable fields
    const emailContent = `# Your 90-Day Objectives Report

Thank you for using our 90-Day Objectives Generator!

## Your Selected Profile
${selectedProfile || 'Not specified'}

## Initial Objectives
${initialResponse || 'No initial objectives generated'}

## Refined Objectives
${refinedResponse || 'No refined objectives generated'}

## Your Feedback
- Experience Rating: ${experienceRating || 'Not provided'}/10
- Would Recommend: ${recommendRating || 'Not provided'}/10

Session ID: ${sessionId}
Generated on: ${new Date().toLocaleDateString()}
    `;

    // Convert markdown to HTML for email
    const htmlContent = marked(emailContent);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: '90-Day Objectives Report',
      text: emailContent,
      html: htmlContent
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '✓ Set' : '✗ Missing',
        password: process.env.SMTP_PASSWORD ? '✓ Set' : '✗ Missing',
        from: process.env.SMTP_FROM_EMAIL
      }
    });
  }
}