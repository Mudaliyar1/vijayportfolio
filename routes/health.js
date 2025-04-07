/**
 * Health check routes
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check
router.get('/details', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[mongoStatus];

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
    },
    database: {
      status: mongoStatus,
      statusText: mongoStatusText
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadavg: os.loadavg()
    },
    env: process.env.NODE_ENV || 'development'
  });
});

// Session check
router.get('/session', (req, res) => {
  // Check if session is working
  if (!req.session) {
    return res.status(500).json({
      status: 'error',
      message: 'Session is not available'
    });
  }

  // Set a value in the session
  req.session.healthCheck = new Date().toISOString();
  
  res.status(200).json({
    status: 'ok',
    session: {
      id: req.sessionID,
      cookie: req.session.cookie,
      healthCheck: req.session.healthCheck
    }
  });
});

module.exports = router;
