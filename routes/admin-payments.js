const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Get all payments
router.get('/payments', isAuthenticated, isAdmin, paymentController.adminGetAllPayments);

// Get payment details
router.get('/payments/:id', isAuthenticated, isAdmin, paymentController.adminGetPaymentDetails);

// Download payment receipt
router.get('/payments/:id/download', isAuthenticated, isAdmin, paymentController.adminDownloadReceipt);

// Bulk delete payments
router.post('/payments/bulk-delete', isAuthenticated, isAdmin, paymentController.adminBulkDeletePayments);

module.exports = router;
