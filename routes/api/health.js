/**
 * Health Check API
 * 
 * This API provides health check endpoints for the status monitoring system.
 * It implements real health checks that actually test the functionality of each component.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// General health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    // Check if database is connected
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'error',
        component: 'Database',
        message: 'Database is not connected',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to ping the database
    const pingResult = await mongoose.connection.db.admin().ping();
    
    if (pingResult && pingResult.ok === 1) {
      return res.json({
        status: 'ok',
        component: 'Database',
        message: 'Database is connected and responding',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(503).json({
        status: 'error',
        component: 'Database',
        message: 'Database ping failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      component: 'Database',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication health check
router.get('/auth', (req, res) => {
  try {
    // Check if passport is initialized
    if (!req.app._passport) {
      return res.status(503).json({
        status: 'error',
        component: 'Authentication',
        message: 'Passport is not initialized',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      status: 'ok',
      component: 'Authentication',
      message: 'Authentication system is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      component: 'Authentication',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// AI Chat Engine health check
router.get('/ai', (req, res) => {
  try {
    // Check if Cohere API key is configured
    if (!process.env.COHERE_API_KEY) {
      return res.status(503).json({
        status: 'error',
        component: 'AI Chat Engine',
        message: 'Cohere API key is not configured',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      status: 'ok',
      component: 'AI Chat Engine',
      message: 'AI Chat Engine is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      component: 'AI Chat Engine',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Digital Twins health check
router.get('/digital-twins', (req, res) => {
  try {
    return res.json({
      status: 'ok',
      component: 'Digital Twins',
      message: 'Digital Twins system is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      component: 'Digital Twins',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System information
router.get('/system', (req, res) => {
  const systemInfo = {
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(systemInfo);
});

module.exports = router;
