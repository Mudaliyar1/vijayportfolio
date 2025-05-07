const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getContactMessages,
  viewContactMessage,
  updateMessageStatus,
  deleteMessage
} = require('../controllers/contactMessageController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Contact messages dashboard
router.get('/', getContactMessages);

// View a single message
router.get('/:id', viewContactMessage);

// Update message status
router.put('/:id/status', updateMessageStatus);

// Delete a message
router.delete('/:id', deleteMessage);
router.post('/:id/delete', deleteMessage); // Alternative route for form submissions

module.exports = router;
