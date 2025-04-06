const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Get all payments
router.get('/payments', isAuthenticated, isAdmin, paymentController.adminGetAllPayments);

// Get payment details
router.get('/payments/:id', isAuthenticated, isAdmin, paymentController.adminGetPaymentDetails);

module.exports = router;
