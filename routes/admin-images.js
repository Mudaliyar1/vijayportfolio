const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getImageManagement,
  getUserImages,
  deleteImage
} = require('../controllers/adminImageController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Image management dashboard
router.get('/', getImageManagement);

// Get user's images
router.get('/user/:userId', getUserImages);

// Delete image
router.delete('/:id', deleteImage);

module.exports = router;
