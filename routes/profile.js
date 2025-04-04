const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureAuthenticated } = require('../middlewares/auth');
const { 
  getProfilePage, 
  updateProfile, 
  updatePassword,
  updateProfilePicture
} = require('../controllers/profileController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
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
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: fileFilter
});

// Profile page
router.get('/', ensureAuthenticated, getProfilePage);

// Update profile
router.put('/update', ensureAuthenticated, updateProfile);

// Update password
router.put('/password', ensureAuthenticated, updatePassword);

// Update profile picture
router.put('/picture', ensureAuthenticated, upload.single('profilePicture'), updateProfilePicture);

module.exports = router;
