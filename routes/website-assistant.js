const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const websiteAssistantController = require('../controllers/websiteAssistantController');

// User routes
router.get('/', isAuthenticated, websiteAssistantController.getWebsiteAssistantPage);
router.post('/chat', isAuthenticated, websiteAssistantController.sendMessage);
router.get('/history/:websiteId', isAuthenticated, websiteAssistantController.getChatHistory);
router.delete('/history/:chatId', isAuthenticated, websiteAssistantController.deleteChat);

// Admin routes
router.get('/admin', isAuthenticated, isAdmin, websiteAssistantController.getAdminDashboard);
router.get('/admin/chats', isAuthenticated, isAdmin, websiteAssistantController.getAdminChats);
router.get('/admin/settings', isAuthenticated, isAdmin, websiteAssistantController.getAdminSettings);
router.post('/admin/settings', isAuthenticated, isAdmin, websiteAssistantController.updateAdminSettings);
router.get('/admin/analytics', isAuthenticated, isAdmin, websiteAssistantController.getAdminAnalytics);

module.exports = router;
