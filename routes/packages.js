const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const packageController = require('../controllers/packageController');

// Get all packages
router.get('/buy-package', packageController.getAllPackages);

// Get package details
router.get('/buy-package/:id', isAuthenticated, packageController.getPackageDetails);

module.exports = router;
