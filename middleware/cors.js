/**
 * CORS Middleware
 * Enables Cross-Origin Resource Sharing for API endpoints
 */
module.exports = (req, res, next) => {
  // Allow requests from any origin for API endpoints
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};
