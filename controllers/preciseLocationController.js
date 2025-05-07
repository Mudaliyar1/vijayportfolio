const User = require('../models/User');
const PreciseLocation = require('../models/PreciseLocation');

// Simple function to render the precise location tracker page
const getPreciseLocationTracker = (req, res) => {
  res.render('admin/precise-location-tracker', {
    title: 'Precise Location Tracker - FTRAISE AI',
    path: '/admin/precise-location-tracker',
    layout: 'layouts/no-footer'
  });
};

// Get all users for the dropdown
const getUsers = async (req, res) => {
  try {
    // Only return users who have location data
    const usersWithLocation = await PreciseLocation.distinct('userId');

    // If no users have location data yet, return all users
    let users;
    if (usersWithLocation.length > 0) {
      users = await User.find({ _id: { $in: usersWithLocation } })
        .select('username email')
        .sort('username');
    } else {
      users = await User.find()
        .select('username email')
        .sort('username');
    }

    res.json({ success: true, users });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPreciseLocationTracker,
  getUsers
};
