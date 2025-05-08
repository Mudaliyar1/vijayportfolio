const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Match user
        const user = await User.findOne({ email: email });

        if (!user) {
          console.log('Login failed: Email not registered');

          // Record the failed login attempt
          try {
            const UserLogin = require('../models/UserLogin');
            const { getRealIpAddress } = require('../utils/ipUtils');
            const { parseUserAgent } = require('../utils/deviceUtils');
            const { getIpLocation } = require('../utils/geoIpUtils');

            const req = arguments[3]; // Access the request object
            if (req) {
              const userAgentString = req.headers['user-agent'] || 'Unknown';
              const ipAddress = getRealIpAddress(req);
              const forwardedIp = req.headers['x-forwarded-for'] || '';
              const deviceInfo = parseUserAgent(userAgentString);
              const locationData = getIpLocation(ipAddress);

              const loginRecord = new UserLogin({
                username: email,
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
                country: locationData.country,
                countryCode: locationData.countryCode,
                region: locationData.region,
                city: locationData.city,
                postalCode: locationData.postalCode,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                timezone: locationData.timezone,
                isp: locationData.isp,
                loginStatus: 'failed',
                loginTime: new Date()
              });

              loginRecord.save().catch(err => console.error('Error recording failed login:', err));
            }
          } catch (err) {
            console.error('Error recording failed login attempt:', err);
          }

          return done(null, false, { message: 'This email is not registered. Please check your email or create an account.' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;

          if (isMatch) {
            return done(null, user);
          } else {
            console.log('Login failed: Incorrect password');

            // Record the failed login attempt
            try {
              const UserLogin = require('../models/UserLogin');
              const { getRealIpAddress } = require('../utils/ipUtils');
              const { parseUserAgent } = require('../utils/deviceUtils');
              const { getIpLocation } = require('../utils/geoIpUtils');

              const req = arguments[3]; // Access the request object
              if (req) {
                const userAgentString = req.headers['user-agent'] || 'Unknown';
                const ipAddress = getRealIpAddress(req);
                const forwardedIp = req.headers['x-forwarded-for'] || '';
                const deviceInfo = parseUserAgent(userAgentString);
                const locationData = getIpLocation(ipAddress);

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
                  country: locationData.country,
                  countryCode: locationData.countryCode,
                  region: locationData.region,
                  city: locationData.city,
                  postalCode: locationData.postalCode,
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  timezone: locationData.timezone,
                  isp: locationData.isp,
                  loginStatus: 'failed',
                  loginTime: new Date()
                });

                loginRecord.save().catch(err => console.error('Error recording failed login:', err));
              }
            } catch (err) {
              console.error('Error recording failed login attempt:', err);
            }

            return done(null, false, { message: 'Incorrect password. Please try again or use the forgot password option.' });
          }
        });
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.email, 'ID:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log('Deserializing user ID:', id);
      if (!id) {
        console.error('Invalid user ID during deserialization');
        return done(null, false);
      }

      const user = await User.findById(id);
      if (!user) {
        console.error('User not found during deserialization for ID:', id);
        return done(null, false);
      }

      console.log('User deserialized successfully:', user.email);
      done(null, user);
    } catch (err) {
      console.error('Error deserializing user:', err);
      done(err, null);
    }
  });
};
