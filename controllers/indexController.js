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
  }
};
