/**
 * Health Check Routes
 * 
 * These routes provide health check endpoints for the status monitoring system.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// General health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check endpoint
router.get('/details', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: mongoose.connection.readyState,
      statusText: getConnectionStatusText(mongoose.connection.readyState)
    },
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external
    }
  };
  
  res.json(health);
});

// Component-specific health checks
router.get('/auth', (req, res) => {
  res.json({
    component: 'User Authentication',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

router.get('/chat', (req, res) => {
  res.json({
    component: 'AI Chat Engine',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

router.get('/admin', (req, res) => {
  res.json({
    component: 'Admin Dashboard',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

router.get('/digital-twin', (req, res) => {
  res.json({
    component: 'Digital Twins',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Helper function to get connection status text
function getConnectionStatusText(status) {
  switch (status) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

module.exports = router;
