const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const userStatisticsController = require('../controllers/userStatisticsController');

// Admin routes for user statistics
router.get('/', isAuthenticated, isAdmin, userStatisticsController.getDashboard);
router.get('/content-generator', isAuthenticated, isAdmin, userStatisticsController.getContentGeneratorStats);
router.get('/seo-analyzer', isAuthenticated, isAdmin, userStatisticsController.getSEOAnalyzerStats);
router.get('/history', isAuthenticated, isAdmin, userStatisticsController.getUserHistory);
router.get('/user/:userId', isAuthenticated, isAdmin, userStatisticsController.getUserDetail);

module.exports = router;
