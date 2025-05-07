const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { getPreciseLocationTracker } = require('../controllers/preciseLocationController');

// Precise location tracker page
router.get('/', ensureAuthenticated, ensureAdmin, getPreciseLocationTracker);

module.exports = router;
