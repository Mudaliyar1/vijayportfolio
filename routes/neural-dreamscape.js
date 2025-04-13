const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const cohereApiCheck = require('../middleware/cohereApiCheck');
const neuralDreamscapeController = require('../controllers/neuralDreamscapeController');

// Apply Cohere API check middleware to routes that need it
// We'll apply it to specific routes instead of all routes

// Dashboard - Main page for managing dreamscapes
router.get('/dashboard', isAuthenticated, neuralDreamscapeController.dashboard);

// Create dreamscape
router.get('/create', isAuthenticated, cohereApiCheck, neuralDreamscapeController.createPage);
router.post('/create', isAuthenticated, cohereApiCheck, neuralDreamscapeController.create);

// Edit dreamscape
router.get('/edit/:id', isAuthenticated, cohereApiCheck, neuralDreamscapeController.editPage);
router.post('/update/:id', isAuthenticated, cohereApiCheck, neuralDreamscapeController.update);

// View dreamscape
router.get('/view/:id', neuralDreamscapeController.view);

// Browse dreamscapes
router.get('/browse', neuralDreamscapeController.browse);

// Network visualization
router.get('/network', neuralDreamscapeController.network);

// Connections
router.post('/connection', isAuthenticated, neuralDreamscapeController.createConnection);
router.get('/suggested-connections/:id', isAuthenticated, cohereApiCheck, neuralDreamscapeController.getSuggestedConnections);

// Delete dreamscape
router.delete('/delete/:id', isAuthenticated, neuralDreamscapeController.delete);
router.post('/delete/:id', isAuthenticated, neuralDreamscapeController.delete); // Alternative for form submission

module.exports = router;
