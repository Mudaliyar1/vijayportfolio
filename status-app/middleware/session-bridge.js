/**
 * Session Bridge Middleware
 * 
 * This middleware allows the status app to share sessions with the main app
 * by providing a way to transfer session data via a token in the URL.
 */

const crypto = require('crypto');

// Store for temporary session tokens
const sessionTokens = new Map();

// Clean up expired tokens every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of sessionTokens.entries()) {
    if (now > data.expires) {
      sessionTokens.delete(token);
    }
  }
}, 15 * 60 * 1000);

module.exports = {
  // Middleware to check for session tokens in the URL
  checkSessionToken: (req, res, next) => {
    try {
      const token = req.query.session_token;
      
      if (token && sessionTokens.has(token)) {
        const sessionData = sessionTokens.get(token);
        
        // Copy session data to the current session
        req.session.user = sessionData.user;
        req.session.isAuthenticated = true;
        req.session.isAdmin = sessionData.isAdmin;
        
        // Delete the token after use
        sessionTokens.delete(token);
        
        // Redirect to remove the token from the URL
        const redirectUrl = req.originalUrl.split('?')[0];
        return res.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('Error in session bridge middleware:', err);
    }
    
    next();
  },
  
  // Generate a session token for cross-app authentication
  generateSessionToken: (user, isAdmin) => {
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token with session data (expires in 5 minutes)
    sessionTokens.set(token, {
      user,
      isAdmin,
      expires: Date.now() + (5 * 60 * 1000)
    });
    
    return token;
  }
};
