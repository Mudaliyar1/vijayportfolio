const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const websiteController = require('../controllers/websiteController');

// Main dashboard route
router.get('/', isAuthenticated, websiteController.getUserWebsites);

// Dashboard route
router.get('/dashboard', isAuthenticated, websiteController.getUserWebsites);

// Unpublished websites route
router.get('/unpublished', isAuthenticated, websiteController.getUserWebsites);

// Create website form route
router.get('/create', isAuthenticated, websiteController.getWebsiteBuilderForm);
router.post('/create', isAuthenticated, websiteController.createWebsite);

// Website builder form (original route)
router.get('/create-website', isAuthenticated, websiteController.getWebsiteBuilderForm);

// Create website
router.post('/create-website', isAuthenticated, websiteController.createWebsite);

// User websites dashboard (original route)
router.get('/dashboard/websites', isAuthenticated, websiteController.getUserWebsites);

// Website details
router.get('/dashboard/websites/:id', isAuthenticated, websiteController.getWebsiteDetails);

// Edit website form
router.get('/dashboard/websites/:id/edit', isAuthenticated, websiteController.getEditWebsiteForm);

// Update website
router.post('/dashboard/websites/:id/edit', isAuthenticated, websiteController.updateWebsite);

// Publish website
router.post('/dashboard/websites/:id/publish', isAuthenticated, websiteController.publishWebsite);

// Preview website
router.get('/dashboard/websites/:id/preview', isAuthenticated, websiteController.previewWebsite);

// Edit page form
router.get('/dashboard/websites/:websiteId/pages/:pageId/edit', isAuthenticated, websiteController.getEditPageForm);

// Update page
router.post('/dashboard/websites/:websiteId/pages/:pageId/edit', isAuthenticated, websiteController.updatePage);

// Delete page
router.delete('/dashboard/websites/:websiteId/pages/:pageId', isAuthenticated, websiteController.deletePage);

// Add new page
router.get('/dashboard/websites/:websiteId/pages/add', isAuthenticated, websiteController.getAddPageForm);
router.post('/dashboard/websites/:websiteId/pages/add', isAuthenticated, websiteController.addPage);

// Delete website
router.delete('/dashboard/websites/:id', isAuthenticated, websiteController.deleteWebsite);

// View public website
router.get('/user-site/:username/:websiteSlug', websiteController.viewPublicWebsite);
router.get('/user-site/:username/:websiteSlug/:pageSlug', websiteController.viewPublicWebsite);

// Select package page
router.get('/dashboard/websites/:id/select-package', isAuthenticated, websiteController.getSelectPackagePage);

// Update website package
router.post('/dashboard/websites/:id/update-package', isAuthenticated, websiteController.updateWebsitePackage);

module.exports = router;
