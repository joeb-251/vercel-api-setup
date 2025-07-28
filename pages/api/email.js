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
    // Create email transport
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Prepare email content
    const emailContent = `# Your 90-Day Objectives Report

Thank you for using our 90-Day Objectives Generator!

## Your Selected Profile
${selectedProfile || 'Not specified'}

## Initial Objectives
${initialResponse}

## Refined Objectives
${refinedResponse}

## Your Feedback
- Experience Rating: ${experienceRating}/10
- Would Recommend: ${recommendRating}/10

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
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}