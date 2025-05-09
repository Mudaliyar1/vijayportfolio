/**
 * Status Page Health Check Routes
 * 
 * These routes provide health check endpoints specifically for the status page
 * to ensure it remains operational even if other parts of the system fail.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'operational',
    component: 'Status Page',
    timestamp: new Date().toISOString()
  });
});

// Database connection check
router.get('/db', async (req, res) => {
  try {
    // Set a timeout for the database check
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database check timed out')), 3000);
    });

    // Check database connection with timeout
    const dbCheckPromise = new Promise(async (resolve, reject) => {
      try {
        // Simple ping to check if database is responsive
        const result = await mongoose.connection.db.admin().ping();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    await Promise.race([dbCheckPromise, timeoutPromise]);

    res.json({
      status: 'operational',
      component: 'Status Page Database',
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Status page database health check failed:', err);
    
    // Still return a 200 status code to indicate the status page itself is working
    res.json({
      status: 'degraded',
      component: 'Status Page Database',
      connection: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Render health check
router.get('/render', (req, res) => {
  try {
    // Check if EJS rendering is working by rendering a simple template
    res.render('status/health', {
      title: 'Status Page Health Check',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Status page render health check failed:', err);
    res.status(500).json({
      status: 'error',
      component: 'Status Page Rendering',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
