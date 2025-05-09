# Status Page URL Fix

This document explains the changes made to fix the status page URL issue in the production environment.

## Problem Description

When users clicked on the status page link in the production environment, they were redirected to `http://localhost:3001/?session_token=...` instead of the actual production status page URL. This happened because the URL was hardcoded to use localhost in the development environment.

## Root Causes

1. **Hardcoded URLs**: The status bridge routes contained hardcoded localhost URLs.
2. **Missing Environment Variables**: The application didn't have a proper environment variable for the status app URL.
3. **No Environment Detection**: The code didn't check for the current environment to use different URLs.

## Implemented Fixes

### 1. Updated Status Bridge Route

Modified the status bridge route in `routes/status-bridge.js` to use environment variables:

```javascript
// Get the status app URL from environment or use a default
const statusAppUrl = process.env.STATUS_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 
                      'https://ftraise-status.onrender.com' : 
                      'http://localhost:3001');

console.log(`Using status app URL: ${statusAppUrl}`);

// Redirect to status app with token
return res.redirect(`${statusAppUrl}?session_token=${token}`);
```

### 2. Updated Session Bridge Route

Made similar changes to the session bridge route in `routes/session-bridge.js`:

```javascript
// Get the status app URL from environment or use a default
const statusAppUrl = process.env.STATUS_APP_URL || 
                     (process.env.NODE_ENV === 'production' ? 
                      'https://ftraise-status.onrender.com' : 
                      'http://localhost:3001');
```

### 3. Updated Status App Layout

Modified the "Back to Main Site" link in the status app's main layout to use environment variables:

```html
<a href="<%= process.env.MAIN_APP_URL || 'http://localhost:3000' %>" class="text-gray-400 hover:text-white transition-colors">
  <i class="fas fa-arrow-left mr-2"></i> Back to Main Site
</a>
```

### 4. Added Environment Variables

Added the `STATUS_APP_URL` environment variable to the main application's `.env` file:

```
# Status app URL
STATUS_APP_URL=https://ftraise-status.onrender.com
```

Also updated the `.env.example` file to include this variable for future reference.

## Deployment Steps

1. Deploy the changes to both the main app and status app on Render.
2. Ensure the environment variables are properly set in the Render dashboard:
   - `STATUS_APP_URL=https://ftraise-status.onrender.com` in the main app
   - `MAIN_APP_URL=https://ftraiseai.onrender.com` in the status app

## Testing

After deployment, test the status page integration by:

1. Clicking on the "System Status" link in the main application
2. Verifying that you're redirected to the correct status page URL
3. Testing the "Back to Main Site" link on the status page
4. Testing the session token functionality by logging in and then accessing the status page

## Troubleshooting

If issues persist:
1. Check the server logs for any errors related to the status bridge
2. Verify that the environment variables are correctly set in the Render dashboard
3. Clear browser cookies and cache
4. Test with different browsers to rule out browser-specific issues
