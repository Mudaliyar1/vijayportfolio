/**
 * Middleware to ensure admin users can bypass maintenance mode
 * This middleware runs before the maintenance middleware and sets flags
 * to ensure admin users can access all routes during maintenance
 */

module.exports = (req, res, next) => {
  // Check if user is authenticated and is admin
  if (req.isAuthenticated() && 
      (req.user.isAdmin || 
       req.user.role === 'admin')) {
    
    // Set flags to bypass maintenance mode
    req.maintenanceBypass = true;
    
    // Ensure these flags are set in the session
    if (!req.session.maintenanceBypass) {
      req.session.maintenanceBypass = true;
      req.session.isAdminSession = true;
      
      // Save the session if it's not already being saved
      if (!req.session.save.isSessionSaving) {
        const originalSave = req.session.save;
        req.session.save = function(callback) {
          // Mark that we're saving to prevent recursive calls
          req.session.save.isSessionSaving = true;
          return originalSave.call(req.session, (err) => {
            req.session.save.isSessionSaving = false;
            if (callback) callback(err);
          });
        };
        
        // Save the session
        req.session.save();
      }
    }
  }
  
  // Continue to next middleware
  next();
};
