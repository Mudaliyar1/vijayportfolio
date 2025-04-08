/**
 * Session error routes
 */
const express = require('express');
const router = express.Router();

// Session error page
router.get('/', (req, res) => {
  res.render('session-error', {
    layout: false
  });
});

// Clear session and redirect to login
router.get('/clear', (req, res) => {
  // Destroy the session
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      // Clear the session cookie
      res.clearCookie('connect.sid');
      // Redirect to login
      res.redirect('/users/login');
    });
  } else {
    // No session to destroy
    res.redirect('/users/login');
  }
});

module.exports = router;
