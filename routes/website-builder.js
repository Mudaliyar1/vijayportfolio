const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const packageController = require('../controllers/packageController');
const websiteController = require('../controllers/websiteController');
const paymentController = require('../controllers/paymentController');

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Dashboard
router.get('/dashboard', websiteController.getDashboard);

// Packages
router.get('/packages', packageController.getPackages);
router.post('/packages/select', packageController.selectPackage);

// Website Creation
router.get('/create', websiteController.getCreateWebsite);
router.post('/create', websiteController.createWebsite);

// Website Editor
router.get('/editor/:websiteId([0-9a-fA-F]{24})', websiteController.getEditor);
router.post('/editor/:websiteId([0-9a-fA-F]{24})/save', websiteController.saveWebsite);
router.post('/editor/:websiteId([0-9a-fA-F]{24})/save-template-content', websiteController.saveTemplateContent);

// Page Management
router.post('/editor/:websiteId([0-9a-fA-F]{24})/page', websiteController.createPage);
router.delete('/editor/:websiteId([0-9a-fA-F]{24})/page/:pageId([0-9a-fA-F]{24})', websiteController.deletePage);
router.post('/editor/:websiteId([0-9a-fA-F]{24})/page/:pageId([0-9a-fA-F]{24})/delete', websiteController.deletePage); // Alternative route for form submissions

// AI Content Generation
router.post('/generate-content', websiteController.generateContent);

// Website Management
// Add regex to ensure websiteId is a valid MongoDB ObjectId (24 hex characters)
router.get('/preview/:websiteId([0-9a-fA-F]{24})', websiteController.previewWebsite);
router.post('/publish/:websiteId([0-9a-fA-F]{24})', websiteController.publishWebsite);
router.post('/unpublish/:websiteId([0-9a-fA-F]{24})', websiteController.unpublishWebsite);
router.delete('/delete/:websiteId([0-9a-fA-F]{24})', websiteController.deleteWebsite);
router.post('/delete/:websiteId([0-9a-fA-F]{24})', websiteController.deleteWebsite); // Alternative route for form submissions

// Payment
router.get('/payment/:websiteId([0-9a-fA-F]{24})', websiteController.getPaymentPage);
router.post('/payment/verify', websiteController.verifyPayment);
router.get('/payment-history', paymentController.getPaymentHistory);
router.get('/payment-details/:paymentId', paymentController.getPaymentDetails);

module.exports = router;
