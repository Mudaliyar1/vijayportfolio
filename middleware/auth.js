/**
 * Authentication middleware
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Check for session passport data as a backup
  const hasSessionUserId = !!(req.session && req.session.passport && req.session.passport.user);

  if (req.isAuthenticated()) {
    // Double-check that we have a user object
    if (!req.user) {
      console.error('Authentication inconsistency: isAuthenticated() is true but req.user is missing');
      console.log('Session data:', {
        sessionID: req.sessionID,
        hasSessionUserId: hasSessionUserId,
        passport: req.session && req.session.passport ? JSON.stringify(req.session.passport) : 'none'
      });

      // Try to recover the session
      if (hasSessionUserId) {
        console.log('Attempting to recover session in auth middleware');
        // Let the sessionRestoreMiddleware handle this on the next request
        req.flash('warning_msg', 'Session recovery attempted. Please try again if you see this message.');
        return res.redirect(req.originalUrl);
      }

      // If we can't recover, clear the session and redirect to login
      req.session.destroy(err => {
        if (err) console.error('Error destroying session:', err);
        res.clearCookie('connect.sid');
        req.flash('error_msg', 'Session error detected. Please log in again.');
        return res.redirect('/users/login');
      });
      return;
    }

    return next();
  }

  // If request is AJAX, return JSON
  if (req.xhr) {
    return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
  }

  // Store the URL the user is trying to access
  req.session.returnTo = req.originalUrl;
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/users/login');
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  // First check if user is authenticated
  if (!req.isAuthenticated()) {
    // If request is AJAX, return JSON
    if (req.xhr) {
      return res.status(401).json({ success: false, message: 'You must be logged in to access this resource' });
    }

    // Store the URL the user is trying to access
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in to access this page');
    return res.redirect('/users/login');
  }

  // Check if user object exists
  if (!req.user) {
    console.error('Authentication inconsistency: isAuthenticated() is true but req.user is missing in isAdmin middleware');

    // If request is AJAX, return JSON
    if (req.xhr) {
      return res.status(500).json({ success: false, message: 'Session error detected' });
    }

    // Clear the session and redirect to login
    req.session.destroy(err => {
      if (err) console.error('Error destroying session:', err);
      res.clearCookie('connect.sid');
      req.flash('error_msg', 'Session error detected. Please log in again.');
      return res.redirect('/users/login');
    });
    return;
  }

  // Check if user is admin
  if (req.user.role === 'admin' || req.user.isAdmin) {
    return next();
  }

  // Special case for known admin email - use environment variable if available
  const adminEmail = process.env.ADMIN_EMAIL || 'vijaymudaliyar224@gmail.com';
  if (req.user.email === adminEmail) {
    // Update user to be admin
    const User = require('../models/User');
    User.findByIdAndUpdate(req.user._id, { isAdmin: true, role: 'admin' })
      .then(() => {
        console.log('Updated admin status for:', req.user.email);
        req.user.isAdmin = true;
        req.user.role = 'admin';
        return next();
      })
      .catch(err => {
        console.error('Error updating admin status:', err);
        // Continue anyway since this is the admin email
        return next();
      });
    return;
  }

  // If request is AJAX, return JSON
  if (req.xhr) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this resource' });
  }

  req.flash('error_msg', 'You do not have permission to access this page');
  res.redirect('/');
};

module.exports = {
  isAuthenticated,
  isAdmin
};
