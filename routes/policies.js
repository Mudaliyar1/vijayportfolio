const express = require('express');
const router = express.Router();

// Terms and Conditions
router.get('/terms', (req, res) => {
  res.render('policies/terms', {
    title: 'Terms and Conditions - FTRAISE AI',
    user: req.user
  });
});

// Cancellation and Refund Policy
router.get('/refund', (req, res) => {
  res.render('policies/refund', {
    title: 'Cancellation and Refund Policy - FTRAISE AI',
    user: req.user
  });
});

// Shipping Policy
router.get('/shipping', (req, res) => {
  res.render('policies/shipping', {
    title: 'Shipping Policy - FTRAISE AI',
    user: req.user
  });
});

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.render('policies/privacy', {
    title: 'Privacy Policy - FTRAISE AI',
    user: req.user
  });
});

// Cookie Policy
router.get('/cookies', (req, res) => {
  res.render('policies/cookies', {
    title: 'Cookie Policy - FTRAISE AI',
    user: req.user
  });
});

// Contact Us
router.get('/contact', (req, res) => {
  res.render('policies/contact', {
    title: 'Contact Us - FTRAISE AI',
    user: req.user
  });
});

// Contact form submission handler
router.post('/contact/submit', (req, res) => {
  // Here you would typically process the contact form submission
  // For now, we'll just redirect back with a success message
  req.flash('success_msg', 'Your message has been sent. We will get back to you soon!');
  res.redirect('/policies/contact');
});

module.exports = router;
