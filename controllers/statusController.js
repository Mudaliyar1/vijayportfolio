const SystemStatus = require('../models/SystemStatus');
const Incident = require('../models/Incident');
const StatusSubscription = require('../models/StatusSubscription');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Helper function to get status text and color
function getStatusInfo(status) {
  switch (status) {
    case 'operational':
      return { text: 'Operational', color: 'green', icon: '🟢' };
    case 'degraded_performance':
      return { text: 'Degraded Performance', color: 'yellow', icon: '🟡' };
    case 'partial_outage':
      return { text: 'Partial Outage', color: 'orange', icon: '🟠' };
    case 'major_outage':
      return { text: 'Major Outage', color: 'red', icon: '🔴' };
    default:
      return { text: 'Unknown', color: 'gray', icon: '⚪' };
  }
}

// Helper function to get overall status text and color
function getOverallStatusInfo(status) {
  switch (status) {
    case 'operational':
      return { text: 'All Systems Operational', color: 'green', icon: '✅' };
    case 'partial_outage':
      return { text: 'Partial System Outage', color: 'orange', icon: '⚠️' };
    case 'major_outage':
      return { text: 'Major System Outage', color: 'red', icon: '🔴' };
    default:
      return { text: 'System Status Unknown', color: 'gray', icon: '❓' };
  }
}

// Helper function to get incident status text and color
function getIncidentStatusInfo(status) {
  switch (status) {
    case 'investigating':
      return { text: 'Investigating', color: 'yellow' };
    case 'identified':
      return { text: 'Identified', color: 'orange' };
    case 'monitoring':
      return { text: 'Monitoring', color: 'blue' };
    case 'resolved':
      return { text: 'Resolved', color: 'green' };
    default:
      return { text: 'Unknown', color: 'gray' };
  }
}

