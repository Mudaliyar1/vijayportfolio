const User = require('../models/User');
const GuestUser = require('../models/GuestUser');

module.exports = {
  // Process rate limit for image generation
  processRateLimit: async function(req) {
    try {
      if (req.isAuthenticated()) {
        // For registered users
        const user = await User.findById(req.user._id);
        const now = new Date();
        const windowDuration = 2 * 60 * 1000; // 2 minutes in milliseconds

        // Check if this is the first request or if we need to reset the window
        if (!user.imageWindowStartTime || now - user.imageWindowStartTime > windowDuration) {
          // First request or window expired - allow the request
          user.imageWindowStartTime = now;
          user.imageRequestsInWindow = 0;
          await user.save();
          return {
            success: true,
            currentLimit: user.imageRateLimit,
            remaining: user.imageRateLimit
          };
        }

        // Check if user has exceeded their custom limit
        console.log(`User ${user.username} image limit: ${user.imageRateLimit}, current: ${user.imageRequestsInWindow}`);

        if (user.imageRequestsInWindow >= user.imageRateLimit) {
          const timeElapsed = now - user.imageWindowStartTime;
          const timeRemaining = windowDuration - timeElapsed;

          if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);

            // Calculate the exact timestamp when the cooldown ends
            const cooldownEndTime = new Date(user.imageWindowStartTime.getTime() + windowDuration).getTime();

            return {
              success: false,
              isRateLimited: true,
              isGuest: false,
              message: `⏳ You can generate only ${user.imageRateLimit} image${user.imageRateLimit > 1 ? 's' : ''} per 2 minutes. Please wait for the cooldown to end. You can generate another image in ${minutes}m ${seconds}s.`,
              timeRemaining: timeRemaining,
              cooldownEndTime: cooldownEndTime,
              currentLimit: user.imageRateLimit,
              limit: user.imageRateLimit
            };
          }
        }

        // Increment the request count
        user.imageRequestsInWindow += 1;
        user.requestsCount += 1; // Keep incrementing the total count
        user.lastRequestTime = now;

        // Always set the window start time when a request is made
        // This ensures the timer starts correctly
        user.imageWindowStartTime = user.imageWindowStartTime || now;

        console.log(`User ${user.username} image request: ${user.imageRequestsInWindow}/${user.imageRateLimit} in current window`);

        await user.save();

        // Calculate remaining requests after incrementing
        const remaining = Math.max(0, user.imageRateLimit - user.imageRequestsInWindow);

        // If this was the last available request, include cooldown info
        if (remaining === 0) {
          const cooldownEndTime = new Date(now.getTime() + windowDuration).getTime();
          return {
            success: true,
            currentLimit: user.imageRateLimit,
            limit: user.imageRateLimit,
            remaining: 0,
            isRateLimited: true,
            cooldownEndTime: cooldownEndTime,
            message: `You have used all your image generation requests (${user.imageRateLimit}/${user.imageRateLimit}). Please wait for the cooldown to end.`
          };
        }

        return {
          success: true,
          currentLimit: user.imageRateLimit,
          limit: user.imageRateLimit,
          remaining: remaining
        };
      } else {
        // For guest users - don't allow image generation
        return {
          success: false,
          isRateLimited: true,
          isGuest: true,
          message: "⚠️ Guest users cannot generate images. Please login or register to use the image generation feature."
        };
      }
    } catch (err) {
      console.error('Rate limiting error:', err);
      return { success: false, message: 'An error occurred while processing your request' };
    }
  },

  // Rate limiter for registered users with custom limits for chat
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

      // Get the user's custom chat rate limit (default is 8)
      const chatLimit = user.chatRateLimit || 8;

      console.log(`User ${user.username} chat limit: ${chatLimit}, current: ${user.requestsInWindow}`);

      // Check if user has exceeded their custom limit
      if (user.requestsInWindow >= chatLimit) {
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
            message: `⏳ You have reached the limit of ${chatLimit} requests within 3 minutes. Please wait for the cooldown to end. You can generate requests again in ${minutes}m ${seconds}s.`,
            timeRemaining: timeRemaining,
            cooldownEndTime: cooldownEndTime,
            currentLimit: chatLimit,
            limit: chatLimit
          });
        }
      }

      // Increment the request count
      user.requestsInWindow += 1;
      user.requestsCount += 1;
      user.lastRequestTime = now;
      user.windowStartTime = user.windowStartTime || now; // Ensure window start time is set
      await user.save();

      console.log(`User ${user.username} chat request: ${user.requestsInWindow}/${user.chatRateLimit} in current window`);

      // Add rate limit info to request object
      req.rateLimit = {
        limit: chatLimit,
        remaining: chatLimit - user.requestsInWindow,
        total: user.requestsCount,
        currentLimit: chatLimit
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
      // Use a unique guest ID from cookie instead of IP address
      let guestId = req.cookies.guestId;

      // If no guestId cookie exists, create one
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        res.cookie('guestId', guestId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true }); // 30 days
      }

      let guestUser = await GuestUser.findOne({ guestId });

      if (!guestUser) {
        guestUser = new GuestUser({
          guestId,
          ipAddress: req.ip || req.connection.remoteAddress, // Still store IP for reference
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
