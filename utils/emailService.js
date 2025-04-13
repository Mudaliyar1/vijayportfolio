const axios = require('axios');

// Get Brevo API key from environment variables
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Check if API key is available
if (!BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not defined in environment variables. Email functionality will not work.');
}

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// NOTE: To use Brevo API in production, you need to authorize your server's IP address
// Visit: https://app.brevo.com/security/authorised_ips
// For Render deployment: You need to add all Render outbound IPs to Brevo's authorized list
// See: https://render.com/docs/static-outbound-ip-addresses

/**
 * Send an email using Brevo API
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.toName - Recipient name
 * @param {String} options.subject - Email subject
 * @param {String} options.htmlContent - HTML content of the email
 * @param {String} options.textContent - Plain text content of the email
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendEmail = async (options) => {
  // Check if API key is available before attempting to send email
  if (!BREVO_API_KEY) {
    console.error('Cannot send email: BREVO_API_KEY is not defined in environment variables');
    return {
      success: false,
      error: 'Email service configuration error. Please contact the administrator.'
    };
  }

  try {
    // Try to send email via Brevo API
    const response = await axios.post(
      'https://api.sendinblue.com/v3/smtp/email',
      {
        sender: {
          name: 'FTRAISE AI',
          email: 'vijaymudaliyar224@gmail.com' // Use your verified email as sender
        },
        to: [
          {
            email: options.to,
            name: options.toName || options.to
          }
        ],
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent || 'Please view this email in a HTML compatible email client'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY
        }
      }
    );

    console.log('Email sent successfully to:', options.to);
    console.log('Brevo API response:', JSON.stringify(response.data, null, 2));
    console.log('Message ID:', response.data.messageId || 'Not provided');
    return { success: true, data: response.data };
  } catch (error) {
    // Log the error
    console.error('Error sending email:', error.response ? error.response.data : error.message);

    // Check if this is an IP authorization error
    const isIPAuthError = error.response &&
                         error.response.data &&
                         error.response.data.message &&
                         error.response.data.message.includes('unrecognised IP address');

    if (isIPAuthError) {
      // Extract the IP address from the error message
      const ipMatch = error.response.data.message.match(/unrecognised IP address ([\d.:a-f]+)/);
      const ipAddress = ipMatch ? ipMatch[1] : 'unknown';

      console.error(`\n==== BREVO API IP AUTHORIZATION ERROR ====`);
      console.error(`Your server's IP address (${ipAddress}) is not authorized in Brevo.`);
      console.error(`Please add this IP to: https://app.brevo.com/security/authorised_ips`);
      console.error(`If using Render, add all IPs from: https://render.com/docs/static-outbound-ip-addresses`);
      console.error(`====================================\n`);
    }

    // In production, we should not expose sensitive information
    if (isProduction) {
      // In production, if we can't send the email, this is a critical error
      if (isIPAuthError) {
        console.error('CRITICAL: Email sending failed due to IP authorization. Check server logs.');
      }

      // In production, we don't want to use fallback mode as it would expose OTPs
      return {
        success: false,
        fallback: false,
        error: 'Email service unavailable. Please try again later or contact support.'
      };
    } else {
      // For development/testing, log the email content to console
      console.log('\n==== EMAIL CONTENT (DEVELOPMENT MODE) ====');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('Text Content:');
      console.log(options.textContent);
      console.log('====================================\n');

      // Return a fallback response for development
      return {
        success: false,
        fallback: true,
        error: error.response ? error.response.data : error.message,
        to: options.to,
        subject: options.subject,
        textContent: options.textContent
      };
    }
  }
};

/**
 * Send OTP email for password reset
 * @param {String} email - Recipient email
 * @param {String} username - Recipient username
 * @param {String} otp - One-time password
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendPasswordResetOTP = async (email, username, otp) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #4a5568;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
          letter-spacing: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FTRAISE AI</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
          <div class="otp">${otp}</div>
          <p>This OTP will expire in 15 minutes.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>FTRAISE AI Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} FTRAISE AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    FTRAISE AI - Password Reset Request

    Hello ${username},

    We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:

    ${otp}

    This OTP will expire in 15 minutes.

    If you did not request a password reset, please ignore this email or contact support if you have concerns.

    Thank you,
    FTRAISE AI Team

    This is an automated email. Please do not reply to this message.
    © ${new Date().getFullYear()} FTRAISE AI. All rights reserved.
  `;

  return sendEmail({
    to: email,
    toName: username,
    subject: 'FTRAISE AI - Password Reset OTP',
    htmlContent,
    textContent
  });
};

/**
 * Send package inquiry confirmation email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} packageName - Name of the package inquired about
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendPackageInquiryConfirmation = async (email, name, packageName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #4a5568;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .highlight {
          font-weight: bold;
          color: #4a5568;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FTRAISE AI</h1>
        </div>
        <div class="content">
          <h2>Thank You for Your Inquiry</h2>
          <p>Hello ${name},</p>
          <p>Thank you for your interest in our <span class="highlight">${packageName}</span> package. We have received your inquiry and our team will review it as soon as possible.</p>
          <p>We typically respond to inquiries within 24-48 hours during business days.</p>
          <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
          <p>Thank you for choosing FTRAISE AI for your website needs!</p>
          <p>Best regards,<br>FTRAISE AI Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} FTRAISE AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    FTRAISE AI - Thank You for Your Inquiry

    Hello ${name},

    Thank you for your interest in our ${packageName} package. We have received your inquiry and our team will review it as soon as possible.

    We typically respond to inquiries within 24-48 hours during business days.

    If you have any urgent questions, please don't hesitate to contact us directly.

    Thank you for choosing FTRAISE AI for your website needs!

    Best regards,
    FTRAISE AI Team

    This is an automated email. Please do not reply to this message.
    © ${new Date().getFullYear()} FTRAISE AI. All rights reserved.
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'FTRAISE AI - Thank You for Your Package Inquiry',
    htmlContent,
    textContent
  });
};

/**
 * Send package approval notification email
 * @param {String} email - Recipient email
 * @param {String} name - Recipient name
 * @param {String} packageName - Name of the approved package
 * @returns {Promise} - A promise that resolves when the email is sent
 */
