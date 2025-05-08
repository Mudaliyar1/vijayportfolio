module.exports = {
  ensureAuthenticated: function(req, res, next) {
    // Check if user is authenticated
    if (req.isAuthenticated()) {
      // Additional check to ensure user object exists
      if (!req.user) {
        console.error('Authentication inconsistency: isAuthenticated() is true but req.user is missing');
        // Clear the session and redirect to login
        return req.session.destroy(err => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          // Clear the session cookie
          res.clearCookie('connect.sid');
          // Redirect to login with error message
          req.flash('error_msg', 'Session error detected. Please log in again.');
          res.redirect('/users/login');
        });
      }
      return next();
    }
    req.flash('error_msg', 'Please log in to access this resource');
    res.redirect('/users/login');
  },

  ensureGuest: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/chat');
  },

  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    res.redirect('/');
  }
};
