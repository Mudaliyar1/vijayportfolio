const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const systemSettingsController = require('../controllers/systemSettingsController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// System settings dashboard
router.get('/', systemSettingsController.getSystemSettingsDashboard);

// Update internet ads setting
router.post('/internet-ads', systemSettingsController.updateInternetAdsSetting);

// Refresh internet ads
router.post('/refresh-internet-ads', systemSettingsController.refreshInternetAds);

// Update all ads disabled setting
router.post('/all-ads-disabled', systemSettingsController.updateAllAdsDisabledSetting);

module.exports = router;
