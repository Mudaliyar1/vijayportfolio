const express = require('express');
const router = express.Router();
const { getMaintenancePage } = require('../controllers/maintenanceController');

// Maintenance page
router.get('/', getMaintenancePage);

module.exports = router;
