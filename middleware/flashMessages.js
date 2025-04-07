/**
 * Middleware to ensure flash messages are available in all templates
 * without clearing them from the session
 */
module.exports = (req, res, next) => {
  // Only set user - don't set default flash messages
  // This ensures flash messages only appear when explicitly set
  res.locals.user = req.user || null;

  next();
};
