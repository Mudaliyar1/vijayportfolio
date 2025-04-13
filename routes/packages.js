const express = require('express');
const router = express.Router();
const packageInquiryController = require('../controllers/packageInquiryController');

// Public routes
router.get('/', packageInquiryController.getPublicPackages);
router.get('/:packageId', packageInquiryController.getPackageDetails);
router.post('/inquiry', packageInquiryController.submitInquiry);
router.post('/ai-recommendation', packageInquiryController.getAiRecommendation);

module.exports = router;
