const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/search', blogController.searchBlogs);
router.get('/:id', blogController.getBlogById);

// User routes (require authentication)
router.get('/create/new', isAuthenticated, blogController.getCreateBlogForm);
router.post('/create', isAuthenticated, blogController.createBlog);
router.get('/edit/:id', isAuthenticated, blogController.getEditBlogForm);
router.post('/edit/:id', isAuthenticated, blogController.updateBlog);
router.delete('/:id/delete', isAuthenticated, blogController.deleteBlog);
router.post('/:id/delete', isAuthenticated, blogController.deleteBlog); // Add POST method for compatibility
router.post('/:id/like', isAuthenticated, blogController.likeBlog);
router.post('/:id/comment', isAuthenticated, blogController.addComment);

// Admin routes
router.get('/admin/manage', isAdmin, blogController.adminGetAllBlogs);

module.exports = router;
