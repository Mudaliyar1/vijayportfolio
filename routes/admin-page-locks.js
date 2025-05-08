const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getPageLockManagement,
  togglePageLock,
  deletePageLock
} = require('../controllers/pageLockController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Page lock management dashboard
router.get('/', getPageLockManagement);

// Toggle page lock status
router.post('/toggle', togglePageLock);

// Delete page lock
router.delete('/:id', deletePageLock);
router.post('/:id/delete', deletePageLock); // Alternative route for form submissions

module.exports = router;
