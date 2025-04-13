const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Blog = require('../models/Blog');
const CommunityPost = require('../models/CommunityPost');

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
  },

  // Remove profile picture
  removeProfilePicture: async (req, res) => {
    try {
      // Get user's current profile picture
      const user = await User.findById(req.user._id);
      const currentPicture = user.profilePicture;

      // Check if user already has the default picture
      if (currentPicture === '/images/default-avatar.png') {
        req.flash('info_msg', 'You are already using the default profile picture');
        return res.redirect('/profile');
      }

      // Delete the current profile picture file
      if (currentPicture) {
        const picturePath = path.join(__dirname, '../public', currentPicture);
        if (fs.existsSync(picturePath)) {
          fs.unlinkSync(picturePath);
        }
      }

      // Set user's profile picture to default
      await User.findByIdAndUpdate(req.user._id, {
        profilePicture: '/images/default-avatar.png'
      });

      req.flash('success_msg', 'Profile picture removed successfully');
      res.redirect('/profile');
    } catch (err) {
      console.error('Profile picture removal error:', err);
      req.flash('error_msg', 'An error occurred while removing your profile picture');
      res.redirect('/profile');
    }
  },

  // Get user content (blogs and community posts)
  getUserContent: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      // Get user's blogs
      const blogs = await Blog.find({ author: req.user._id })
        .sort({ createdAt: -1 });

      // Get user's community posts
      const posts = await CommunityPost.find({ author: req.user._id })
        .sort({ createdAt: -1 });

      res.render('profile/content', {
        title: 'My Content - FTRAISE AI',
        user: req.user,
        blogs,
        posts
      });
    } catch (error) {
      console.error('Error fetching user content:', error);
      req.flash('error_msg', 'An error occurred while loading your content');
      res.redirect('/profile');
    }
  },

  // View another user's public profile
  viewUserProfile: async (req, res) => {
    try {
      const { username } = req.params;

      // Find the user by username
      const profileUser = await User.findOne({ username });

      if (!profileUser) {
        return res.status(404).render('404', {
          title: '404 - User Not Found',
          user: req.user
        });
      }

      // Get user's public blogs
      const blogs = await Blog.find({
        author: profileUser._id,
        status: 'published'
      }).sort({ createdAt: -1 }).limit(5);

      // Get user's public community posts
      const posts = await CommunityPost.find({
        author: profileUser._id,
        status: 'published'
      }).sort({ createdAt: -1 }).limit(5);

      // Check if user has a digital twin
      let hasDigitalTwin = false;
      if (profileUser.digitalTwin) {
        hasDigitalTwin = true;
      }

      res.render('profile/public', {
        title: `${profileUser.username}'s Profile - FTRAISE AI`,
        user: req.user,
        profileUser,
        blogs,
        posts,
        hasDigitalTwin
      });
    } catch (error) {
      console.error('Error viewing user profile:', error);
      res.status(500).render('500', {
        title: '500 - Server Error',
        user: req.user
      });
    }
  }
};
