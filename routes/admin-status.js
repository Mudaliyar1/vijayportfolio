/**
 * Admin status routes
 * These routes are used to check admin status and maintenance mode
 */
const express = require('express');
const router = express.Router();
const MaintenanceMode = require('../models/MaintenanceMode');

// Check admin status and maintenance mode
router.get('/check', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    const isAuthenticated = req.isAuthenticated();
    const isAdmin = isAuthenticated && (
      req.user.isAdmin ||
      req.user.role === 'admin'
    );

    // Check if maintenance mode is enabled
    const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });
    let isMaintenanceActive = false;

    if (maintenanceSettings) {
      // Check if maintenance is enabled
      if (maintenanceSettings.isEnabled) {
        // Check if there's an end time and if it has passed
        const now = new Date();
        if (!maintenanceSettings.endTime || now < maintenanceSettings.endTime) {
          isMaintenanceActive = true;
        } else {
          // End time has passed, automatically disable maintenance mode
          maintenanceSettings.isEnabled = false;
          await maintenanceSettings.save();
          console.log('Maintenance mode automatically disabled due to end time passing');
        }
      }
    }

    // Check session flags
    const sessionFlags = {
      maintenanceBypass: !!req.session.maintenanceBypass,
      isAdminSession: !!req.session.isAdminSession
    };

    // Return status
    res.json({
      status: 'success',
      isAuthenticated,
      isAdmin,
      isMaintenanceActive,
      sessionFlags,
      user: isAuthenticated ? {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        role: req.user.role
      } : null
    });
  } catch (err) {
    console.error('Error checking admin status:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check admin status',
      error: err.message
    });
  }
});

// Force set admin session flags
router.post('/set-admin-flags', (req, res) => {
  if (!req.isAuthenticated() || !(req.user.isAdmin || req.user.role === 'admin')) {
    return res.status(403).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }

  // Set session flags
  req.session.maintenanceBypass = true;
  req.session.isAdminSession = true;

  // Save session
  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to set admin flags',
        error: err.message
      });
    }

    res.json({
      status: 'success',
      message: 'Admin flags set successfully',
      sessionFlags: {
        maintenanceBypass: true,
        isAdminSession: true
      }
    });
  });
});

module.exports = router;
