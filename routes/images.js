const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated } = require('../middlewares/auth');
const { userRateLimiter, guestRateLimiter } = require('../middlewares/rateLimiter');
const Image = require('../models/Image');
const {
  getImageGenerationPage,
  generateImage,
  uploadImage,
  transformImage,
  getUserImages
} = require('../controllers/imageController');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/images'));
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB limit
  },
  fileFilter: fileFilter
});

// Image generation page
router.get('/', getImageGenerationPage);

// Generate image from text prompt (with optional reference image)
router.post('/generate', userRateLimiter, guestRateLimiter, upload.single('referenceImage'), generateImage);

// Upload image
router.post('/upload', userRateLimiter, guestRateLimiter, upload.single('image'), uploadImage);

// Transform uploaded image
router.post('/transform', userRateLimiter, guestRateLimiter, transformImage);

// Get user's images
router.get('/my-images', ensureAuthenticated, getUserImages);

// Get user's images data (for AJAX)
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

// Delete user's image
router.delete('/my-images/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check if user owns the image
    if (!image.userId.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this image'
      });
    }

    // Delete the image file if it's in the uploads directory
    if (image.imagePath.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', image.imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the reference image file if it exists and is in the uploads directory
    if (image.referenceImagePath && image.referenceImagePath.startsWith('/uploads/')) {
      const referenceImagePath = path.join(__dirname, '../public', image.referenceImagePath);
      if (fs.existsSync(referenceImagePath)) {
        fs.unlinkSync(referenceImagePath);
      }
    }

    // Delete the image from the database
    await Image.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the image'
    });
  }
});

module.exports = router;
