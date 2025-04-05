const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getDemoPage, getAnalyticsPage } = require('../controllers/indexController');

// Home page route
router.get('/', getHomePage);

// About page route
router.get('/about', getAboutPage);

// Demo page route
router.get('/demo', getDemoPage);

// Analytics page route
router.get('/analytics', getAnalyticsPage);

module.exports = router;
