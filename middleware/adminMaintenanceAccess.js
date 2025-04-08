/**
 * Middleware to ensure admin access during maintenance mode
 * This middleware specifically handles admin routes during maintenance
 */

const MaintenanceMode = require('../models/MaintenanceMode');

module.exports = async (req, res, next) => {
  try {
    // ALWAYS allow access to admin routes for authenticated admins
    // This is a failsafe to ensure admins can always access admin routes
    if (req.isAuthenticated() &&
        (req.user.isAdmin ||
         req.user.role === 'admin' ||
         req.maintenanceBypass ||
         req.session.maintenanceBypass ||
         req.session.isAdminSession)) {

      // Check if maintenance mode is enabled (for UI purposes only)
      const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });
      const isMaintenanceActive = maintenanceSettings &&
                                 maintenanceSettings.isEnabled &&
                                 (!maintenanceSettings.endTime || new Date() < maintenanceSettings.endTime);

      // Add a flag to indicate we're in maintenance mode (for UI purposes)
      req.maintenanceMode = isMaintenanceActive;

      // Ensure the bypass flag is set in the session for future requests
      if (!req.session.maintenanceBypass) {
        req.session.maintenanceBypass = true;
        req.session.isAdminSession = true;

        // Save the session if it's not already being saved
        if (!req.session.save.isSessionSaving) {
          req.session.save((err) => {
            if (err) console.error('Error saving session in adminMaintenanceAccess:', err);
          });
        }
      }

      // Always allow admin access
      return next();
    }

    // For non-admins, check if maintenance mode is enabled
    const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

    // If maintenance mode is not enabled, proceed normally
    if (!maintenanceSettings || !maintenanceSettings.isEnabled) {
      return next();
    }

    // Check if maintenance period has ended
    const now = new Date();
    if (maintenanceSettings.endTime && now > maintenanceSettings.endTime) {
      // Automatically disable maintenance mode if the end time has passed
      maintenanceSettings.isEnabled = false;
      await maintenanceSettings.save();
      return next();
    }

    // If not admin, redirect to login with a message
    req.flash('error_msg', 'Only administrators can access the admin area during maintenance mode.');
    return res.redirect('/users/login');
  } catch (err) {
    console.error('Error in admin maintenance access middleware:', err);
    next(err);
  }
};
