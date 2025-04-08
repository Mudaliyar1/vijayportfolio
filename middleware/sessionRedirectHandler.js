/**
 * Middleware to redirect to session error page on session errors
 */

module.exports = (req, res, next) => {
  // Skip for session-error routes to avoid redirect loops
  if (req.path.startsWith('/session-error') || 
      req.path.startsWith('/health') || 
      req.path === '/favicon.ico') {
    return next();
  }
  
  // Check if session exists and has required properties
  const hasValidSession = req.session && 
                         req.session.cookie && 
                         req.session.cookie.expires;
  
  if (!hasValidSession) {
    console.error('Invalid session detected, redirecting to session error page');
    return res.redirect('/session-error');
  }
  
  // Continue to next middleware
  next();
};
