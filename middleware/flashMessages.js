/**
 * Middleware to ensure flash messages are available in all templates
 * This middleware runs after the main flash middleware in server.js
 */
module.exports = (req, res, next) => {
  // Only set user - don't set default flash messages
  // This ensures flash messages only appear when explicitly set
  res.locals.user = req.user || null;

  // Ensure flash message arrays are always defined
  // These should already be set by the main flash middleware
  res.locals.success_msg = res.locals.success_msg || [];
  res.locals.error_msg = res.locals.error_msg || [];
  res.locals.warning_msg = res.locals.warning_msg || [];
  res.locals.error = res.locals.error || [];
  res.locals.errors = res.locals.errors || [];

  next();
};
