/**
 * Admin Crash Test Routes
 *
 * These routes provide functionality to intentionally crash the website
 * for testing the status page's resilience.
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Crash the website immediately
router.post('/crash-now', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Log the crash test
    console.error('INTENTIONAL CRASH TRIGGERED BY ADMIN:', req.user.username);

    // Create a crash incident before shutting down
    const SystemStatus = require('../models/SystemStatus');
    const Incident = require('../models/Incident');

    // Update system status in the background without waiting
    SystemStatus.findOne().sort({ updatedAt: -1 })
      .then(systemStatus => {
        if (systemStatus) {
          systemStatus.overallStatus = 'major_outage';
          systemStatus.components.forEach(component => {
            if (component.name !== 'Database (MongoDB)') {
              component.status = 'major_outage';
            }
          });
          return systemStatus.save();
        }
      })
      .catch(err => console.error('Error updating system status before crash:', err));

    // Create an incident in the background without waiting
    new Incident({
      title: 'System Crash: Manual Shutdown',
      description: `The system was intentionally shut down by admin ${req.user.username} for testing purposes.`,
      status: 'investigating',
      severity: 'critical',
      affectedComponents: ['AI Chat Engine', 'User Login/Auth', 'Admin Dashboard', 'Website Frontend'],
      updates: [{
        message: `The system was intentionally shut down by admin ${req.user.username} for testing purposes.`,
        status: 'investigating'
      }]
    }).save()
      .catch(err => console.error('Error creating incident before crash:', err));

    // Set a timeout to crash the process after sending the response
    setTimeout(() => {
      // This will crash the Node.js process
      process.exit(1);
    }, 2000); // Increased to 2 seconds to allow background operations to complete

    // Send a response before crashing
    res.json({
      success: true,
      message: 'Website crash initiated. The server will shut down in 2 seconds.'
    });
  } catch (err) {
    console.error('Error in crash-now route:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate crash. Error: ' + err.message
    });
  }
});

// Crash the website with an uncaught exception
router.post('/crash-exception', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Log the crash test
    console.error('INTENTIONAL EXCEPTION CRASH TRIGGERED BY ADMIN:', req.user.username);

    // Create a crash incident before throwing exception
    const SystemStatus = require('../models/SystemStatus');
    const Incident = require('../models/Incident');

    // Update system status in the background without waiting
    SystemStatus.findOne().sort({ updatedAt: -1 })
      .then(systemStatus => {
        if (systemStatus) {
          systemStatus.overallStatus = 'major_outage';
          systemStatus.components.forEach(component => {
            if (component.name !== 'Database (MongoDB)') {
              component.status = 'major_outage';
            }
          });
          return systemStatus.save();
        }
      })
      .catch(err => console.error('Error updating system status before exception:', err));

    // Create an incident in the background without waiting
    new Incident({
      title: 'System Crash: Uncaught Exception',
      description: `The system crashed due to an uncaught exception triggered by admin ${req.user.username} for testing purposes.`,
      status: 'investigating',
      severity: 'critical',
      affectedComponents: ['AI Chat Engine', 'User Login/Auth', 'Admin Dashboard', 'Website Frontend'],
      updates: [{
        message: `The system crashed due to an uncaught exception triggered by admin ${req.user.username} for testing purposes.`,
        status: 'investigating'
      }]
    }).save()
      .catch(err => console.error('Error creating incident before exception:', err));

    // Set a timeout to throw an uncaught exception after sending the response
    setTimeout(() => {
      // This will crash the Node.js process with an uncaught exception
      throw new Error('Intentional uncaught exception triggered by admin for testing');
    }, 2000); // Increased to 2 seconds to allow background operations to complete

    // Send a response before crashing
    res.json({
      success: true,
      message: 'Website crash via exception initiated. The server will crash in 2 seconds.'
    });
  } catch (err) {
    console.error('Error in crash-exception route:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate exception crash. Error: ' + err.message
    });
  }
});

// Crash the website with memory overload
router.post('/crash-memory', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Log the crash test
    console.error('INTENTIONAL MEMORY CRASH TRIGGERED BY ADMIN:', req.user.username);

    // Create a crash incident before memory overload
    const SystemStatus = require('../models/SystemStatus');
    const Incident = require('../models/Incident');

    // Update system status in the background without waiting
    SystemStatus.findOne().sort({ updatedAt: -1 })
      .then(systemStatus => {
        if (systemStatus) {
          systemStatus.overallStatus = 'major_outage';
          systemStatus.components.forEach(component => {
            if (component.name !== 'Database (MongoDB)') {
              component.status = 'major_outage';
            }
          });
          return systemStatus.save();
        }
      })
      .catch(err => console.error('Error updating system status before memory overload:', err));

    // Create an incident in the background without waiting
    new Incident({
      title: 'System Crash: Memory Overload',
      description: `The system crashed due to memory overload triggered by admin ${req.user.username} for testing purposes.`,
      status: 'investigating',
      severity: 'critical',
      affectedComponents: ['AI Chat Engine', 'User Login/Auth', 'Admin Dashboard', 'Website Frontend'],
      updates: [{
        message: `The system crashed due to memory overload triggered by admin ${req.user.username} for testing purposes.`,
        status: 'investigating'
      }]
    }).save()
      .catch(err => console.error('Error creating incident before memory overload:', err));

    // Send a response before attempting to crash
    res.json({
      success: true,
      message: 'Memory overload initiated. The server will become unresponsive shortly.'
    });

    // Set a timeout to start memory overload after sending the response
    setTimeout(() => {
      const memoryHog = [];
      try {
        // This will eventually crash the Node.js process with an out-of-memory error
        while (true) {
          memoryHog.push(new Array(1000000).fill('x'));
        }
      } catch (e) {
        console.error('Memory overload failed:', e);
        // If the memory overload fails, force a crash
        process.exit(1);
      }
    }, 2000); // Increased to 2 seconds to allow background operations to complete
  } catch (err) {
    console.error('Error in crash-memory route:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate memory overload. Error: ' + err.message
    });
  }
});

// Crash the website with an infinite loop
router.post('/crash-loop', isAuthenticated, isAdmin, (req, res) => {
  try {
    // Log the crash test
    console.error('INTENTIONAL INFINITE LOOP TRIGGERED BY ADMIN:', req.user.username);

    // Create a crash incident before infinite loop
    const SystemStatus = require('../models/SystemStatus');
    const Incident = require('../models/Incident');

    // Update system status in the background without waiting
    SystemStatus.findOne().sort({ updatedAt: -1 })
      .then(systemStatus => {
        if (systemStatus) {
          systemStatus.overallStatus = 'major_outage';
          systemStatus.components.forEach(component => {
            if (component.name !== 'Database (MongoDB)') {
              component.status = 'major_outage';
            }
          });
          return systemStatus.save();
        }
      })
      .catch(err => console.error('Error updating system status before infinite loop:', err));

    // Create an incident in the background without waiting
    new Incident({
      title: 'System Crash: Infinite Loop',
      description: `The system became unresponsive due to an infinite loop triggered by admin ${req.user.username} for testing purposes.`,
      status: 'investigating',
      severity: 'critical',
      affectedComponents: ['AI Chat Engine', 'User Login/Auth', 'Admin Dashboard', 'Website Frontend'],
      updates: [{
        message: `The system became unresponsive due to an infinite loop triggered by admin ${req.user.username} for testing purposes.`,
        status: 'investigating'
      }]
    }).save()
      .catch(err => console.error('Error creating incident before infinite loop:', err));

    // Send a response before starting the infinite loop
    res.json({
      success: true,
      message: 'Infinite loop initiated. The server will become unresponsive shortly.'
    });

    // Set a timeout to start the infinite loop after sending the response
    setTimeout(() => {
      // This will make the Node.js process unresponsive
      while (true) {
        // Intentionally empty infinite loop
      }
    }, 2000); // Increased to 2 seconds to allow background operations to complete
  } catch (err) {
    console.error('Error in crash-loop route:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate infinite loop. Error: ' + err.message
    });
  }
});

module.exports = router;
