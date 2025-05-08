/**
 * Session Bridge Routes
 * 
 * These routes allow for sharing sessions between the main app and the status app
 */

const express = require('express');
const router = express.Router();
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

// Route to redirect to status app with session token
router.get('/status-app', (req, res) => {
  try {
    // Only create a token if the user is authenticated
    if (req.isAuthenticated()) {
      const token = crypto.randomBytes(32).toString('hex');
      
      // Store token with session data (expires in 5 minutes)
      sessionTokens.set(token, {
        user: {
          _id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          isAdmin: req.user.isAdmin || req.user.role === 'admin'
        },
        isAdmin: req.user.isAdmin || req.user.role === 'admin',
        expires: Date.now() + (5 * 60 * 1000)
      });
      
      // Redirect to status app with token
      return res.redirect(`http://localhost:3001?session_token=${token}`);
    }
    
    // If not authenticated, just redirect to status app
    res.redirect('http://localhost:3001');
  } catch (err) {
    console.error('Error in session bridge:', err);
    res.redirect('http://localhost:3001');
  }
});

// API endpoint for the status app to validate tokens
router.get('/validate-token/:token', (req, res) => {
  try {
    const { token } = req.params;
    
    if (sessionTokens.has(token)) {
      const sessionData = sessionTokens.get(token);
      
      // Delete the token after use
      sessionTokens.delete(token);
      
      return res.json({
        success: true,
        sessionData
      });
    }
    
    res.status(404).json({
      success: false,
      message: 'Invalid or expired token'
    });
  } catch (err) {
    console.error('Error validating token:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = {
  router,
  sessionTokens
};
