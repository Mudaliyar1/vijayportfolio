const SystemSetting = require('../models/SystemSetting');
const internetAdsService = require('../services/internetAdsService');

module.exports = {
  // Admin: Get system settings dashboard
  getSystemSettingsDashboard: async (req, res) => {
    try {
      // Get all settings
      const settings = await SystemSetting.find().sort({ key: 1 });

      // Get ad settings
      const internetAdsEnabled = await internetAdsService.areInternetAdsEnabled();
      const allAdsDisabled = await internetAdsService.areAllAdsDisabled();

      res.render('admin/settings/dashboard', {
        title: 'System Settings - FTRAISE AI',
        settings,
        internetAdsEnabled,
        allAdsDisabled
      });
    } catch (err) {
      console.error('Error loading system settings dashboard:', err);
      req.flash('error_msg', 'An error occurred while loading the system settings dashboard');
      res.redirect('/admin');
    }
  },

  // Admin: Update internet ads setting
  updateInternetAdsSetting: async (req, res) => {
    try {
      const { enabled } = req.body;

      // Update the setting
      await SystemSetting.findOneAndUpdate(
        { key: 'internetAdsEnabled' },
        { value: enabled === 'true' || enabled === true },
        { upsert: true }
      );

      // If enabled, fetch internet ads
      if (enabled === 'true' || enabled === true) {
        await internetAdsService.fetchAndStoreInternetAds();
      }

      req.flash('success_msg', 'Internet ads setting updated successfully');
      res.redirect('/admin/settings');
    } catch (err) {
      console.error('Error updating internet ads setting:', err);
      req.flash('error_msg', 'An error occurred while updating the internet ads setting');
      res.redirect('/admin/settings');
    }
  },

  // Admin: Manually refresh internet ads
  refreshInternetAds: async (req, res) => {
    try {
      // Check if internet ads are enabled
      const enabled = await internetAdsService.areInternetAdsEnabled();
      if (!enabled) {
        req.flash('error_msg', 'Internet ads are disabled. Enable them first to refresh.');
        return res.redirect('/admin/settings');
      }

      // Fetch and store internet ads
      const count = await internetAdsService.fetchAndStoreInternetAds();

      req.flash('success_msg', `Successfully refreshed ${count} internet ads`);
      res.redirect('/admin/settings');
    } catch (err) {
      console.error('Error refreshing internet ads:', err);
      req.flash('error_msg', 'An error occurred while refreshing internet ads');
      res.redirect('/admin/settings');
    }
  },

  // Admin: Update all ads disabled setting
  updateAllAdsDisabledSetting: async (req, res) => {
    try {
      const { disabled } = req.body;

      // Update the setting
      await SystemSetting.findOneAndUpdate(
        { key: 'allAdsDisabled' },
        { value: disabled === 'true' || disabled === true },
        { upsert: true }
      );

      if (disabled === 'true' || disabled === true) {
        req.flash('success_msg', 'All ads have been disabled across the site');
      } else {
        req.flash('success_msg', 'Ads have been enabled across the site');
      }

      res.redirect('/admin/settings');
    } catch (err) {
      console.error('Error updating all ads disabled setting:', err);
      req.flash('error_msg', 'An error occurred while updating the all ads disabled setting');
      res.redirect('/admin/settings');
    }
  }
};
