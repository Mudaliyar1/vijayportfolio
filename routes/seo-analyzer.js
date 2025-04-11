const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const seoAnalyzerController = require('../controllers/seoAnalyzerController');

// User routes
router.get('/', isAuthenticated, seoAnalyzerController.getSEOAnalyzerPage);
router.post('/analyze', isAuthenticated, seoAnalyzerController.analyzeSEO);
router.post('/optimize', isAuthenticated, seoAnalyzerController.optimizeSEO);
router.get('/history', isAuthenticated, seoAnalyzerController.getSEOHistory);
router.delete('/history/:id', isAuthenticated, seoAnalyzerController.deleteSEOHistory);

// Admin routes
router.get('/admin', isAuthenticated, isAdmin, seoAnalyzerController.getAdminDashboard);
router.get('/admin/settings', isAuthenticated, isAdmin, seoAnalyzerController.getAdminSettings);
router.post('/admin/settings', isAuthenticated, isAdmin, seoAnalyzerController.updateAdminSettings);
router.get('/admin/analytics', isAuthenticated, isAdmin, seoAnalyzerController.getAdminAnalytics);

module.exports = router;
