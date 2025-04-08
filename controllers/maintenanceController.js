const MaintenanceMode = require('../models/MaintenanceMode');
const MaintenanceLoginAttempt = require('../models/MaintenanceLoginAttempt');
const MaintenanceHistory = require('../models/MaintenanceHistory');
const User = require('../models/User');
const useragent = require('useragent');
const DeviceDetector = require('device-detector-js');
const deviceDetector = new DeviceDetector();

module.exports = {
  // Check if maintenance mode is enabled
  isMaintenanceMode: async () => {
    try {
      // Get the latest maintenance mode settings
      const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

      // If no settings exist or maintenance mode is disabled, return false
      if (!maintenanceSettings || !maintenanceSettings.isEnabled) {
        return false;
      }

      // Check if maintenance period has ended
      const now = new Date();
      if (maintenanceSettings.endTime && now > maintenanceSettings.endTime) {
        // Automatically disable maintenance mode if the end time has passed
        maintenanceSettings.isEnabled = false;
        await maintenanceSettings.save();

        // Log the automatic disabling
        console.log(`Maintenance mode automatically disabled at ${now.toISOString()} because end time ${maintenanceSettings.endTime.toISOString()} has passed`);

        // Create a maintenance history record
        try {
          await MaintenanceHistory.create({
            action: 'auto_disable',
            details: 'Maintenance mode automatically disabled due to end time passing',
            previousSettings: {
              isEnabled: true,
              startTime: maintenanceSettings.startTime,
              endTime: maintenanceSettings.endTime,
              message: maintenanceSettings.message
            }
          });
        } catch (historyErr) {
          console.error('Error creating maintenance history record:', historyErr);
        }

        return false;
      }

      // Maintenance mode is active
      return maintenanceSettings;
    } catch (err) {
      console.error('Error checking maintenance mode:', err);
      return false;
    }
  },

  // Middleware to check maintenance mode and redirect non-admin users
  maintenanceMiddleware: async (req, res, next) => {
    try {
      // Skip maintenance check for these paths
      const bypassPaths = [
        '/maintenance',
        '/health',
        '/users/login',
        '/users/logout',
        '/session-error',
        '/clear-flash',
        '/favicon.ico',
        '/css',
        '/js',
        '/images'
      ];

      // Check if the current path should bypass maintenance check
      const shouldBypass = bypassPaths.some(path => req.path === path || req.path.startsWith(path));
      if (shouldBypass) {
        return next();
      }

      // ALWAYS bypass maintenance for admin routes
      if (req.path.startsWith('/admin') || req.originalUrl.startsWith('/admin')) {
        // For admin routes, check if user is authenticated and is admin
        if (req.isAuthenticated() &&
            (req.user.isAdmin ||
             req.user.role === 'admin' ||
             req.maintenanceBypass ||
             req.session.maintenanceBypass ||
             req.session.isAdminSession)) {
          // Set a flag to indicate we're in maintenance mode (for UI purposes)
          req.maintenanceMode = true;
          return next();
        }

        // If not authenticated or not admin, redirect to login
        req.flash('error_msg', 'You must be an administrator to access this area during maintenance mode.');
        return res.redirect('/users/login?admin=true');
      }

      // Check if user is admin and should bypass maintenance
      if (req.isAuthenticated() &&
          (req.user.isAdmin ||
           req.user.role === 'admin' ||
           req.maintenanceBypass ||
           req.session.maintenanceBypass ||
           req.session.isAdminSession)) {
        // Admin users bypass maintenance mode for all routes
        return next();
      }

      // Check if maintenance mode is enabled
      const maintenanceSettings = await module.exports.isMaintenanceMode();

      // If maintenance mode is not enabled, proceed normally
      if (!maintenanceSettings) {
        return next();
      }

      // Allow admin users to bypass maintenance mode for non-admin routes
      if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
      }

      // If a non-admin user is logged in, log them out
      if (req.isAuthenticated() && !req.user.isAdmin) {
        return req.logout(function(err) {
          if (err) {
            console.error('Error during logout:', err);
          }
          req.flash('error_msg', 'The site is currently in maintenance mode. You have been logged out.');
          return res.redirect('/maintenance');
        });
      }

      // For login attempts during maintenance, handle specially
      if (req.path === '/users/login' && req.method === 'POST') {
        // Parse user agent
        const agent = useragent.parse(req.headers['user-agent']);

        // Get the email from the request body
        const { email, password } = req.body;

        // Special case for known admin email - don't log the actual email for security
        const adminEmail = process.env.ADMIN_EMAIL || 'vijaymudaliyar224@gmail.com';
        if (email === adminEmail) {
          console.log('Admin email detected, allowing access');

          // Log successful admin login attempt
          try {
            // Get detailed device information
            const userAgentString = req.headers['user-agent'];
            const deviceInfo = deviceDetector.parse(userAgentString);

            // Get IP addresses
            const ipAddress = req.connection.remoteAddress || '0.0.0.0';
            const forwardedIp = req.headers['x-forwarded-for'] || '';

            // Determine device type, brand, and model
            let deviceType = 'Desktop';
            let deviceBrand = '';
            let deviceModel = '';

            if (deviceInfo.device) {
              deviceType = deviceInfo.device.type || 'Unknown';
              deviceBrand = deviceInfo.device.brand || '';
              deviceModel = deviceInfo.device.model || '';
            }

            // Get browser and OS details
            const agent = useragent.parse(userAgentString);
            const browser = deviceInfo.client?.name || agent.family;
            const browserVersion = deviceInfo.client?.version || agent.toVersion();
            const operatingSystem = deviceInfo.os?.name || agent.os.family;
            const osVersion = deviceInfo.os?.version || agent.os.toVersion();

            // Log the attempt with detailed information
            const loginAttempt = new MaintenanceLoginAttempt({
              username: email,
              ipAddress: ipAddress,
              forwardedIp: forwardedIp,
              userAgent: userAgentString,
              browser: browser,
              browserVersion: browserVersion,
              operatingSystem: operatingSystem,
              osVersion: osVersion,
              deviceType: deviceType,
              deviceBrand: deviceBrand,
              deviceModel: deviceModel,
              status: 'passed',
              reason: 'Admin login during maintenance'
            });

            await loginAttempt.save();
            console.log('Logged successful admin login during maintenance');
          } catch (err) {
            console.error('Error logging admin login:', err);
          }

          return next();
        }

        // Check if this is an admin trying to log in
        const user = await User.findOne({ email });

        // If it's an admin, allow the login attempt to proceed
        if (user && (user.isAdmin || user.role === 'admin' || email === process.env.ADMIN_EMAIL || email === 'vijaymudaliyar224@gmail.com')) {
          console.log('Admin login attempt detected, allowing access:', email);
          // Set a special flag to indicate this is an admin login during maintenance
          req.adminMaintenance = true;
          return next();
        }

        // Log the user details for debugging
        if (user) {
          console.log('User found but not admin:', email, 'isAdmin:', user.isAdmin);
        }

        console.log('Non-admin login attempt during maintenance:', email);

        // Get detailed device information
        const userAgentString = req.headers['user-agent'];
        const deviceInfo = deviceDetector.parse(userAgentString);

        // Get IP addresses
        const ipAddress = req.connection.remoteAddress || '0.0.0.0';
        const forwardedIp = req.headers['x-forwarded-for'] || '';

        // Determine device type, brand, and model
        let deviceType = 'Desktop';
        let deviceBrand = '';
        let deviceModel = '';

        if (deviceInfo.device) {
          deviceType = deviceInfo.device.type || 'Unknown';
          deviceBrand = deviceInfo.device.brand || '';
          deviceModel = deviceInfo.device.model || '';
        }

        // Get browser and OS details
        const browser = deviceInfo.client?.name || agent.family;
        const browserVersion = deviceInfo.client?.version || agent.toVersion();
        const operatingSystem = deviceInfo.os?.name || agent.os.family;
        const osVersion = deviceInfo.os?.version || agent.os.toVersion();

        // Log the attempt with detailed information
        const loginAttempt = new MaintenanceLoginAttempt({
          username: email || 'Unknown',
          ipAddress: ipAddress,
          forwardedIp: forwardedIp,
          userAgent: userAgentString,
          browser: browser,
          browserVersion: browserVersion,
          operatingSystem: operatingSystem,
          osVersion: osVersion,
          deviceType: deviceType,
          deviceBrand: deviceBrand,
          deviceModel: deviceModel,
          status: 'failed',
          reason: 'Non-admin user during maintenance'
        });

        await loginAttempt.save();
        console.log('Logged maintenance login attempt:', {
          username: email,
          device: `${deviceBrand} ${deviceModel}`,
          browser: `${browser} ${browserVersion}`,
          os: `${operatingSystem} ${osVersion}`
        });

        // Set error message for non-admin login attempts
        req.flash('error_msg', 'Only administrators can log in during maintenance mode. You will be redirected to the maintenance page.');
        return res.redirect('/users/login?maintenance=true');
      }

      // Special case for the login page - allow access but with maintenance notice
      if (req.path === '/users/login' && req.method === 'GET') {
        // Set a flag to show maintenance notice on the login page
        req.maintenanceMode = true;

        // If redirected from a failed login attempt, add auto-redirect
        if (req.query.maintenance === 'true') {
          req.maintenanceRedirect = true;
        }

        return next();
      }

      // Redirect to maintenance page
      res.redirect('/maintenance');
    } catch (err) {
      console.error('Error in maintenance middleware:', err);
      next();
    }
  },

  // Render maintenance page
  getMaintenancePage: async (req, res) => {
    try {
      // Get maintenance settings
      const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

      // If maintenance mode is not enabled, redirect to home
      if (!maintenanceSettings || !maintenanceSettings.isEnabled) {
        return res.redirect('/');
      }

      res.render('maintenance', {
        title: 'Maintenance Mode - FTRAISE AI',
        maintenance: maintenanceSettings
      });
    } catch (err) {
      console.error('Error rendering maintenance page:', err);
      res.status(500).render('500');
    }
  },

  // Admin: Get maintenance management page
  getMaintenanceManagement: async (req, res) => {
    try {
      // Get current maintenance settings
      const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

      // Get limited login attempts for the main page (just the most recent 5)
      const loginAttempts = await MaintenanceLoginAttempt.find()
        .sort({ timestamp: -1 })
        .limit(5);

      // Get total count of login attempts
      const totalLoginAttempts = await MaintenanceLoginAttempt.countDocuments();

      // Get limited maintenance history for the main page (just the most recent 3)
      const maintenanceHistory = await MaintenanceHistory.find()
        .sort({ startTime: -1 })
        .populate('adminId', 'username')
        .limit(3);

      // Get total count of maintenance history records
      const totalMaintenanceHistory = await MaintenanceHistory.countDocuments();

      // Debug maintenance history
      console.log('Maintenance history count:', maintenanceHistory.length);
      if (maintenanceHistory.length > 0) {
        console.log('First history record:', {
          reason: maintenanceHistory[0].reason,
          startTime: maintenanceHistory[0].startTime,
          status: maintenanceHistory[0].status
        });
      } else {
        console.log('No maintenance history records found');

        // Create a sample history record if none exist
        if (req.user && req.user.isAdmin) {
          try {
            const startTime = new Date();
            startTime.setHours(startTime.getHours() - 2); // 2 hours ago

            const endTime = new Date();
            endTime.setHours(endTime.getHours() - 1); // 1 hour ago

            const historyRecord = new MaintenanceHistory({
              reason: 'System Update',
              message: 'Initial system update and maintenance',
              startTime,
              endTime,
              durationUnit: 'hours',
              durationValue: 1,
              actualEndTime: endTime,
              status: 'completed',
              adminId: req.user._id,
              loginAttempts: 0,
              notes: 'Initial maintenance record'
            });

            await historyRecord.save();
            console.log('Created sample maintenance history record');

            // Reload the history
            maintenanceHistory.push(historyRecord);
          } catch (err) {
            console.error('Error creating sample history record:', err);
          }
        }
      }

      res.render('admin/maintenance', {
        title: 'Maintenance Management - FTRAISE AI',
        maintenance: maintenanceSettings || new MaintenanceMode(),
        loginAttempts,
        maintenanceHistory,
        totalLoginAttempts,
        totalMaintenanceHistory,
        path: '/admin/maintenance',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error loading maintenance management:', err);
      req.flash('error_msg', 'An error occurred while loading maintenance management');
      res.redirect('/admin');
    }
  },

  // Admin: Get maintenance history
  getMaintenanceHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await MaintenanceHistory.countDocuments();

      // Get maintenance history with pagination
      const maintenanceHistory = await MaintenanceHistory.find()
        .sort({ startTime: -1 })
        .populate('adminId', 'username')
        .skip(skip)
        .limit(limit);

      res.render('admin/maintenance-history', {
        title: 'Maintenance History - FTRAISE AI',
        maintenanceHistory,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        path: '/admin/maintenance/history',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error loading maintenance history:', err);
      req.flash('error_msg', 'An error occurred while loading maintenance history');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Get all login attempts
  getLoginAttempts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await MaintenanceLoginAttempt.countDocuments();

      // Get login attempts with pagination
      const loginAttempts = await MaintenanceLoginAttempt.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      res.render('admin/login-attempts', {
        title: 'Login Attempts During Maintenance - FTRAISE AI',
        loginAttempts,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        path: '/admin/maintenance/attempts',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error loading login attempts:', err);
      req.flash('error_msg', 'An error occurred while loading login attempts');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Update maintenance settings
  updateMaintenanceSettings: async (req, res) => {
    try {
      const {
        isEnabled,
        reason,
        message,
        durationUnit,
        durationValue,
        notes
      } = req.body;

      // Calculate end time based on duration
      const startTime = new Date();
      const endTime = new Date();

      switch (durationUnit) {
        case 'seconds':
          endTime.setSeconds(endTime.getSeconds() + parseInt(durationValue));
          break;
        case 'minutes':
          endTime.setMinutes(endTime.getMinutes() + parseInt(durationValue));
          break;
        case 'hours':
          endTime.setHours(endTime.getHours() + parseInt(durationValue));
          break;
        case 'days':
          endTime.setDate(endTime.getDate() + parseInt(durationValue));
          break;
        case 'months':
          endTime.setMonth(endTime.getMonth() + parseInt(durationValue));
          break;
        default:
          endTime.setHours(endTime.getHours() + 1); // Default to 1 hour
      }

      // Get previous maintenance settings
      let maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });
      const wasEnabled = maintenanceSettings ? maintenanceSettings.isEnabled : false;
      const isNowEnabled = isEnabled === 'true';

      // Create new settings if none exist
      if (!maintenanceSettings) {
        maintenanceSettings = new MaintenanceMode();
      }

      // Update settings
      maintenanceSettings.isEnabled = isNowEnabled;
      maintenanceSettings.reason = reason;
      maintenanceSettings.message = message;
      maintenanceSettings.startTime = startTime;
      maintenanceSettings.endTime = endTime;
      maintenanceSettings.durationUnit = durationUnit;
      maintenanceSettings.durationValue = parseInt(durationValue);
      maintenanceSettings.updatedBy = req.user._id;

      await maintenanceSettings.save();

      // If maintenance was enabled or disabled, create a history record
      if ((!wasEnabled && isNowEnabled) || (wasEnabled && !isNowEnabled)) {
        // If maintenance was disabled, record it as disabled (not completed)
        if (wasEnabled && !isNowEnabled) {
          // Find the most recent history that doesn't have an actual end time
          const lastHistory = await MaintenanceHistory.findOne({
            actualEndTime: null
          }).sort({ startTime: -1 });

          if (lastHistory) {
            const now = new Date();
            lastHistory.actualEndTime = now;

            // Count login attempts during this maintenance period
            const loginAttemptsCount = await MaintenanceLoginAttempt.countDocuments({
              timestamp: {
                $gte: lastHistory.startTime,
                $lte: now
              }
            });

            // Update the login attempts count
            lastHistory.loginAttempts = loginAttemptsCount;

            // Set status to 'cancelled' if disabled before the scheduled end time
            if (now < lastHistory.endTime) {
              lastHistory.status = 'cancelled';
            } else {
              lastHistory.status = 'completed';
            }

            await lastHistory.save();
            console.log(`Updated maintenance history with ${loginAttemptsCount} login attempts`);
          }
        }

        // If maintenance was enabled, create a new history record
        if (!wasEnabled && isNowEnabled) {
          // Count login attempts for this maintenance period
          // We'll update this count when maintenance ends, for now set to 0
          const loginAttemptsCount = 0;

          // Create history record
          const historyRecord = new MaintenanceHistory({
            reason,
            message,
            startTime,
            endTime,
            durationUnit,
            durationValue: parseInt(durationValue),
            adminId: req.user._id,
            loginAttempts: loginAttemptsCount,
            notes: notes || ''
          });

          const savedRecord = await historyRecord.save();
          console.log('Created maintenance history record:', {
            id: savedRecord._id,
            reason: savedRecord.reason,
            startTime: savedRecord.startTime,
            adminId: savedRecord.adminId
          });
        }
      }

      req.flash('success_msg', `Maintenance mode ${isNowEnabled ? 'enabled' : 'disabled'} successfully`);
      res.redirect('/admin/maintenance');
    } catch (err) {
      console.error('Error updating maintenance settings:', err);
      req.flash('error_msg', 'An error occurred while updating maintenance settings');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Delete login attempt
  deleteLoginAttempt: async (req, res) => {
    try {
      const attemptId = req.params.id;

      await MaintenanceLoginAttempt.findByIdAndDelete(attemptId);

      req.flash('success_msg', 'Login attempt deleted successfully');
      res.redirect('/admin/maintenance');
    } catch (err) {
      console.error('Error deleting login attempt:', err);
      req.flash('error_msg', 'An error occurred while deleting the login attempt');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Clear all login attempts
  clearLoginAttempts: async (req, res) => {
    try {
      await MaintenanceLoginAttempt.deleteMany({});

      req.flash('success_msg', 'All login attempts cleared successfully');
      res.redirect('/admin/maintenance');
    } catch (err) {
      console.error('Error clearing login attempts:', err);
      req.flash('error_msg', 'An error occurred while clearing login attempts');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Delete a maintenance history record
  deleteMaintenanceHistory: async (req, res) => {
    try {
      const historyId = req.params.id;

      await MaintenanceHistory.findByIdAndDelete(historyId);

      req.flash('success_msg', 'Maintenance history record deleted successfully');
      res.redirect('/admin/maintenance');
    } catch (err) {
      console.error('Error deleting maintenance history:', err);
      req.flash('error_msg', 'An error occurred while deleting the maintenance history record');
      res.redirect('/admin/maintenance');
    }
  },

  // Admin: Bulk delete maintenance history records
  bulkDeleteMaintenanceHistory: async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        req.flash('error_msg', 'No records selected for deletion');
        return res.redirect('/admin/maintenance');
      }

      // Delete all selected records
      const result = await MaintenanceHistory.deleteMany({ _id: { $in: ids } });

      req.flash('success_msg', `${result.deletedCount} maintenance history records deleted successfully`);
      res.redirect('/admin/maintenance');
    } catch (err) {
      console.error('Error bulk deleting maintenance history:', err);
      req.flash('error_msg', 'An error occurred while deleting the maintenance history records');
      res.redirect('/admin/maintenance');
    }
  }
};

