/**
 * Status Server
 *
 * This is a separate server for the status page that runs independently
 * from the main application. This ensures that the status page remains
 * operational even if the main application crashes.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

// Initialize Express app
const app = express();
const STATUS_PORT = process.env.STATUS_PORT || 3001;

// Trust proxy - important for Render and other PaaS platforms
app.set('trust proxy', 1);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('Status Server: MongoDB Connected');
  } catch (err) {
    console.error('Status Server: MongoDB Connection Error:', err);
    console.log('Status Server: Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Configure Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Set up EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/status-layout');
app.use(express.static(path.join(__dirname, 'public')));

// Create a session store
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
  ttl: 14 * 24 * 60 * 60, // 14 days
  autoRemove: 'native',
  touchAfter: 24 * 3600, // time period in seconds
  stringify: true,
  crypto: false,
  collectionName: 'status_sessions',
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'status_page_secret_key',
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
  name: 'status.sid' // Different name from main app to avoid conflicts
}));

// Flash messages
app.use(flash());

// Set up flash messages in res.locals
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.error = req.flash('error');
  next();
});

// Add production-specific middleware
if (process.env.NODE_ENV === 'production') {
  // Add a middleware to handle the base path for status pages in production
  app.use((req, res, next) => {
    // Store the original URL for debugging
    console.log(`Status Server: Received request for ${req.originalUrl}`);
    next();
  });
}

// Load models
require('./models/SystemStatus');
require('./models/Incident');
require('./models/StatusSubscription');

// Helper functions for status page
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

// Status page routes
app.get('/', async (req, res) => {
  // Redirect root to /status
  res.redirect('/status');
});

// Production-specific routes (path-based approach for Render)
app.get('/status-page', async (req, res) => {
  // This route is used in production
  return res.redirect('/status');
});

app.get('/status-page-bridge', async (req, res) => {
  // This route is used in production
  return res.redirect('/status-bridge');
});

app.get('/status-page-health', async (req, res) => {
  // This route is used in production
  return res.redirect('/health');
});

app.get('/status', async (req, res) => {
  try {
    // Define default fallback data
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

    // Set a timeout for database operations to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 5000);
    });

    // Get the current system status with timeout
    const SystemStatus = mongoose.model('SystemStatus');
    const Incident = mongoose.model('Incident');

    let systemStatusPromise = SystemStatus.findOne().sort({ updatedAt: -1 });
    let systemStatus;

    try {
      systemStatus = await Promise.race([systemStatusPromise, timeoutPromise]);
    } catch (err) {
      console.error('Error fetching system status:', err);
      systemStatus = fallbackSystemStatus;
    }

    // If no system status exists, use the fallback
    if (!systemStatus) {
      console.log('No system status found, using fallback data');
      systemStatus = fallbackSystemStatus;
    }

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

    // Check if main server is running
    let mainServerStatus = 'unknown';
    try {
      // Determine the main server URL
      let mainServerUrl;
      if (process.env.NODE_ENV === 'production') {
        // In production, use the BASE_URL environment variable or construct from hostname
        mainServerUrl = process.env.BASE_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'ftraiseai.onrender.com'}`;
      } else {
        // In development, use localhost with the main server port
        mainServerUrl = `http://localhost:${process.env.PORT || 3000}`;
      }

      const response = await fetch(`${mainServerUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (response.ok) {
        mainServerStatus = 'operational';
      } else {
        mainServerStatus = 'down';
      }
    } catch (err) {
      console.log('Main server appears to be down:', err.message);
      mainServerStatus = 'down';

      // If main server is down, update the system status
      if (systemStatus && systemStatus.components) {
        // Check if we need to update the status
        let needsUpdate = false;

        // Update Website Frontend component
        const frontendComponent = systemStatus.components.find(c => c.name === 'Website Frontend');
        if (frontendComponent && frontendComponent.status !== 'major_outage') {
          frontendComponent.status = 'major_outage';
          needsUpdate = true;
        }

        // Update overall status if all components are not already in major outage
        if (systemStatus.overallStatus !== 'major_outage') {
          systemStatus.overallStatus = 'major_outage';
          needsUpdate = true;
        }

        // Save the updated status
        if (needsUpdate && typeof systemStatus.save === 'function') {
          try {
            await systemStatus.save();
            console.log('Updated system status to reflect main server down');

            // Refresh status info after update
            overallStatusInfo = getOverallStatusInfo(systemStatus.overallStatus);
            componentsWithInfo = systemStatus.components.map(component => {
              return {
                ...component.toObject(),
                statusInfo: getStatusInfo(component.status)
              };
            });
          } catch (saveErr) {
            console.error('Error saving updated system status:', saveErr);
          }
        }
      }
    }

    // Render the page with the data we have
    res.render('status/index', {
      title: 'System Status - FTRAISE AI',
      systemStatus: systemStatus || fallbackSystemStatus,
      overallStatusInfo,
      components: componentsWithInfo,
      incidents: formattedIncidents,
      uptimeData,
      user: req.user,
      timeFilter: req.query.timeFilter || '30days',
      mainServerStatus,
      layout: 'layouts/status-layout' // Use a dedicated layout for the status page
    });
  } catch (err) {
    console.error('Error in status page:', err);

    // Create fallback data for the status page
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
    const uptimeData = {};
    fallbackSystemStatus.components.forEach(component => {
      uptimeData[component.name] = 100;
    });

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
      uptimeData,
      user: req.user,
      timeFilter: '30days',
      mainServerStatus: 'unknown',
      error: 'There was an issue loading the latest status data. Showing default values.',
      layout: 'layouts/status-layout' // Use a dedicated layout for the status page
    });
  }
});

// Health check routes
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    component: 'Status Server',
    timestamp: new Date().toISOString()
  });
});

app.get('/status/health', (req, res) => {
  res.json({
    status: 'operational',
    component: 'Status Server',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('status/error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    layout: 'layouts/status-layout'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Status Server Error:', err);
  res.status(500).render('status/error', {
    title: '500 - Server Error',
    message: 'An error occurred while processing your request.',
    layout: 'layouts/status-layout'
  });
});

// Function to resolve unresolved crash incidents on server startup
async function resolveUnresolvedCrashIncidents() {
  try {
    const Incident = mongoose.model('Incident');

    // Find all unresolved crash incidents (investigating or identified status)
    const unresolvedCrashIncidents = await Incident.find({
      title: { $regex: /crash|exception|shutdown/i },
      status: { $in: ['investigating', 'identified'] }
    });

    console.log(`Status Server: Found ${unresolvedCrashIncidents.length} unresolved crash incidents to auto-resolve`);

    // Resolve each incident
    for (const incident of unresolvedCrashIncidents) {
      // Add an update that the server has restarted and resolved the issue
      incident.updates.push({
        message: 'Server has restarted and is now operational. This incident has been automatically resolved by the status server.',
        status: 'resolved',
        timestamp: new Date()
      });

      // Update the incident status and end time
      incident.status = 'resolved';
      incident.endTime = new Date();

      // Save the incident
      await incident.save();
      console.log(`Status Server: Auto-resolved crash incident: ${incident.title}`);
    }
  } catch (err) {
    console.error('Status Server: Error auto-resolving crash incidents:', err);
  }
}

// Function to start the server with port fallback
function startServer(port) {
  const server = app.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Error starting status server:', err);
      }
    })
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`Status Server running on port ${actualPort}`);

      // Store the actual port in a file for the main server to read
      const fs = require('fs');
      try {
        fs.writeFileSync('status-server-port.txt', actualPort.toString());
      } catch (err) {
        console.error('Error writing port file:', err);
      }

      // Auto-resolve crash incidents after server starts
      resolveUnresolvedCrashIncidents();
    });

  return server;
}

// Start server with initial port
startServer(STATUS_PORT);
