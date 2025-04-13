const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminMarketingPackageController = require('../controllers/adminMarketingPackageController');

// Apply admin middleware to all routes
router.use(isAuthenticated, isAdmin);

// Get all marketing packages
router.get('/', adminMarketingPackageController.getMarketingPackages);

// Add marketing package
router.get('/add', adminMarketingPackageController.getAddMarketingPackage);
router.post('/add', adminMarketingPackageController.addMarketingPackage);

// Edit marketing package
router.get('/edit/:packageId', adminMarketingPackageController.getEditMarketingPackage);
router.post('/edit/:packageId', adminMarketingPackageController.updateMarketingPackage);

// Delete marketing package
router.delete('/:packageId', adminMarketingPackageController.deleteMarketingPackage);
router.post('/:packageId/delete', adminMarketingPackageController.deleteMarketingPackage); // Alternative route for form submissions

module.exports = router;
