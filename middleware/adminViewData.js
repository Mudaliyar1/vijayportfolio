/**
 * Middleware to add common admin view data
 * This middleware adds maintenance mode flag and other common data to all admin views
 */

const MaintenanceMode = require('../models/MaintenanceMode');

module.exports = async (req, res, next) => {
  // Store the original render function
  const originalRender = res.render;

  // Override the render function to add common data
  res.render = async function(view, options, callback) {
    // Create options object if it doesn't exist
    options = options || {};

    try {
      // Check if maintenance mode is actually active by querying the database
      const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });
      const isMaintenanceActive = maintenanceSettings &&
                                 maintenanceSettings.isEnabled &&
                                 (!maintenanceSettings.endTime || new Date() < maintenanceSettings.endTime);

      // Only set maintenanceMode flag if maintenance is actually active
      options.maintenanceMode = isMaintenanceActive;

      // Call the original render function with the modified options
      originalRender.call(this, view, options, callback);
    } catch (err) {
      console.error('Error checking maintenance mode in adminViewData:', err);
      // Default to false if there's an error
      options.maintenanceMode = false;
      originalRender.call(this, view, options, callback);
    }
  };

  next();
};
