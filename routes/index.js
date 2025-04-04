const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage } = require('../controllers/indexController');

// Home page route
router.get('/', getHomePage);

// About page route
router.get('/about', getAboutPage);

module.exports = router;
