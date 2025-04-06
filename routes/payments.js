const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create order for package purchase
router.get('/payment/create-order/:id', isAuthenticated, paymentController.createOrder);

// Verify payment
router.post('/payment/verify', isAuthenticated, paymentController.verifyPayment);

// Payment success page
router.get('/payment/success/:id', isAuthenticated, paymentController.paymentSuccess);

// Get payment history
router.get('/payment/history', isAuthenticated, paymentController.getPaymentHistory);

module.exports = router;
