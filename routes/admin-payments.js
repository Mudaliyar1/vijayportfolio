const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const paymentController = require('../controllers/paymentController');

// Get all payments
router.get('/payments', isAuthenticated, isAdmin, adminMaintenanceAccess, paymentController.adminGetAllPayments);

// Get payment details
router.get('/payments/:id', isAuthenticated, isAdmin, adminMaintenanceAccess, paymentController.adminGetPaymentDetails);

// Download payment receipt
router.get('/payments/:id/download', isAuthenticated, isAdmin, adminMaintenanceAccess, paymentController.adminDownloadReceipt);

// Bulk delete payments
router.post('/payments/bulk-delete', isAuthenticated, isAdmin, adminMaintenanceAccess, paymentController.adminBulkDeletePayments);

module.exports = router;
