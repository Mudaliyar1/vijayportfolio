const ApiKey = require('../models/ApiKey');
const StaticApiKey = require('../models/StaticApiKey');
const DynamicApiKey = require('../models/DynamicApiKey');

/**
 * API Authentication Middleware
 * Authenticates requests using API keys
 */
const apiAuth = async (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'API key is missing or invalid'
      });
    }
    
    // Extract API key
    const apiKey = authHeader.split(' ')[1];
    
    if (!apiKey || !apiKey.startsWith('ftr_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key format'
      });
    }
    
    // Find API key in database
    const key = await ApiKey.findOne({ key: apiKey });
    
    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Check if key is active
    if (!key.isActive()) {
      return res.status(401).json({
        success: false,
        message: key.isExpired() ? 'API key has expired' : 'API key is disabled or revoked'
      });
    }
    
    // Store API key in request for later use
    req.apiKey = key;
    
    // Increment request count
    key.incrementRequestCount().catch(err => {
      console.error('Error incrementing API key request count:', err);
    });
    
    next();
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during API authentication'
    });
  }
};

/**
 * Static API Authentication Middleware
 * Authenticates requests using static API keys
 * Checks domain and IP restrictions
 */
const staticApiAuth = async (req, res, next) => {
  try {
    // First, apply general API authentication
    await apiAuth(req, res, async () => {
      // Check if key is a static key
      if (req.apiKey.type !== 'static') {
        return res.status(401).json({
          success: false,
          message: 'This endpoint requires a static API key'
        });
      }
      
      // Get the static key with full schema
      const staticKey = await StaticApiKey.findById(req.apiKey._id);
      
      if (!staticKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid static API key'
        });
      }
      
      // Check domain restriction
      const origin = req.headers.origin || req.headers.referer;
      let domain = null;
      
      if (origin) {
        try {
          domain = new URL(origin).hostname;
        } catch (error) {
          console.error('Error parsing origin:', error);
        }
      }
      
      if (domain && !staticKey.isDomainAllowed(domain)) {
        return res.status(403).json({
          success: false,
          message: 'This API key is not authorized for this domain'
        });
      }
      
      // Check IP restriction
      const ip = req.ip || req.connection.remoteAddress;
      
      if (ip && !staticKey.isIpAllowed(ip)) {
        return res.status(403).json({
          success: false,
          message: 'This API key is not authorized for this IP address'
        });
      }
      
      // Check rate limit
      const rateLimitResult = await staticKey.checkRateLimit();
      
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt,
          timeRemaining: Math.ceil(rateLimitResult.timeRemaining / 1000) // in seconds
        });
      }
      
      // Store static key in request for later use
      req.staticApiKey = staticKey;
      
      next();
    });
  } catch (error) {
    console.error('Static API authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during API authentication'
    });
  }
};

/**
 * Dynamic API Authentication Middleware
 * Authenticates requests using dynamic API keys
 * Checks permissions and rate limits
 */
const dynamicApiAuth = async (req, res, next) => {
  try {
    // First, apply general API authentication
    await apiAuth(req, res, async () => {
      // Check if key is a dynamic key
      if (req.apiKey.type !== 'dynamic') {
        return res.status(401).json({
          success: false,
          message: 'This endpoint requires a dynamic API key'
        });
      }
      
      // Get the dynamic key with full schema
      const dynamicKey = await DynamicApiKey.findById(req.apiKey._id);
      
      if (!dynamicKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid dynamic API key'
        });
      }
      
      // Check endpoint permission
      const endpoint = req.originalUrl;
      
      if (!dynamicKey.canAccessEndpoint(endpoint)) {
        return res.status(403).json({
          success: false,
          message: 'This API key is not authorized for this endpoint'
        });
      }
      
      // Check rate limit
      const rateLimitResult = await dynamicKey.checkRateLimit();
      
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt,
          timeRemaining: Math.ceil(rateLimitResult.timeRemaining / 1000) // in seconds
        });
      }
      
      // Store dynamic key in request for later use
      req.dynamicApiKey = dynamicKey;
      
      next();
    });
  } catch (error) {
    console.error('Dynamic API authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during API authentication'
    });
  }
};

module.exports = {
  apiAuth,
  staticApiAuth,
  dynamicApiAuth
};
