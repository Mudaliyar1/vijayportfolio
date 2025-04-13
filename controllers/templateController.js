const WebsiteTemplate = require('../models/WebsiteTemplate');
const TemplatePage = require('../models/TemplatePage');
const Website = require('../models/Website');
const WebsitePage = require('../models/WebsitePage');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Admin: Get template management dashboard
  getAdminTemplateDashboard: async (req, res) => {
    try {
      // Get all templates
      const templates = await WebsiteTemplate.find().sort({ createdAt: -1 });

      // Count statistics
      const totalTemplates = templates.length;
      const activeTemplates = templates.filter(t => t.isActive).length;
      const paidTemplates = templates.filter(t => t.isPaid).length;
      const freeTemplates = templates.filter(t => !t.isPaid).length;

      // Get recent templates
      const recentTemplates = templates.slice(0, 10);

      // Get top templates (placeholder - would be based on usage in a real app)
      const topTemplates = templates.slice(0, 6);

      res.render('admin/templates/dashboard', {
        title: 'Template Management - Admin',
        templates,
        totalTemplates,
        activeTemplates,
        paidTemplates,
        freeTemplates,
        recentTemplates,
        topTemplates,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching template dashboard:', err);
      req.flash('error_msg', 'Failed to load template dashboard. Please try again later.');
      res.redirect('/admin');
    }
  },

  // Admin: Get template creation page
  getCreateTemplate: async (req, res) => {
    try {
      // Get all packages for selection
      const packages = await Package.find({ isActive: true }).sort({ name: 1 });

      res.render('admin/templates/create', {
        title: 'Create Template - Admin',
        packages,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading template creation page:', err);
      req.flash('error_msg', 'Failed to load template creation page. Please try again later.');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Create new template
  createTemplate: async (req, res) => {
    try {
      const { name, description, category, tags, isPaid, price, 'packages[]': selectedPackages } = req.body;

      // Handle thumbnail upload
      let thumbnail = '/images/templates/placeholder.jpg';
      if (req.file) {
        thumbnail = `/uploads/templates/${req.file.filename}`;
      }

      // Create new template
      const newTemplate = new WebsiteTemplate({
        name,
        description,
        thumbnail,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isPaid: isPaid === 'true',
        price: isPaid === 'true' ? parseFloat(price) : 0,
        createdBy: req.user._id
      });

      await newTemplate.save();

      // Create default home page for the template
      const homePage = new TemplatePage({
        templateId: newTemplate._id,
        title: 'Home',
        slug: 'home',
        isHomePage: true,
        htmlContent: '<div class="container mx-auto px-4 py-8"><h1>Welcome to your website</h1><p>This is your homepage content.</p></div>',
        cssContent: 'body { font-family: Arial, sans-serif; }',
        jsContent: '',
        order: 0
      });

      await homePage.save();

      // Associate template with selected packages
      if (selectedPackages) {
        // Handle both single value and array
        const packageIds = Array.isArray(selectedPackages) ? selectedPackages : [selectedPackages];

        // Update each package to include this template
        for (const packageId of packageIds) {
          await Package.findByIdAndUpdate(
            packageId,
            { $addToSet: { templates: newTemplate._id } }
          );
        }
      }

      req.flash('success_msg', 'Template created successfully. Now you can add more pages.');
      res.redirect(`/admin/templates/${newTemplate._id}/pages`);
    } catch (err) {
      console.error('Error creating template:', err);
      req.flash('error_msg', 'Failed to create template. Please try again.');
      res.redirect('/admin/templates/create');
    }
  },

  // Admin: Get template edit page
  getEditTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;

      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Get all packages with populated templates and defaultTemplate
      const packages = await Package.find({ isActive: true })
        .populate('templates')
        .populate('defaultTemplate')
        .sort({ name: 1 });

      res.render('admin/templates/edit', {
        title: `Edit Template: ${template.name} - Admin`,
        template,
        packages,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading template edit page:', err);
      req.flash('error_msg', 'Failed to load template edit page. Please try again later.');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Update template
  updateTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;
      const {
        name,
        description,
        category,
        tags,
        isPaid,
        price,
        isActive,
        'packages[]': selectedPackages,
        'defaultForPackages[]': defaultForPackages
      } = req.body;

      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Update template fields
      template.name = name;
      template.description = description;
      template.category = category;
      template.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
      template.isPaid = isPaid === 'true';
      template.price = isPaid === 'true' ? parseFloat(price) : 0;
      template.isActive = isActive === 'true';

      // Handle thumbnail upload
      if (req.file) {
        // Delete old thumbnail if it's not the default
        if (template.thumbnail !== '/images/templates/placeholder.jpg') {
          const oldThumbnailPath = path.join(__dirname, '..', 'public', template.thumbnail);
          if (fs.existsSync(oldThumbnailPath)) {
            fs.unlinkSync(oldThumbnailPath);
          }
        }

        template.thumbnail = `/uploads/templates/${req.file.filename}`;
      }

      await template.save();

      // Get all packages to update associations
      const allPackages = await Package.find();

      // Process package associations
      for (const pkg of allPackages) {
        // Check if this package should include this template
        const shouldIncludeTemplate = selectedPackages &&
          (Array.isArray(selectedPackages) ?
            selectedPackages.includes(pkg._id.toString()) :
            selectedPackages === pkg._id.toString());

        // Check if this template should be the default for this package
        const shouldBeDefault = defaultForPackages &&
          (Array.isArray(defaultForPackages) ?
            defaultForPackages.includes(pkg._id.toString()) :
            defaultForPackages === pkg._id.toString());

        // Update package templates array
        if (shouldIncludeTemplate) {
          // Add template to package if not already included
          if (!pkg.templates.some(t => t.equals(templateId))) {
            pkg.templates.push(templateId);
          }
        } else {
          // Remove template from package
          pkg.templates = pkg.templates.filter(t => !t.equals(templateId));
        }

        // Update default template
        if (shouldBeDefault) {
          pkg.defaultTemplate = templateId;
        } else if (pkg.defaultTemplate && pkg.defaultTemplate.equals(templateId)) {
          // If this was the default template but shouldn't be anymore
          pkg.defaultTemplate = null;
        }

        await pkg.save();
      }

      req.flash('success_msg', 'Template updated successfully.');
      res.redirect('/admin/templates');
    } catch (err) {
      console.error('Error updating template:', err);
      req.flash('error_msg', 'Failed to update template. Please try again.');
      res.redirect(`/admin/templates/${req.params.templateId}/edit`);
    }
  },

  // Admin: Delete template
  deleteTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;

      // Check if template exists
      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Check if template is being used by any websites
      const websitesUsingTemplate = await Website.countDocuments({ templateId });

      if (websitesUsingTemplate > 0) {
        req.flash('error_msg', 'Cannot delete template as it is being used by websites. Deactivate it instead.');
        return res.redirect('/admin/templates');
      }

      // Delete template pages
      await TemplatePage.deleteMany({ templateId });

      // Delete template thumbnail if it's not the default
      if (template.thumbnail !== '/images/templates/placeholder.jpg') {
        const thumbnailPath = path.join(__dirname, '..', 'public', template.thumbnail);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // Delete template
      await WebsiteTemplate.findByIdAndDelete(templateId);

      req.flash('success_msg', 'Template deleted successfully.');
      res.redirect('/admin/templates');
    } catch (err) {
      console.error('Error deleting template:', err);
      req.flash('error_msg', 'Failed to delete template. Please try again.');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Get template pages management
  getTemplatePages: async (req, res) => {
    try {
      const { templateId } = req.params;

      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      const pages = await TemplatePage.find({ templateId }).sort({ order: 1 });

      res.render('admin/templates/pages', {
        title: `Manage Pages: ${template.name} - Admin`,
        template,
        pages,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading template pages:', err);
      req.flash('error_msg', 'Failed to load template pages. Please try again later.');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Get page creation form
  getCreatePage: async (req, res) => {
    try {
      const { templateId } = req.params;

      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      res.render('admin/templates/create-page', {
        title: `Add Page to ${template.name} - Admin`,
        template,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading page creation form:', err);
      req.flash('error_msg', 'Failed to load page creation form. Please try again later.');
      res.redirect(`/admin/templates/${req.params.templateId}/pages`);
    }
  },

  // Admin: Create new page for template
  createPage: async (req, res) => {
    try {
      const { templateId } = req.params;
      const { title, slug, htmlContent, cssContent, jsContent, isHomePage } = req.body;

      // Check if template exists
      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Generate slug if not provided
      const pageSlug = slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Check if slug is already used in this template
      const existingPage = await TemplatePage.findOne({ templateId, slug: pageSlug });

      if (existingPage) {
        req.flash('error_msg', 'A page with this slug already exists in this template.');
        return res.redirect(`/admin/templates/${templateId}/pages/create`);
      }

      // Get page count for order
      const pagesCount = await TemplatePage.countDocuments({ templateId });

      // If setting as homepage, update existing homepage
      if (isHomePage === 'true') {
        await TemplatePage.updateMany({ templateId, isHomePage: true }, { isHomePage: false });
      }

      // Create new page
      const newPage = new TemplatePage({
        templateId,
        title,
        slug: pageSlug,
        isHomePage: isHomePage === 'true',
        htmlContent,
        cssContent,
        jsContent,
        order: pagesCount
      });

      await newPage.save();

      // Sync this new page to all websites using this template
      const { syncNewTemplatePageToWebsites } = require('../utils/templateSync');
      const updatedWebsites = await syncNewTemplatePageToWebsites(newPage);

      let successMessage = 'Page added to template successfully.';
      if (updatedWebsites > 0) {
        successMessage += ` The page was also added to ${updatedWebsites} website(s) using this template.`;
      }

      req.flash('success_msg', successMessage);
      res.redirect(`/admin/templates/${templateId}/pages`);
    } catch (err) {
      console.error('Error creating template page:', err);
      req.flash('error_msg', 'Failed to create page. Please try again.');
      res.redirect(`/admin/templates/${req.params.templateId}/pages/create`);
    }
  },

  // Admin: Get page edit form
  getEditPage: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;

      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      const page = await TemplatePage.findById(pageId);

      if (!page || page.templateId.toString() !== templateId) {
        req.flash('error_msg', 'Page not found.');
        return res.redirect(`/admin/templates/${templateId}/pages`);
      }

      res.render('admin/templates/edit-page', {
        title: `Edit Page: ${page.title} - Admin`,
        template,
        page,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading page edit form:', err);
      req.flash('error_msg', 'Failed to load page edit form. Please try again later.');
      res.redirect(`/admin/templates/${req.params.templateId}/pages`);
    }
  },

  // Admin: Update template page
  updatePage: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;
      const { title, slug, htmlContent, cssContent, jsContent, isHomePage } = req.body;

      // Check if template exists
      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Check if page exists
      const page = await TemplatePage.findById(pageId);

      if (!page || page.templateId.toString() !== templateId) {
        req.flash('error_msg', 'Page not found.');
        return res.redirect(`/admin/templates/${templateId}/pages`);
      }

      // Check if slug is already used by another page in this template
      if (slug !== page.slug) {
        const existingPage = await TemplatePage.findOne({
          templateId,
          slug,
          _id: { $ne: pageId }
        });

        if (existingPage) {
          req.flash('error_msg', 'A page with this slug already exists in this template.');
          return res.redirect(`/admin/templates/${templateId}/pages/${pageId}/edit`);
        }
      }

      // If setting as homepage, update existing homepage
      if (isHomePage === 'true' && !page.isHomePage) {
        await TemplatePage.updateMany({ templateId, isHomePage: true }, { isHomePage: false });
      }

      // Update page
      page.title = title;
      page.slug = slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      page.isHomePage = isHomePage === 'true';
      page.htmlContent = htmlContent;
      page.cssContent = cssContent;
      page.jsContent = jsContent;

      await page.save();

      req.flash('success_msg', 'Page updated successfully.');
      res.redirect(`/admin/templates/${templateId}/pages`);
    } catch (err) {
      console.error('Error updating template page:', err);
      req.flash('error_msg', 'Failed to update page. Please try again.');
      res.redirect(`/admin/templates/${req.params.templateId}/pages/${req.params.pageId}/edit`);
    }
  },

  // Admin: Delete template page
  deletePage: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;

      // Check if template exists
      const template = await WebsiteTemplate.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found.');
        return res.redirect('/admin/templates');
      }

      // Check if page exists
      const page = await TemplatePage.findById(pageId);

      if (!page || page.templateId.toString() !== templateId) {
        req.flash('error_msg', 'Page not found.');
        return res.redirect(`/admin/templates/${templateId}/pages`);
      }

      // Check if it's the only page or a homepage
      const pagesCount = await TemplatePage.countDocuments({ templateId });

      if (pagesCount <= 1) {
        req.flash('error_msg', 'Cannot delete the only page in a template.');
        return res.redirect(`/admin/templates/${templateId}/pages`);
      }

      if (page.isHomePage) {
        req.flash('error_msg', 'Cannot delete the homepage. Set another page as homepage first.');
        return res.redirect(`/admin/templates/${templateId}/pages`);
      }

      // Delete page
      await TemplatePage.findByIdAndDelete(pageId);

      // Reorder remaining pages
      const remainingPages = await TemplatePage.find({ templateId }).sort({ order: 1 });

      for (let i = 0; i < remainingPages.length; i++) {
        remainingPages[i].order = i;
        await remainingPages[i].save();
      }

      req.flash('success_msg', 'Page deleted successfully.');
      res.redirect(`/admin/templates/${templateId}/pages`);
    } catch (err) {
      console.error('Error deleting template page:', err);
      req.flash('error_msg', 'Failed to delete page. Please try again.');
      res.redirect(`/admin/templates/${req.params.templateId}/pages`);
    }
  },

  // User: Get template selection page
  getTemplateSelection: async (req, res) => {
    try {
      // Get active templates
      const templates = await WebsiteTemplate.find({ isActive: true }).sort({ createdAt: -1 });

      // Separate free and paid templates
      const freeTemplates = templates.filter(t => !t.isPaid);
      const paidTemplates = templates.filter(t => t.isPaid);

      res.render('website-builder/template-selection', {
        title: 'Select a Template - FTRAISE AI',
        freeTemplates,
        paidTemplates,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading template selection page:', err);
      req.flash('error_msg', 'Failed to load templates. Please try again later.');
      res.redirect('/website-builder/dashboard');
    }
  },

  // User: Preview template
  previewTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;

      // Get template
      const template = await WebsiteTemplate.findById(templateId);

      if (!template || !template.isActive) {
        req.flash('error_msg', 'Template not found or inactive.');
        return res.redirect('/website-builder/templates');
      }

      // Get template pages
      const pages = await TemplatePage.find({ templateId }).sort({ order: 1 });

      if (pages.length === 0) {
        req.flash('error_msg', 'This template has no pages.');
        return res.redirect('/website-builder/templates');
      }

      // Get current page (from query or default to homepage)
      let currentPage;
      if (req.query.page) {
        currentPage = await TemplatePage.findById(req.query.page);
        // Verify the page belongs to this template
        if (!currentPage || currentPage.templateId.toString() !== templateId) {
          currentPage = null;
        }
      }

      // If no valid page was found, use homepage or first page
      if (!currentPage) {
        currentPage = pages.find(p => p.isHomePage) || pages[0];
      }

      res.render('website-builder/template-preview', {
        title: `Preview: ${template.name} - ${currentPage.title} - FTRAISE AI`,
        template,
        pages,
        currentPage,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user,
        layout: false
      });
    } catch (err) {
      console.error('Error previewing template:', err);
      req.flash('error_msg', 'Failed to preview template. Please try again later.');
      res.redirect('/website-builder/templates');
    }
  },

  // User: Select template and create website
  selectTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;
      const { name, description } = req.body;

      // Get template
      const template = await WebsiteTemplate.findById(templateId);

      if (!template || !template.isActive) {
        req.flash('error_msg', 'Template not found or inactive.');
        return res.redirect('/website-builder/templates');
      }

      // Find a package that includes this template
      let packageId = null;

      // First, try to find a package where this template is the default
      const defaultPackage = await Package.findOne({
        defaultTemplate: templateId,
        isActive: true
      });

      if (defaultPackage) {
        packageId = defaultPackage._id;
      } else {
        // If no default package, find any package that includes this template
        const anyPackage = await Package.findOne({
          templates: templateId,
          isActive: true
        });

        if (anyPackage) {
          packageId = anyPackage._id;
        } else {
          // If no package includes this template, use the first free package
          const freePackage = await Package.findOne({
            isFree: true,
            isActive: true
          });

          if (freePackage) {
            packageId = freePackage._id;
          } else {
            // If no free package, use the first active package
            const anyActivePackage = await Package.findOne({ isActive: true });

            if (!anyActivePackage) {
              req.flash('error_msg', 'No active package found. Please contact support.');
              return res.redirect('/website-builder/templates');
            }

            packageId = anyActivePackage._id;
          }
        }
      }

      // Generate a unique domain based on username and website name
      const domain = `${req.user.username.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      // Generate a slug from the domain
      const slug = domain;

      // Create new website
      const newWebsite = new Website({
        userId: req.user._id,
        packageId: packageId,
        templateId: template._id,
        name,
        description,
        domain,
        slug,
        isPaid: !template.isPaid, // Free templates are automatically marked as paid
        status: 'draft'
      });

      await newWebsite.save();

      // Get template pages
      const templatePages = await TemplatePage.find({ templateId }).sort({ order: 1 });

      // Create website pages from template pages
      for (const templatePage of templatePages) {
        const newPage = new WebsitePage({
          websiteId: newWebsite._id,
          title: templatePage.title,
          slug: templatePage.slug,
          isHomePage: templatePage.isHomePage,
          content: '',
          htmlContent: templatePage.htmlContent,
          cssContent: templatePage.cssContent,
          jsContent: templatePage.jsContent,
          order: templatePage.order
        });

        await newPage.save();
      }

      if (template.isPaid) {
        // Redirect to payment page for paid templates
        req.flash('success_msg', 'Website created from template. Please complete payment to publish it.');
        res.redirect(`/website-builder/payment/${newWebsite._id}`);
      } else {
        // Redirect to dashboard for free templates
        req.flash('success_msg', 'Website created from template successfully. You can now publish it.');
        res.redirect('/website-builder/dashboard');
      }
    } catch (err) {
      console.error('Error creating website from template:', err);
      req.flash('error_msg', 'Failed to create website from template. Please try again.');
      res.redirect('/website-builder/templates');
    }
  }
};
