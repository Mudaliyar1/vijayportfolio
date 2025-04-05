const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Image = require('../models/Image');

module.exports = {
  // Render image management dashboard
  getImageManagement: async (req, res) => {
    try {
      // Get users with image counts
      const users = await User.aggregate([
        {
          $lookup: {
            from: 'images',
            localField: '_id',
            foreignField: 'userId',
            as: 'images'
          }
        },
        {
          $addFields: {
            generatedCount: {
              $size: {
                $filter: {
                  input: '$images',
                  as: 'image',
                  cond: { $eq: ['$$image.type', 'generated'] }
                }
              }
            },
            uploadedCount: {
              $size: {
                $filter: {
                  input: '$images',
                  as: 'image',
                  cond: { $eq: ['$$image.type', 'uploaded'] }
                }
              }
            },
            transformedCount: {
              $size: {
                $filter: {
                  input: '$images',
                  as: 'image',
                  cond: { $eq: ['$$image.type', 'transformed'] }
                }
              }
            },
            totalImages: { $size: '$images' }
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            profilePicture: 1,
            generatedCount: 1,
            uploadedCount: 1,
            transformedCount: 1,
            totalImages: 1,
            createdAt: 1
          }
        },
        {
          $sort: { totalImages: -1 }
        }
      ]);

      // Get guest user image counts
      const guestImages = await Image.aggregate([
        {
          $match: { guestId: { $ne: null } }
        },
        {
          $group: {
            _id: '$guestId',
            generatedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'generated'] }, 1, 0] }
            },
            uploadedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'uploaded'] }, 1, 0] }
            },
            transformedCount: {
              $sum: { $cond: [{ $eq: ['$type', 'transformed'] }, 1, 0] }
            },
            totalImages: { $sum: 1 },
            lastActivity: { $max: '$createdAt' }
          }
        },
        {
          $sort: { totalImages: -1 }
        }
      ]);

      // Get total counts
      const totalGenerated = await Image.countDocuments({ type: 'generated' });
      const totalUploaded = await Image.countDocuments({ type: 'uploaded' });
      const totalTransformed = await Image.countDocuments({ type: 'transformed' });
      const totalImages = totalGenerated + totalUploaded + totalTransformed;

      res.render('admin/images', {
        title: 'Image Management - FTRAISE AI',
        users,
        guestImages,
        totalGenerated,
        totalUploaded,
        totalTransformed,
        totalImages,
        path: '/admin/images',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error loading image management:', err);
      req.flash('error_msg', 'An error occurred while loading image management');
      res.redirect('/admin');
    }
  },

  // Get user's images
  getUserImages: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/admin/images');
      }
      
      // Get user's images
      const images = await Image.find({ userId })
        .sort({ createdAt: -1 });

      res.render('admin/user-images', {
        title: `${user.username}'s Images - FTRAISE AI`,
        user,
        images,
        path: '/admin/images',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error getting user images:', err);
      req.flash('error_msg', 'An error occurred while loading user images');
      res.redirect('/admin/images');
    }
  },

  // Delete image
  deleteImage: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find the image
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Image not found' 
        });
      }

      // Delete the image file if it's in the uploads directory
      if (image.imagePath.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '../public', image.imagePath);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Delete the original image file if it exists and is in the uploads directory
      if (image.originalImagePath && image.originalImagePath.startsWith('/uploads/')) {
        const originalImagePath = path.join(__dirname, '../public', image.originalImagePath);
        if (fs.existsSync(originalImagePath)) {
          fs.unlinkSync(originalImagePath);
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
  }
};
