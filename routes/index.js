const express = require('express');
const router = express.Router();
const {
  getHomePage,
  getAboutPage,
  getDemoPage,
  getAnalyticsPage,
  getBlogPage,
  getCommunityPage
} = require('../controllers/indexController');

// Home page route
router.get('/', getHomePage);

// About page route
router.get('/about', getAboutPage);

// Demo page route
router.get('/demo', getDemoPage);

// Analytics page route
router.get('/analytics', getAnalyticsPage);

// Blog page route (redirects to blog router)
router.get('/blog', getBlogPage);

// Community page route
router.get('/community', getCommunityPage);

// Database error page route
router.get('/db-error', (req, res) => {
  res.render('db-error', {
    title: 'Database Connection Error',
    user: null,
    success_msg: '',
    error_msg: '',
    error: '',
    errors: []
  });
});

// Test ads page route
router.get('/test-ads', (req, res) => {
  res.render('test-ads', {
    title: 'Ad Test Page',
    user: req.user || null,
    success_msg: '',
    error_msg: '',
    error: '',
    errors: []
  });
});

module.exports = router;
