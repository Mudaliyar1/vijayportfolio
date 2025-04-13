const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const packageInquiryController = require('../controllers/packageInquiryController');

// Apply admin middleware to all routes
router.use(isAuthenticated, isAdmin);

// Get all inquiries
router.get('/', packageInquiryController.getAdminInquiries);

// Update inquiry status
router.post('/update-status', packageInquiryController.updateInquiryStatus);

// Delete inquiry
router.delete('/:inquiryId', packageInquiryController.deleteInquiry);
router.post('/:inquiryId/delete', packageInquiryController.deleteInquiry); // Alternative route for form submissions

module.exports = router;
