const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../middlewares/auth');
const {
  getDeveloperPortal,
  getApiDocs,
  createApiKey,
  updateApiKey,
  regenerateApiKey,
  deleteApiKey
} = require('../../controllers/apiKeyController');

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Developer portal
router.get('/developer-portal', getDeveloperPortal);

// API documentation
router.get('/docs', getApiDocs);

// Create API key
router.post('/create', createApiKey);

// Update API key
router.post('/update', updateApiKey);

// Regenerate API key
router.post('/regenerate', regenerateApiKey);

// Delete API key
router.delete('/:id', deleteApiKey);
router.post('/delete/:id', deleteApiKey); // Alternative route for form submissions

module.exports = router;
