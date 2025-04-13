const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteController');

// Render user website
// Add regex to ensure domain doesn't match static file patterns
router.get('/:domain([^.]+)', websiteController.renderUserWebsite);
router.get('/:domain([^.]+)/:page([^.]+)', websiteController.renderUserWebsite);

module.exports = router;
