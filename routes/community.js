const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', communityController.getAllPosts);
router.get('/search', communityController.searchPosts);
router.get('/post/:id', communityController.getPostById);

// User routes (require authentication)
router.get('/create/new', isAuthenticated, communityController.getCreatePostForm);
router.post('/create', isAuthenticated, communityController.createPost);
router.get('/edit/:id', isAuthenticated, communityController.getEditPostForm);
router.post('/edit/:id', isAuthenticated, communityController.updatePost);
router.delete('/post/:id/delete', isAuthenticated, communityController.deletePost);
router.post('/post/:id/delete', isAuthenticated, communityController.deletePost); // Add POST method for compatibility
router.post('/post/:id/like', isAuthenticated, communityController.likePost);
router.post('/post/:id/comment', isAuthenticated, communityController.addComment);
router.post('/post/:id/comment/:commentId/like', isAuthenticated, communityController.likeComment);
router.post('/post/:id/status', isAdmin, communityController.updatePostStatus);

// Admin routes
router.get('/admin/manage', isAdmin, communityController.adminGetAllPosts);

module.exports = router;
