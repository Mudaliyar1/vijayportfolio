const User = require('../models/User');
const RateLimitRequest = require('../models/RateLimitRequest');

module.exports = {
  // Render rate limit request page
  getRequestPage: async (req, res) => {
    try {
      // Get user
      const user = await User.findById(req.user._id);
      
      res.render('rate-limits/request', {
        title: 'Request Rate Limit Increase - FTRAISE AI',
        user,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Error loading rate limit request page:', err);
      req.flash('error_msg', 'An error occurred while loading the rate limit request page');
      res.redirect('/');
    }
  },
  
  // Submit rate limit request
  submitRequest: async (req, res) => {
    try {
      const { requestType, requestedLimit, reason } = req.body;
      
      // Validate input
      if (!requestType || !['chat', 'image'].includes(requestType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request type. Must be "chat" or "image".'
        });
      }
      
      if (!requestedLimit || isNaN(requestedLimit) || requestedLimit < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid requested limit. Must be a positive number.'
        });
      }
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a reason for your request (minimum 10 characters).'
        });
      }
      
      // Check if user already has a pending request for this type
      const existingRequest = await RateLimitRequest.findOne({
        userId: req.user._id,
        requestType,
        status: 'pending'
      });
      
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: `You already have a pending ${requestType} rate limit request.`
        });
      }
      
      // Get current limit
      const user = await User.findById(req.user._id);
      const currentLimit = requestType === 'chat' ? user.chatRateLimit : user.imageRateLimit;
      
      // Don't allow requests for lower limits
      if (requestedLimit <= currentLimit) {
        return res.status(400).json({
          success: false,
          message: `Requested limit must be higher than your current limit of ${currentLimit}.`
        });
      }
      
      // Create new request
      const newRequest = new RateLimitRequest({
        userId: req.user._id,
        requestType,
        currentLimit,
        requestedLimit,
        reason
      });
      
      await newRequest.save();
      
      res.json({
        success: true,
        message: 'Your rate limit increase request has been submitted and is pending review.',
        request: newRequest
      });
    } catch (err) {
      console.error('Error submitting rate limit request:', err);
      res.status(500).json({
        success: false,
        message: 'An error occurred while submitting your request'
      });
    }
  },
  
  // Get user's rate limit requests
  getUserRequests: async (req, res) => {
    try {
      const requests = await RateLimitRequest.find({
        userId: req.user._id
      }).sort({ createdAt: -1 });
      
      res.json({
        success: true,
        requests
      });
    } catch (err) {
      console.error('Error getting rate limit requests:', err);
      res.status(500).json({
        success: false,
        message: 'An error occurred while getting your requests'
      });
    }
  }
};
