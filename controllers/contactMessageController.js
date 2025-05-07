const ContactMessage = require('../models/ContactMessage');

module.exports = {
  // Get all contact messages for admin dashboard
  getContactMessages: async (req, res) => {
    try {
      // Get query parameters for filtering
      const { status, search, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
      
      // Build query
      let query = {};
      
      // Filter by status if provided
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // Search by name, email, or subject
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Count total messages matching the query
      const totalMessages = await ContactMessage.countDocuments(query);
      
      // Calculate pagination
      const totalPages = Math.ceil(totalMessages / limit);
      const skip = (page - 1) * limit;
      
      // Determine sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortOptions = {};
      sortOptions[sort] = sortOrder;
      
      // Get messages with pagination and sorting
      const messages = await ContactMessage.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get counts for each status for the sidebar
      const statusCounts = {
        all: await ContactMessage.countDocuments({}),
        new: await ContactMessage.countDocuments({ status: 'new' }),
        read: await ContactMessage.countDocuments({ status: 'read' }),
        replied: await ContactMessage.countDocuments({ status: 'replied' }),
        archived: await ContactMessage.countDocuments({ status: 'archived' })
      };
      
      res.render('admin/contact-messages', {
        title: 'Contact Messages - Admin Dashboard',
        messages,
        statusCounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          totalMessages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          status: status || 'all',
          search: search || '',
          sort,
          order
        },
        path: '/admin/contact-messages',
        layout: 'layouts/admin'
      });
    } catch (err) {
      console.error('Error fetching contact messages:', err);
      req.flash('error_msg', 'Failed to load contact messages');
      res.redirect('/admin');
    }
  },
  
  // View a single contact message
  viewContactMessage: async (req, res) => {
    try {
      const message = await ContactMessage.findById(req.params.id);
      
      if (!message) {
        req.flash('error_msg', 'Message not found');
        return res.redirect('/admin/contact-messages');
      }
      
      // If the message is new, mark it as read
      if (message.status === 'new') {
        message.status = 'read';
        await message.save();
      }
      
      res.render('admin/contact-message-detail', {
        title: 'View Message - Admin Dashboard',
        message,
        path: '/admin/contact-messages',
        layout: 'layouts/admin'
      });
    } catch (err) {
      console.error('Error fetching contact message:', err);
      req.flash('error_msg', 'Failed to load message');
      res.redirect('/admin/contact-messages');
    }
  },
  
  // Update message status
  updateMessageStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const message = await ContactMessage.findById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }
      
      message.status = status;
      await message.save();
      
      res.json({
        success: true,
        message: 'Message status updated successfully'
      });
    } catch (err) {
      console.error('Error updating message status:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update message status'
      });
    }
  },
  
  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;
      
      const message = await ContactMessage.findById(id);
      
      if (!message) {
        req.flash('error_msg', 'Message not found');
        return res.redirect('/admin/contact-messages');
      }
      
      await ContactMessage.findByIdAndDelete(id);
      
      req.flash('success_msg', 'Message deleted successfully');
      res.redirect('/admin/contact-messages');
    } catch (err) {
      console.error('Error deleting message:', err);
      req.flash('error_msg', 'Failed to delete message');
      res.redirect('/admin/contact-messages');
    }
  }
};
