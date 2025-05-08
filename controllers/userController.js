const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Memory = require('../models/Memory');
const Review = require('../models/Review');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetOTP } = require('../utils/emailService');

module.exports = {
  // Render login page
  getLogin: (req, res) => {
    // Check if this is an admin login attempt during maintenance
    const adminLogin = req.query.admin === 'true';

    // Debug flash messages - these are already in res.locals from middleware
    console.log('Login page flash messages:');
    console.log('success_msg:', res.locals.success_msg);
    console.log('error_msg:', res.locals.error_msg);
    console.log('error:', res.locals.error);

    // Filter out inappropriate messages if needed
    if (res.locals.success_msg && res.locals.success_msg.includes('OTP verified successfully')) {
      // Replace with a more appropriate message for login
      res.locals.success_msg = ['Your password has been reset successfully. Please log in with your new password.'];
    }

    res.render('users/login', {
      title: 'Login - FTRAISE AI',
      layout: 'layouts/auth',
      maintenanceMode: req.maintenanceMode || false,
      maintenanceRedirect: req.maintenanceRedirect || false,
      adminLogin: adminLogin
      // Flash messages are already in res.locals
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
        // Debug info object
        console.log('Authentication failed:', info);

        // Use the message directly from Passport
        if (info && info.message) {
          req.flash('error_msg', info.message);
        } else {
          req.flash('error_msg', 'Invalid email or password');
        }
        return res.redirect('/users/login');
      }

      // Log successful authentication
      console.log('User authenticated:', user.email, 'Admin:', user.isAdmin);

      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }

        // Log successful login
        console.log('User logged in successfully:', user.email);
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());

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

        // Handle different scenarios based on maintenance mode and user role
        if (isMaintenanceActive) {
          if (isUserAdmin || req.adminMaintenance) {
            // Admin during maintenance mode
            console.log('Redirecting admin to dashboard during maintenance');

            // If the user doesn't have the isAdmin flag but is using the admin email, update their status
            if ((isAdminEmail || req.adminMaintenance) && !user.isAdmin) {
              console.log('Updating admin status for:', user.email);
              await User.findByIdAndUpdate(user._id, { isAdmin: true, role: 'admin' });
              // Update the user object in the session
              user.isAdmin = true;
              user.role = 'admin';
            }

            // Record the admin login in the UserLogin collection for IP tracking
            try {
              const UserLogin = require('../models/UserLogin');

              // Get user agent string
              const userAgentString = req.headers['user-agent'] || 'Unknown';

              // Get IP addresses
              const { getRealIpAddress } = require('../utils/ipUtils');
              const ipAddress = getRealIpAddress(req);
              const forwardedIp = req.headers['x-forwarded-for'] || '';

              // Parse user agent to get device and browser info
              const { parseUserAgent } = require('../utils/deviceUtils');
              const deviceInfo = parseUserAgent(userAgentString);

              // Get location data
              const { getIpLocation } = require('../utils/geoIpUtils');
              const locationData = getIpLocation(ipAddress);

              // Create the login record
              const loginRecord = new UserLogin({
                username: user.email,
                userId: user._id,
                ipAddress: ipAddress,
                forwardedIp: forwardedIp,
                userAgent: userAgentString,
                browser: deviceInfo.browser,
                browserVersion: deviceInfo.browserVersion,
                operatingSystem: deviceInfo.operatingSystem,
                osVersion: deviceInfo.osVersion,
                deviceType: deviceInfo.deviceType,
                deviceBrand: deviceInfo.deviceBrand,
                deviceModel: deviceInfo.deviceModel,
                // Location data
                country: locationData.country,
                countryCode: locationData.countryCode,
                region: locationData.region,
                regionCode: locationData.regionCode,
                city: locationData.city,
                postalCode: locationData.postalCode,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracyRadius: locationData.accuracyRadius,
                timezone: locationData.timezone,
                // ISP and network data
                isp: locationData.isp,
                organization: locationData.organization,
                asn: locationData.asn,
                userType: locationData.userType,
                connectionType: locationData.connectionType,
                databaseType: locationData.databaseType,
                // Login status
                loginStatus: 'success',
                loginTime: new Date()
              });

              // Save the login record
              await loginRecord.save();
              console.log('Recorded admin login for:', user.email, '(maintenance mode)');
            } catch (err) {
              console.error('Error recording admin login:', err);
            }

            // Force bypass maintenance mode for admin
            req.maintenanceBypass = true;

            // Store the bypass flag in the session so it persists across requests
            req.session.maintenanceBypass = true;
            req.session.isAdminSession = true;

            // Save the session before redirecting
            return req.session.save(err => {
              if (err) {
                console.error('Error saving session:', err);
              }
              res.redirect('/admin');
            });
          } else {
            // Non-admin during maintenance mode
            console.log('Non-admin logged in during maintenance, logging out');

            // Record the login attempt in both maintenance log and user logins
            try {
              const MaintenanceLoginAttempt = require('../models/MaintenanceLoginAttempt');
              const UserLogin = require('../models/UserLogin');

              // Get user agent string
              const userAgentString = req.headers['user-agent'] || 'Unknown';

              // Get IP addresses
              const { getRealIpAddress } = require('../utils/ipUtils');
              const ipAddress = getRealIpAddress(req);
              const forwardedIp = req.headers['x-forwarded-for'] || '';

              // Parse user agent to get device and browser info
              const { parseUserAgent } = require('../utils/deviceUtils');
              const deviceInfo = parseUserAgent(userAgentString);

              // Get location data
              const { getIpLocation } = require('../utils/geoIpUtils');
              const locationData = getIpLocation(ipAddress);

              // Create the maintenance login attempt record
              const loginAttempt = new MaintenanceLoginAttempt({
                username: user.email,
                userId: user._id,
                ipAddress: ipAddress,
                forwardedIp: forwardedIp,
                userAgent: userAgentString,
                browser: deviceInfo.browser,
                browserVersion: deviceInfo.browserVersion,
                operatingSystem: deviceInfo.operatingSystem,
                osVersion: deviceInfo.osVersion,
                deviceType: deviceInfo.deviceType,
                deviceBrand: deviceInfo.deviceBrand,
                deviceModel: deviceInfo.deviceModel,
                status: 'blocked',
                reason: 'Non-admin user during maintenance',
                timestamp: new Date() // Ensure timestamp is set to now
              });

              // Also create a record in the UserLogin collection for IP tracking
              const userLoginRecord = new UserLogin({
                username: user.email,
                userId: user._id,
                ipAddress: ipAddress,
                forwardedIp: forwardedIp,
                userAgent: userAgentString,
                browser: deviceInfo.browser,
                browserVersion: deviceInfo.browserVersion,
                operatingSystem: deviceInfo.operatingSystem,
                osVersion: deviceInfo.osVersion,
                deviceType: deviceInfo.deviceType,
                deviceBrand: deviceInfo.deviceBrand,
                deviceModel: deviceInfo.deviceModel,
                // Location data
                country: locationData.country,
                countryCode: locationData.countryCode,
                region: locationData.region,
                regionCode: locationData.regionCode,
                city: locationData.city,
                postalCode: locationData.postalCode,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracyRadius: locationData.accuracyRadius,
                timezone: locationData.timezone,
                // ISP and network data
                isp: locationData.isp,
                organization: locationData.organization,
                asn: locationData.asn,
                userType: locationData.userType,
                connectionType: locationData.connectionType,
                databaseType: locationData.databaseType,
                // Login status
                loginStatus: 'blocked',
                loginTime: new Date()
              });

              // Save both records
              await Promise.all([
                loginAttempt.save(),
                userLoginRecord.save()
              ]);

              console.log('Recorded login attempt for:', user.email, '(maintenance mode)');
            } catch (err) {
              console.error('Error recording login attempt:', err);
            }

            return req.logout(function(err) {
              if (err) { console.error('Error during logout:', err); }
              req.flash('error_msg', 'Only administrators can access the site during maintenance.');
              res.redirect('/maintenance');
            });
          }
        } else {
          // Normal operation (no maintenance mode)
          console.log('Normal login, redirecting to chat');

          // Record the login in the user logins log with location data
          try {
            const UserLogin = require('../models/UserLogin');

            // Get user agent string
            const userAgentString = req.headers['user-agent'] || 'Unknown';

            // Get IP addresses
            const { getRealIpAddress } = require('../utils/ipUtils');
            const ipAddress = getRealIpAddress(req);
            const forwardedIp = req.headers['x-forwarded-for'] || '';

            // Parse user agent to get device and browser info
            const { parseUserAgent } = require('../utils/deviceUtils');
            const deviceInfo = parseUserAgent(userAgentString);

            // Get location data
            const { getIpLocation } = require('../utils/geoIpUtils');
            const locationData = getIpLocation(ipAddress);

            // Create the login record with detailed device and location info
            const loginRecord = new UserLogin({
              username: user.email,
              userId: user._id,
              ipAddress: ipAddress,
              forwardedIp: forwardedIp,
              userAgent: userAgentString,
              browser: deviceInfo.browser,
              browserVersion: deviceInfo.browserVersion,
              operatingSystem: deviceInfo.operatingSystem,
              osVersion: deviceInfo.osVersion,
              deviceType: deviceInfo.deviceType,
              deviceBrand: deviceInfo.deviceBrand,
              deviceModel: deviceInfo.deviceModel,
              // Location data
              country: locationData.country,
              countryCode: locationData.countryCode,
              region: locationData.region,
              regionCode: locationData.regionCode,
              city: locationData.city,
              postalCode: locationData.postalCode,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              accuracyRadius: locationData.accuracyRadius,
              timezone: locationData.timezone,
              // ISP and network data
              isp: locationData.isp,
              organization: locationData.organization,
              asn: locationData.asn,
              userType: locationData.userType,
              connectionType: locationData.connectionType,
              databaseType: locationData.databaseType,
              // Login status
              loginStatus: 'success',
              loginTime: new Date()
            });

            // Save the login record
            await loginRecord.save();
            console.log('Recorded successful login for:', user.email);
          } catch (err) {
            console.error('Error recording login:', err);
          }

          // Ensure session is saved before redirecting
          return req.session.save((err) => {
            if (err) {
              console.error('Error saving session after login:', err);
              // Even if there's an error, try to continue with the redirect
              // but add a flag to the session to indicate there was an error
              req.session.loginError = true;
            }

            // Log session details for debugging
            console.log('Session before redirect:', {
              id: req.sessionID,
              authenticated: req.isAuthenticated(),
              user: req.user ? req.user.email : 'none',
              cookie: req.session.cookie ? 'exists' : 'missing'
            });

            // Set a flash message to confirm login success
            req.flash('success_msg', 'You have successfully logged in');

            // Redirect to chat page
            return res.redirect('/chat');
          });
        }
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

  // Render forgot password page
  getForgotPassword: (req, res) => {
    res.render('users/forgot-password', {
      title: 'Forgot Password - FTRAISE AI',
      layout: 'layouts/auth',
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  },

  // Handle forgot password request
  postForgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Forgot password request for email:', email);

      if (!email) {
        console.log('No email provided');
        req.flash('error_msg', 'Please enter your email address');
        return res.redirect('/users/forgot-password');
      }

      // Check if email exists
      const user = await User.findOne({ email });
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('Email not registered:', email);
        req.flash('error_msg', 'This email is not registered in our system. Please check the email or create a new account.');
        return res.redirect('/users/forgot-password');
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete any existing OTPs for this user
      await PasswordReset.deleteMany({ userId: user._id });

      // Create a new password reset document
      const passwordReset = new PasswordReset({
        userId: user._id,
        email: user.email,
        otp
      });

      await passwordReset.save();
      console.log('Password reset record created:', passwordReset._id);

      // Send OTP email
      const emailResult = await sendPasswordResetOTP(user.email, user.username, otp);

      // Check if email was sent successfully or using fallback
      if (emailResult.success) {
        // Clear any previous messages
        req.flash('error_msg', null);
        req.flash('success_msg', 'An OTP has been sent to your email address');
      } else if (emailResult.fallback) {
        // For development/testing, show the OTP on screen
        // Clear any previous messages
        req.flash('error_msg', null);
        req.flash('success_msg', `Development Mode: Your OTP is ${otp}. In production, this would be sent to your email.`);
      } else {
        // In production, don't expose the error details to the user
        console.error('Failed to send password reset email:', emailResult.error);
        req.flash('error_msg', 'Unable to send email at this time. Please try again later or contact support.');
        return res.redirect('/users/forgot-password');
      }

      // Redirect to reset password page with email parameter
      return res.redirect(`/users/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Error in forgot password:', err);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      return res.redirect('/users/forgot-password');
    }
  },

  // Render reset password page
  getResetPassword: async (req, res) => {
    const { email, verified } = req.query;

    if (!email) {
      req.flash('error_msg', 'Email is required');
      return res.redirect('/users/forgot-password');
    }

    try {
      // Check if the email exists in the system
      const user = await User.findOne({ email });
      if (!user) {
        req.flash('error_msg', 'This email is not registered in our system');
        return res.redirect('/users/forgot-password');
      }

      // If this is the verified page (after OTP verification), clear any messages about OTP being sent
      if (verified === 'true') {
        // Filter out any messages about OTP being sent
        if (Array.isArray(res.locals.success_msg)) {
          res.locals.success_msg = res.locals.success_msg.filter(msg =>
            !msg.includes('OTP has been sent')
          );
        }
      }

      // Debug flash messages
      console.log('Reset password page flash messages:');
      console.log('success_msg:', res.locals.success_msg);
      console.log('error_msg:', res.locals.error_msg);
      console.log('error:', res.locals.error);

      res.render('users/reset-password', {
        title: 'Reset Password - FTRAISE AI',
        layout: 'layouts/auth',
        email,
        verified: verified === 'true'
        // Flash messages are already in res.locals
      });
    } catch (err) {
      console.error('Error in getResetPassword:', err);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      return res.redirect('/users/forgot-password');
    }
  },

  // Verify OTP
  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;

      console.log('Verifying OTP:', { email, otp });

      if (!email || !otp) {
        console.log('Email or OTP missing');
        req.flash('error_msg', 'Email and OTP are required');
        return res.redirect(`/users/reset-password?email=${encodeURIComponent(email)}`);
      }

      // Find the user
      const user = await User.findOne({ email });

      if (!user) {
        console.log('User not found for email:', email);
        req.flash('error_msg', 'This email is not registered in our system');
        return res.redirect('/users/forgot-password');
      }

      // Check if there are any failed attempts for this user
      const failedAttempt = await PasswordReset.findOne({
        userId: user._id,
        isUsed: true,
        isBlocked: true
      });

      if (failedAttempt) {
        console.log('Account blocked due to previous failed attempts');
        req.flash('error_msg', 'Your account has been temporarily blocked due to too many failed attempts. Please request a new OTP.');
        return res.redirect('/users/forgot-password');
      }

      // First check if there's any OTP record for this user
      const anyOtpExists = await PasswordReset.findOne({
        userId: user._id,
        isUsed: false
      });

      if (!anyOtpExists) {
        console.log('No active OTP found for user');
        req.flash('error_msg', 'Your OTP has expired or is invalid. Please request a new OTP.');
        return res.redirect(`/users/forgot-password`);
      }

      // Find the password reset document with the provided OTP
      const passwordReset = await PasswordReset.findOne({
        userId: user._id,
        otp,
        isUsed: false
      });

      console.log('Password reset document found:', passwordReset ? 'Yes' : 'No');

      if (!passwordReset) {
        console.log('Invalid OTP entered:', otp);

        // Create a record of this failed attempt
        await PasswordReset.updateMany(
          { userId: user._id, isUsed: false },
          { $set: { isUsed: true, isBlocked: true } }
        );

        // Show an error message
        req.flash('error_msg', 'Invalid OTP. For security reasons, this OTP has been blocked. Please request a new OTP.');

        // Redirect to forgot password page
        return res.redirect('/users/forgot-password');
      }

      // Clear all flash messages
      req.session.flash = {};

      // Set a new success message for OTP verification
      req.flash('success_msg', 'OTP verified successfully. Please set your new password.');
      return res.redirect(`/users/reset-password?email=${encodeURIComponent(email)}&verified=true`);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      return res.redirect(`/users/reset-password?email=${encodeURIComponent(email)}`);
    }
  },

  // Handle reset password request
  postResetPassword: async (req, res) => {
    try {
      const { email, password, password2 } = req.body;
      let errors = [];

      // Check required fields
      if (!email || !password || !password2) {
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
        return res.render('users/reset-password', {
          title: 'Reset Password - FTRAISE AI',
          layout: 'layouts/auth',
          errors,
          email,
          verified: true
        });
      }

      // Find the user
      const user = await User.findOne({ email });

      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/users/forgot-password');
      }

      // Find the latest password reset document for this user
      const passwordReset = await PasswordReset.findOne({
        userId: user._id,
        isUsed: false
      }).sort({ createdAt: -1 });

      if (!passwordReset) {
        req.flash('error_msg', 'Your OTP verification has expired. Please request a new password reset.');
        return res.redirect('/users/forgot-password');
      }

      // Mark the OTP as used
      passwordReset.isUsed = true;
      await passwordReset.save();

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      // Clear any previous success messages
      req.flash('success_msg', null);
      // Set a new success message specifically for password reset
      req.flash('success_msg', 'Your password has been reset successfully. You can now log in with your new password.');
      res.redirect('/users/login');
    } catch (err) {
      console.error('Error in reset password:', err);
      req.flash('error_msg', 'An error occurred. Please try again later.');
      res.redirect('/users/forgot-password');
    }
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
