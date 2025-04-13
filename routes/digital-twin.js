const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const cohereApiCheck = require('../middleware/cohereApiCheck');
const digitalTwinController = require('../controllers/digitalTwinController');

// Apply Cohere API check middleware to routes that need it
// We'll apply it to specific routes instead of all routes

// Digital Twin Dashboard - Main page for managing digital twin
router.get('/dashboard', isAuthenticated, cohereApiCheck, digitalTwinController.dashboard);

// Digital Twin Setup - Create or edit digital twin
router.get('/setup', isAuthenticated, cohereApiCheck, digitalTwinController.setupPage);
router.post('/create', isAuthenticated, cohereApiCheck, digitalTwinController.create);
router.post('/update', isAuthenticated, cohereApiCheck, digitalTwinController.update);

// Digital Twin Training - Add training data to digital twin
router.get('/train', isAuthenticated, cohereApiCheck, digitalTwinController.trainingPage);
router.post('/train', isAuthenticated, cohereApiCheck, digitalTwinController.addTrainingData);
router.delete('/train/:trainingDataId', isAuthenticated, cohereApiCheck, digitalTwinController.removeTrainingData);

// Digital Twin Settings - Configure digital twin settings
router.get('/settings', isAuthenticated, cohereApiCheck, digitalTwinController.settingsPage);
router.post('/settings', isAuthenticated, cohereApiCheck, digitalTwinController.updateSettings);

// Digital Twin Deletion - Delete digital twin
router.delete('/delete', isAuthenticated, cohereApiCheck, digitalTwinController.delete);
router.post('/delete', isAuthenticated, cohereApiCheck, digitalTwinController.delete); // Alternative for form submission

// Cleanup old interactions - Admin only
router.get('/cleanup', isAuthenticated, isAdmin, digitalTwinController.cleanupOldInteractions);

// Browse all public digital twins
router.get('/browse', digitalTwinController.listPublicTwins);

// Digital Twin Public Interface - Public page for interacting with digital twin
router.get('/public/:username', cohereApiCheck, digitalTwinController.publicInterface);
router.post('/interact', cohereApiCheck, digitalTwinController.interact);

module.exports = router;
