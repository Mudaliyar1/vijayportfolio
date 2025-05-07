const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getIpTracker,
  exportCsv,
  exportPdf
} = require('../controllers/ipTrackerController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// IP tracker dashboard
router.get('/', getIpTracker);

// Export data
router.get('/export/csv', exportCsv);
router.get('/export/pdf', exportPdf);

module.exports = router;
