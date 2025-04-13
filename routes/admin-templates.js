const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const templateController = require('../controllers/templateController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/templates');
  },
  filename: function(req, file, cb) {
    cb(null, `template-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'));
  }
});

// Admin Routes
router.get('/', isAuthenticated, isAdmin, templateController.getAdminTemplateDashboard);
router.get('/create', isAuthenticated, isAdmin, templateController.getCreateTemplate);
router.post('/create', isAuthenticated, isAdmin, upload.single('thumbnail'), templateController.createTemplate);
router.get('/:templateId/edit', isAuthenticated, isAdmin, templateController.getEditTemplate);
router.post('/:templateId/edit', isAuthenticated, isAdmin, upload.single('thumbnail'), templateController.updateTemplate);
router.post('/:templateId/delete', isAuthenticated, isAdmin, templateController.deleteTemplate);

// Template Pages Management
router.get('/:templateId/pages', isAuthenticated, isAdmin, templateController.getTemplatePages);
router.get('/:templateId/pages/create', isAuthenticated, isAdmin, templateController.getCreatePage);
router.post('/:templateId/pages/create', isAuthenticated, isAdmin, templateController.createPage);
router.get('/:templateId/pages/:pageId/edit', isAuthenticated, isAdmin, templateController.getEditPage);
router.post('/:templateId/pages/:pageId/edit', isAuthenticated, isAdmin, templateController.updatePage);
router.post('/:templateId/pages/:pageId/delete', isAuthenticated, isAdmin, templateController.deletePage);

module.exports = router;
