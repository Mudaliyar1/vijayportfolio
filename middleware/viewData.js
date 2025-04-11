/**
 * Middleware to add common view data for user routes
 */
module.exports = (req, res, next) => {
  // Add user to res.locals if authenticated
  res.locals.user = req.isAuthenticated() ? req.user : null;
  
  // Add other common view data
  res.locals.title = 'FTRAISE AI';
  res.locals.path = req.path;
  
  next();
};
