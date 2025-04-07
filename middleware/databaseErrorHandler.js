/**
 * Middleware to handle database connection errors gracefully
 */
module.exports = (req, res, next) => {
  // Check if MongoDB is connected
  const mongoose = require('mongoose');

  if (mongoose.connection.readyState !== 1) {
    // MongoDB is not connected
    console.log('MongoDB is not connected. Showing database error page.');

    // Skip for static assets and API routes
    if (req.path.startsWith('/public') || req.path.startsWith('/api')) {
      return next();
    }

    // Skip for the database error page itself to avoid loops
    if (req.path === '/db-error') {
      return next();
    }

    // Render the database error page
    return res.render('db-error', {
      title: 'Database Connection Error',
      user: null,
      success_msg: '',
      error_msg: '',
      error: '',
      errors: []
    });
  }

  // MongoDB is connected, proceed normally
  next();
};
