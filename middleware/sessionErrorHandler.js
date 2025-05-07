/**
 * Enhanced Middleware to handle session errors
 * This middleware will:
 * 1. Catch errors related to session handling
 * 2. Provide a fallback session if needed
 * 3. Log session errors for debugging
 * 4. Ensure authentication state is properly maintained
 */

module.exports = (req, res, next) => {
  // Check if session exists
  if (!req.session) {
    console.error('Session not available in request');
    // Create a temporary session object
    req.session = {};
  }

  // Check if session cookie exists
  if (req.session && !req.session.cookie) {
    console.error('Session cookie not available');
    // Create a temporary cookie
    req.session.cookie = {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIES === 'true',
      sameSite: 'lax',
      path: '/'
    };
  }

  // Catch session save errors
  const originalSave = req.session.save;
  req.session.save = function(callback) {
    return originalSave.call(req.session, (err) => {
      if (err) {
        console.error('Error saving session:', err);
        // Log additional information for debugging
        console.error('Session ID:', req.sessionID);
        console.error('User authenticated:', req.isAuthenticated ? req.isAuthenticated() : 'isAuthenticated not available');
        console.error('Environment:', process.env.NODE_ENV || 'development');
      }
      if (callback) {
        callback(err);
      }
    });
  };

  // Add a flag to track if we've already regenerated the session
  // to prevent infinite loops
  if (!req.session._sessionFixed && req.isAuthenticated && req.isAuthenticated() && !req.session.passport) {
    console.error('Session inconsistency detected: User appears authenticated but session.passport is missing');
    req.session._sessionFixed = true;

    // Force logout to reset authentication state
    if (req.logout) {
      req.logout(function(err) {
        if (err) {
          console.error('Error during forced logout:', err);
        }
        // Redirect to login page
        return res.redirect('/users/login');
      });
    } else {
      // If logout function is not available, just continue
      next();
    }
  } else {
    // Continue to next middleware
    next();
  }
};
