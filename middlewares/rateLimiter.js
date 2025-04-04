const User = require('../models/User');
const GuestUser = require('../models/GuestUser');

module.exports = {
  // Rate limiter for registered users: 8 requests per 3 minutes
  userRateLimiter: async function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }

    try {
      const user = await User.findById(req.user._id);
      const now = new Date();
      const windowDuration = 3 * 60 * 1000; // 3 minutes in milliseconds

      // Check if we need to reset the window
      if (!user.windowStartTime || now - user.windowStartTime > windowDuration) {
        user.windowStartTime = now;
        user.requestsInWindow = 0;
      }

      // Check if user has exceeded the limit
      if (user.requestsInWindow >= 8) {
        const timeElapsed = now - user.windowStartTime;
        const timeRemaining = windowDuration - timeElapsed;

        if (timeRemaining > 0) {
          const minutes = Math.floor(timeRemaining / 60000);
          const seconds = Math.floor((timeRemaining % 60000) / 1000);

          // Calculate the exact timestamp when the cooldown ends
          const cooldownEndTime = new Date(user.windowStartTime.getTime() + windowDuration).getTime();

          return res.status(429).json({
            success: false,
            isRateLimited: true,
            message: `⏳ You have reached the limit of 8 requests within 3 minutes. Please wait for the cooldown to end. You can generate requests again in ${minutes}m ${seconds}s.`,
            timeRemaining: timeRemaining,
            cooldownEndTime: cooldownEndTime
          });
        }
      }

      // Increment the request count
      user.requestsInWindow += 1;
      user.requestsCount += 1;
      user.lastRequestTime = now;
      await user.save();

      // Add rate limit info to request object
      req.rateLimit = {
        limit: 8,
        remaining: 8 - user.requestsInWindow,
        total: user.requestsCount
      };

      next();
    } catch (err) {
      console.error('Rate limiting error:', err);
      next(err);
    }
  },

  // Rate limiter for guest users: 5 requests total
  guestRateLimiter: async function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      let guestUser = await GuestUser.findOne({ ipAddress });

      if (!guestUser) {
        guestUser = new GuestUser({
          ipAddress,
          requestsCount: 0,
          lastRequestTime: null
        });
      }

      // Check if guest has exceeded the limit
      if (guestUser.requestsCount >= 5) {
        return res.status(429).json({
          success: false,
          isRateLimited: true,
          isGuest: true,
          message: "⚠️ You have reached the limit of 5 requests for guest users. Please login or register to continue using the AI chat. As a guest user, you are limited to 5 requests total. You have used 5 of 5 requests. 👉 Create an account to get 8 requests per 3 minutes!",
        });
      }

      // Increment the request count
      guestUser.requestsCount += 1;
      guestUser.lastRequestTime = new Date();
      await guestUser.save();

      // Add rate limit info to request object
      req.rateLimit = {
        limit: 5,
        remaining: 5 - guestUser.requestsCount,
        total: guestUser.requestsCount
      };

      next();
    } catch (err) {
      console.error('Guest rate limiting error:', err);
      next(err);
    }
  }
};
