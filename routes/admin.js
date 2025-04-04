const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const { 
  getDashboard, 
  getUserManagement, 
  getChatManagement,
  getGuestManagement,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  viewChat,
  deleteChat,
  deleteGuest
} = require('../controllers/adminController');

// Apply admin middleware to all routes
router.use(ensureAdmin);

// Dashboard
router.get('/', getDashboard);

// User management
router.get('/users', getUserManagement);
router.post('/users', createUser);
router.put('/users', updateUser);
router.put('/users/reset-password', resetPassword);
router.delete('/users/:id', deleteUser);

// Chat management
router.get('/chats', getChatManagement);
router.get('/chats/:id', viewChat);
router.delete('/chats/:id', deleteChat);

// Guest management
router.get('/guests', getGuestManagement);
router.delete('/guests/:id', deleteGuest);

module.exports = router;
