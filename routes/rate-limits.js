const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const {
  getRequestPage,
  submitRequest,
  getUserRequests
} = require('../controllers/rateLimitController');

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Rate limit request page
router.get('/request', getRequestPage);

// Submit rate limit request
router.post('/request', submitRequest);

// Get user's rate limit requests
router.get('/my-requests', getUserRequests);

module.exports = router;
