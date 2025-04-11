const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const templateMarketplaceController = require('../controllers/templateMarketplaceController');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/templates');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|zip|html|css|js/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Invalid file type!');
    }
  }
});

// Public routes
router.get('/', templateMarketplaceController.getMarketplace);
router.get('/template/:id', templateMarketplaceController.getTemplateDetails);
router.get('/categories/:category', templateMarketplaceController.getTemplatesByCategory);
router.get('/search', templateMarketplaceController.searchTemplates);

// Authenticated user routes
router.get('/my-templates', isAuthenticated, templateMarketplaceController.getUserTemplates);
router.get('/create', isAuthenticated, templateMarketplaceController.getCreateTemplatePage);
router.post('/create', isAuthenticated, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'preview', maxCount: 1 },
  { name: 'htmlFile', maxCount: 1 },
  { name: 'cssFile', maxCount: 1 },
  { name: 'jsFile', maxCount: 1 }
]), templateMarketplaceController.createTemplate);
router.get('/edit/:id', isAuthenticated, templateMarketplaceController.getEditTemplatePage);
router.post('/edit/:id', isAuthenticated, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'preview', maxCount: 1 },
  { name: 'htmlFile', maxCount: 1 },
  { name: 'cssFile', maxCount: 1 },
  { name: 'jsFile', maxCount: 1 }
]), templateMarketplaceController.updateTemplate);
router.delete('/delete/:id', isAuthenticated, templateMarketplaceController.deleteTemplate);
router.post('/review/:id', isAuthenticated, templateMarketplaceController.reviewTemplate);
router.post('/purchase/:id', isAuthenticated, templateMarketplaceController.purchaseTemplate);
router.get('/purchased', isAuthenticated, templateMarketplaceController.getPurchasedTemplates);

// Admin routes
router.get('/', isAuthenticated, isAdmin, templateMarketplaceController.getAdminDashboard);
router.get('/pending', isAuthenticated, isAdmin, templateMarketplaceController.getPendingTemplates);
router.post('/approve/:id', isAuthenticated, isAdmin, templateMarketplaceController.approveTemplate);
router.post('/reject/:id', isAuthenticated, isAdmin, templateMarketplaceController.rejectTemplate);
router.get('/analytics', isAuthenticated, isAdmin, templateMarketplaceController.getAnalytics);
router.get('/templates', isAuthenticated, isAdmin, templateMarketplaceController.getManageTemplates);
router.get('/templates/create', isAuthenticated, isAdmin, templateMarketplaceController.getCreateTemplatePage);
router.get('/templates/edit/:id', isAuthenticated, isAdmin, templateMarketplaceController.getEditTemplatePage);
router.post('/templates/create', isAuthenticated, isAdmin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'preview', maxCount: 1 }, { name: 'htmlFile', maxCount: 1 }, { name: 'cssFile', maxCount: 1 }, { name: 'jsFile', maxCount: 1 }]), templateMarketplaceController.createTemplate);
router.post('/templates/edit/:id', isAuthenticated, isAdmin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'preview', maxCount: 1 }, { name: 'htmlFile', maxCount: 1 }, { name: 'cssFile', maxCount: 1 }, { name: 'jsFile', maxCount: 1 }]), templateMarketplaceController.updateTemplate);
router.delete('/templates/delete/:id', isAuthenticated, isAdmin, templateMarketplaceController.deleteTemplate);

module.exports = router;
