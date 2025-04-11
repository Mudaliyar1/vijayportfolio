const Template = require('../models/Template');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Public routes
  getMarketplace: async (req, res) => {
    try {
      // Get featured templates (approved and published)
      const featuredTemplates = await Template.find({
        isApproved: true,
        isPublished: true
      })
      .sort({ downloads: -1 })
      .limit(6);

      // Get free templates
      const freeTemplates = await Template.find({
        isApproved: true,
        isPublished: true,
        price: 0
      })
      .sort({ createdAt: -1 })
      .limit(6);

      // Get premium templates
      const premiumTemplates = await Template.find({
        isApproved: true,
        isPublished: true,
        price: { $gt: 0 }
      })
      .sort({ createdAt: -1 })
      .limit(6);

      // Get categories
      const categories = await Template.distinct('businessType');

      res.render('template-marketplace/index', {
        title: 'Template Marketplace - FTRAISE AI',
        user: req.user,
        featuredTemplates,
        freeTemplates,
        premiumTemplates,
        categories
      });
    } catch (err) {
      console.error('Error loading template marketplace:', err);
      req.flash('error_msg', 'Failed to load template marketplace');
      res.redirect('/dashboard');
    }
  },

  getTemplateDetails: async (req, res) => {
    try {
      const { id } = req.params;

      // Get template details
      const template = await Template.findById(id)
        .populate('creator', 'username email')
        .populate('reviews.user', 'username');

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/template-marketplace');
      }

      // Check if user has purchased this template
      let hasPurchased = false;
      if (req.user) {
        // In a real implementation, you would check the user's purchases
        // For now, we'll just check if it's free or created by the user
        hasPurchased = template.price === 0 ||
                      (template.creator && template.creator._id.toString() === req.user._id.toString());
      }

      // Get similar templates
      const similarTemplates = await Template.find({
        _id: { $ne: template._id },
        businessType: template.businessType,
        isApproved: true,
        isPublished: true
      })
      .limit(3);

      res.render('template-marketplace/template-details', {
        title: `${template.name} - Template Marketplace - FTRAISE AI`,
        user: req.user,
        template,
        similarTemplates,
        hasPurchased
      });
    } catch (err) {
      console.error('Error loading template details:', err);
      req.flash('error_msg', 'Failed to load template details');
      res.redirect('/template-marketplace');
    }
  },

  getTemplatesByCategory: async (req, res) => {
    try {
      const { category } = req.params;

      console.log('Category:', category);
      console.log('Views directory:', path.join(__dirname, '../views'));

      // Get templates by category
      const templates = await Template.find({
        businessType: category,
        isApproved: true,
        isPublished: true
      })
      .sort({ createdAt: -1 });

      console.log('Templates found:', templates.length);

      // Get all categories for the filter dropdown
      const categories = await Template.distinct('businessType');

      return res.render('template-marketplace/category', {
        title: `${category} Templates - FTRAISE AI`,
        user: req.user,
        templates,
        category,
        categories
      });
    } catch (err) {
      console.error('Error loading templates by category:', err);
      req.flash('error_msg', 'Failed to load templates');
      return res.redirect('/template-marketplace');
    }
  },

  searchTemplates: async (req, res) => {
    try {
      const { query, category, priceRange } = req.query;

      // Build search filter
      const filter = {
        isApproved: true,
        isPublished: true
      };

      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }

      if (category && category !== 'all') {
        filter.businessType = category;
      }

      if (priceRange) {
        if (priceRange === 'free') {
          filter.price = 0;
        } else if (priceRange === 'paid') {
          filter.price = { $gt: 0 };
        }
      }

      // Get templates matching the search criteria
      const templates = await Template.find(filter)
        .sort({ createdAt: -1 });

      // Get all categories for the filter dropdown
      const categories = await Template.distinct('businessType');

      res.render('template-marketplace/search-results', {
        title: 'Search Results - Template Marketplace - FTRAISE AI',
        user: req.user,
        templates,
        categories,
        searchQuery: query || '',
        selectedCategory: category || 'all',
        selectedPriceRange: priceRange || 'all'
      });
    } catch (err) {
      console.error('Error searching templates:', err);
      req.flash('error_msg', 'Failed to search templates');
      res.redirect('/template-marketplace');
    }
  },

  // Authenticated user routes
  getUserTemplates: async (req, res) => {
    try {
      // Get templates created by the user
      const templates = await Template.find({ creator: req.user._id })
        .sort({ createdAt: -1 });

      res.render('template-marketplace/my-templates', {
        title: 'My Templates - FTRAISE AI',
        user: req.user,
        templates
      });
    } catch (err) {
      console.error('Error loading user templates:', err);
      req.flash('error_msg', 'Failed to load your templates');
      res.redirect('/template-marketplace');
    }
  },

  getCreateTemplatePage: async (req, res) => {
    try {
      // Get categories for the dropdown
      const categories = await Template.distinct('businessType');

      res.render('template-marketplace/create-template', {
        title: 'Create Template - FTRAISE AI',
        user: req.user,
        categories
      });
    } catch (err) {
      console.error('Error loading create template page:', err);
      req.flash('error_msg', 'Failed to load create template page');
      res.redirect('/template-marketplace/my-templates');
    }
  },

  createTemplate: async (req, res) => {
    try {
      const {
        name,
        description,
        businessType,
        packageType,
        price,
        theme,
        colorScheme
      } = req.body;

      // Validate required fields
      if (!name || !description || !businessType || !packageType) {
        req.flash('error_msg', 'Please fill in all required fields');
        return res.redirect('/template-marketplace/create');
      }

      // Check if files were uploaded
      if (!req.files || !req.files.thumbnail || !req.files.htmlFile || !req.files.cssFile) {
        req.flash('error_msg', 'Please upload all required files (thumbnail, HTML, and CSS)');
        return res.redirect('/template-marketplace/create');
      }

      // Create new template
      const newTemplate = new Template({
        name,
        description,
        businessType,
        packageType,
        price: price || 0,
        theme: theme || 'default',
        colorScheme: colorScheme || 'blue',
        thumbnail: `/uploads/templates/${req.files.thumbnail[0].filename}`,
        creator: req.user._id,
        isApproved: false, // Requires admin approval
        isPublished: false // Not published until approved
      });

      // Add preview image if uploaded
      if (req.files.preview) {
        newTemplate.preview = `/uploads/templates/${req.files.preview[0].filename}`;
      }

      // Read HTML and CSS files
      const htmlContent = fs.readFileSync(req.files.htmlFile[0].path, 'utf8');
      const cssContent = fs.readFileSync(req.files.cssFile[0].path, 'utf8');

      // Create template pages
      newTemplate.pages = [{
        title: 'Home',
        slug: 'home',
        content: htmlContent,
        isHomepage: true,
        order: 0
      }];

      // Add JS file if uploaded
      let jsContent = '';
      if (req.files.jsFile) {
        jsContent = fs.readFileSync(req.files.jsFile[0].path, 'utf8');
      }

      // Save the template
      await newTemplate.save();

      req.flash('success_msg', 'Template submitted for approval');
      res.redirect('/template-marketplace/my-templates');
    } catch (err) {
      console.error('Error creating template:', err);
      req.flash('error_msg', 'Failed to create template');
      res.redirect('/template-marketplace/create');
    }
  },

  getEditTemplatePage: async (req, res) => {
    try {
      const { id } = req.params;

      // Get template details
      const template = await Template.findOne({ _id: id, creator: req.user._id });

      if (!template) {
        req.flash('error_msg', 'Template not found or you do not have permission to edit it');
        return res.redirect('/template-marketplace/my-templates');
      }

      // Get categories for the dropdown
      const categories = await Template.distinct('businessType');

      res.render('template-marketplace/edit-template', {
        title: `Edit ${template.name} - FTRAISE AI`,
        user: req.user,
        template,
        categories
      });
    } catch (err) {
      console.error('Error loading edit template page:', err);
      req.flash('error_msg', 'Failed to load edit template page');
      res.redirect('/template-marketplace/my-templates');
    }
  },

  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        businessType,
        packageType,
        price,
        theme,
        colorScheme
      } = req.body;

      // Find the template
      const template = await Template.findOne({ _id: id, creator: req.user._id });

      if (!template) {
        req.flash('error_msg', 'Template not found or you do not have permission to edit it');
        return res.redirect('/template-marketplace/my-templates');
      }

      // Update template fields
      template.name = name;
      template.description = description;
      template.businessType = businessType;
      template.packageType = packageType;
      template.price = price || 0;
      template.theme = theme || 'default';
      template.colorScheme = colorScheme || 'blue';
      template.updatedAt = Date.now();

      // Update thumbnail if uploaded
      if (req.files && req.files.thumbnail) {
        template.thumbnail = `/uploads/templates/${req.files.thumbnail[0].filename}`;
      }

      // Update preview if uploaded
      if (req.files && req.files.preview) {
        template.preview = `/uploads/templates/${req.files.preview[0].filename}`;
      }

      // Update HTML content if uploaded
      if (req.files && req.files.htmlFile) {
        const htmlContent = fs.readFileSync(req.files.htmlFile[0].path, 'utf8');

        // Find the homepage
        const homePage = template.pages.find(page => page.isHomepage);
        if (homePage) {
          homePage.content = htmlContent;
        } else {
          template.pages.push({
            title: 'Home',
            slug: 'home',
            content: htmlContent,
            isHomepage: true,
            order: 0
          });
        }
      }

      // Update CSS content if uploaded
      if (req.files && req.files.cssFile) {
        const cssContent = fs.readFileSync(req.files.cssFile[0].path, 'utf8');
        // In a real implementation, you would update the CSS file
      }

      // Update JS content if uploaded
      if (req.files && req.files.jsFile) {
        const jsContent = fs.readFileSync(req.files.jsFile[0].path, 'utf8');
        // In a real implementation, you would update the JS file
      }

      // Save the updated template
      await template.save();

      req.flash('success_msg', 'Template updated successfully');
      res.redirect('/template-marketplace/my-templates');
    } catch (err) {
      console.error('Error updating template:', err);
      req.flash('error_msg', 'Failed to update template');
      res.redirect(`/template-marketplace/edit/${req.params.id}`);
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the template
      const template = await Template.findOne({ _id: id, creator: req.user._id });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found or you do not have permission to delete it' });
      }

      // Delete the template
      await Template.deleteOne({ _id: id, creator: req.user._id });

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
      console.error('Error deleting template:', err);
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  },

  reviewTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        req.flash('error_msg', 'Please provide a valid rating (1-5)');
        return res.redirect(`/template-marketplace/template/${id}`);
      }

      // Find the template
      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/template-marketplace');
      }

      // Check if user has already reviewed this template
      const existingReviewIndex = template.reviews.findIndex(
        review => review.user && review.user.toString() === req.user._id.toString()
      );

      if (existingReviewIndex !== -1) {
        // Update existing review
        template.reviews[existingReviewIndex].rating = rating;
        template.reviews[existingReviewIndex].comment = comment;
      } else {
        // Add new review
        template.reviews.push({
          user: req.user._id,
          rating,
          comment
        });
      }

      // Update template rating (average of all reviews)
      const totalRating = template.reviews.reduce((sum, review) => sum + review.rating, 0);
      template.rating = totalRating / template.reviews.length;

      // Save the updated template
      await template.save();

      req.flash('success_msg', 'Review submitted successfully');
      res.redirect(`/template-marketplace/template/${id}`);
    } catch (err) {
      console.error('Error submitting review:', err);
      req.flash('error_msg', 'Failed to submit review');
      res.redirect(`/template-marketplace/template/${req.params.id}`);
    }
  },

  purchaseTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the template
      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/template-marketplace');
      }

      // Check if template is free
      if (template.price === 0) {
        // Increment downloads
        template.downloads += 1;
        await template.save();

        req.flash('success_msg', 'Template added to your collection');
        return res.redirect(`/template-marketplace/template/${id}`);
      }

      // For paid templates, in a real implementation, you would:
      // 1. Process payment
      // 2. Add template to user's purchased templates
      // 3. Increment downloads
      // For now, we'll just simulate this

      template.downloads += 1;
      await template.save();

      req.flash('success_msg', 'Template purchased successfully');
      res.redirect(`/template-marketplace/template/${id}`);
    } catch (err) {
      console.error('Error purchasing template:', err);
      req.flash('error_msg', 'Failed to purchase template');
      res.redirect(`/template-marketplace/template/${req.params.id}`);
    }
  },

  getPurchasedTemplates: async (req, res) => {
    try {
      // In a real implementation, you would get the user's purchased templates
      // For now, we'll just get all free templates and templates created by the user
      const templates = await Template.find({
        $or: [
          { price: 0, isApproved: true, isPublished: true },
          { creator: req.user._id }
        ]
      })
      .sort({ createdAt: -1 });

      res.render('template-marketplace/purchased-templates', {
        title: 'My Purchased Templates - FTRAISE AI',
        user: req.user,
        templates
      });
    } catch (err) {
      console.error('Error loading purchased templates:', err);
      req.flash('error_msg', 'Failed to load your purchased templates');
      res.redirect('/template-marketplace');
    }
  },

  // Admin routes
  getAdminDashboard: async (req, res) => {
    try {
      // Get template statistics
      const totalTemplates = await Template.countDocuments();
      const approvedTemplates = await Template.countDocuments({ isApproved: true });
      const pendingTemplates = await Template.countDocuments({ isApproved: false });
      const freeTemplates = await Template.countDocuments({ price: 0 });
      const paidTemplates = await Template.countDocuments({ price: { $gt: 0 } });

      // Get recent templates
      const recentTemplates = await Template.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('creator', 'username email');

      // Get top templates by downloads
      const topTemplates = await Template.find()
        .sort({ downloads: -1 })
        .limit(5)
        .populate('creator', 'username');

      res.render('admin/template-marketplace/dashboard', {
        title: 'Template Marketplace Admin - FTRAISE AI',
        user: req.user,
        totalTemplates,
        approvedTemplates,
        pendingTemplates,
        freeTemplates,
        paidTemplates,
        recentTemplates,
        topTemplates,
        path: '/admin/template-marketplace'
      });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      req.flash('error_msg', 'Failed to load admin dashboard');
      res.redirect('/admin');
    }
  },

  getPendingTemplates: async (req, res) => {
    try {
      // Get pending templates
      const pendingTemplates = await Template.find({ isApproved: false })
        .sort({ createdAt: -1 })
        .populate('creator', 'username email');

      res.render('admin/template-marketplace/pending-templates', {
        title: 'Pending Templates - FTRAISE AI',
        user: req.user,
        pendingTemplates,
        path: '/admin/template-marketplace/pending'
      });
    } catch (err) {
      console.error('Error loading pending templates:', err);
      req.flash('error_msg', 'Failed to load pending templates');
      res.redirect('/admin/template-marketplace');
    }
  },

  approveTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the template
      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/template-marketplace/pending');
      }

      // Approve the template
      template.isApproved = true;
      template.isPublished = true;
      await template.save();

      req.flash('success_msg', 'Template approved successfully');
      res.redirect('/admin/template-marketplace/pending');
    } catch (err) {
      console.error('Error approving template:', err);
      req.flash('error_msg', 'Failed to approve template');
      res.redirect('/admin/template-marketplace/pending');
    }
  },

  rejectTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Find the template
      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/template-marketplace/pending');
      }

      // In a real implementation, you would notify the creator about the rejection

      // Delete the template
      await Template.deleteOne({ _id: id });

      req.flash('success_msg', 'Template rejected successfully');
      res.redirect('/admin/template-marketplace/pending');
    } catch (err) {
      console.error('Error rejecting template:', err);
      req.flash('error_msg', 'Failed to reject template');
      res.redirect('/admin/template-marketplace/pending');
    }
  },

  getAnalytics: async (req, res) => {
    try {
      // Get daily template uploads for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyUploads = await Template.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);

      // Format for chart display
      const formattedDailyUploads = dailyUploads.map(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        return {
          date: date.toISOString().split('T')[0],
          count: stat.count
        };
      });

      // Get category distribution
      const categoryDistribution = await Template.aggregate([
        { $group: { _id: '$businessType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get package type distribution
      const packageDistribution = await Template.aggregate([
        { $group: { _id: '$packageType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Get price distribution
      const priceDistribution = await Template.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$price', 0] },
                'Free',
                {
                  $cond: [
                    { $lte: ['$price', 10] },
                    '$1-$10',
                    {
                      $cond: [
                        { $lte: ['$price', 20] },
                        '$11-$20',
                        '$20+'
                      ]
                    }
                  ]
                }
              ]
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.render('admin/template-marketplace/analytics', {
        title: 'Template Marketplace Analytics - FTRAISE AI',
        user: req.user,
        dailyUploads: formattedDailyUploads,
        categoryDistribution,
        packageDistribution,
        priceDistribution,
        path: '/admin/template-marketplace/analytics'
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
      req.flash('error_msg', 'Failed to load analytics');
      res.redirect('/admin/template-marketplace');
    }
  },

  getManageTemplates: async (req, res) => {
    try {
      // Get all templates
      const templates = await Template.find()
        .sort({ createdAt: -1 })
        .populate('creator', 'username email');

      // Get categories for the filter dropdown
      const categories = await Template.distinct('businessType');

      res.render('admin/template-marketplace/manage-templates', {
        title: 'Manage Website Templates - FTRAISE AI',
        user: req.user,
        templates,
        categories,
        path: '/admin/template-marketplace/templates'
      });
    } catch (err) {
      console.error('Error loading templates:', err);
      req.flash('error_msg', 'Failed to load templates');
      res.redirect('/admin/template-marketplace');
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the template
      const template = await Template.findById(id);

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      // Delete the template
      await Template.deleteOne({ _id: id });

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (err) {
      console.error('Error deleting template:', err);
      res.status(500).json({ success: false, message: 'Failed to delete template' });
    }
  }
};
