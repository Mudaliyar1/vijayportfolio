const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const adController = require('../controllers/adController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Ad management dashboard
router.get('/', adController.getAdDashboard);

// Add new ad form
router.get('/add', adController.getAddAdForm);

// Add new ad
router.post('/add', adController.addAd);

// Edit ad form
router.get('/edit/:id', adController.getEditAdForm);

// Update ad
router.post('/edit/:id', adController.updateAd);

// Toggle ad active status
router.post('/toggle/:id', adController.toggleAdStatus);

// Delete ad
router.post('/delete/:id', adController.deleteAd);

// Validate image URL
router.post('/validate-image', adController.validateImageUrl);

module.exports = router;
