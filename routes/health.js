/**
 * Health check routes
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

// Get reference to the session store from the app
let sessionStore;
router.use((req, res, next) => {
  // Get the session store from the app
  if (req.app && req.app.get('sessionStore')) {
    sessionStore = req.app.get('sessionStore');
  }
  next();
});

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

  // Ensure session is saved
  req.session.save(err => {
    if (err) {
      console.error('Error saving session:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Error saving session',
        error: err.message
      });
    }

    // Return session info
    res.status(200).json({
      status: 'ok',
      session: {
        id: req.sessionID,
        cookie: req.session.cookie ? {
          maxAge: req.session.cookie.maxAge,
          expires: req.session.cookie.expires,
          httpOnly: req.session.cookie.httpOnly,
          secure: req.session.cookie.secure
        } : null,
        healthCheck: req.session.healthCheck
      },
      store: sessionStore ? sessionStore.constructor.name : 'Unknown'
    });
  });
});

// Session debug route
router.get('/session-debug', async (req, res) => {
  try {
    // Get session collection stats
    const db = mongoose.connection.db;
    const sessionCollection = db.collection('sessions');
    const sessionCount = await sessionCollection.countDocuments();
    const sessionSample = await sessionCollection.find().limit(1).toArray();

    res.status(200).json({
      status: 'ok',
      sessionCount,
      sessionSample: sessionSample.map(s => ({
        id: s._id,
        expires: s.expires,
        hasExpires: !!s.expires,
        sessionDataType: typeof s.session,
        isValidJson: typeof s.session === 'string' ? isValidJson(s.session) : false
      }))
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error getting session debug info',
      error: err.message
    });
  }
});

// Helper function to check if a string is valid JSON
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = router;
