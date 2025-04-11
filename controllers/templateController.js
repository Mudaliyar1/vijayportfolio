const Template = require('../models/Template');
const Website = require('../models/Website');
const User = require('../models/User');
const Package = require('../models/Package');

module.exports = {
  // Get all templates
  getAllTemplates: async (req, res) => {
    try {
      // Get user data to filter templates by package
      const user = req.user ? await User.findById(req.user._id).populate('activePackage') : null;
      const userPackage = user?.activePackage?.name || 'Free';

      // Get all available packages for reference
      const allPackages = await Package.find({ active: true }).sort({ price: 1 });

      // Create a hierarchy of packages to determine which templates to show
      const packageHierarchy = {};
      let packageRank = 0;

      // Add packages to hierarchy with their rank
      allPackages.forEach(pkg => {
        packageHierarchy[pkg.name] = packageRank++;
      });

      // Add 'All' with highest rank
      packageHierarchy['All'] = packageRank;

      // Get the user's package rank
      const userPackageRank = packageHierarchy[userPackage] || 0;

      // Get templates based on user's package rank
      // Show templates that are for the user's package or lower packages
      let templates = await Template.find({ active: true });

      // Filter templates based on exact package match or 'All'
      templates = templates.filter(template => {
        // If template is for 'All' packages, show it to everyone
        if (template.packageType === 'All') return true;

        // Otherwise, only show if the user has exactly the package specified for the template
        return userPackage === template.packageType;
      });

      // Group templates by business type
      const templatesByType = {};
      templates.forEach(template => {
        if (!templatesByType[template.businessType]) {
          templatesByType[template.businessType] = [];
        }
        templatesByType[template.businessType].push(template);
      });

      res.render('templates/index', {
        title: 'Website Templates - FTRAISE AI',
        templatesByType,
        userPackage,
        packageHierarchy, // Pass the hierarchy to the view for reference
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
      req.flash('error_msg', 'Failed to load templates');
      res.redirect('/dashboard');
    }
  },

  // Get template details
  getTemplateDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/templates');
      }

      // Get user's package to check if they can use this template
      const user = req.user ? await User.findById(req.user._id).populate('activePackage') : null;
      const userPackage = user?.activePackage?.name || 'Free';

      // Get all available packages for reference
      const allPackages = await Package.find({ active: true }).sort({ price: 1 });

      // Create a hierarchy of packages to determine which templates to show
      const packageHierarchy = {};
      let packageRank = 0;

      // Add packages to hierarchy with their rank
      allPackages.forEach(pkg => {
        packageHierarchy[pkg.name] = packageRank++;
      });

      // Add 'All' with highest rank
      packageHierarchy['All'] = packageRank;

      // Get the user's package rank
      const userPackageRank = packageHierarchy[userPackage] || 0;

      // Get the template's package rank
      const templatePackageRank = packageHierarchy[template.packageType];

      // Check if user can use this template
      // Only allow if template is for 'All' packages or if user has exactly the package specified
      const canUseTemplate = template.packageType === 'All' || userPackage === template.packageType;

      // Get all packages for upgrade option
      const packages = await Package.find({ active: true }).sort({ price: 1 });

      res.render('templates/details', {
        title: `${template.name} - FTRAISE AI`,
        template,
        canUseTemplate,
        userPackage,
        packageHierarchy,
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching template details:', err);
      req.flash('error_msg', 'Failed to load template details');
      res.redirect('/templates');
    }
  },

  // Use template to create website
  useTemplate: async (req, res) => {
    try {
      const { templateId } = req.params;
      const { title, description, packageId } = req.body;

      // Validate input
      if (!title || !description) {
        req.flash('error_msg', 'Please provide a title and description for your website');
        return res.redirect(`/templates/${templateId}`);
      }

      // Get template
      const template = await Template.findById(templateId);
      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/templates');
      }

      // Get user
      const user = await User.findById(req.user._id).populate('activePackage');

      // Determine which package to use
      let selectedPackage;
      let needsPayment = false;

      if (packageId) {
        selectedPackage = await Package.findById(packageId);
        // Check if this is a paid package
        if (selectedPackage.price > 0) {
          // Always require payment for paid packages
          needsPayment = true;
          console.log('Paid package selected - payment will be required');
        }
      } else if (user.activePackage) {
        selectedPackage = user.activePackage;
        // Check if this is a paid package
        if (selectedPackage.price > 0) {
          // Always require payment for paid packages
          needsPayment = true;
          console.log('Paid package selected - payment will be required');
        }
      } else {
        // Default to free package if no package is selected or active
        selectedPackage = await Package.findOne({ name: 'Free' });
      }

      // Check if the selected package exactly matches the template's required package
      if (template.packageType !== 'All' && template.packageType !== selectedPackage.name) {
        req.flash('error_msg', `This template is only available for the ${template.packageType} package`);
        return res.redirect(`/templates/${templateId}`);
      }

      // Check if the selected package has enough pages for this template
      if (template.pageCount > selectedPackage.maxPages) {
        req.flash('error_msg', `This template requires a package with at least ${template.pageCount} pages`);
        return res.redirect(`/templates/${templateId}`);
      }

      // Generate slug from title
      const slug = `${user.username}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      // Check if slug already exists
      const existingWebsite = await Website.findOne({ slug });
      if (existingWebsite) {
        req.flash('error_msg', 'A website with a similar title already exists. Please choose a different title.');
        return res.redirect(`/templates/${templateId}`);
      }

      // Create new website from template
      const newWebsite = new Website({
        title,
        description,
        businessType: template.businessType,
        theme: template.theme,
        colorScheme: template.colorScheme,
        isResponsive: template.isResponsive, // Copy responsive design setting from template
        pages: template.pages.map(page => ({
          title: page.title,
          slug: page.slug,
          content: page.content,
          isHomepage: page.isHomepage,
          order: page.order
        })),
        user: user._id,
        package: selectedPackage._id,
        slug,
        isPublished: selectedPackage.isFree === true // Only publish immediately if it's a free package
      });

      console.log('Creating website with package:', selectedPackage.name, 'isFree:', selectedPackage.isFree, 'needsPayment:', needsPayment, 'isPublished:', newWebsite.isPublished);

      await newWebsite.save();

      // Update user website count
      user.websiteCount += 1;
      await user.save();

      // Always redirect to the edit page first, regardless of package type
      // This allows users to edit their website before deciding to publish
      req.flash('success_msg', 'Website created successfully from template! You can now edit your website. When you are ready, click "Publish" to make it live.');
      res.redirect(`/dashboard/websites/${newWebsite._id}/edit`);
    } catch (err) {
      console.error('Error creating website from template:', err);
      req.flash('error_msg', 'Failed to create website from template');
      res.redirect('/templates');
    }
  },

  // Admin: Get all templates (including inactive)
  adminGetAllTemplates: async (req, res) => {
    try {
      const templates = await Template.find().sort({ createdAt: -1 });
      res.render('admin/templates/index', {
        title: 'Manage Templates - FTRAISE AI Admin',
        templates,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching templates for admin:', err);
      req.flash('error_msg', 'Failed to load templates');
      res.redirect('/admin/dashboard');
    }
  },

  // Admin: Create template form
  adminGetCreateTemplateForm: async (req, res) => {
    try {
      const packages = await Package.find({ active: true });

      res.render('admin/templates/create', {
        title: 'Create Template - FTRAISE AI Admin',
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading template creation form:', err);
      req.flash('error_msg', 'Failed to load template creation form');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Create template
  adminCreateTemplate: async (req, res) => {
    try {
      const {
        name,
        description,
        businessType,
        theme,
        colorScheme,
        packageType,
        pageCount,
        isResponsive,
        active
      } = req.body;

      // Handle thumbnail upload
      let thumbnail = '/images/templates/default.jpg';
      if (req.file) {
        thumbnail = `/uploads/templates/${req.file.filename}`;
      }

      // Create template with default pages
      const newTemplate = new Template({
        name,
        description,
        businessType,
        theme: theme || 'default',
        colorScheme: colorScheme || 'blue',
        thumbnail,
        packageType: packageType || 'All',
        pageCount: pageCount || 1,
        isResponsive: isResponsive === 'on',
        active: active === 'on',
        pages: [
          {
            title: 'Home',
            slug: 'home',
            content: generateDefaultHomePage(name, description, businessType, theme),
            isHomepage: true,
            order: 0
          },
          {
            title: 'About',
            slug: 'about',
            content: generateDefaultAboutPage(name, businessType),
            isHomepage: false,
            order: 1
          },
          {
            title: 'Services',
            slug: 'services',
            content: generateDefaultServicesPage(businessType),
            isHomepage: false,
            order: 2
          },
          {
            title: 'Contact',
            slug: 'contact',
            content: generateDefaultContactPage(name),
            isHomepage: false,
            order: 3
          }
        ]
      });

      await newTemplate.save();

      req.flash('success_msg', 'Template created successfully');
      res.redirect('/admin/templates');
    } catch (err) {
      console.error('Error creating template:', err);

      // Check if this is a validation error
      if (err.name === 'ValidationError') {
        let errorMessage = 'Validation error: ';

        // Check for packageType error
        if (err.errors && err.errors.packageType) {
          const invalidValue = err.errors.packageType.value;
          errorMessage += `The package type '${invalidValue}' is not valid. `;
          errorMessage += `Valid package types are: ${Template.schema.path('packageType').enumValues.join(', ')}`;
        } else {
          // Generic validation error message
          errorMessage += Object.values(err.errors).map(e => e.message).join(', ');
        }

        req.flash('error_msg', errorMessage);
      } else {
        req.flash('error_msg', 'Failed to create template');
      }

      res.redirect('/admin/templates/create');
    }
  },

  // Admin: Edit template form
  adminGetEditTemplateForm: async (req, res) => {
    try {
      const { id } = req.params;
      const template = await Template.findById(id);
      const packages = await Package.find({ active: true });

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      res.render('admin/templates/edit', {
        title: `Edit ${template.name} - FTRAISE AI Admin`,
        template,
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching template for edit:', err);
      req.flash('error_msg', 'Failed to load template');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Update template
  adminUpdateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        businessType,
        theme,
        colorScheme,
        packageType,
        pageCount,
        isResponsive,
        active
      } = req.body;

      const template = await Template.findById(id);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      // Update thumbnail if provided
      let thumbnail = template.thumbnail;
      if (req.file) {
        thumbnail = `/uploads/templates/${req.file.filename}`;
      }

      // Update template
      template.name = name;
      template.description = description;
      template.businessType = businessType;
      template.theme = theme || 'default';
      template.colorScheme = colorScheme || 'blue';
      template.thumbnail = thumbnail;
      template.packageType = packageType || 'All';
      template.pageCount = pageCount || 1;
      template.isResponsive = isResponsive === 'on';
      template.active = active === 'on';

      await template.save();

      req.flash('success_msg', 'Template updated successfully');
      res.redirect('/admin/templates');
    } catch (err) {
      console.error('Error updating template:', err);

      // Check if this is a validation error
      if (err.name === 'ValidationError') {
        let errorMessage = 'Validation error: ';

        // Check for packageType error
        if (err.errors && err.errors.packageType) {
          const invalidValue = err.errors.packageType.value;
          errorMessage += `The package type '${invalidValue}' is not valid. `;
          errorMessage += `Valid package types are: ${Template.schema.path('packageType').enumValues.join(', ')}`;
        } else {
          // Generic validation error message
          errorMessage += Object.values(err.errors).map(e => e.message).join(', ');
        }

        req.flash('error_msg', errorMessage);
      } else {
        req.flash('error_msg', 'Failed to update template');
      }

      res.redirect(`/admin/templates/${req.params.id}/edit`);
    }
  },

  // Admin: Add new page to template form
  adminGetAddTemplatePageForm: async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await Template.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      res.render('admin/templates/add-page', {
        title: `Add Page - ${template.name} - FTRAISE AI Admin`,
        template,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading add page form:', err);
      req.flash('error_msg', 'Failed to load add page form');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Add new page to template
  adminAddTemplatePage: async (req, res) => {
    try {
      const { templateId } = req.params;
      const { title, slug, content, isHomepage } = req.body;

      const template = await Template.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        req.flash('error_msg', 'Slug can only contain lowercase letters, numbers, and hyphens');
        return res.redirect(`/admin/templates/${templateId}/pages/add`);
      }

      // Check if slug already exists in this template
      const slugExists = template.pages.some(page => page.slug === slug);
      if (slugExists) {
        req.flash('error_msg', 'A page with this slug already exists in this template');
        return res.redirect(`/admin/templates/${templateId}/pages/add`);
      }

      // If this is set as homepage, unset any existing homepage
      if (isHomepage === 'on') {
        template.pages.forEach(page => {
          if (page.isHomepage) {
            page.isHomepage = false;
          }
        });
      }

      // Get the highest order number and add 1
      const highestOrder = template.pages.length > 0
        ? Math.max(...template.pages.map(page => page.order))
        : -1;

      // Create new page
      template.pages.push({
        title,
        slug,
        content,
        isHomepage: isHomepage === 'on',
        order: highestOrder + 1
      });

      // Update page count
      template.pageCount = template.pages.length;

      await template.save();

      req.flash('success_msg', 'Page added successfully');
      res.redirect(`/admin/templates/${templateId}/edit`);
    } catch (err) {
      console.error('Error adding template page:', err);
      req.flash('error_msg', 'Failed to add page');
      res.redirect(`/admin/templates/${req.params.templateId}/pages/add`);
    }
  },

  // Admin: Edit template page form
  adminGetEditTemplatePageForm: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;
      const template = await Template.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      const page = template.pages.id(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found');
        return res.redirect(`/admin/templates/${templateId}/edit`);
      }

      res.render('admin/templates/edit-page', {
        title: `Edit ${page.title} - ${template.name} - FTRAISE AI Admin`,
        template,
        page,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching template page for edit:', err);
      req.flash('error_msg', 'Failed to load template page');
      res.redirect('/admin/templates');
    }
  },

  // Admin: Update template page
  adminUpdateTemplatePage: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;
      const { title, slug, content, isHomepage } = req.body;

      const template = await Template.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      const page = template.pages.id(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found');
        return res.redirect(`/admin/templates/${templateId}/edit`);
      }

      // Validate slug format if it's changed
      if (slug !== page.slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          req.flash('error_msg', 'Slug can only contain lowercase letters, numbers, and hyphens');
          return res.redirect(`/admin/templates/${templateId}/pages/${pageId}/edit`);
        }

        // Check if slug already exists in this template
        const slugExists = template.pages.some(p => p.slug === slug && p._id.toString() !== pageId);
        if (slugExists) {
          req.flash('error_msg', 'A page with this slug already exists in this template');
          return res.redirect(`/admin/templates/${templateId}/pages/${pageId}/edit`);
        }
      }

      // If this is set as homepage, unset any existing homepage
      if (isHomepage === 'on' && !page.isHomepage) {
        template.pages.forEach(p => {
          if (p.isHomepage && p._id.toString() !== pageId) {
            p.isHomepage = false;
          }
        });
      }

      // Update page
      page.title = title;
      page.slug = slug;
      page.content = content;
      page.isHomepage = isHomepage === 'on';

      await template.save();

      req.flash('success_msg', 'Template page updated successfully');
      res.redirect(`/admin/templates/${templateId}/edit`);
    } catch (err) {
      console.error('Error updating template page:', err);
      req.flash('error_msg', 'Failed to update template page');
      res.redirect(`/admin/templates/${req.params.templateId}/edit`);
    }
  },

  // Admin: Delete template page
  adminDeleteTemplatePage: async (req, res) => {
    try {
      const { templateId, pageId } = req.params;

      const template = await Template.findById(templateId);

      if (!template) {
        req.flash('error_msg', 'Template not found');
        return res.redirect('/admin/templates');
      }

      // Find the page
      const page = template.pages.id(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found');
        return res.redirect(`/admin/templates/${templateId}/edit`);
      }

      // Don't allow deleting the last page
      if (template.pages.length <= 1) {
        req.flash('error_msg', 'Cannot delete the last page of a template');
        return res.redirect(`/admin/templates/${templateId}/edit`);
      }

      // Don't allow deleting the homepage
      if (page.isHomepage) {
        req.flash('error_msg', 'Cannot delete the homepage. Please set another page as homepage first.');
        return res.redirect(`/admin/templates/${templateId}/edit`);
      }

      // Remove the page
      template.pages.pull(pageId);

      // Update page count
      template.pageCount = template.pages.length;

      await template.save();

      req.flash('success_msg', 'Page deleted successfully');
      res.redirect(`/admin/templates/${templateId}/edit`);
    } catch (err) {
      console.error('Error deleting template page:', err);
      req.flash('error_msg', 'Failed to delete page');
      res.redirect(`/admin/templates/${req.params.templateId}/edit`);
    }
  },

  // Admin: Delete template
  adminDeleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      await Template.findByIdAndDelete(id);

      req.flash('success_msg', 'Template deleted successfully');
      res.redirect('/admin/templates');
    } catch (err) {
      console.error('Error deleting template:', err);
      req.flash('error_msg', 'Failed to delete template');
      res.redirect('/admin/templates');
    }
  }
};

// Helper functions to generate default page content
function generateDefaultHomePage(name, description, businessType, theme) {
  return `
    <section class="hero">
      <h1>${name}</h1>
      <p>${description}</p>
      <a href="#contact" class="btn website-internal-link">Contact Us</a>
    </section>

    <section class="about">
      <h2>About Us</h2>
      <p>Welcome to ${name}, your trusted partner in ${businessType}. We provide exceptional services tailored to your needs.</p>
    </section>

    <section class="services">
      <h2>Our Services</h2>
      <div class="service-grid">
        <div class="service-card">
          <h3>Service 1</h3>
          <p>Description of your first service offering.</p>
        </div>
        <div class="service-card">
          <h3>Service 2</h3>
          <p>Description of your second service offering.</p>
        </div>
        <div class="service-card">
          <h3>Service 3</h3>
          <p>Description of your third service offering.</p>
        </div>
      </div>
    </section>

    <section class="contact">
      <h2>Contact Us</h2>
      <p>Get in touch with us to learn more about our services.</p>
      <form class="contact-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your Name">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="Your Email">
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" placeholder="Your Message"></textarea>
        </div>
        <button type="submit" class="btn">Send Message</button>
      </form>
    </section>
  `;
}

function generateDefaultAboutPage(name, businessType) {
  return `
    <section class="about-page">
      <h1>About Us</h1>
      <p>Welcome to ${name}, your trusted partner in ${businessType}.</p>

      <div class="about-content">
        <div class="about-text">
          <h2>Our Story</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>

          <h2>Our Mission</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>

          <h2>Our Values</h2>
          <ul>
            <li>Quality</li>
            <li>Integrity</li>
            <li>Innovation</li>
            <li>Customer Satisfaction</li>
          </ul>
        </div>

        <div class="about-image">
          <img src="/images/placeholder.jpg" alt="About Us">
        </div>
      </div>

      <div class="team-section">
        <h2>Our Team</h2>
        <div class="team-grid">
          <div class="team-member">
            <img src="/images/placeholder.jpg" alt="Team Member">
            <h3>John Doe</h3>
            <p>CEO & Founder</p>
          </div>
          <div class="team-member">
            <img src="/images/placeholder.jpg" alt="Team Member">
            <h3>Jane Smith</h3>
            <p>COO</p>
          </div>
          <div class="team-member">
            <img src="/images/placeholder.jpg" alt="Team Member">
            <h3>Mike Johnson</h3>
            <p>CTO</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generateDefaultServicesPage(businessType) {
  return `
    <section class="services-page">
      <h1>Our Services</h1>
      <p>We offer a wide range of services to meet your ${businessType} needs.</p>

      <div class="services-grid">
        <div class="service-card">
          <img src="/images/placeholder.jpg" alt="Service">
          <h3>Service 1</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
        </div>
        <div class="service-card">
          <img src="/images/placeholder.jpg" alt="Service">
          <h3>Service 2</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
        </div>
        <div class="service-card">
          <img src="/images/placeholder.jpg" alt="Service">
          <h3>Service 3</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
        </div>
        <div class="service-card">
          <img src="/images/placeholder.jpg" alt="Service">
          <h3>Service 4</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
        </div>
      </div>

      <div class="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Contact us today to learn more about our services and how we can help you.</p>
        <a href="/contact" class="btn">Contact Us</a>
      </div>
    </section>
  `;
}

function generateDefaultContactPage(name) {
  return `
    <section class="contact-page">
      <h1>Contact Us</h1>
      <p>Get in touch with ${name} to learn more about our services.</p>

      <div class="contact-container">
        <div class="contact-form-container">
          <h2>Send Us a Message</h2>
          <form class="contact-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Your Name">
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="Your Email">
            </div>
            <div class="form-group">
              <label for="phone">Phone</label>
              <input type="tel" id="phone" name="phone" placeholder="Your Phone">
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" name="message" placeholder="Your Message"></textarea>
            </div>
            <button type="submit" class="btn">Send Message</button>
          </form>
        </div>

        <div class="contact-info">
          <h2>Contact Information</h2>
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <p>123 Main Street, City, Country</p>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <p>+1 (123) 456-7890</p>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <p>info@example.com</p>
          </div>
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <p>Monday - Friday: 9am - 5pm</p>
          </div>
        </div>
      </div>

      <div class="map-container">
        <h2>Find Us</h2>
        <div class="map-placeholder">
          <img src="/images/map-placeholder.jpg" alt="Map">
        </div>
      </div>
    </section>
  `;
}
