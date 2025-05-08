/**
 * Enhanced authentication verification middleware
 * This middleware provides additional checks to ensure authentication is working correctly
 */

module.exports = (req, res, next) => {
  // Skip for public routes
  if (req.path === '/' || 
      req.path.startsWith('/users/login') || 
      req.path.startsWith('/users/register') || 
      req.path.startsWith('/session-error') ||
      req.path === '/favicon.ico' ||
      req.path.startsWith('/css') ||
      req.path.startsWith('/js') ||
      req.path.startsWith('/images')) {
    return next();
  }
  
  // Check if user is authenticated
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
  
  // If authenticated but user object is missing, there's a session issue
  if (isAuthenticated && !req.user) {
    console.error('Authentication inconsistency detected:', {
      path: req.path,
      sessionID: req.sessionID,
      isAuthenticated: isAuthenticated,
      hasUser: !!req.user
    });
    
    // Clear the session and redirect to login
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      // Clear the session cookie
      res.clearCookie('connect.sid');
      // Redirect to login with error message
      req.flash('error_msg', 'Session error detected. Please log in again.');
      res.redirect('/users/login');
    });
    return;
  }
  
  // Continue to next middleware
  next();
};
