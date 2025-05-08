const express = require('express');
const router = express.Router();
const techAdsController = require('../controllers/techAdsController');

// Tech ads showcase page
router.get('/', techAdsController.getTechAdsShowcase);

// API: Get random new ads
router.get('/api/random', techAdsController.getRandomNewAds);

module.exports = router;
