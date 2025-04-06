const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const websiteController = require('../controllers/websiteController');

// Website builder form
router.get('/create-website', isAuthenticated, websiteController.getWebsiteBuilderForm);

// Create website
router.post('/create-website', isAuthenticated, websiteController.createWebsite);

// User websites dashboard
router.get('/dashboard/websites', isAuthenticated, websiteController.getUserWebsites);

// Website details
router.get('/dashboard/websites/:id', isAuthenticated, websiteController.getWebsiteDetails);

// Edit website form
router.get('/dashboard/websites/:id/edit', isAuthenticated, websiteController.getEditWebsiteForm);

// Update website
router.post('/dashboard/websites/:id/edit', isAuthenticated, websiteController.updateWebsite);

// Publish website
router.post('/dashboard/websites/:id/publish', isAuthenticated, websiteController.publishWebsite);

// Edit page form
router.get('/dashboard/websites/:websiteId/pages/:pageId/edit', isAuthenticated, websiteController.getEditPageForm);

// Update page
router.post('/dashboard/websites/:websiteId/pages/:pageId/edit', isAuthenticated, websiteController.updatePage);

// Delete website
router.delete('/dashboard/websites/:id', isAuthenticated, websiteController.deleteWebsite);

// View public website
router.get('/user-site/:username/:websiteSlug', websiteController.viewPublicWebsite);
router.get('/user-site/:username/:websiteSlug/:pageSlug', websiteController.viewPublicWebsite);

module.exports = router;
