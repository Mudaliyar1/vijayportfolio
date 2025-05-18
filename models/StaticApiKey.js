const mongoose = require('mongoose');
const ApiKey = require('./ApiKey');

/**
 * Static API Key Schema
 * For use in HTML websites with domain/IP restrictions
 */
const StaticApiKeySchema = new mongoose.Schema({
  // Domain restrictions (whitelist)
  domains: {
    type: [String],
    default: []
  },
  // IP restrictions (whitelist)
  ipAddresses: {
    type: [String],
    default: []
  },
  // Rate limits
  rateLimit: {
    requests: {
      type: Number,
      default: 10 // Default: 10 requests per hour
    },
    window: {
      type: Number,
      default: 60 * 60 * 1000 // Default: 1 hour in milliseconds
    }
  },
  // Window start time for rate limiting
  windowStartTime: {
    type: Date,
    default: null
  },
  // Requests in current window
  requestsInWindow: {
    type: Number,
    default: 0
  }
});

// Method to check domain restriction
StaticApiKeySchema.methods.isDomainAllowed = function(domain) {
  // If no domains are specified, allow all domains
  if (!this.domains || this.domains.length === 0) {
    return true;
  }
  
  // Check if domain is in the whitelist
  return this.domains.some(allowedDomain => {
    // Allow exact match
    if (domain === allowedDomain) {
      return true;
    }
    
    // Allow subdomain match (e.g., sub.example.com matches example.com)
    if (domain.endsWith(`.${allowedDomain}`)) {
      return true;
    }
    
    return false;
  });
};

// Method to check IP restriction
StaticApiKeySchema.methods.isIpAllowed = function(ip) {
  // If no IPs are specified, allow all IPs
  if (!this.ipAddresses || this.ipAddresses.length === 0) {
    return true;
  }
  
  // Check if IP is in the whitelist
  return this.ipAddresses.includes(ip);
};

// Method to check rate limit
StaticApiKeySchema.methods.checkRateLimit = async function() {
  const now = new Date();
  
  // Check if this is the first request or if we need to reset the window
  if (!this.windowStartTime || now - this.windowStartTime > this.rateLimit.window) {
    // First request or window expired - reset window
    this.windowStartTime = now;
    this.requestsInWindow = 0;
    await this.save();
    return {
      allowed: true,
      remaining: this.rateLimit.requests
    };
  }
  
  // Check if rate limit is exceeded
  if (this.requestsInWindow >= this.rateLimit.requests) {
    // Calculate time remaining in current window
    const timeElapsed = now - this.windowStartTime;
    const timeRemaining = this.rateLimit.window - timeElapsed;
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(this.windowStartTime.getTime() + this.rateLimit.window),
      timeRemaining
    };
  }
  
  // Increment request count
  this.requestsInWindow += 1;
  await this.save();
  
  return {
    allowed: true,
    remaining: this.rateLimit.requests - this.requestsInWindow
  };
};

// Create the model as a discriminator of ApiKey
const StaticApiKey = ApiKey.discriminator('StaticApiKey', StaticApiKeySchema);

module.exports = StaticApiKey;
