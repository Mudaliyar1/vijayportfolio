const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const ensureAuthenticated = isAuthenticated; // For backward compatibility
const ensureGuest = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
};

// Login page
router.get('/login', ensureGuest, userController.getLogin);

// Login handle
router.post('/login', ensureGuest, userController.postLogin);

// Register page
router.get('/register', ensureGuest, userController.getRegister);

// Register handle
router.post('/register', ensureGuest, userController.postRegister);

// Logout handle
router.get('/logout', ensureAuthenticated, userController.logout);

// Delete account
router.delete('/delete', ensureAuthenticated, userController.deleteAccount);

// Social features removed as requested

module.exports = router;
