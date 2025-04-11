const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const GuestUser = require('../models/GuestUser');
const Memory = require('../models/Memory');
const Review = require('../models/Review');
const Image = require('../models/Image');
const Package = require('../models/Package');
const Website = require('../models/Website');

module.exports = {
  // Render admin dashboard
  getDashboard: async (req, res) => {
    try {
      // Get counts for dashboard
      const userCount = await User.countDocuments();
      const chatCount = await Chat.countDocuments();
      const guestCount = await GuestUser.countDocuments();
      const imageCount = await Image.countDocuments();

      // Get website builder counts
      const Website = require('../models/Website');
      const Package = require('../models/Package');
      const Payment = require('../models/Payment');

      const websiteCount = await Website.countDocuments();
      const packageCount = await Package.countDocuments({ active: true });
      const paymentCount = await Payment.countDocuments();

      // Get recent users
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5);

      // Get recent chats
      const recentChats = await Chat.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('userId', 'username');

      // Get recent websites
      const recentWebsites = await Website.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'username')
        .populate('package', 'name');

      res.render('admin/dashboard', {
        title: 'Admin Dashboard - FTRAISE AI',
        userCount,
        chatCount,
        guestCount,
        imageCount,
        websiteCount,
        packageCount,
        paymentCount,
        recentUsers,
        recentChats,
        recentWebsites,
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

  // Package Management
  getPackageManagement: async (req, res) => {
    try {
      // Get all packages, including deleted ones but mark them differently
      const packages = await Package.find().sort({ price: 1 });

      // Separate active and deleted packages
      const activePackages = packages.filter(pkg => !pkg.isDeleted);
      const deletedPackages = packages.filter(pkg => pkg.isDeleted);

      res.render('admin/packages', {
        title: 'Package Management - Admin',
        packages: activePackages,
        deletedPackages,
        showDeleted: req.query.showDeleted === 'true',
        user: req.user,
        path: '/admin/packages',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error getting packages:', err);
      req.flash('error_msg', 'Failed to load packages');
      res.redirect('/admin');
    }
  },

  // Create Package Page
  getCreatePackage: (req, res) => {
    res.render('admin/packages/create', {
      title: 'Create Package - Admin',
      user: req.user,
      path: '/admin/packages',
      layout: 'layouts/no-footer'
    });
  },

  // Edit Package Page
  getEditPackage: async (req, res) => {
    try {
      const package = await Package.findById(req.params.id);
      if (!package) {
        req.flash('error_msg', 'Package not found');
        return res.redirect('/admin/packages');
      }

      res.render('admin/packages/edit', {
        title: 'Edit Package - Admin',
        package,
        user: req.user,
        path: '/admin/packages',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error getting package:', err);
      req.flash('error_msg', 'Failed to load package');
      res.redirect('/admin/packages');
    }
  },

  // View Package Page
  getViewPackage: async (req, res) => {
    try {
      const package = await Package.findById(req.params.id);
      if (!package) {
        req.flash('error_msg', 'Package not found');
        return res.redirect('/admin/packages');
      }

      res.render('admin/packages/view', {
        title: 'View Package - Admin',
        package,
        user: req.user,
        path: '/admin/packages',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error getting package:', err);
      req.flash('error_msg', 'Failed to load package');
      res.redirect('/admin/packages');
    }
  },

  createPackage: async (req, res) => {
    try {
      const { name, price, description, maxPages, features, isFree } = req.body;

      // Check if a package with the same name already exists
      const existingPackage = await Package.findOne({ name: name });
      if (existingPackage) {
        req.flash('error_msg', `A package with the name "${name}" already exists. Please choose a different name.`);
        return res.redirect('/admin/packages/create');
      }

      // Convert features string to array
      const featuresArray = features.split('\n').filter(feature => feature.trim() !== '');

      // Log the isFree value from the form
      console.log('Creating package with isFree:', isFree);

      // Explicitly set isFree as a boolean
      const isFreeBoolean = isFree === 'on' ? true : false;
      console.log('isFree as boolean:', isFreeBoolean);

      // Create new package
      const newPackage = new Package({
        name,
        price,
        description,
        maxPages,
        features: featuresArray,
        isFree: isFreeBoolean,
        allowBlog: req.body.allowBlog === 'on',
        allowGallery: req.body.allowGallery === 'on',
        allowContact: req.body.allowContact === 'on',
        allowTestimonials: req.body.allowTestimonials === 'on',
        allowEcommerce: req.body.allowEcommerce === 'on',
        allowAiContent: req.body.allowAiContent === 'on',
        allowCustomLayout: req.body.allowCustomLayout === 'on'
      });

      await newPackage.save();

      req.flash('success_msg', 'Package created successfully');
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error creating package:', err);

      // Check if this is a duplicate key error
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        req.flash('error_msg', `A package with the name "${err.keyValue.name}" already exists. Please choose a different name.`);
      } else {
        req.flash('error_msg', 'Failed to create package');
      }

      res.redirect('/admin/packages/create');
    }
  },

  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, description, maxPages, features, isFree } = req.body;

      // Get the old package to check if name has changed
      const oldPackage = await Package.findById(id);

      // If name is being changed, check if the new name already exists
      if (name !== oldPackage.name) {
        const existingPackage = await Package.findOne({ name: name, _id: { $ne: id } });
        if (existingPackage) {
          req.flash('error_msg', `A package with the name "${name}" already exists. Please choose a different name.`);
          return res.redirect(`/admin/packages/edit/${id}`);
        }
      }

      // Convert features string to array
      const featuresArray = features.split('\n').filter(feature => feature.trim() !== '');

      // Log the isFree value from the form
      console.log('Updating package with isFree:', isFree);

      // Explicitly set isFree as a boolean
      const isFreeBoolean = isFree === 'on' ? true : false;
      console.log('isFree as boolean:', isFreeBoolean);

      const oldMaxPages = oldPackage.maxPages;

      // Update package
      await Package.findByIdAndUpdate(id, {
        name,
        price,
        description,
        maxPages,
        features: featuresArray,
        isFree: isFreeBoolean,
        allowBlog: req.body.allowBlog === 'on',
        allowGallery: req.body.allowGallery === 'on',
        allowContact: req.body.allowContact === 'on',
        allowTestimonials: req.body.allowTestimonials === 'on',
        allowEcommerce: req.body.allowEcommerce === 'on',
        allowAiContent: req.body.allowAiContent === 'on',
        allowCustomLayout: req.body.allowCustomLayout === 'on'
      });

      // If maxPages has decreased, update all websites using this package
      if (parseInt(maxPages) < oldMaxPages) {
        console.log(`Package ${name} maxPages decreased from ${oldMaxPages} to ${maxPages}. Updating websites...`);

        // Find all websites using this package
        const websites = await Website.find({ package: id });

        // Update each website
        for (const website of websites) {
          // If website has more pages than the new limit, remove excess pages
          if (website.pages.length > maxPages) {
            console.log(`Website ${website.title} has ${website.pages.length} pages, reducing to ${maxPages}`);

            // Sort pages by order
            website.pages.sort((a, b) => a.order - b.order);

            // Keep only the first maxPages pages (including homepage)
            const homePage = website.pages.find(page => page.isHomepage);
            const regularPages = website.pages.filter(page => !page.isHomepage);

            // Ensure homepage is kept
            let newPages = [];
            if (homePage) {
              newPages.push(homePage);
            }

            // Add regular pages up to the limit
            const remainingSlots = maxPages - newPages.length;
            newPages = newPages.concat(regularPages.slice(0, remainingSlots));

            // Update the website
            website.pages = newPages;

            // Reorder pages
            website.pages.sort((a, b) => a.order - b.order);
            website.pages.forEach((page, index) => {
              page.order = index;
            });

            await website.save();
            console.log(`Website ${website.title} updated to ${website.pages.length} pages`);
          }
        }
      }

      req.flash('success_msg', 'Package updated successfully');
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error updating package:', err);

      // Check if this is a duplicate key error
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        req.flash('error_msg', `A package with the name "${err.keyValue.name}" already exists. Please choose a different name.`);
      } else {
        req.flash('error_msg', 'Failed to update package');
      }

      res.redirect('/admin/packages/edit/' + req.params.id);
    }
  },

  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;

      // Import Website model
      const Website = require('../models/Website');

      // Instead of preventing deletion, we'll handle users with this package
      const usersWithPackage = await User.find({ activePackage: id });
      const websitesWithPackage = await Website.find({ package: id });

      // Mark the package as inactive instead of deleting it
      await Package.findByIdAndUpdate(id, {
        active: false,
        isDeleted: true,
        deletedAt: new Date()
      });

      // Update users who have this package
      if (usersWithPackage.length > 0) {
        // Notify users that their package has been discontinued
        for (const user of usersWithPackage) {
          // Create a notification for the user
          // This is where you would add code to notify users if you have a notification system

          // Reset user's package to null
          user.activePackage = null;
          user.packageExpiryDate = null;
          await user.save();
        }

        console.log(`Updated ${usersWithPackage.length} users who had this package`);
      }

      // Mark websites with this package as needing package update
      if (websitesWithPackage.length > 0) {
        for (const website of websitesWithPackage) {
          website.needsPackageUpdate = true;
          website.isPublished = false; // Unpublish websites with deleted package
          await website.save();
        }

        console.log(`Updated ${websitesWithPackage.length} websites that used this package`);
      }

      req.flash('success_msg', `Package marked as inactive and ${usersWithPackage.length} users were updated`);
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error deleting package:', err);
      req.flash('error_msg', 'Failed to delete package');
      res.redirect('/admin/packages');
    }
  },

  // Bulk delete packages
  bulkDeletePackages: async (req, res) => {
    try {
      const { packageIds } = req.body;

      if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
        req.flash('error_msg', 'No packages selected for deletion');
        return res.redirect('/admin/packages');
      }

      // Import Website model
      const Website = require('../models/Website');

      // Find users with these packages
      const usersWithPackages = await User.find({ activePackage: { $in: packageIds } });

      // Find websites with these packages
      const websitesWithPackages = await Website.find({ package: { $in: packageIds } });

      // Mark packages as inactive instead of deleting them
      const result = await Package.updateMany(
        { _id: { $in: packageIds } },
        {
          active: false,
          isDeleted: true,
          deletedAt: new Date()
        }
      );

      // Update users who have these packages
      let updatedUserCount = 0;
      if (usersWithPackages.length > 0) {
        for (const user of usersWithPackages) {
          // Reset user's package to null
          user.activePackage = null;
          user.packageExpiryDate = null;
          await user.save();
          updatedUserCount++;
        }
      }

      // Mark websites with these packages as needing package update
      let updatedWebsiteCount = 0;
      if (websitesWithPackages.length > 0) {
        for (const website of websitesWithPackages) {
          website.needsPackageUpdate = true;
          website.isPublished = false; // Unpublish websites with deleted packages
          await website.save();
          updatedWebsiteCount++;
        }
      }

      req.flash('success_msg', `${result.modifiedCount} packages marked as inactive. Updated ${updatedUserCount} users and ${updatedWebsiteCount} websites.`);
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error bulk deleting packages:', err);
      req.flash('error_msg', 'An error occurred while deleting the packages');
      res.redirect('/admin/packages');
    }
  },

  toggleFreePackage: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the package
      const package = await Package.findById(id);

      if (!package) {
        req.flash('error_msg', 'Package not found');
        return res.redirect('/admin/packages');
      }

      console.log('Before toggle - Package isFree:', package.isFree, 'Type:', typeof package.isFree);

      // Toggle the isFree flag - ensure it's a boolean
      package.isFree = package.isFree === true ? false : true;

      console.log('After toggle - Package isFree:', package.isFree, 'Type:', typeof package.isFree);

      // Save the updated package
      await package.save();

      req.flash('success_msg', `Package is now ${package.isFree ? 'free' : 'paid'}`);
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error toggling free package:', err);
      req.flash('error_msg', 'Failed to toggle free package');
      res.redirect('/admin/packages');
    }
  }
};
