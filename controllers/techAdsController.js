const Ad = require('../models/Ad');
const SystemSetting = require('../models/SystemSetting');
const flash = require('connect-flash');

// Helper function to get random ads from the available sources
const getRandomAds = (count = 1) => {
  const internetAdsService = require('../services/internetAdsService');
  const { FREE_AD_SOURCES } = internetAdsService;

  // Shuffle the array using Fisher-Yates algorithm
  const shuffled = [...FREE_AD_SOURCES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Take the first 'count' elements
  return shuffled.slice(0, count);
};

module.exports = {
  // Get tech ads showcase page
  getTechAdsShowcase: async (req, res) => {
    try {
      // Check if all ads are disabled
      const allAdsDisabledSetting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
      const allAdsDisabled = allAdsDisabledSetting ? allAdsDisabledSetting.value === true : false;

      if (allAdsDisabled) {
        // Only show the flash message to admin users
        if (req.user && req.user.role === 'admin') {
          req.flash('info_msg', 'All ads are currently disabled. Please enable ads in the admin settings.');
        }
        return res.render('tech-ads/showcase', {
          title: 'Tech Ads Showcase - FTRAISE AI',
          ads: [],
          categories: [],
          selectedCategory: 'all',
          allAdsDisabled: true,
          messages: req.flash()
        });
      }

      // Check if internet ads are enabled
      const internetAdsSetting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
      const internetAdsEnabled = internetAdsSetting ? internetAdsSetting.value === true : false;

      if (!internetAdsEnabled) {
        // Only show the flash message to admin users
        if (req.user && req.user.role === 'admin') {
          req.flash('info_msg', 'Internet ads are currently disabled. Please enable them in the admin settings.');
        }
        return res.render('tech-ads/showcase', {
          title: 'Tech Ads Showcase - FTRAISE AI',
          ads: [],
          categories: [],
          selectedCategory: 'all',
          allAdsDisabled: false,
          messages: req.flash()
        });
      }

      // Get the selected category from query params
      const selectedCategory = req.query.category || 'all';

      // Build the query
      const query = { source: 'internet', active: true };
      if (selectedCategory !== 'all') {
        query.category = selectedCategory;
      }

      // Get all active internet ads
      const ads = await Ad.find(query).sort({ createdAt: -1 });

      // Get all available categories
      const categories = await Ad.distinct('category', { source: 'internet' });

      res.render('tech-ads/showcase', {
        title: 'Tech Ads Showcase - FTRAISE AI',
        ads,
        categories,
        selectedCategory,
        allAdsDisabled: false,
        messages: req.flash()
      });
    } catch (err) {
      console.error('Error loading tech ads showcase:', err);
      req.flash('error_msg', 'An error occurred while loading the tech ads showcase');
      res.redirect('/');
    }
  },

  // API: Get random new ads
  getRandomNewAds: async (req, res) => {
    try {
      // Check if all ads are disabled
      const allAdsDisabledSetting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
      const allAdsDisabled = allAdsDisabledSetting ? allAdsDisabledSetting.value === true : false;

      if (allAdsDisabled) {
        return res.json({ success: false, message: 'All ads are disabled', ads: [] });
      }

      // Check if internet ads are enabled
      const internetAdsSetting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
      const internetAdsEnabled = internetAdsSetting ? internetAdsSetting.value === true : false;

      if (!internetAdsEnabled) {
        return res.json({ success: false, message: 'Internet ads are disabled', ads: [] });
      }

      // Get the count parameter (default to 1)
      const count = parseInt(req.query.count) || 1;

      // Get the category parameter (optional)
      const category = req.query.category;

      // Get random ads
      let randomSources = getRandomAds(count);

      // Filter by category if provided
      if (category && category !== 'all') {
        randomSources = randomSources.filter(source => source.category === category);
      }

      // Convert sources to ad format
      const ads = randomSources.map(source => ({
        id: Math.random().toString(36).substring(2, 15),
        source: 'internet',
        category: source.category || 'other',
        title: source.title,
        description: source.description,
        imageUrl: source.url,
        link: source.link
      }));

      return res.json({ success: true, ads });
    } catch (err) {
      console.error('Error getting random new ads:', err);
      return res.status(500).json({ success: false, message: 'An error occurred while getting random new ads', ads: [] });
    }
  }
};
