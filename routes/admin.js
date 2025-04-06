const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const {
  getDashboard,
  getUserManagement,
  getChatManagement,
  getGuestManagement,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  viewChat,
  deleteChat,
  deleteGuest,
  getMemoryManagement,
  viewMemory,
  deleteMemory,
  deleteInteraction
} = require('../controllers/adminController');

const {
  getReviewManagement,
  toggleReviewApproval,
  toggleReviewDisplay,
  deleteReview
} = require('../controllers/reviewController');

const {
  getMaintenanceManagement,
  getMaintenanceHistory,
  getLoginAttempts,
  updateMaintenanceSettings,
  deleteLoginAttempt,
  clearLoginAttempts,
  deleteMaintenanceHistory,
  bulkDeleteMaintenanceHistory
} = require('../controllers/maintenanceController');

// Apply admin middleware to all routes
router.use(ensureAdmin);

// Dashboard
router.get('/', getDashboard);

// User management
router.get('/users', getUserManagement);
router.post('/users', createUser);
router.put('/users', updateUser);
router.put('/users/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);

// Chat management
router.get('/chats', getChatManagement);
router.get('/chats/:id', viewChat);
router.delete('/chats/:id', deleteChat);
router.post('/chats/:id/delete', deleteChat); // Alternative route for form submissions

// Guest management
router.get('/guests', getGuestManagement);
router.delete('/guests/:id', deleteGuest);

// Memory management
router.get('/memories', getMemoryManagement);
router.get('/memories/:id', viewMemory);
router.delete('/memories/:id', deleteMemory);
router.delete('/memories/:memoryId/interactions/:interactionIndex', deleteInteraction);

// Review management
router.get('/reviews', getReviewManagement);
router.put('/reviews/:id/approve', toggleReviewApproval);
router.put('/reviews/:id/display', toggleReviewDisplay);
router.delete('/reviews/:id', deleteReview);

// Maintenance management
router.get('/maintenance', getMaintenanceManagement);
router.get('/maintenance/history', getMaintenanceHistory);
router.get('/maintenance/attempts', getLoginAttempts);
router.post('/maintenance', updateMaintenanceSettings);
router.delete('/maintenance/attempts/:id', deleteLoginAttempt);
router.delete('/maintenance/attempts', clearLoginAttempts);
router.delete('/maintenance/history/:id', deleteMaintenanceHistory);
router.delete('/maintenance/history/bulk-delete', bulkDeleteMaintenanceHistory);

module.exports = router;
