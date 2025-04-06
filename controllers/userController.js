const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Memory = require('../models/Memory');
const Review = require('../models/Review');

module.exports = {
  // Render login page
  getLogin: (req, res) => {
    // Check if this is an admin login attempt during maintenance
    const adminLogin = req.query.admin === 'true';

    res.render('users/login', {
      title: 'Login - FTRAISE AI',
      layout: 'layouts/auth',
      maintenanceMode: req.maintenanceMode || false,
      maintenanceRedirect: req.maintenanceRedirect || false,
      adminLogin: adminLogin
    });
  },

  // Handle login
  postLogin: (req, res, next) => {
    // Check if we need to bypass maintenance check for admin login
    const bypassMaintenance = req.query.bypass === 'true';

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }

      if (!user) {
        req.flash('error_msg', info.message);
        return res.redirect('/users/login');
      }

      // Log successful authentication
      console.log('User authenticated:', user.email, 'Admin:', user.isAdmin);

      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }

        // Check if maintenance mode is active
        const MaintenanceMode = require('../models/MaintenanceMode');
        const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });

        const isMaintenanceActive = maintenanceSettings &&
                                   maintenanceSettings.isEnabled &&
                                   new Date() < maintenanceSettings.endTime;

        // Special case for known admin email - use environment variable if available
        const adminEmail = process.env.ADMIN_EMAIL || 'vijaymudaliyar224@gmail.com';
        const isAdminEmail = user.email === adminEmail;
        const isUserAdmin = user.isAdmin || isAdminEmail;

        console.log('Maintenance active:', isMaintenanceActive, 'User is admin:', isUserAdmin, 'Email:', user.email);

        // If maintenance is active and user is admin, redirect to admin dashboard
        if (isMaintenanceActive && isUserAdmin) {
          console.log('Redirecting admin to dashboard during maintenance');

          // If the user doesn't have the isAdmin flag but is using the admin email, update their status
          if (isAdminEmail && !user.isAdmin) {
            console.log('Updating admin status for:', user.email);
            await User.findByIdAndUpdate(user._id, { isAdmin: true });
          }

          return res.redirect('/admin');
        } else if (isMaintenanceActive && !isUserAdmin) {
          // If maintenance is active and user is not admin, log them out and redirect to maintenance
          console.log('Non-admin logged in during maintenance, logging out');
          req.logout(function(err) {
            if (err) { console.error('Error during logout:', err); }
            req.flash('error_msg', 'Only administrators can access the site during maintenance.');
            return res.redirect('/maintenance');
          });
          return;
        }

        // Otherwise, redirect to chat
        console.log('Normal login, redirecting to chat');
        return res.redirect('/chat');
      });
    })(req, res, next);
  },

  // Render register page
  getRegister: (req, res) => {
    res.render('users/register', {
      title: 'Register - FTRAISE AI',
      layout: 'layouts/auth'
    });
  },

  // Handle registration
  postRegister: async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    // Check required fields
    if (!username || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    // Check passwords match
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
      return res.render('users/register', {
        title: 'Register - FTRAISE AI',
        layout: 'layouts/auth',
        errors,
        username,
        email
      });
    }

    try {
      // Check if email exists
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        errors.push({ msg: 'Email is already registered' });
        return res.render('users/register', {
          title: 'Register - FTRAISE AI',
          layout: 'layouts/auth',
          errors,
          username,
          email
        });
      }

      // Check if username exists
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        errors.push({ msg: 'Username is already taken' });
        return res.render('users/register', {
          title: 'Register - FTRAISE AI',
          layout: 'layouts/auth',
          errors,
          username,
          email
        });
      }

      // Create new user
      const newUser = new User({
        username,
        email,
        password
      });

      // Set admin role for specific email
      if (email === 'vijaymudaliyar224@gmail.com') {
        newUser.role = 'admin';
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);

      // Save user
      await newUser.save();

      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/users/login');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred during registration');
      res.redirect('/users/register');
    }
  },

  // Handle logout
  logout: (req, res) => {
    req.logout(function(err) {
      if (err) {
        console.error(err);
        return next(err);
      }
      req.flash('success_msg', 'You are logged out');
      res.redirect('/users/login');
    });
  },

  // Delete user account
  deleteAccount: async (req, res) => {
    try {
      // Delete user's chats
      await Chat.deleteMany({ userId: req.user._id });

      // Delete user's memories
      await Memory.deleteMany({ userId: req.user._id });

      // Delete user's reviews
      await Review.deleteMany({ userId: req.user._id });

      // Delete user
      await User.findByIdAndDelete(req.user._id);

      req.logout(function(err) {
        if (err) {
          console.error('Error during logout:', err);
          return res.redirect('/profile');
        }
        req.flash('success_msg', 'Your account has been deleted successfully');
        res.redirect('/users/login');
      });
    } catch (err) {
      console.error('Error deleting account:', err);
      req.flash('error_msg', 'An error occurred while deleting your account');
      res.redirect('/profile');
    }
  },

  // Search users feature removed as requested

  // Social features removed as requested
};
