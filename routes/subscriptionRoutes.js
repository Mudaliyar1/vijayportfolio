/**
 * Subscription Routes
 */
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');

// User subscription routes
router.get('/', ensureAuthenticated, subscriptionController.getSubscriptionPage);
router.post('/create-order', ensureAuthenticated, subscriptionController.createSubscriptionOrder);
router.post('/verify-payment', ensureAuthenticated, subscriptionController.verifySubscriptionPayment);
router.post('/cancel', ensureAuthenticated, subscriptionController.cancelSubscription);

// Admin subscription routes
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const adminViewData = require('../middleware/adminViewData');

// Apply admin middleware to admin routes
router.use('/admin/*', ensureAdmin);
router.use('/admin/*', adminMaintenanceAccess);
router.use('/admin/*', adminViewData);

router.get('/admin/subscription-settings', subscriptionController.getSubscriptionSettings);
router.post('/admin/subscription-settings', subscriptionController.updateSubscriptionSettings);
router.post('/admin/create-subscription', subscriptionController.createSubscriptionForUser);
router.post('/admin/cancel-subscription/:id', subscriptionController.cancelUserSubscription);
router.post('/admin/reactivate-subscription/:id', subscriptionController.reactivateSubscription);

// Subscription plan routes
router.post('/admin/create-plan', subscriptionController.createSubscriptionPlan);
router.post('/admin/toggle-plan/:id', subscriptionController.toggleSubscriptionPlan);
router.post('/admin/delete-plan/:id', subscriptionController.deleteSubscriptionPlan);
router.post('/admin/create-subscription-with-plan', subscriptionController.createSubscriptionWithPlan);

module.exports = router;
