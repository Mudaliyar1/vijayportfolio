/**
 * Email Sender Utility
 * Uses Brevo (formerly Sendinblue) to send emails
 */
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
let apiInstance = null;

// Initialize the API client
function initBrevoClient() {
  if (apiInstance) return apiInstance;

  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error('BREVO_API_KEY is not set in environment variables');
      return null;
    }

    const apiClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey1 = apiClient.authentications['api-key'];
    apiKey1.apiKey = apiKey;

    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log('Brevo API client initialized successfully');
    return apiInstance;
  } catch (error) {
    console.error('Error initializing Brevo API client:', error);
    return null;
  }
}

/**
 * Send a verification email to a subscriber
 * @param {string} email - Subscriber's email address
 * @param {string} verificationToken - Verification token
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
async function sendVerificationEmail(email, verificationToken) {
  try {
    const api = initBrevoClient();
    if (!api) {
      console.error('Failed to initialize Brevo API client');
      return false;
    }

    const sender = {
      email: process.env.EMAIL_FROM || 'status@ftraiseai.onrender.com',
      name: 'FTRAISE AI Status'
    };

    const receivers = [
      {
        email: email
      }
    ];

    // Get the base URL from environment or use a default
    const baseUrl = process.env.STATUS_APP_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/verify/${verificationToken}`;

    const emailContent = {
      sender,
      to: receivers,
      subject: 'Verify your FTRAISE AI Status subscription',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00a8ff;">FTRAISE AI Status</h1>
          <p>Thank you for subscribing to FTRAISE AI Status updates!</p>
          <p>Please click the button below to verify your subscription:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #00a8ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Subscription
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>If you did not request this subscription, you can ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            &copy; ${new Date().getFullYear()} FTRAISE AI. All rights reserved.
          </p>
        </div>
      `
    };

    const data = await api.sendTransacEmail(emailContent);
    console.log('Verification email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Send a notification email about a new incident
 * @param {Object} incident - Incident object
 * @param {Array} subscribers - Array of subscriber objects
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
async function sendIncidentEmail(incident, subscribers) {
  try {
    const api = initBrevoClient();
    if (!api) {
      console.error('Failed to initialize Brevo API client');
      return false;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No subscribers to notify about incident');
      return true;
    }

    const sender = {
      email: process.env.EMAIL_FROM || 'status@ftraiseai.onrender.com',
      name: 'FTRAISE AI Status'
    };

    const receivers = subscribers.map(subscriber => ({
      email: subscriber.email
    }));

    // Get the base URL from environment or use a default
    const baseUrl = process.env.STATUS_APP_URL || 'http://localhost:3001';

    const emailContent = {
      sender,
      to: receivers,
      subject: `[FTRAISE AI Status] New Incident: ${incident.title}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #00a8ff;">FTRAISE AI Status</h1>
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h2 style="margin-top: 0;">New Incident Detected</h2>
            <h3>${incident.title}</h3>
            <p>${incident.description}</p>
            <p><strong>Affected components:</strong> ${incident.affectedComponents.join(', ')}</p>
            <p><strong>Started at:</strong> ${new Date(incident.startTime).toLocaleString()}</p>
            <p><strong>Severity:</strong> ${incident.severity}</p>
          </div>
          <p>View the <a href="${baseUrl}" style="color: #00a8ff;">status page</a> for more information and updates.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You're receiving this because you subscribed to FTRAISE AI status updates.
            <br>
            To unsubscribe, <a href="${baseUrl}/unsubscribe/${subscriber.unsubscribeToken}" style="color: #00a8ff;">click here</a>.
          </p>
        </div>
      `
    };

    const data = await api.sendTransacEmail(emailContent);
    console.log('Incident notification email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error sending incident notification email:', error);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendIncidentEmail
};
