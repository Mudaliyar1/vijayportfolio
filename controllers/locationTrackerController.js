// Simple controller for the location tracker feature

// Render the precise location tracker page
exports.getPreciseLocationTracker = (req, res) => {
  res.render('admin/precise-location-tracker', {
    title: 'Precise Location Tracker - FTRAISE AI',
    path: '/admin/precise-location-tracker',
    layout: 'layouts/no-footer'
  });
};

// Get all users for the dropdown
exports.getUsers = async (req, res) => {
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
};
