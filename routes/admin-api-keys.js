const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getApiKeyManagement,
  adminUpdateApiKey,
  adminDeleteApiKey
} = require('../controllers/apiKeyController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// API key management
router.get('/', getApiKeyManagement);

// Update API key
router.post('/update', adminUpdateApiKey);

// Delete API key
router.delete('/:id', adminDeleteApiKey);
router.post('/delete/:id', adminDeleteApiKey); // Alternative route for form submissions

module.exports = router;
