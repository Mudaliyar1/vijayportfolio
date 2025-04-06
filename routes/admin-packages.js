const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const packageController = require('../controllers/packageController');

// Get all packages
router.get('/packages', isAuthenticated, isAdmin, packageController.adminGetAllPackages);

// Create package form
router.get('/packages/create', isAuthenticated, isAdmin, packageController.adminCreatePackageForm);

// Create package
router.post('/packages/create', isAuthenticated, isAdmin, packageController.adminCreatePackage);

// Edit package form
router.get('/packages/edit/:id', isAuthenticated, isAdmin, packageController.adminEditPackageForm);

// Update package
router.post('/packages/edit/:id', isAuthenticated, isAdmin, packageController.adminUpdatePackage);

// Delete package
router.delete('/packages/:id', isAuthenticated, isAdmin, packageController.adminDeletePackage);

module.exports = router;
