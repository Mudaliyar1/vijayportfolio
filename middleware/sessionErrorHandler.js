/**
 * Middleware to handle session errors
 * This middleware will:
 * 1. Catch errors related to session handling
 * 2. Provide a fallback session if needed
 * 3. Log session errors for debugging
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
      secure: process.env.NODE_ENV === 'production'
    };
  }

  // Catch session save errors
  const originalSave = req.session.save;
  req.session.save = function(callback) {
    return originalSave.call(req.session, (err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
      if (callback) {
        callback(err);
      }
    });
  };

  // Continue to next middleware
  next();
};
