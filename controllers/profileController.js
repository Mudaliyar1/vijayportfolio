const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Chat = require('../models/Chat');

module.exports = {
  // Render profile page
  getProfilePage: async (req, res) => {
    try {
      // Get user's chat count
      const chatCount = await Chat.countDocuments({ userId: req.user._id });

      res.render('profile/index', {
        title: 'My Profile - FTRAISE AI',
        user: req.user,
        chatCount
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading your profile');
      res.redirect('/');
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const { username, email } = req.body;
      let errors = [];

      // Check required fields
      if (!username || !email) {
        errors.push({ msg: 'Please fill in all fields' });
      }

      if (errors.length > 0) {
        return res.render('profile/index', {
          title: 'My Profile - FTRAISE AI',
          user: req.user,
          errors
        });
      }

      // Check if username is taken by another user
      const usernameExists = await User.findOne({
        username,
        _id: { $ne: req.user._id }
      });

      if (usernameExists) {
        errors.push({ msg: 'Username is already taken' });
      }

      // Check if email is taken by another user
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user._id }
      });

      if (emailExists) {
        errors.push({ msg: 'Email is already registered' });
      }

      if (errors.length > 0) {
        return res.render('profile/index', {
          title: 'My Profile - FTRAISE AI',
          user: req.user,
          errors
        });
      }

      // Update user
      await User.findByIdAndUpdate(req.user._id, {
        username,
        email
      });

      req.flash('success_msg', 'Profile updated successfully');
      res.redirect('/profile');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while updating your profile');
      res.redirect('/profile');
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      let errors = [];

      // Check required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        errors.push({ msg: 'Please fill in all password fields' });
      }

      // Check passwords match
      if (newPassword !== confirmPassword) {
        errors.push({ msg: 'New passwords do not match' });
      }

      // Check password length
      if (newPassword.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
      }

      if (errors.length > 0) {
        return res.render('profile/index', {
          title: 'My Profile - FTRAISE AI',
          user: req.user,
          passwordErrors: errors
        });
      }

      // Check current password
      const user = await User.findById(req.user._id);
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        errors.push({ msg: 'Current password is incorrect' });
        return res.render('profile/index', {
          title: 'My Profile - FTRAISE AI',
          user: req.user,
          passwordErrors: errors
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await User.findByIdAndUpdate(req.user._id, {
        password: hashedPassword
      });

      req.flash('success_msg', 'Password updated successfully');
      res.redirect('/profile');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while updating your password');
      res.redirect('/profile');
    }
  },

  // Update profile picture
  updateProfilePicture: async (req, res) => {
    try {
      if (!req.file) {
        req.flash('error_msg', 'Please select an image to upload');
        return res.redirect('/profile');
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Get old profile picture path
      const user = await User.findById(req.user._id);
      const oldPicture = user.profilePicture;

      // Set new profile picture path
      const profilePicture = `/uploads/${req.file.filename}`;

      // Update user
      await User.findByIdAndUpdate(req.user._id, {
        profilePicture
      });

      // Delete old profile picture if it's not the default
      if (oldPicture && oldPicture !== '/images/default-avatar.png') {
        const oldPicturePath = path.join(__dirname, '../public', oldPicture);
        if (fs.existsSync(oldPicturePath)) {
          fs.unlinkSync(oldPicturePath);
        }
      }

      req.flash('success_msg', 'Profile picture updated successfully');
      res.redirect('/profile');
    } catch (err) {
      console.error('Profile picture update error:', err);
      req.flash('error_msg', 'An error occurred while updating your profile picture');
      res.redirect('/profile');
    }
  }
};
