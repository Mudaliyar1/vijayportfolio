const Review = require('../models/Review');
const User = require('../models/User');

module.exports = {
  // Get all reviews for display
  getReviews: async (req, res) => {
    try {
      const reviews = await Review.find({ isApproved: true, isDisplayed: true })
        .sort({ createdAt: -1 })
        .populate('userId', 'username profilePicture');

      res.render('reviews', {
        title: 'User Reviews - FTRAISE AI',
        reviews
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading reviews');
      res.redirect('/');
    }
  },

  // Get reviews for homepage (top 2)
  getTopReviews: async () => {
    try {
      return await Review.find({ isApproved: true, isDisplayed: true })
        .sort({ rating: -1, createdAt: -1 })
        .limit(2)
        .populate('userId', 'username profilePicture');
    } catch (err) {
      console.error('Error getting top reviews:', err);
      return [];
    }
  },

  // Submit a new review
  submitReview: async (req, res) => {
    try {
      const { rating, comment } = req.body;

      // Validate input
      if (!rating || !comment) {
        req.flash('error_msg', 'Please provide both a rating and comment');
        return res.redirect('/reviews');
      }

      // Check if user is authenticated or has a guest session
      if (!req.isAuthenticated() && !req.session.guestId) {
        req.flash('error_msg', 'You must be logged in or register to submit a review. Guest users cannot submit reviews.');
        return res.redirect('/reviews');
      }

      // Create review object
      const reviewData = {
        rating: parseInt(rating),
        comment
      };

      // Add user info if logged in
      if (req.isAuthenticated()) {
        reviewData.userId = req.user._id;
      } else if (req.session.guestId) {
        reviewData.guestId = req.session.guestId;
      }

      // Create and save the review
      const review = new Review(reviewData);
      await review.save();

      req.flash('success_msg', 'Thank you for your review!');
      res.redirect('/reviews');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while submitting your review');
      res.redirect('/reviews');
    }
  },

  // Admin: Get all reviews for management
  getReviewManagement: async (req, res) => {
    try {
      const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'username');

      res.render('admin/reviews', {
        title: 'Review Management - FTRAISE AI',
        reviews,
        path: '/admin/reviews',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while loading reviews');
      res.redirect('/admin');
    }
  },

  // Admin: Toggle review approval
  toggleReviewApproval: async (req, res) => {
    try {
      const reviewId = req.params.id;

      const review = await Review.findById(reviewId);
      if (!review) {
        req.flash('error_msg', 'Review not found');
        return res.redirect('/admin/reviews');
      }

      review.isApproved = !review.isApproved;
      await review.save();

      req.flash('success_msg', `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully`);
      res.redirect('/admin/reviews');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while updating the review');
      res.redirect('/admin/reviews');
    }
  },

  // Admin: Toggle review display
  toggleReviewDisplay: async (req, res) => {
    try {
      const reviewId = req.params.id;

      const review = await Review.findById(reviewId);
      if (!review) {
        req.flash('error_msg', 'Review not found');
        return res.redirect('/admin/reviews');
      }

      review.isDisplayed = !review.isDisplayed;
      await review.save();

      req.flash('success_msg', `Review ${review.isDisplayed ? 'displayed' : 'hidden'} successfully`);
      res.redirect('/admin/reviews');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while updating the review');
      res.redirect('/admin/reviews');
    }
  },

  // Admin: Delete review
  deleteReview: async (req, res) => {
    try {
      const reviewId = req.params.id;

      await Review.findByIdAndDelete(reviewId);

      req.flash('success_msg', 'Review deleted successfully');
      res.redirect('/admin/reviews');
    } catch (err) {
      console.error(err);
      req.flash('error_msg', 'An error occurred while deleting the review');
      res.redirect('/admin/reviews');
    }
  }
};
