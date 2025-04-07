/**
 * Route to clear all flash messages
 */
const express = require('express');
const router = express.Router();

// Clear all flash messages
router.get('/', (req, res) => {
  // Clear all flash messages
  req.flash('success_msg', '');
  req.flash('error_msg', '');
  req.flash('warning_msg', '');
  req.flash('error', '');
  req.flash('errors', []);

  // Redirect back to the previous page or home
  const referer = req.headers.referer || '/';
  res.redirect(referer);
});

module.exports = router;
