const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Precise location tracker page - define the handler directly in the route file
router.get('/precise', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.render('admin/precise-location-tracker', {
    title: 'Precise Location Tracker - FTRAISE AI',
    path: '/admin/location-tracker/precise',
    layout: 'layouts/no-footer'
  });
});

// API route to get users
router.get('/api/users', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const User = require('../models/User');

    // Get all users
    const users = await User.find()
      .select('username email')
      .sort('username');

    res.json({ success: true, users });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
