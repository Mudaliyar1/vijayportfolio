const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { getUsers } = require('../controllers/preciseLocationController');

// Get users for dropdown
router.get('/users', ensureAuthenticated, ensureAdmin, getUsers);

module.exports = router;
