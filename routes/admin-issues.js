const express = require('express');
const router = express.Router();
const { ensureAdmin } = require('../middlewares/auth');
const adminMaintenanceAccess = require('../middleware/adminMaintenanceAccess');
const {
  getAdminIssues,
  updateIssueStatus,
  addReplyToIssue,
  getAdminIssueDetail,
  deleteIssue
} = require('../controllers/issueController');

// Apply admin middleware to all routes
router.use(ensureAdmin);
router.use(adminMaintenanceAccess);

// Issues dashboard
router.get('/', getAdminIssues);

// Issue detail page
router.get('/:id', getAdminIssueDetail);

// Update issue status
router.put('/:id/status', updateIssueStatus);

// Add reply to issue
router.post('/:id/reply', addReplyToIssue);

// Delete issue
router.post('/:id/delete', deleteIssue);

module.exports = router;
