const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getAdminStatusPage,
  updateSystemStatus,
  createIncident,
  updateIncident,
  deleteIncident
} = require('../controllers/statusController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Status management dashboard
router.get('/', getAdminStatusPage);

// Update system status
router.post('/update', updateSystemStatus);

// Create new incident
router.post('/incidents', createIncident);

// Update incident
router.post('/incidents/:id', updateIncident);

// Delete incident
router.delete('/incidents/:id', deleteIncident);
router.post('/incidents/:id/delete', deleteIncident); // Alternative route for form submissions

module.exports = router;
