const { getTopReviews } = require('./reviewController');

module.exports = {
  // Render home page
  getHomePage: async (req, res) => {
    try {
      // Get top reviews for homepage
      const topReviews = await getTopReviews();

      res.render('index', {
        title: 'FTRAISE AI - Futuristic AI Chat Experience',
        topReviews
      });
    } catch (err) {
      console.error('Error loading homepage:', err);
      res.render('index', {
        title: 'FTRAISE AI - Futuristic AI Chat Experience',
        topReviews: []
      });
    }
  },

  // Render about page
  getAboutPage: (req, res) => {
    res.render('about', {
      title: 'About - FTRAISE AI'
    });
  },

  // Render demo page
  getDemoPage: (req, res) => {
    res.render('demo', {
      title: 'Interactive Demos - FTRAISE AI'
    });
  },

  // Render analytics page
  getAnalyticsPage: (req, res) => {
    res.render('analytics', {
      title: 'Platform Analytics - FTRAISE AI'
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
        message: 'An error occurred while loading the blog page.'
      });
    }
  },

  // Render community page
  getCommunityPage: (req, res) => {
    res.render('community', {
      title: 'Community - FTRAISE AI'
    });
  }
};
