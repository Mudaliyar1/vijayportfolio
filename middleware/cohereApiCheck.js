/**
 * Middleware to check if Cohere API is configured
 * This middleware checks if the Cohere API key is set in the environment variables
 * and redirects to an error page if it's not.
 */
module.exports = (req, res, next) => {
  try {
    if (!process.env.COHERE_API_KEY) {
      console.error('Cohere API key is not configured');
      req.flash('error_msg', 'Cohere API key is not configured. Please contact the administrator.');
      return res.redirect('/error');
    }
    next();
  } catch (error) {
    console.error('Error in Cohere API check middleware:', error);
    // Continue to the next middleware instead of failing
    next();
  }
};
