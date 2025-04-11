/**
 * Middleware to add common website builder view data
 * This middleware adds layout and other common data to all website builder views
 */

module.exports = (req, res, next) => {
  // Store the original render function
  const originalRender = res.render;

  // Override the render function to add common data
  res.render = function(view, options, callback) {
    // Create options object if it doesn't exist
    options = options || {};

    // Set website builder layout
    options.layout = 'layouts/website-builder';

    // Add current path for sidebar highlighting
    options.currentPath = req.path;

    // Call the original render function with the modified options
    originalRender.call(this, view, options, callback);
  };

  next();
};
