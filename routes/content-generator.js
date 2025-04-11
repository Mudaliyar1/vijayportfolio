const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const contentGeneratorController = require('../controllers/contentGeneratorController');

// User routes
router.get('/', isAuthenticated, contentGeneratorController.getContentGeneratorPage);
router.post('/generate', isAuthenticated, contentGeneratorController.generateContent);
router.post('/save', isAuthenticated, contentGeneratorController.saveGeneratedContent);
router.get('/history', isAuthenticated, contentGeneratorController.getContentHistory);
router.delete('/history/:id', isAuthenticated, contentGeneratorController.deleteContentHistory);

// Admin routes
router.get('/admin', isAuthenticated, isAdmin, contentGeneratorController.getAdminContentGeneratorPage);
router.get('/admin/settings', isAuthenticated, isAdmin, contentGeneratorController.getContentGeneratorSettings);
router.post('/admin/settings', isAuthenticated, isAdmin, contentGeneratorController.updateContentGeneratorSettings);
router.get('/admin/analytics', isAuthenticated, isAdmin, contentGeneratorController.getContentGeneratorAnalytics);
router.get('/admin/templates', isAuthenticated, isAdmin, contentGeneratorController.getContentTemplates);
router.post('/admin/templates', isAuthenticated, isAdmin, contentGeneratorController.createContentTemplate);
router.put('/admin/templates/:id', isAuthenticated, isAdmin, contentGeneratorController.updateContentTemplate);
router.delete('/admin/templates/:id', isAuthenticated, isAdmin, contentGeneratorController.deleteContentTemplate);

module.exports = router;
