/**
 * Middleware to add ads to views
 */
const Ad = require('../models/Ad');
const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const internetAdsService = require('../services/internetAdsService');

module.exports = async (req, res, next) => {
  try {
    // Initialize empty ads object by default
    res.locals.ads = {
      popup: [],
      top: [],
      bottom: [],
      sidebar: [],
      content: []
    };

    // Check ad settings
    const allAdsDisabled = await internetAdsService.areAllAdsDisabled();
    const internetAdsEnabled = await internetAdsService.areInternetAdsEnabled();

    // Check if user has an ad-free subscription
    let userAdFree = false;
    if (req.isAuthenticated() && req.user) {
      // Check if user has an active ad-free subscription
      userAdFree = await internetAdsService.isUserAdFree(req.user._id);

      // Update user's ad-free status if subscription has expired
      await internetAdsService.updateUserAdFreeStatus(req.user._id);
    }

    // Add flags to res.locals for templates to use
    res.locals.allAdsDisabled = allAdsDisabled || userAdFree;
    res.locals.internetAdsEnabled = internetAdsEnabled;
    res.locals.userAdFree = userAdFree;

    // Skip fetching ads if all ads are disabled, user has ad-free subscription, or for admin routes, API routes, and static files
    if (allAdsDisabled ||
        userAdFree ||
        req.path.startsWith('/admin') ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/css') ||
        req.path.startsWith('/js') ||
        req.path.startsWith('/images') ||
        req.path === '/favicon.ico') {
      return next();
    }

    // Get the current path (remove trailing slash if present)
    let currentPath = req.path.endsWith('/') && req.path !== '/'
      ? req.path.slice(0, -1)
      : req.path;

    // If path is '/', set it to 'home' for matching
    if (currentPath === '/') {
      currentPath = 'home';
    } else {
      // Remove leading slash for other paths
      currentPath = currentPath.substring(1);
    }

    // Also create a simplified path for matching (first segment only)
    // This helps match ads to sections like /blog/post-1, /blog/post-2, etc.
    let simplePath = currentPath.split('/')[0];

    // Debug logging removed

    // Add the current path to res.locals for templates to use
    res.locals.currentPath = currentPath;
    res.locals.simplePath = simplePath;

    // Get current date
    const now = new Date();

    // Build the query for active ads
    const query = {
      $and: [
        // Match any of these page conditions
        { $or: [
          { pages: 'all' },              // Ads marked for all pages
          { pages: currentPath },         // Exact path match
          { pages: simplePath },          // Section match (first segment)
          { pages: 'home' }               // Include home ads on all pages for better coverage
        ]},
        // Must be active
        { active: true },
        // Must be within date range
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ]
    };

    // Add source filter based on internetAdsEnabled setting
    if (!internetAdsEnabled) {
      // If internet ads are disabled, only show custom ads
      query.$and.push({ source: 'custom' });
    }

    // Debug logging removed

    // Find ads matching the query
    const ads = await Ad.find(query);

    // Group ads by position
    const groupedAds = {
      popup: [],
      top: [],
      bottom: [],
      sidebar: [],
      content: []
    };

    ads.forEach(ad => {
      // Handle both old format (position) and new format (positions array)
      const positions = ad.positions || [ad.position];

      // Add the ad to each of its positions
      positions.forEach(position => {
        if (groupedAds[position]) {
          groupedAds[position].push(ad);
        }
      });
    });

    // Add ads to res.locals
    res.locals.ads = groupedAds;

    // Debug logging removed

    next();
  } catch (err) {
    console.error('Error in ads middleware:', err);
    // Continue without ads if there's an error
    next();
  }
};
