/**
 * Crash Detection Middleware
 *
 * This middleware monitors for crashes and updates the system status accordingly.
 * It works with the status page to ensure crashes are properly reported.
 */

const SystemStatus = require('../models/SystemStatus');
const Incident = require('../models/Incident');

// Track the last health check time
let lastHealthCheckTime = Date.now();
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Perform a health check and update status
async function performHealthCheck() {
  try {
    // Update the last health check time
    lastHealthCheckTime = Date.now();

    // Get the current system status
    const systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    if (systemStatus) {
      // Update the health check timestamp
      systemStatus.lastHealthCheck = new Date();
      await systemStatus.save();

      console.log('Health check completed successfully');
    }
  } catch (err) {
    console.error('Error performing health check:', err);
  }
}

// Initialize health check interval
let healthCheckInterval = null;

// Flag to track if crash handlers have been set up
let crashHandlersInitialized = false;

// Start the health check interval
function startHealthChecks() {
  if (!healthCheckInterval) {
    healthCheckInterval = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
    console.log('Health check monitoring started');
  }
}

// Handle process termination
function setupCrashHandlers() {
  // Only set up handlers once to prevent memory leaks
  if (crashHandlersInitialized) {
    return;
  }

  // Increase the max listeners to prevent warnings
  process.setMaxListeners(15);

  // Handle uncaught exceptions
  process.on('uncaughtException', async (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);

    try {
      // Create an incident for the crash
      await createCrashIncident('Uncaught Exception', err.message || 'Unknown error');
    } catch (logErr) {
      console.error('Failed to log crash incident:', logErr);
    }

    // Exit with error code after a delay to allow logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);

    try {
      // Create an incident for the crash
      await createCrashIncident('Unhandled Promise Rejection', reason ? (reason.message || String(reason)) : 'Unknown reason');
    } catch (logErr) {
      console.error('Failed to log crash incident:', logErr);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully');

    try {
      // Update system status to indicate shutdown
      await updateSystemStatus('partial_outage', 'Server is shutting down for maintenance');
    } catch (err) {
      console.error('Error updating system status during shutdown:', err);
    }

    // Exit gracefully
    process.exit(0);
  });

  // Mark as initialized
  crashHandlersInitialized = true;
  console.log('Crash handlers initialized');
}

// Create a crash incident
async function createCrashIncident(title, description) {
  try {
    // Get the current system status
    let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    if (!systemStatus) {
      // Create a default system status if none exists
      systemStatus = await SystemStatus.create({
        overallStatus: 'major_outage',
        components: [
          { name: 'AI Chat Engine', status: 'major_outage' },
          { name: 'Database (MongoDB)', status: 'operational' },
          { name: 'User Login/Auth', status: 'major_outage' },
          { name: 'Admin Dashboard', status: 'major_outage' },
          { name: 'Website Frontend', status: 'major_outage' }
        ]
      });
    } else {
      // Update the system status to indicate a major outage
      systemStatus.overallStatus = 'major_outage';

      // Update component statuses
      systemStatus.components.forEach(component => {
        if (component.name !== 'Database (MongoDB)') {
          component.status = 'major_outage';
        }
      });

      await systemStatus.save();
    }

    // Create a new incident
    const incident = new Incident({
      title: `System Crash: ${title}`,
      description: `The system experienced a crash due to: ${description}. The server will need to be restarted.`,
      status: 'investigating',
      severity: 'critical',
      affectedComponents: systemStatus.components.map(c => c.name).filter(name => name !== 'Database (MongoDB)'),
      updates: [{
        message: `The system experienced a crash due to: ${description}. The server will need to be restarted.`,
        status: 'investigating'
      }]
    });

    await incident.save();
    console.log('Crash incident created successfully');

    return incident;
  } catch (err) {
    console.error('Error creating crash incident:', err);
    throw err;
  }
}

// Update system status
async function updateSystemStatus(status, reason) {
  try {
    // Get the current system status
    let systemStatus = await SystemStatus.findOne().sort({ updatedAt: -1 });

    if (!systemStatus) {
      // Create a default system status if none exists
      systemStatus = await SystemStatus.create({
        overallStatus: status,
        components: [
          { name: 'AI Chat Engine', status },
          { name: 'Database (MongoDB)', status: 'operational' },
          { name: 'User Login/Auth', status },
          { name: 'Admin Dashboard', status },
          { name: 'Website Frontend', status }
        ]
      });
    } else {
      // Update the system status
      systemStatus.overallStatus = status;

      // Update component statuses
      systemStatus.components.forEach(component => {
        if (component.name !== 'Database (MongoDB)') {
          component.status = status;
        }
      });

      await systemStatus.save();
    }

    console.log(`System status updated to ${status}: ${reason}`);

    return systemStatus;
  } catch (err) {
    console.error('Error updating system status:', err);
    throw err;
  }
}

// Flag to track if middleware has been initialized
let middlewareInitialized = false;

// Initialize the crash detection system
function initialize() {
  if (middlewareInitialized) {
    return;
  }

  // Start health checks
  startHealthChecks();

  // Set up crash handlers
  setupCrashHandlers();

  // Mark as initialized
  middlewareInitialized = true;
  console.log('Crash detection middleware initialized');
}

// Initialize on module load
initialize();

// Middleware function
module.exports = function(req, res, next) {
  // Continue to the next middleware
  next();
};
