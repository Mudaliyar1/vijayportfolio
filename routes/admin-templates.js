const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const templateController = require('../controllers/templateController');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/templates');
  },
  filename: (req, file, cb) => {
    cb(null, `template-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Admin template routes
router.get('/templates', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminGetAllTemplates);
router.get('/templates/create', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminGetCreateTemplateForm);
router.post('/templates/create', isAuthenticated, isAdmin, adminMaintenanceAccess, upload.single('thumbnail'), templateController.adminCreateTemplate);
router.get('/templates/:id/edit', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminGetEditTemplateForm);
router.post('/templates/:id/edit', isAuthenticated, isAdmin, adminMaintenanceAccess, upload.single('thumbnail'), templateController.adminUpdateTemplate);

// Template page management routes
router.get('/templates/:templateId/pages/add', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminGetAddTemplatePageForm);
router.post('/templates/:templateId/pages/add', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminAddTemplatePage);
router.get('/templates/:templateId/pages/:pageId/edit', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminGetEditTemplatePageForm);
router.post('/templates/:templateId/pages/:pageId/edit', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminUpdateTemplatePage);
router.post('/templates/:templateId/pages/:pageId/delete', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminDeleteTemplatePage);

// Template deletion route
router.post('/templates/:id/delete', isAuthenticated, isAdmin, adminMaintenanceAccess, templateController.adminDeleteTemplate);

module.exports = router;
