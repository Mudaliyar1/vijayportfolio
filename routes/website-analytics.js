const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const websiteAnalyticsController = require('../controllers/websiteAnalyticsController');

// User routes
router.get('/', isAuthenticated, websiteAnalyticsController.getDashboard);
router.get('/website/:id', isAuthenticated, websiteAnalyticsController.getWebsiteAnalytics);
router.get('/website/:id/pages', isAuthenticated, websiteAnalyticsController.getPageAnalytics);
router.get('/website/:id/visitors', isAuthenticated, websiteAnalyticsController.getVisitorAnalytics);
router.get('/website/:id/referrers', isAuthenticated, websiteAnalyticsController.getReferrerAnalytics);
router.get('/website/:id/devices', isAuthenticated, websiteAnalyticsController.getDeviceAnalytics);
router.get('/website/:id/export', isAuthenticated, websiteAnalyticsController.exportAnalytics);

// API routes for tracking
router.post('/api/track', websiteAnalyticsController.trackPageView);
router.post('/api/track/event', websiteAnalyticsController.trackEvent);

// Admin routes
router.get('/admin', isAuthenticated, isAdmin, websiteAnalyticsController.getAdminDashboard);
router.get('/admin/websites', isAuthenticated, isAdmin, websiteAnalyticsController.getAdminWebsites);
router.get('/admin/users', isAuthenticated, isAdmin, websiteAnalyticsController.getAdminUsers);

module.exports = router;
