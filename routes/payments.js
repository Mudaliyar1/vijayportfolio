const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create order for package purchase
router.get('/payment/create-order/:id', isAuthenticated, paymentController.createOrder);

// Apply discount from scratch card
router.post('/payment/apply-discount', isAuthenticated, paymentController.applyDiscount);

// Verify payment
router.post('/payment/verify', isAuthenticated, paymentController.verifyPayment);

// Payment success page
router.get('/payment/success/:id', isAuthenticated, paymentController.paymentSuccess);

// Retry payment
router.get('/payment/retry/:id', isAuthenticated, paymentController.retryPayment);

// Download payment receipt
router.get('/payment/download/:id', isAuthenticated, paymentController.downloadReceipt);

// Delete payment record
router.delete('/payment/delete/:id', isAuthenticated, paymentController.deletePaymentRecord);

// Get payment history
router.get('/payment/history', isAuthenticated, paymentController.getPaymentHistory);

module.exports = router;
