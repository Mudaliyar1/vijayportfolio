const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const GuestUser = require('../models/GuestUser');
const Memory = require('../models/Memory');
const Review = require('../models/Review');
const Image = require('../models/Image');


const PasswordReset = require('../models/PasswordReset');

module.exports = {
  // Render admin dashboard
  getDashboard: async (req, res) => {
    try {
      // Get counts for dashboard
      const userCount = await User.countDocuments();
      const chatCount = await Chat.countDocuments();
      const guestCount = await GuestUser.countDocuments();
      const imageCount = await Image.countDocuments();

      // Get recent users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5);

      // Get recent chats
      const recentChats = await Chat.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('userId', 'username');

      res.render('admin/dashboard', {
        title: 'Admin Dashboard - FTRAISE AI',
        userCount,
        chatCount,
        guestCount,
        imageCount,
        recentUsers,
        recentChats,
        path: '/admin',
        layout: 'layouts/no-footer',
        maintenanceMode: req.maintenanceMode || req.session.maintenanceBypass || false
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading the dashboard');
      res.redirect('/');
    }
  },

  // Render user management page
  getUserManagement: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });

      res.render('admin/users', {
        title: 'User Management - FTRAISE AI',
        users,
        currentUser: req.user, // Pass the current user to the view
        path: '/admin/users',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading users');
      res.redirect('/admin');
    }
  },

  // Render chat management page
  getChatManagement: async (req, res) => {
    try {
      // Get all chats
      const allChats = await Chat.find()
        .sort({ updatedAt: -1 })
        .populate('userId', 'username');

      // Group chats by user
      const userChats = {};
      const guestChats = [];

      allChats.forEach(chat => {
        if (chat.userId) {
          // For registered users
          const userId = chat.userId._id.toString();
          if (!userChats[userId]) {
            userChats[userId] = {
              user: chat.userId,
              chats: [],
              totalMessages: 0,
              lastUpdated: chat.updatedAt
            };
          }
          userChats[userId].chats.push(chat);
          userChats[userId].totalMessages += chat.messages.length;

          // Update last updated time if this chat is more recent
          if (chat.updatedAt > userChats[userId].lastUpdated) {
            userChats[userId].lastUpdated = chat.updatedAt;
          }
        } else {
          // For guest users
          guestChats.push(chat);
        }
      });

      // Convert userChats object to array and sort by last updated time
      const groupedUserChats = Object.values(userChats).sort((a, b) =>
        b.lastUpdated - a.lastUpdated
      );

      // Group guest chats by IP address
      const groupedGuestChats = {};
      guestChats.forEach(chat => {
        if (!groupedGuestChats[chat.guestId]) {
          groupedGuestChats[chat.guestId] = {
            guestId: chat.guestId,
            chats: [],
            totalMessages: 0,
            lastUpdated: chat.updatedAt
          };
        }
        groupedGuestChats[chat.guestId].chats.push(chat);
        groupedGuestChats[chat.guestId].totalMessages += chat.messages.length;

        // Update last updated time if this chat is more recent
        if (chat.updatedAt > groupedGuestChats[chat.guestId].lastUpdated) {
          groupedGuestChats[chat.guestId].lastUpdated = chat.updatedAt;
        }
      });

      // Convert groupedGuestChats object to array and sort by last updated time
      const sortedGuestChats = Object.values(groupedGuestChats).sort((a, b) =>
        b.lastUpdated - a.lastUpdated
      );

      res.render('admin/chats', {
        title: 'Chat Management - FTRAISE AI',
        userChats: groupedUserChats,
        guestChats: sortedGuestChats,
        path: '/admin/chats',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading chats');
      res.redirect('/admin');
    }
  },

  // Render guest user management page
  getGuestManagement: async (req, res) => {
    try {
      const guests = await GuestUser.find().sort({ createdAt: -1 });

      res.render('admin/guests', {
        title: 'Guest Management - FTRAISE AI',
        guests,
        path: '/admin/guests',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading guest users');
      res.redirect('/admin');
    }
  },

  // Create a new user
  createUser: async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      let errors = [];

      // Check required fields
      if (!username || !email || !password || !role) {
        errors.push({ msg: 'Please fill in all fields' });
      }

      // Check password length
      if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
      }

      if (errors.length > 0) {
        req.flash('error_msg', errors.map(err => err.msg).join(', '));
        return res.redirect('/admin/users');
      }

      // Check if email exists
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        req.flash('error_msg', 'Email is already registered');
        return res.redirect('/admin/users');
      }

      // Check if username exists
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        req.flash('error_msg', 'Username is already taken');
        return res.redirect('/admin/users');
      }

      // Create new user
      const newUser = new User({
        username,
        email,
        password,
        role
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Save user
      await newUser.save();

      req.flash('success_msg', 'User created successfully');
      res.redirect('/admin/users');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while creating the user');
      res.redirect('/admin/users');
    }
  },

  // Update a user
  updateUser: async (req, res) => {
    try {
      const { userId, username, email, role } = req.body;

      // Check if username is taken by another user
      const usernameExists = await User.findOne({
        username,
        _id: { $ne: userId }
      });

      if (usernameExists) {
        req.flash('error_msg', 'Username is already taken');
        return res.redirect('/admin/users');
      }

      // Check if email is taken by another user
      const emailExists = await User.findOne({
        email,
        _id: { $ne: userId }
      });

      if (emailExists) {
        req.flash('error_msg', 'Email is already registered');
        return res.redirect('/admin/users');
      }

      // Update user
      await User.findByIdAndUpdate(userId, {
        username,
        email,
        role
      });

      req.flash('success_msg', 'User updated successfully');
      res.redirect('/admin/users');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while updating the user');
      res.redirect('/admin/users');
    }
  },

  // Reset a user's password
  resetPassword: async (req, res) => {
    try {
      const { userId, newPassword } = req.body;

      // Check password length
      if (newPassword.length < 6) {
        req.flash('error_msg', 'Password should be at least 6 characters');
        return res.redirect('/admin/users');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword
      });

      req.flash('success_msg', 'Password reset successfully');
      res.redirect('/admin/users');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while resetting the password');
      res.redirect('/admin/users');
    }
  },

  // Delete a user
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/admin/users');
      }

      // Check if admin is trying to delete their own account
      const isSelfDelete = userId === req.user._id.toString();

      // Delete user's chats
      await Chat.deleteMany({ userId });

      // Delete user's memories
      await Memory.deleteMany({ userId });

      // Delete user's reviews
      await Review.deleteMany({ userId });

      // Delete user
      await User.findByIdAndDelete(userId);

      if (isSelfDelete) {
        // If admin deleted their own account, destroy the session and redirect to login
        req.flash('success_msg', 'Your account has been deleted successfully');
        return req.logout(function(err) {
          if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/admin/users');
          }
          res.redirect('/users/login');
        });
      } else {
        // Normal redirect for deleting other users
        req.flash('success_msg', 'User deleted successfully');
        return res.redirect('/admin/users');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      req.flash('error_msg', 'An error occurred while deleting the user');
      return res.redirect('/admin/users');
    }
  },

  // View a specific chat
  viewChat: async (req, res) => {
    try {
      const chatId = req.params.id;

      const chat = await Chat.findById(chatId)
        .populate('userId', 'username');

      if (!chat) {
        req.flash('error_msg', 'Chat not found');
        return res.redirect('/admin/chats');
      }

      res.render('admin/view-chat', {
        title: 'View Chat - FTRAISE AI',
        chat,
        path: '/admin/chats',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading the chat');
      res.redirect('/admin/chats');
    }
  },

  // Delete a chat
  deleteChat: async (req, res) => {
    try {
      const chatId = req.params.id;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        req.flash('error_msg', 'Invalid chat ID format');
        return res.redirect('/admin/chats');
      }

      // Find the chat first to make sure it exists
      const chat = await Chat.findById(chatId);

      if (!chat) {
        req.flash('error_msg', 'Chat not found');
        return res.redirect('/admin/chats');
      }

      // Delete the chat
      await Chat.findByIdAndDelete(chatId);

      // Clear the success message
      req.flash('success_msg', 'Chat deleted successfully');

      // Redirect back to the chat management page
      return res.redirect('/admin/chats');
    } catch (err) {
      console.error('Error deleting chat:', err);
      req.flash('error_msg', 'An error occurred while deleting the chat');
      return res.redirect('/admin/chats');
    }
  },

  // Delete a guest user
  deleteGuest: async (req, res) => {
    try {
      const guestId = req.params.id;

      // Get guest user
      const guest = await GuestUser.findById(guestId);

      if (!guest) {
        req.flash('error_msg', 'Guest user not found');
        return res.redirect('/admin/guests');
      }

      // Delete guest's chats
      await Chat.deleteMany({ guestId: guest.ipAddress });

      // Delete guest's memories
      await Memory.deleteMany({ guestId: guest.ipAddress });

      // Delete guest
      await GuestUser.findByIdAndDelete(guestId);

      req.flash('success_msg', 'Guest user deleted successfully');
      res.redirect('/admin/guests');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while deleting the guest user');
      res.redirect('/admin/guests');
    }
  },

  // Render memory management page
  getMemoryManagement: async (req, res) => {
    try {
      // Get all memories and populate user information
      const memories = await Memory.find()
        .sort({ updatedAt: -1 })
        .populate('userId', 'username');

      res.render('admin/memories', {
        title: 'AI Memory Management - FTRAISE AI',
        memories,
        path: '/admin/memories',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading memories');
      res.redirect('/admin');
    }
  },

  // View a specific memory
  viewMemory: async (req, res) => {
    try {
      const memoryId = req.params.id;

      const memory = await Memory.findById(memoryId)
        .populate('userId', 'username');

      if (!memory) {
        req.flash('error_msg', 'Memory not found');
        return res.redirect('/admin/memories');
      }

      res.render('admin/view-memory', {
        title: 'View Memory - FTRAISE AI',
        memory,
        path: '/admin/memories',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading the memory');
      res.redirect('/admin/memories');
    }
  },

  // Delete a memory
  deleteMemory: async (req, res) => {
    try {
      const memoryId = req.params.id;

      await Memory.findByIdAndDelete(memoryId);

      req.flash('success_msg', 'Memory deleted successfully');
      res.redirect('/admin/memories');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while deleting the memory');
      res.redirect('/admin/memories');
    }
  },

  // Delete a specific interaction from memory
  deleteInteraction: async (req, res) => {
    try {
      const { memoryId, interactionIndex } = req.params;

      const memory = await Memory.findById(memoryId);

      if (!memory) {
        req.flash('error_msg', 'Memory not found');
        return res.redirect('/admin/memories');
      }

      // Remove the interaction at the specified index
      memory.interactions.splice(interactionIndex, 1);

      await memory.save();

      req.flash('success_msg', 'Interaction deleted successfully');
      res.redirect(`/admin/memories/${memoryId}`);
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while deleting the interaction');
      res.redirect('/admin/memories');
    }
  },


  // Render password reset history page
  getPasswordResetHistory: async (req, res) => {
    try {
      // Get search query
      const { search } = req.query;

      // Build query
      let query = {};
      if (search) {
        query = {
          $or: [
            { email: { $regex: search, $options: 'i' } },
            { otp: { $regex: search, $options: 'i' } }
          ]
        };
      }

      console.log('Fetching password reset history with query:', query);

      // Get password reset history with user info
      const passwordResets = await PasswordReset.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 });

      console.log(`Found ${passwordResets.length} password reset records`);

      // Debug the first few records
      if (passwordResets.length > 0) {
        console.log('Sample reset record:', {
          id: passwordResets[0]._id,
          email: passwordResets[0].email,
          userId: passwordResets[0].userId,
          isUsed: passwordResets[0].isUsed,
          createdAt: passwordResets[0].createdAt
        });
      }

      // Process the data before rendering

      // Group by user and count attempts
      const userResetCounts = {};
      passwordResets.forEach(reset => {
        const userId = reset.userId ? reset.userId._id.toString() : 'unknown';
        if (!userResetCounts[userId]) {
          userResetCounts[userId] = {
            user: reset.userId || { username: 'Unknown', email: reset.email },
            email: reset.email,
            count: 0,
            lastAttempt: reset.createdAt
          };
        }
        userResetCounts[userId].count++;
        if (new Date(reset.createdAt) > new Date(userResetCounts[userId].lastAttempt)) {
          userResetCounts[userId].lastAttempt = reset.createdAt;
        }
      });

      // Check if this is an AJAX request
      const isAjax = req.query.ajax === 'true';

      if (isAjax) {
        // For AJAX requests, render only the partial view
        res.render('admin/password-resets', {
          title: 'Password Reset History - FTRAISE AI', // Include title even for AJAX requests
          passwordResets,
          userResetCounts: Object.values(userResetCounts),
          search: search || '',
          layout: false // Don't use a layout for AJAX responses
        });
      } else {
        // For regular requests, render the full page
        res.render('admin/password-resets', {
          title: 'Password Reset History - FTRAISE AI',
          passwordResets,
          userResetCounts: Object.values(userResetCounts),
          search: search || '',
          path: '/admin/password-resets',
          layout: 'layouts/no-footer'
        });
      }
    } catch (err) {
      console.error('Error loading password reset history:', err);
      req.flash('error_msg', 'An error occurred while loading password reset history');
      res.redirect('/admin');
    }
  }
};