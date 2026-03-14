import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for PDF/HTML content

// Middleware to allow embedding (e.g., in Google Sites)
app.use((req, res, next) => {
  // Allow embedding from Google Sites and other domains
  res.setHeader('Content-Security-Policy', "frame-ancestors https://sites.google.com https://*.googleusercontent.com *");
  // Remove X-Frame-Options if present (it conflicts with CSP frame-ancestors and defaults to SAMEORIGIN in some setups)
  res.removeHeader('X-Frame-Options');
  next();
});

// API Routes

// Prospect Registration Endpoint
app.post('/api/prospects/register', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate a free trial token
    // Format: TRIAL-TIMESTAMP-RANDOM
    const token = `TRIAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Configure Nodemailer
    // Use environment variables for SMTP, or fallback to Ethereal for testing if not provided
    // Note: In a real production app, you would use a dedicated email service (SendGrid, AWS SES, etc.)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'ethereal_user', 
        pass: process.env.SMTP_PASS || 'ethereal_pass', 
      },
    });

    // Email Content
    const mailOptions = {
      from: process.env.SMTP_FROM || '"WeVerify Team" <no-reply@weverify.works>',
      to: email,
      subject: 'Welcome to WeVerify - Your Free Trial Token Inside!',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">WeVerify<span style="color: #14b8a6;">.works</span></h1>
          </div>
          
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Welcome to the future of verification.</h2>
            <p style="color: #475569; line-height: 1.6;">Thank you for your interest in WeVerify. We are excited to offer you a <strong>Free Trial Token</strong> to experience our platform firsthand.</p>
            
            <div style="background-color: #f0fdfa; border: 1px dashed #14b8a6; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold;">Your Free Token</p>
              <h3 style="margin: 12px 0; font-size: 28px; color: #0f766e; font-family: monospace; letter-spacing: 2px; font-weight: bold;">${token}</h3>
              <p style="margin: 0; font-size: 13px; color: #0d9488;">Valid for one standard verification request.</p>
            </div>

            <p style="color: #475569; line-height: 1.6;">To use your token:</p>
            <ol style="color: #475569; line-height: 1.6; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Log in to your dashboard (or create an account).</li>
              <li style="margin-bottom: 8px;">Navigate to the "Redeem Token" section.</li>
              <li style="margin-bottom: 8px;">Enter the code above to add a credit to your account.</li>
            </ol>
            
            <div style="margin-top: 32px; text-align: center;">
              <a href="${process.env.APP_URL || 'https://weverify.works'}/#/login" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 14px;">Log In to Redeem</a>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} WeVerify.works. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Send Email
    let emailSent = false;
    let emailConfigured = false;

    if (process.env.SMTP_HOST) {
        emailConfigured = true;
        try {
            await transporter.sendMail(mailOptions);
            emailSent = true;
            console.log(`Email sent to ${email}`);
        } catch (emailError) {
            console.error('Failed to send email via SMTP:', emailError);
            // We still return success so the user gets the token, but emailSent will be false
        }
    } else {
        console.log('SMTP not configured. Skipping email send. Token generated:', token);
    }

    res.json({ 
      success: true, 
      message: 'Prospect registered', 
      token: token, 
      emailSent,
      emailConfigured 
    });

  } catch (error: any) {
    console.error('Prospect Registration Error:', error.message);
    res.status(500).json({ error: 'Failed to register prospect' });
  }
});

app.post('/api/osticket/create-ticket', async (req, res) => {
  const { 
    applicantName, 
    applicantEmail, 
    subject, 
    message, 
    ip 
  } = req.body;

  try {
    const osTicketUrl = process.env.OSTICKET_URL || "https://ampcgfoundation.pro/amphds1/";
    const apiKey = process.env.OSTICKET_API_KEY;

    if (!apiKey) {
      console.warn('osTicket API Key is not configured.');
      return res.status(500).json({ error: 'osTicket configuration missing' });
    }

    // Ensure URL ends with /api/tickets.json
    let apiUrl = osTicketUrl;
    if (!apiUrl.endsWith('/')) apiUrl += '/';
    apiUrl += 'api/tickets.json';

    const payload = {
      alert: true,
      autorespond: true,
      source: 'API',
      name: applicantName,
      email: applicantEmail || 'system@weverify.works',
      subject: subject,
      ip: ip || '127.0.0.1',
      message: message.includes('<') ? `data:text/html,${message}` : message
    };

    console.log(`Creating osTicket ticket at: ${apiUrl}`);
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 8000 // 8 second timeout for osTicket
    });

    console.log('osTicket Ticket Created:', response.data);
    res.json({ success: true, ticketId: response.data });
  } catch (error: any) {
    console.error('osTicket Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create ticket', 
      details: error.response?.data || error.message 
    });
  }
});

// Stripe Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const { email, plan } = req.body;
  let priceId = '';
  let tokens = 0;

  switch (plan) {
    case 'PERSONAL':
      priceId = process.env.STRIPE_PERSONAL_PRICE_ID || '';
      tokens = 3;
      break;
    case 'PRO':
      priceId = process.env.STRIPE_PRO_PRICE_ID || '';
      tokens = 25;
      break;
    case 'PREMIUM':
      priceId = process.env.STRIPE_PREMIUM_PRICE_ID || '';
      tokens = 100;
      break;
    default:
      return res.status(400).json({ error: 'Invalid plan selected' });
  }

  if (!priceId) {
    return res.status(500).json({ error: `Stripe Price ID for ${plan} is missing` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // Change to 'payment' for one-time token purchase if preferred, or keep 'subscription' if that's the model. User said "Personal (monthly subscription not required)" so 'payment' is better for Personal.
      success_url: `${req.headers.origin}/#/dashboard?session_id={CHECKOUT_SESSION_ID}&tokens=${tokens}`,
      cancel_url: `${req.headers.origin}/#/dashboard`,
      customer_email: email,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Google Apps Script Automation Proxy - Recreated for maximum reliability
app.all('/api/automation/dispatch', async (req, res) => {
  const automationUrl = process.env.AUTOMATION_URL || "https://script.google.com/macros/s/AKfycbzvU6juIsZ4Cfz1Avl9_oyHsVCCsZnpJg8G0z9pMWF3-_Mv25F3ZoD1m9tBkdC3gyRcFQ/exec";
  
  if (!automationUrl) {
    return res.status(500).json({ error: 'Automation URL not configured' });
  }

  console.log(`[Automation] Dispatching ${req.method} to script...`);

  try {
    // We use a clean axios instance for this request
    const instance = axios.create({
      timeout: 40000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400 // GAS returns 302, which we want to follow
    });

    let result;
    if (req.method === 'POST') {
      // Prepare payload
      const payload = {
        ...req.body,
        email: req.body.recipientEmail || req.body.email,
        timestamp: new Date().toISOString()
      };

      // GAS doPost usually redirects to a GET URL. 
      // Axios follows 302 by default with a GET request to the new location.
      result = await instance.post(automationUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      result = await instance.get(automationUrl, { params: req.query });
    }

    // Check if we ended up at a Google Login page
    const finalUrl = result.request?.res?.responseUrl || '';
    if (finalUrl.includes('accounts.google.com')) {
      console.error('[Automation] Blocked by Google Login. Script must be "Access: Anyone".');
      return res.status(401).json({ 
        error: 'Authentication Required', 
        details: 'The script is private. Change deployment to "Access: Anyone".' 
      });
    }

    console.log(`[Automation] Success. Status: ${result.status}`);
    return res.json({ success: true, data: result.data });

  } catch (error: any) {
    console.error('[Automation] Critical Failure:', error.message);
    
    // Even if it "fails" with a redirect error, the script often still executed
    if (error.code === 'ERR_FR_TOO_MANY_REDIRECTS' || error.response?.status === 302) {
      return res.json({ success: true, message: 'Dispatched (Redirect handled)' });
    }

    return res.status(error.response?.status || 500).json({
      error: 'Dispatch failed',
      details: error.message,
      code: error.code
    });
  }
});

// Generic Email Sending Endpoint
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, text, fromName, cc, bcc } = req.body;

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html/text' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass',
      },
    });

    const mailOptions = {
      from: fromName ? `"${fromName}" <verifications@weverify.works>` : (process.env.SMTP_FROM || '"WeVerify Team" <verifications@weverify.works>'),
      to,
      cc,
      bcc,
      subject,
      html,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    res.json({ success: true, message: 'Email sent successfully' });

  } catch (error: any) {
    console.error('Email Send Error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  
  // SPA fallback for production
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