const sendPackageApprovalNotification = async (email, name, packageName) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .header {
          background-color: #4a5568;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .highlight {
          font-weight: bold;
          color: #4a5568;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #4a5568;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FTRAISE AI</h1>
        </div>
        <div class="content">
          <h2>Congratulations! Your Package Request is Approved</h2>
          <p>Hello ${name},</p>
          <p>Great news! Your request for the <span class="highlight">${packageName}</span> package has been approved.</p>
          <p>Our team will be in touch with you shortly to discuss the next steps and begin working on your website.</p>
          <p>If you have any questions or need further information, please don't hesitate to contact us.</p>
          <p>Thank you for choosing FTRAISE AI for your website needs!</p>
          <p>Best regards,<br>FTRAISE AI Team</p>
          <a href="https://ftraise.com/packages" class="button">View Your Package</a>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} FTRAISE AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    FTRAISE AI - Your Package Request is Approved

    Hello ${name},

    Great news! Your request for the ${packageName} package has been approved.

    Our team will be in touch with you shortly to discuss the next steps and begin working on your website.

    If you have any questions or need further information, please don't hesitate to contact us.

    Thank you for choosing FTRAISE AI for your website needs!

    Best regards,
    FTRAISE AI Team

    Visit: https://ftraise.com/packages to view your package

    This is an automated email. Please do not reply to this message.
    © ${new Date().getFullYear()} FTRAISE AI. All rights reserved.
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'FTRAISE AI - Your Package Request is Approved',
    htmlContent,
    textContent
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetOTP,
  sendPackageInquiryConfirmation,
  sendPackageApprovalNotification
};
