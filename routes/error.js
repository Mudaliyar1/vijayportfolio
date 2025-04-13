/**
 * Error routes
 */
const express = require('express');
const router = express.Router();

// General error page
router.get('/', (req, res) => {
  const message = req.flash('error_msg')[0] || 'An error occurred';
  res.render('error', {
    title: 'Error',
    message,
    user: req.user
  });
});

module.exports = router;
