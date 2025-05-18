const mongoose = require('mongoose');
const ApiKey = require('./ApiKey');

/**
 * Dynamic API Key Schema
 * For use in backend applications with higher rate limits
 */
const DynamicApiKeySchema = new mongoose.Schema({
  // Rate limits
  rateLimit: {
    requests: {
      type: Number,
      default: 50 // Default: 50 requests per hour
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
  },
  // Additional permissions
  permissions: {
    fullAccess: {
      type: Boolean,
      default: true
    },
    allowedEndpoints: {
      type: [String],
      default: ['*'] // Default: all endpoints
    }
  }
});

// Method to check rate limit
DynamicApiKeySchema.methods.checkRateLimit = async function() {
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

// Method to check endpoint permission
DynamicApiKeySchema.methods.canAccessEndpoint = function(endpoint) {
  // If full access is granted, allow all endpoints
  if (this.permissions.fullAccess) {
    return true;
  }
  
  // Check if endpoint is in the allowed list
  return this.permissions.allowedEndpoints.some(allowedEndpoint => {
    // Allow exact match
    if (endpoint === allowedEndpoint) {
      return true;
    }
    
    // Allow wildcard match
    if (allowedEndpoint === '*') {
      return true;
    }
    
    // Allow path prefix match with wildcard (e.g., /api/* matches /api/users)
    if (allowedEndpoint.endsWith('/*') && endpoint.startsWith(allowedEndpoint.slice(0, -1))) {
      return true;
    }
    
    return false;
  });
};

// Create the model as a discriminator of ApiKey
const DynamicApiKey = ApiKey.discriminator('DynamicApiKey', DynamicApiKeySchema);

module.exports = DynamicApiKey;
