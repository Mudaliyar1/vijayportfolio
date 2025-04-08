# Session Troubleshooting Guide

This document provides guidance on troubleshooting session-related issues in the FTRaise AI application.

## Common Session Issues

1. **"Cannot read properties of undefined (reading 'expires')"**
   - This error occurs when the session cookie is missing or corrupted
   - It can also happen when the MongoDB session store is not properly connected

2. **Session data lost between requests**
   - This can happen if the session store is not properly configured
   - It can also happen if the session cookie is not being set correctly

3. **500 Server Error on deployed application**
   - Often related to session issues in production environments
   - Can be caused by differences in cookie handling between development and production

## Fixing Session Issues

### 1. Run the Session Fix Script

We've created a script to clean up corrupted sessions in the database:

```bash
node scripts/fix-sessions.js
```

This script will:
- Remove sessions with missing expires field
- Remove sessions with invalid JSON data
- Report on the number of sessions fixed or deleted

### 2. Check Session Health

You can check the health of your session system by visiting:

```
/health/session
```

This endpoint will:
- Verify that sessions are working
- Show details about your session configuration
- Indicate if there are any issues with the session store

### 3. Debug Session Issues

For more detailed debugging, visit:

```
/health/session-debug
```

This will show:
- Number of sessions in the database
- Sample session data structure
- Validation of session data format

### 4. Clear Your Session

If you're experiencing session issues, you can clear your session by visiting:

```
/session-error/clear
```

This will:
- Destroy your current session
- Clear the session cookie
- Redirect you to the login page

## Session Configuration

Our session configuration uses:

1. **connect-mongo** for MongoDB session storage
2. **express-session** for session management
3. Custom middleware for error handling and redirection

Key configuration options:
- `stringify: true` - Ensures proper serialization of session data
- `autoCreate: true` - Ensures the expires field is always set
- `rolling: true` - Resets the cookie expiration on each request

## Deployment Considerations

When deploying to production:

1. Ensure the MongoDB connection string is correct
2. Set a strong SESSION_SECRET environment variable
3. Consider the cookie secure setting based on your HTTPS configuration
4. Monitor session errors in your application logs

## Contact Support

If you continue to experience session issues after trying these steps, please contact support at:

Email: vijaymudaliyar224@gmail.com
