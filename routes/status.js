const express = require('express');
const router = express.Router();
const { 
  getStatusPage,
  subscribeToUpdates
} = require('../controllers/statusController');

// Public status page
router.get('/', getStatusPage);

// Subscribe to status updates
router.post('/subscribe', subscribeToUpdates);

module.exports = router;
