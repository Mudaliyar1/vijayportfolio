/**
 * Authentication middleware
 */

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
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
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
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
