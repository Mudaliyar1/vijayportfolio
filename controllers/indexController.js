const { getTopReviews } = require('./reviewController');

module.exports = {
  // Render home page
  getHomePage: async (req, res) => {
    try {
      // Get top reviews for homepage
      const topReviews = await getTopReviews();

      res.render('index', {
        title: 'FTRAISE AI - Futuristic AI Chat Experience',
        topReviews,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading homepage:', err);
      res.render('index', {
        title: 'FTRAISE AI - Futuristic AI Chat Experience',
        topReviews: [],
        user: req.user
      });
    }
  },

  // Render about page
  getAboutPage: (req, res) => {
    res.render('about', {
      title: 'About - FTRAISE AI',
      user: req.user
    });
  },

  // Render demo page
  getDemoPage: (req, res) => {
    res.render('demo', {
      title: 'Interactive Demos - FTRAISE AI',
      user: req.user
    });
  },

  // Render analytics page
  getAnalyticsPage: (req, res) => {
    res.render('analytics', {
      title: 'Platform Analytics - FTRAISE AI',
      user: req.user
    });
  },

  // Render blog page
  getBlogPage: async (req, res) => {
    try {
      // Import the blog controller and call its getAllBlogs method
      const blogController = require('./blogController');
      await blogController.getAllBlogs(req, res);
    } catch (error) {
      console.error('Error in getBlogPage:', error);
      res.render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while loading the blog page.',
        user: req.user
      });
    }
  },

  // Render community page
  getCommunityPage: async (req, res) => {
    try {
      // Import the community controller and call its getAllPosts method
      const communityController = require('./communityController');

      // Set default query parameters if not provided
      req.query = req.query || {};
      if (!req.query.sort) req.query.sort = 'newest';
      if (!req.query.category) req.query.category = 'all';

      // Call the getAllPosts method directly
      await communityController.getAllPosts(req, res);
    } catch (error) {
      console.error('Error in getCommunityPage:', error);
      res.render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while loading the community page.',
        user: req.user
      });
    }
  }
};
