const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const Image = require('../models/Image');

// Get user's images
router.get('/my-images/data', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's images
    const images = await Image.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      images
    });
  } catch (err) {
    console.error('Error getting user images:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while loading your images' 
    });
  }
});

module.exports = router;
