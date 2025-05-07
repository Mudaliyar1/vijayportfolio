const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const PreciseLocation = require('../models/PreciseLocation');

/**
 * @route POST /api/precise-location
 * @desc Record precise location data from client
 * @access Private
 */
router.post('/precise-location', ensureAuthenticated, async (req, res) => {
  try {
    const { location, timestamp } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ success: false, message: 'Invalid location data' });
    }

    // Create new precise location record
    const preciseLocation = new PreciseLocation({
      userId: req.user._id,
      username: req.user.email,
      ipAddress: req.ip,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 0,
      altitude: location.altitude || null,
      altitudeAccuracy: location.altitudeAccuracy || null,
      heading: location.heading || null,
      speed: location.speed || null,
      source: location.source || 'GPS',
      timestamp: timestamp || new Date()
    });

    // Save the location data
    await preciseLocation.save();

    // Return success
    res.json({ success: true, message: 'Location recorded successfully' });
  } catch (error) {
    console.error('Error recording precise location:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route GET /api/precise-location/latest/:userId
 * @desc Get latest precise location for a user
 * @access Private (Admin only)
 */
router.get('/precise-location/latest/:userId', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {

    const { userId } = req.params;

    // Get the latest location for the specified user
    const latestLocation = await PreciseLocation.findOne({ userId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!latestLocation) {
      return res.status(404).json({ success: false, message: 'No location data found for this user' });
    }

    res.json({ success: true, location: latestLocation });
  } catch (error) {
    console.error('Error fetching precise location:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route GET /api/precise-location/history/:userId
 * @desc Get location history for a user
 * @access Private (Admin only)
 */
router.get('/precise-location/history/:userId', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {

    const { userId } = req.params;
    const { limit = 100, startDate, endDate } = req.query;

    // Build query
    const query = { userId };

    // Add date range if specified
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endOfDay;
      }
    }

    // Get location history
    const locationHistory = await PreciseLocation.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, locations: locationHistory });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
