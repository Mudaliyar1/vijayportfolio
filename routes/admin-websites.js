const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const websiteController = require('../controllers/websiteController');

// Get all websites
router.get('/websites', isAuthenticated, isAdmin, websiteController.adminGetAllWebsites);

// Get website details
router.get('/websites/:id', isAuthenticated, isAdmin, websiteController.adminGetWebsiteDetails);

// Toggle website published status
router.post('/websites/:id/toggle-status', isAuthenticated, isAdmin, websiteController.adminToggleWebsiteStatus);

// Delete website
router.delete('/websites/:id', isAuthenticated, isAdmin, websiteController.adminDeleteWebsite);

module.exports = router;
