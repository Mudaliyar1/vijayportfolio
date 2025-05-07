/**
 * Utility functions for handling IP addresses
 */

/**
 * Get the real IP address of the client
 * This function tries to get the real IP address by checking various headers
 * that might be set by proxies, load balancers, etc.
 * 
 * @param {Object} req - Express request object
 * @returns {String} The client's IP address
 */
function getRealIpAddress(req) {
  // Check for various headers that might contain the real IP
  const ipAddress = 
    req.headers['x-forwarded-for'] || 
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||  // Cloudflare
    req.headers['true-client-ip'] ||    // Akamai and Cloudflare
    req.headers['x-client-ip'] ||
    req.headers['forwarded'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    '0.0.0.0';
  
  // If x-forwarded-for contains multiple IPs, get the first one (client IP)
  if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
    return ipAddress.split(',')[0].trim();
  }
  
  // Handle IPv6 localhost
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  // Handle IPv6 addresses that start with ::ffff: (IPv4-mapped IPv6 addresses)
  if (ipAddress && ipAddress.startsWith('::ffff:')) {
    return ipAddress.substring(7);
  }
  
  return ipAddress;
}

module.exports = {
  getRealIpAddress
};
