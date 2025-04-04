const express = require('express');
const router = express.Router();
const { 
  getLogin, 
  postLogin, 
  getRegister, 
  postRegister, 
  logout,
  deleteAccount
} = require('../controllers/userController');
const { ensureAuthenticated, ensureGuest } = require('../middlewares/auth');

// Login page
router.get('/login', ensureGuest, getLogin);

// Login handle
router.post('/login', ensureGuest, postLogin);

// Register page
router.get('/register', ensureGuest, getRegister);

// Register handle
router.post('/register', ensureGuest, postRegister);

// Logout handle
router.get('/logout', ensureAuthenticated, logout);

// Delete account
router.delete('/delete', ensureAuthenticated, deleteAccount);

module.exports = router;
