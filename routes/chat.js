const express = require('express');
const router = express.Router();
const {
  chatPage,
  sendMessage,
  getChatHistory,
  getChat,
  deleteChat
} = require('../controllers/chatController');
const { userRateLimiter, guestRateLimiter } = require('../middlewares/rateLimiter');

// Chat page
router.get('/', chatPage);

// Process message
router.post('/process', userRateLimiter, guestRateLimiter, sendMessage);

// Get chat history
router.get('/history', getChatHistory);

// Get specific chat
router.get('/:id', getChat);

// Delete chat
router.delete('/:id', deleteChat);

module.exports = router;
