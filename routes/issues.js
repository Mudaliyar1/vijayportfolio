const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const {
  getReportIssuePage,
  submitIssue,
  getMyIssues,
  getIssueById,
  deleteIssue
} = require('../controllers/issueController');

// Apply authentication middleware to all routes
router.use(ensureAuthenticated);

// Report issue page
router.get('/report', getReportIssuePage);

// Submit issue
router.post('/submit', submitIssue);

// My issues page
router.get('/', getMyIssues);

// Issue detail page
router.get('/:id', getIssueById);

// Delete issue
router.post('/:id/delete', deleteIssue);

module.exports = router;
