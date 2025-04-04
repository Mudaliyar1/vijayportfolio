const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const Chat = require('../models/Chat');

module.exports = {
  // Render login page
  getLogin: (req, res) => {
    res.render('users/login', {
      title: 'Login - FTRAISE AI',
      layout: 'layouts/auth'
    });
  },
  
  // Handle login
  postLogin: (req, res, next) => {
    passport.authenticate('local', {
      successRedirect: '/chat',
      failureRedirect: '/users/login',
      failureFlash: true
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
      
      // Delete user
      await User.findByIdAndDelete(req.user._id);
      
      req.logout(function(err) {
        if (err) {
          console.error(err);
          return next(err);
        }
        req.flash('success_msg', 'Your account has been deleted successfully');
        res.redirect('/users/login');
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while deleting your account');
      res.redirect('/profile');
    }
  }
};
