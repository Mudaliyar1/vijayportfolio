const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const websiteController = require('../controllers/websiteController');
const packageController = require('../controllers/packageController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Packages Management - These routes need to be defined BEFORE the :websiteId routes to avoid conflicts
router.get('/packages', packageController.getAdminPackages);
router.get('/packages/create', packageController.adminCreatePackageForm);
router.post('/packages', packageController.createPackage);
router.get('/packages/edit/:id', packageController.adminEditPackageForm);
router.put('/packages', packageController.updatePackage);
router.post('/packages/update', packageController.updatePackage); // Alternative route for form submissions
router.delete('/packages/:packageId', packageController.deletePackage);
router.post('/packages/:packageId/delete', packageController.deletePackage); // Alternative route for form submissions
router.post('/packages/:packageId/toggle-status', packageController.togglePackageStatus);
router.post('/packages/:packageId/toggle-free', packageController.togglePackageStatus); // Alternative route for form submissions
router.post('/packages/bulk-delete', packageController.bulkDeletePackages); // Bulk delete packages

// Payments Management - These routes need to be defined BEFORE the :websiteId routes to avoid conflicts
router.get('/payments', websiteController.getAdminPayments);
router.get('/payments/:paymentId', websiteController.getAdminPaymentDetails);
router.delete('/payments/:paymentId', websiteController.adminDeletePayment);
router.post('/payments/:paymentId/delete', websiteController.adminDeletePayment); // Alternative route for form submissions

// Websites Management
router.get('/', websiteController.getAdminWebsites);
router.get('/:websiteId', websiteController.getAdminWebsiteDetails);
router.post('/:websiteId/toggle-status', websiteController.adminToggleWebsiteStatus);
router.delete('/:websiteId', websiteController.adminDeleteWebsite);
router.post('/:websiteId/delete', websiteController.adminDeleteWebsite); // Alternative route for form submissions

module.exports = router;
