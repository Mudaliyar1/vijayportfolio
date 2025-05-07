const Issue = require('../models/Issue');

module.exports = {
  // Render the issue reporting form
  getReportIssuePage: (req, res) => {
    res.render('issues/report-issue', {
      title: 'Report an Issue - FTRAISE AI',
      user: req.user
    });
  },

  // Submit a new issue
  submitIssue: async (req, res) => {
    try {
      const { title, category, description } = req.body;

      // Generate a unique token ID
      const tokenId = await Issue.generateTokenId();

      // Create the issue
      const issue = await Issue.create({
        tokenId,
        title,
        category,
        description,
        user: req.user._id
      });

      // Redirect to the thank you page with the token ID
      res.render('issues/thank-you', {
        title: 'Issue Submitted - FTRAISE AI',
        user: req.user,
        issue
      });
    } catch (err) {
      console.error('Error submitting issue:', err);
      req.flash('error_msg', 'There was an error submitting your issue. Please try again.');
      res.redirect('/report-issue');
    }
  },

  // Get all issues for the current user
  getMyIssues: async (req, res) => {
    try {
      // Get query parameters for filtering
      const { search, status, sort = 'createdAt', order = 'desc' } = req.query;

      // Build query
      let query = { user: req.user._id };

      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }

      // Search by token ID or title
      if (search) {
        query.$or = [
          { tokenId: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ];
      }

      // Determine sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions = {};
      sortOptions[sort] = sortOrder;

      // Get issues
      const issues = await Issue.find(query)
        .sort(sortOptions);

      res.render('issues/my-issues', {
        title: 'My Issues - FTRAISE AI',
        user: req.user,
        issues,
        filters: {
          status: status || 'all',
          search: search || '',
          sort,
          order
        }
      });
    } catch (err) {
      console.error('Error fetching issues:', err);
      req.flash('error_msg', 'Failed to load your issues');
      res.redirect('/');
    }
  },

  // Get a single issue by ID
  getIssueById: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the issue
      const issue = await Issue.findById(id)
        .populate('user', 'username email')
        .populate('adminReplies.admin', 'username');

      // Check if issue exists
      if (!issue) {
        req.flash('error_msg', 'Issue not found');
        return res.redirect('/my-issues');
      }

      // Check if the user is authorized to view this issue
      if (!req.user.isAdmin && !req.user.role === 'admin' && issue.user._id.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'You are not authorized to view this issue');
        return res.redirect('/my-issues');
      }

      res.render('issues/issue-detail', {
        title: `Issue ${issue.tokenId} - FTRAISE AI`,
        user: req.user,
        issue
      });
    } catch (err) {
      console.error('Error fetching issue:', err);
      req.flash('error_msg', 'Failed to load issue');
      res.redirect('/my-issues');
    }
  },

  // Admin: Get all issues
  getAdminIssues: async (req, res) => {
    try {
      // Get query parameters for filtering
      const { status, search, user, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

      // Build query
      let query = {};

      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }

      // Search by token ID, title, or user
      if (search) {
        query.$or = [
          { tokenId: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ];
      }

      // Count total issues matching the query
      const totalIssues = await Issue.countDocuments(query);

      // Calculate pagination
      const totalPages = Math.ceil(totalIssues / limit);
      const skip = (page - 1) * limit;

      // Determine sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions = {};
      sortOptions[sort] = sortOrder;

      // Get issues with pagination and sorting
      const issues = await Issue.find(query)
        .populate('user', 'username email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      // Get counts for each status for the sidebar
      const statusCounts = {
        all: await Issue.countDocuments({}),
        open: await Issue.countDocuments({ status: 'Open' }),
        inProgress: await Issue.countDocuments({ status: 'In Progress' }),
        resolved: await Issue.countDocuments({ status: 'Resolved' })
      };

      res.render('admin/issues', {
        title: 'Issue Management - Admin Dashboard',
        issues,
        statusCounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalIssues,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          status: status || 'all',
          search: search || '',
          sort,
          order
        },
        path: '/admin/issues',
        layout: 'layouts/admin'
      });
    } catch (err) {
      console.error('Error fetching issues for admin:', err);
      req.flash('error_msg', 'Failed to load issues');
      res.redirect('/admin');
    }
  },

  // Admin: Update issue status
  updateIssueStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Find the issue
      const issue = await Issue.findById(id);

      // Check if issue exists
      if (!issue) {
        return res.status(404).json({
          success: false,
          message: 'Issue not found'
        });
      }

      // Update status
      issue.status = status;
      await issue.save();

      res.json({
        success: true,
        message: 'Issue status updated successfully'
      });
    } catch (err) {
      console.error('Error updating issue status:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update issue status'
      });
    }
  },

  // Admin: Add reply to issue
  addReplyToIssue: async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      // Find the issue
      const issue = await Issue.findById(id);

      // Check if issue exists
      if (!issue) {
        req.flash('error_msg', 'Issue not found');
        return res.redirect('/admin/issues');
      }

      // Add reply
      issue.adminReplies.push({
        message,
        admin: req.user._id
      });

      // Update status to In Progress if it's currently Open
      if (issue.status === 'Open') {
        issue.status = 'In Progress';
      }

      await issue.save();

      req.flash('success_msg', 'Reply added successfully');
      res.redirect(`/admin/issues/${id}`);
    } catch (err) {
      console.error('Error adding reply to issue:', err);
      req.flash('error_msg', 'Failed to add reply');
      res.redirect('/admin/issues');
    }
  },

  // Delete issue (for both users and admins)
  deleteIssue: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the issue
      const issue = await Issue.findById(id);

      // Check if issue exists
      if (!issue) {
        req.flash('error_msg', 'Issue not found');
        return res.redirect(req.user.isAdmin ? '/admin/issues' : '/issues');
      }

      // Check if the user is authorized to delete this issue
      if (!req.user.isAdmin && !req.user.role === 'admin' && issue.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'You are not authorized to delete this issue');
        return res.redirect('/issues');
      }

      // Delete the issue
      await Issue.findByIdAndDelete(id);

      req.flash('success_msg', 'Issue deleted successfully');
      return res.redirect(req.user.isAdmin ? '/admin/issues' : '/issues');
    } catch (err) {
      console.error('Error deleting issue:', err);
      req.flash('error_msg', 'Failed to delete issue');
      return res.redirect(req.user.isAdmin ? '/admin/issues' : '/issues');
    }
  },

  // Admin: Get issue detail
  getAdminIssueDetail: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the issue
      const issue = await Issue.findById(id)
        .populate('user', 'username email')
        .populate('adminReplies.admin', 'username');

      // Check if issue exists
      if (!issue) {
        req.flash('error_msg', 'Issue not found');
        return res.redirect('/admin/issues');
      }

      res.render('admin/issue-detail', {
        title: `Issue ${issue.tokenId} - Admin Dashboard`,
        issue,
        path: '/admin/issues',
        layout: 'layouts/admin'
      });
    } catch (err) {
      console.error('Error fetching issue for admin:', err);
      req.flash('error_msg', 'Failed to load issue');
      res.redirect('/admin/issues');
    }
  }
};
