const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const websiteController = require('../controllers/websiteController');

// Get all websites
router.get('/websites', isAuthenticated, isAdmin, adminMaintenanceAccess, websiteController.adminGetAllWebsites);

// Get website details
router.get('/websites/:id', isAuthenticated, isAdmin, adminMaintenanceAccess, websiteController.adminGetWebsiteDetails);

// Toggle website published status
router.post('/websites/:id/toggle-status', isAuthenticated, isAdmin, adminMaintenanceAccess, websiteController.adminToggleWebsiteStatus);

// Bulk delete websites
router.post('/websites/bulk-delete', isAuthenticated, isAdmin, adminMaintenanceAccess, websiteController.adminBulkDeleteWebsites);

// Delete website
router.delete('/websites/:id', isAuthenticated, isAdmin, adminMaintenanceAccess, websiteController.adminDeleteWebsite);

module.exports = router;