module.exports = {
  // Public status page with enhanced reliability
  getStatusPage: async (req, res) => {
    // Define default fallback data outside of try/catch to ensure it's always available
    const fallbackSystemStatus = {
      overallStatus: 'operational',
      components: [
        { name: 'AI Chat Engine', status: 'operational' },
        { name: 'Database (MongoDB)', status: 'operational' },
        { name: 'User Login/Auth', status: 'operational' },
        { name: 'Admin Dashboard', status: 'operational' },
        { name: 'Website Frontend', status: 'operational' }
      ],
      updatedAt: new Date()
    };

    // Default uptime data
    const defaultUptimeData = {};
    fallbackSystemStatus.components.forEach(component => {
      defaultUptimeData[component.name] = 100;
    });

    try {
      // Set a timeout for database operations to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out')), 5000);
      });

      // Get the current system status with timeout
      let systemStatusPromise = SystemStatus.findOne().sort({ updatedAt: -1 });
      let systemStatus = await Promise.race([systemStatusPromise, timeoutPromise]);

      // If no system status exists, use the fallback but try to create a new one in the background
      if (!systemStatus) {
        console.log('No system status found, using fallback data');
        // Try to create a default one in the background without waiting
        SystemStatus.create({
          overallStatus: 'operational',
          components: fallbackSystemStatus.components
        }).catch(err => {
          console.error('Failed to create default system status:', err);
        });

        // Use fallback for rendering
        systemStatus = fallbackSystemStatus;
      }

      // Log system status for debugging
      console.log('System status loaded successfully:', systemStatus.overallStatus);

      // Get incidents with time filter from query parameter or default to 30 days
      const timeFilter = req.query.timeFilter || '30days';
      let dateFilter = {};

      if (timeFilter !== 'all') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        switch(timeFilter) {
          case '30days':
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
            break;
          case '90days':
            dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
            break;
          case '6months':
            dateFilter = { createdAt: { $gte: sixMonthsAgo } };
            break;
          case '1year':
            dateFilter = { createdAt: { $gte: oneYearAgo } };
            break;
          default:
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
        }
      }

      // Try to get incidents with timeout
      let incidentsPromise = Incident.find(dateFilter).sort({ createdAt: -1 });
      let incidents = [];
      try {
        incidents = await Promise.race([incidentsPromise, timeoutPromise]);
      } catch (incidentErr) {
        console.error('Error fetching incidents, using empty array:', incidentErr);
        // Continue with empty incidents array
      }

      // Calculate uptime percentages for the last 30 days
      const uptimeData = {};

      // Handle both mongoose model and plain object
      const components = systemStatus.components || fallbackSystemStatus.components;

      // Initialize uptime data
      if (Array.isArray(components)) {
        components.forEach(component => {
          // Default to 100% uptime
          const name = component.name || (typeof component === 'object' ? Object.values(component)[0] : 'Unknown');
          uptimeData[name] = 100;
        });
      } else {
        // Fallback if components is not an array
        Object.assign(uptimeData, defaultUptimeData);
      }

      // Adjust uptime based on incidents
      if (incidents && incidents.length > 0) {
        incidents.forEach(incident => {
          if (incident.status === 'resolved' && incident.endTime && incident.startTime) {
            const duration = incident.endTime - incident.startTime;
            const durationHours = duration / (1000 * 60 * 60);

            if (Array.isArray(incident.affectedComponents)) {
              incident.affectedComponents.forEach(component => {
                if (uptimeData[component]) {
                  // Calculate percentage of time the component was down in the last 30 days
                  const percentageDown = (durationHours / (30 * 24)) * 100;
                  uptimeData[component] = Math.max(0, uptimeData[component] - percentageDown).toFixed(2);
                }
              });
            }
          }
        });
      }

      // Get status info for display
      const overallStatusInfo = getOverallStatusInfo(systemStatus.overallStatus || 'operational');

      // Handle components safely
      let componentsWithInfo = [];
      if (Array.isArray(components)) {
        componentsWithInfo = components.map(component => {
          // Handle both mongoose model and plain object
          if (typeof component.toObject === 'function') {
            return {
              ...component.toObject(),
              statusInfo: getStatusInfo(component.status || 'operational')
            };
          } else {
            return {
              name: component.name || 'Unknown',
              status: component.status || 'operational',
              statusInfo: getStatusInfo(component.status || 'operational')
            };
          }
        });
      } else {
        // Fallback if components is not an array
        componentsWithInfo = fallbackSystemStatus.components.map(component => ({
          name: component.name,
          status: component.status,
          statusInfo: getStatusInfo(component.status)
        }));
      }

      // Format incidents for display safely
      const formattedIncidents = incidents && incidents.length > 0 ? incidents.map(incident => {
        // Handle both mongoose model and plain object
        if (typeof incident.toObject === 'function') {
          return {
            ...incident.toObject(),
            statusInfo: getIncidentStatusInfo(incident.status || 'resolved'),
            duration: incident.duration || 'Unknown',
            isOngoing: incident.isOngoing || false
          };
        } else {
          return {
            _id: incident._id || 'unknown',
            title: incident.title || 'Unknown Incident',
            description: incident.description || 'No description available',
            status: incident.status || 'resolved',
            statusInfo: getIncidentStatusInfo(incident.status || 'resolved'),
            affectedComponents: incident.affectedComponents || [],
            startTime: incident.startTime || new Date(),
            endTime: incident.endTime,
            duration: incident.duration || 'Unknown',
            isOngoing: incident.isOngoing || false,
            updates: incident.updates || []
          };
        }
      }) : [];

      // Render the page with the data we have
      res.render('status/index', {
        title: 'System Status - FTRAISE AI',
        systemStatus: systemStatus || fallbackSystemStatus,
        overallStatusInfo,
        components: componentsWithInfo,
        incidents: formattedIncidents,
        uptimeData,
        user: req.user,
        timeFilter: req.query.timeFilter || '30days'
      });
    } catch (err) {
      console.error('Error in status page:', err);

      // Get status info for display using fallback data
      const overallStatusInfo = getOverallStatusInfo('operational');
      const componentsWithInfo = fallbackSystemStatus.components.map(component => {
        return {
          name: component.name,
          status: component.status,
          statusInfo: getStatusInfo(component.status)
        };
      });

      // Always render the page with fallback data in case of any error
      res.render('status/index', {
        title: 'System Status - FTRAISE AI',
        systemStatus: fallbackSystemStatus,
        overallStatusInfo,
        components: componentsWithInfo,
        incidents: [],
        uptimeData: defaultUptimeData,
        user: req.user,
        timeFilter: '30days',
        error: 'There was an issue loading the latest status data. Showing default values.'
      });
    }
  },

  // Subscribe to status updates
  subscribeToUpdates: async (req, res) => {
    try {
      const { email } = req.body;

      // Check if already subscribed
      const existingSubscription = await StatusSubscription.findOne({ email });

      if (existingSubscription) {
        if (existingSubscription.isVerified) {
          req.flash('info_msg', 'You are already subscribed to status updates.');
        } else {
          req.flash('info_msg', 'Please verify your email address to complete your subscription.');
        }
        return res.redirect('/status');
      }

      // Generate tokens
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      // Create new subscription
      await StatusSubscription.create({
        email,
        verificationToken,
        unsubscribeToken
      });

      // TODO: Send verification email

      req.flash('success_msg', 'Please check your email to verify your subscription.');
      res.redirect('/status');
    } catch (err) {
      console.error('Error subscribing to status updates:', err);
      req.flash('error_msg', 'Failed to subscribe to status updates.');
      res.redirect('/status');
    }
  },

  // Admin: Get status management page
  getAdminStatusPage: async (req, res) => {
    try {
      // Get the current system status
      let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

      // If no system status exists, create a default one
      if (!systemStatus) {
        // Try to fetch components from status app if available
        let statusAppComponents = [];
        try {
          // Use the same MongoDB connection to fetch from status app
          const statusAppSystemStatus = await mongoose.connection.db
            .collection('systemstatuses')
            .findOne({}, { sort: { updatedAt: -1 } });

          if (statusAppSystemStatus && statusAppSystemStatus.components && statusAppSystemStatus.components.length > 0) {
            statusAppComponents = statusAppSystemStatus.components.map(comp => ({
              name: comp.name,
              status: 'operational'
            }));
            console.log('Fetched components from status app:', statusAppComponents);
          }
        } catch (statusAppErr) {
          console.error('Error fetching components from status app:', statusAppErr);
        }

        // Use status app components if available, otherwise use defaults
        const componentsToUse = statusAppComponents.length > 0 ? statusAppComponents : [
          { name: 'AI Chat Engine', status: 'operational' },
          { name: 'Database (MongoDB)', status: 'operational' },
          { name: 'User Login/Auth', status: 'operational' },
          { name: 'Admin Dashboard', status: 'operational' },
          { name: 'Website Frontend', status: 'operational' }
        ];

        systemStatus = await SystemStatus.create({
          overallStatus: 'operational',
          components: componentsToUse
        });
      }

      // Check if we need to sync components from status app
      try {
        const statusAppSystemStatus = await mongoose.connection.db
          .collection('systemstatuses')
          .findOne({}, { sort: { updatedAt: -1 } });

        if (statusAppSystemStatus && statusAppSystemStatus.components) {
          // Get component names from status app
          const statusAppComponentNames = statusAppSystemStatus.components.map(comp => comp.name);

          // Get component names from main app
          const mainAppComponentNames = systemStatus.components.map(comp => comp.name);

          // Find components in status app that are not in main app
          const newComponents = statusAppComponentNames.filter(name => !mainAppComponentNames.includes(name));

          // Add new components to main app
          if (newComponents.length > 0) {
            newComponents.forEach(name => {
              systemStatus.components.push({
                name,
                status: 'operational',
                updatedAt: new Date()
              });
            });

            await systemStatus.save();
            console.log('Added new components from status app:', newComponents);
          }
        }
      } catch (syncErr) {
        console.error('Error syncing components from status app:', syncErr);
      }

      // Get incidents with time filter from query parameter or default to all
      const timeFilter = req.query.timeFilter || 'all';
      let dateFilter = {};

      if (timeFilter !== 'all') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        switch(timeFilter) {
          case '30days':
            dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
            break;
          case '90days':
            dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
            break;
          case '6months':
            dateFilter = { createdAt: { $gte: sixMonthsAgo } };
            break;
          case '1year':
            dateFilter = { createdAt: { $gte: oneYearAgo } };
            break;
          default:
            dateFilter = {};
        }
      }

      const incidents = await Incident.find(dateFilter).sort({ createdAt: -1 });

      // Get status info for display
      const overallStatusInfo = getOverallStatusInfo(systemStatus.overallStatus);
      const componentsWithInfo = systemStatus.components.map(component => {
        return {
          ...component.toObject(),
          statusInfo: getStatusInfo(component.status)
        };
      });

      // Format incidents for display
      const formattedIncidents = incidents.map(incident => {
        return {
          ...incident.toObject(),
          statusInfo: getIncidentStatusInfo(incident.status),
          duration: incident.duration,
          isOngoing: incident.isOngoing
        };
      });

      // Get subscription count
      const subscriptionCount = await StatusSubscription.countDocuments({ isVerified: true });

      res.render('admin/status-management', {
        title: 'Status Management - Admin Dashboard',
        systemStatus,
        overallStatusInfo,
        components: componentsWithInfo,
        incidents: formattedIncidents,
        subscriptionCount,
        path: '/admin/system-status',
        layout: 'layouts/admin',
        timeFilter: req.query.timeFilter || 'all'
      });
    } catch (err) {
      console.error('Error fetching system status for admin:', err);

      // Create a fallback system status for error cases
      const fallbackSystemStatus = {
        overallStatus: 'operational',
        components: [
          { name: 'AI Chat Engine', status: 'operational' },
          { name: 'Database (MongoDB)', status: 'operational' },
          { name: 'User Login/Auth', status: 'operational' },
          { name: 'Admin Dashboard', status: 'operational' },
          { name: 'Website Frontend', status: 'operational' }
        ],
        updatedAt: new Date()
      };

      // Get status info for display
      const overallStatusInfo = getOverallStatusInfo(fallbackSystemStatus.overallStatus);
      const componentsWithInfo = fallbackSystemStatus.components.map(component => {
        return {
          name: component.name,
          status: component.status,
          statusInfo: getStatusInfo(component.status)
        };
      });

      // Render the page with fallback data
      res.render('admin/status-management', {
        title: 'Status Management - Admin Dashboard',
        systemStatus: fallbackSystemStatus,
        overallStatusInfo,
        components: componentsWithInfo,
        incidents: [],
        subscriptionCount: 0,
        path: '/admin/system-status',
        layout: 'layouts/admin',
        timeFilter: 'all',
        error_msg: ['There was an issue loading the latest status data. Showing default values.']
      });
    }
  },

  // Admin: Update system status
  updateSystemStatus: async (req, res) => {
    try {
      const { overallStatus, components } = req.body;

      // Get current status
      let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

      if (!systemStatus) {
        systemStatus = new SystemStatus();
      }

      // Update overall status
      systemStatus.overallStatus = overallStatus;

      // Update component statuses
      if (components && Array.isArray(components)) {
        components.forEach(comp => {
          const componentIndex = systemStatus.components.findIndex(c => c.name === comp.name);

          if (componentIndex !== -1) {
            systemStatus.components[componentIndex].status = comp.status;
            systemStatus.components[componentIndex].updatedAt = new Date();
          }
        });
      }

      // Set updated by
      systemStatus.updatedBy = req.user._id;

      await systemStatus.save();

      // TODO: Notify subscribers if status changed

      req.flash('success_msg', 'System status updated successfully.');
      res.redirect('/admin/system-status');
    } catch (err) {
      console.error('Error updating system status:', err);
      req.flash('error_msg', 'Failed to update system status.');
      res.redirect('/admin/system-status');
    }
  },

  // Admin: Create new incident
  createIncident: async (req, res) => {
    try {
      const { title, description, affectedComponents, status, severity } = req.body;

      // Create new incident
      const incident = new Incident({
        title,
        description,
        affectedComponents: Array.isArray(affectedComponents) ? affectedComponents : [affectedComponents],
        status,
        severity,
        createdBy: req.user._id,
        updates: [{
          message: description,
          status,
          updatedBy: req.user._id
        }]
      });

      await incident.save();

      // TODO: Notify subscribers about new incident

      req.flash('success_msg', 'Incident created successfully.');
      res.redirect('/admin/system-status');
    } catch (err) {
      console.error('Error creating incident:', err);
      req.flash('error_msg', 'Failed to create incident.');
      res.redirect('/admin/system-status');
    }
  },

  // Admin: Update incident
  updateIncident: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      const incident = await Incident.findById(id);

      if (!incident) {
        req.flash('error_msg', 'Incident not found.');
        return res.redirect('/admin/system-status');
      }

      // Add update to incident
      incident.updates.push({
        message,
        status,
        updatedBy: req.user._id
      });

      // Update incident status
      incident.status = status;

      // If resolved, set end time
      if (status === 'resolved' && !incident.endTime) {
        incident.endTime = new Date();
      }

      await incident.save();

      // TODO: Notify subscribers about incident update

      req.flash('success_msg', 'Incident updated successfully.');
      res.redirect('/admin/system-status');
    } catch (err) {
      console.error('Error updating incident:', err);
      req.flash('error_msg', 'Failed to update incident.');
      res.redirect('/admin/system-status');
    }
  },

  // Admin: Delete incident
  deleteIncident: async (req, res) => {
    try {
      const { id } = req.params;

      await Incident.findByIdAndDelete(id);

      req.flash('success_msg', 'Incident deleted successfully.');
      res.redirect('/admin/system-status');
    } catch (err) {
      console.error('Error deleting incident:', err);
      req.flash('error_msg', 'Failed to delete incident.');
      res.redirect('/admin/system-status');
    }
  }
};
