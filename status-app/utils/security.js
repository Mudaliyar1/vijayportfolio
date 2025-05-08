/**
 * Security Utility
 * Contains security-related functions and middleware
 */
const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (will be converted to hex, so final length will be 2x)
 * @returns {string} - Random token
 */
function generateSecureToken(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string using SHA-256
 * @param {string} input - String to hash
 * @returns {string} - Hashed string
 */
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Middleware to add security headers to responses
 */
function securityHeadersMiddleware(req, res, next) {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self'");
  
  next();
}

/**
 * Rate limiting middleware to prevent brute force attacks
 * @param {number} maxRequests - Maximum number of requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 */
function rateLimitMiddleware(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const requests = {};
  
  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || req.connection.remoteAddress;
    
    // Initialize request count for this IP
    if (!requests[ip]) {
      requests[ip] = {
        count: 0,
        resetTime: Date.now() + windowMs
      };
    }
    
    // Reset count if the time window has passed
    if (Date.now() > requests[ip].resetTime) {
      requests[ip] = {
        count: 0,
        resetTime: Date.now() + windowMs
      };
    }
    
    // Increment request count
    requests[ip].count++;
    
    // Check if the request count exceeds the limit
    if (requests[ip].count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.'
      });
    }
    
    next();
  };
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

module.exports = {
  generateSecureToken,
  hashString,
  sanitizeInput,
  securityHeadersMiddleware,
  rateLimitMiddleware,
  isValidEmail
};
