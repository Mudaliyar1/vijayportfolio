# Deployment Guide for FTRAISE AI

This guide provides instructions for deploying the FTRAISE AI application to Render and configuring email services.

## Deploying to Render

1. Create a new Web Service in your Render dashboard
2. Connect your GitHub repository
3. Configure the following settings:
   - **Name**: ftraise-ai (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `node server.js`

## Environment Variables

Add the following environment variables in your Render dashboard:

- `NODE_ENV`: Set to `production`
- `BREVO_API_KEY`: Your Brevo API key (get this from your Brevo account dashboard)
- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID (get this from your Razorpay dashboard)
- `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret (get this from your Razorpay dashboard)
- `COHERE_API_KEY`: Your Cohere API key (for AI content generation)

## Configuring Brevo for Email Sending

For the password reset functionality to work properly in production, you need to authorize Render's outbound IP addresses in your Brevo account.

### Authorizing Render's IP Addresses in Brevo

1. Log in to your Brevo account at [https://app.brevo.com/](https://app.brevo.com/)
2. Navigate to Settings → API & Integration → SMTP & API
3. Click on the "Authorized IPs" tab
4. Add all of Render's outbound IP addresses:

**Render's Static Outbound IP Addresses:**
- 35.160.120.126
- 35.160.153.177
- 35.161.239.25
- 35.167.66.134
- 44.231.116.151
- 44.231.121.46
- 44.234.73.116
- 44.242.66.198
- 52.10.129.168
- 52.37.177.93
- 52.39.153.231
- 52.88.18.35
- 52.88.219.166
- 52.89.85.107
- 54.148.176.65
- 54.191.242.128
- 54.200.75.194
- 54.202.77.215
- 54.212.83.188
- 54.218.125.95
- 54.244.114.55
- 54.245.35.153

For the most up-to-date list, check [Render's documentation](https://render.com/docs/static-outbound-ip-addresses).

## Testing Email Functionality

After deployment, test the password reset functionality:

1. Go to your deployed application
2. Click "Forgot Password?" on the login page
3. Enter a registered email address
4. Check that the OTP is received in the email
5. Complete the password reset process

## Troubleshooting

### Email Issues

If emails are not being sent:

1. Check the server logs in your Render dashboard
2. Verify that all Render IP addresses are authorized in Brevo
3. Confirm that the Brevo API key is correctly set in the environment variables
4. Ensure your Brevo account is active and has available email credits

### Payment Issues

If Razorpay payments are not working:

1. Check the server logs for any Razorpay-related errors
2. Verify that both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correctly set in environment variables
3. Ensure your Razorpay account is active and properly configured
4. For testing, use Razorpay test mode credentials
5. If you see a "Module not found" error for Razorpay, ensure the deployment has completed the build process with all dependencies installed

## Security Considerations

- **API Keys**: Never commit API keys to your repository. Always use environment variables.
  - The Brevo API key should only be stored in your Render dashboard or .env file (locally)
  - If you accidentally commit an API key, consider it compromised and generate a new one immediately

- **Password Reset Security**:
  - In production, OTPs are never displayed on screen (only sent via email)
  - All password reset tokens expire after 15 minutes
  - Used OTPs cannot be reused for security

- **Environment Variables**:
  - Use a .env.example file to document required variables without actual values
  - Never commit the actual .env file to your repository

- **IP Restrictions**:
  - Brevo requires authorizing server IP addresses for enhanced security
  - This prevents unauthorized use of your API key even if it's compromised
