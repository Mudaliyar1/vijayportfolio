/**
 * Middleware to restore user authentication from session if needed
 * This helps fix issues where the session contains user ID but req.user is missing
 */
const User = require('../models/User');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
  try {
    // Skip for static files and certain routes
    if (req.path.startsWith('/css') || 
        req.path.startsWith('/js') || 
        req.path.startsWith('/images') ||
        req.path === '/favicon.ico' ||
        req.path.startsWith('/session-error')) {
      return next();
    }
    
    // Check if we have a session with passport user ID but no req.user
    if (req.session && 
        req.session.passport && 
        req.session.passport.user && 
        !req.user) {
      
      console.log('Session restore middleware: Found session with user ID but no req.user');
      
      try {
        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(req.session.passport.user)) {
          console.error('Invalid user ID format in session:', req.session.passport.user);
          return next();
        }
        
        // Try to find the user
        const user = await User.findById(req.session.passport.user);
        
        if (user) {
          console.log('Session restore middleware: Restored user from session:', user.email);
          
          // Manually restore the user to the request
          req.user = user;
          
          // Add login method if it doesn't exist
          if (!req.login && req.logIn) {
            req.login = req.logIn;
          }
          
          // Re-login the user to ensure passport is properly set up
          if (req.login) {
            req.login(user, (err) => {
              if (err) {
                console.error('Error re-logging in user:', err);
              }
              return next();
            });
            return;
          }
        } else {
          console.error('User not found for ID in session:', req.session.passport.user);
        }
      } catch (err) {
        console.error('Error restoring user from session:', err);
      }
    }
    
    next();
  } catch (err) {
    console.error('Error in session restore middleware:', err);
    next();
  }
};
