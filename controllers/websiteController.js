const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Website = require('../models/Website');
const Package = require('../models/Package');

// Helper function to generate AI website content
const generateWebsiteContent = async (title, description, businessType, theme, pages) => {
  try {
    // This is a placeholder for the actual AI content generation
    // In a real implementation, you would call your AI service here

    const websitePages = [];

    // Generate homepage
    websitePages.push({
      title: 'Home',
      slug: 'home',
      content: `
        <section class="hero">
          <h1>${title}</h1>
          <p>${description}</p>
          <a href="#contact" class="btn">Contact Us</a>
        </section>

        <section class="about">
          <h2>About Us</h2>
          <p>Welcome to ${title}, your trusted partner in ${businessType}. We provide exceptional services tailored to your needs.</p>
        </section>

        <section class="services">
          <h2>Our Services</h2>
          <div class="service-grid">
            <div class="service-card">
              <h3>Service 1</h3>
              <p>Description of service 1</p>
            </div>
            <div class="service-card">
              <h3>Service 2</h3>
              <p>Description of service 2</p>
            </div>
            <div class="service-card">
              <h3>Service 3</h3>
              <p>Description of service 3</p>
            </div>
          </div>
        </section>
      `,
      isHomepage: true,
      order: 0
    });

    // Generate additional pages based on the package
    if (pages > 1) {
      websitePages.push({
        title: 'About',
        slug: 'about',
        content: `
          <section class="about-page">
            <h1>About ${title}</h1>
            <p>${description}</p>
            <p>We are a leading provider of ${businessType} services, committed to excellence and customer satisfaction.</p>

            <h2>Our Mission</h2>
            <p>Our mission is to provide high-quality services that exceed our customers' expectations.</p>

            <h2>Our Vision</h2>
            <p>Our vision is to become the most trusted name in ${businessType}.</p>
          </section>
        `,
        isHomepage: false,
        order: 1
      });
    }

    if (pages > 2) {
      websitePages.push({
        title: 'Services',
        slug: 'services',
        content: `
          <section class="services-page">
            <h1>Our Services</h1>
            <p>We offer a wide range of services to meet your ${businessType} needs.</p>

            <div class="service-list">
              <div class="service-item">
                <h2>Service 1</h2>
                <p>Detailed description of service 1 and how it benefits our clients.</p>
              </div>

              <div class="service-item">
                <h2>Service 2</h2>
                <p>Detailed description of service 2 and how it benefits our clients.</p>
              </div>

              <div class="service-item">
                <h2>Service 3</h2>
                <p>Detailed description of service 3 and how it benefits our clients.</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 2
      });
    }

    if (pages > 3) {
      websitePages.push({
        title: 'Contact',
        slug: 'contact',
        content: `
          <section class="contact-page">
            <h1>Contact Us</h1>
            <p>Get in touch with us for any inquiries or to schedule a consultation.</p>

            <div class="contact-form">
              <form>
                <div class="form-group">
                  <label for="name">Name</label>
                  <input type="text" id="name" name="name" required>
                </div>

                <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" name="email" required>
                </div>

                <div class="form-group">
                  <label for="message">Message</label>
                  <textarea id="message" name="message" rows="5" required></textarea>
                </div>

                <button type="submit" class="btn">Send Message</button>
              </form>
            </div>

            <div class="contact-info">
              <h2>Contact Information</h2>
              <p>Email: info@example.com</p>
              <p>Phone: +1 (123) 456-7890</p>
              <p>Address: 123 Main St, City, Country</p>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 3
      });
    }

    if (pages > 4) {
      websitePages.push({
        title: 'Gallery',
        slug: 'gallery',
        content: `
          <section class="gallery-page">
            <h1>Our Gallery</h1>
            <p>Browse through our portfolio of work and projects.</p>

            <div class="gallery-grid">
              <div class="gallery-item">
                <img src="https://via.placeholder.com/400x300" alt="Gallery Image 1">
                <h3>Project 1</h3>
                <p>Description of project 1</p>
              </div>

              <div class="gallery-item">
                <img src="https://via.placeholder.com/400x300" alt="Gallery Image 2">
                <h3>Project 2</h3>
                <p>Description of project 2</p>
              </div>

              <div class="gallery-item">
                <img src="https://via.placeholder.com/400x300" alt="Gallery Image 3">
                <h3>Project 3</h3>
                <p>Description of project 3</p>
              </div>

              <div class="gallery-item">
                <img src="https://via.placeholder.com/400x300" alt="Gallery Image 4">
                <h3>Project 4</h3>
                <p>Description of project 4</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 4
      });
    }

    return websitePages;
  } catch (error) {
    console.error('Error generating website content:', error);
    throw new Error('Failed to generate website content');
  }
};

module.exports = {
  // Render website builder form
  getWebsiteBuilderForm: async (req, res) => {
    try {
      // Get user data
      const user = await User.findById(req.user._id).populate('activePackage');

      // Get available packages for selection
      const packages = await Package.find({ active: true }).sort({ price: 1 });

      // Check if user has reached their website limit
      const hasReachedLimit = user.activePackage && user.websiteCount >= user.maxWebsites;

      if (hasReachedLimit) {
        req.flash('error_msg', 'You have reached your website limit. Please upgrade your package to create more websites.');
        return res.redirect('/dashboard/websites');
      }

      // Get the selected package if provided
      let selectedPackage = null;
      if (req.query.packageId) {
        selectedPackage = await Package.findById(req.query.packageId);
      }

      res.render('websites/create', {
        title: 'Create Website - FTRAISE AI',
        user,
        package: user.activePackage,
        packages,
        hasActivePackage: !!user.activePackage,
        selectedPackage
      });
    } catch (err) {
      console.error('Error loading website builder form:', err);
      req.flash('error_msg', 'Failed to load website builder');
      res.redirect('/dashboard/websites');
    }
  },

  // Create a new website
  createWebsite: async (req, res) => {
    try {
      const { title, description, businessType, theme, colorScheme, packageId } = req.body;

      // Validate input
      if (!title || !description || !businessType) {
        req.flash('error_msg', 'Please fill in all required fields');
        return res.redirect('/create-website');
      }

      // Get user
      const user = await User.findById(req.user._id).populate('activePackage');

      // Determine which package to use
      let selectedPackage;

      if (user.activePackage) {
        // Use existing package if available
        selectedPackage = user.activePackage;

        // Check if user has reached their website limit
        if (user.websiteCount >= user.maxWebsites) {
          req.flash('error_msg', 'You have reached your website limit. Please upgrade your package to create more websites.');
          return res.redirect('/dashboard/websites');
        }
      } else if (packageId) {
        // User selected a new package
        selectedPackage = await Package.findById(packageId);

        if (!selectedPackage) {
          req.flash('error_msg', 'Selected package not found');
          return res.redirect('/create-website');
        }

        // Check if the package is free or if payment is required
        if (!selectedPackage.isFree && !req.body.paymentConfirmed) {
          // For paid packages, redirect to payment page
          return res.redirect(`/dashboard/payment?package=${selectedPackage._id}`);
        }

        // For free packages, assign it to the user
        if (selectedPackage.isFree) {
          user.activePackage = selectedPackage._id;
          await user.save();
        }
      } else {
        // No package selected
        req.flash('error_msg', 'Please select a package to create a website');
        return res.redirect('/create-website');
      }

      // Generate slug from title
      const slug = `${user.username}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      // Check if slug already exists
      const existingWebsite = await Website.findOne({ slug });
      if (existingWebsite) {
        req.flash('error_msg', 'A website with a similar title already exists. Please choose a different title.');
        return res.redirect('/create-website');
      }

      // Generate website content using AI
      const pages = await generateWebsiteContent(
        title,
        description,
        businessType,
        theme || 'default',
        selectedPackage.maxPages
      );

      // Create new website
      const newWebsite = new Website({
        title,
        description,
        businessType,
        theme: theme || 'default',
        colorScheme: colorScheme || 'blue',
        pages,
        user: user._id,
        package: selectedPackage._id,
        slug,
        isPublished: false // Always create as unpublished initially
      });

      await newWebsite.save();

      // If user has an active package, count this website against their limit
      if (user.activePackage) {
        user.websiteCount += 1;
        await user.save();
      }

      req.flash('success_msg', 'Website created successfully! You can publish it after reviewing.');
      return res.redirect(`/dashboard/websites/${newWebsite._id}`);
    } catch (err) {
      console.error('Error creating website:', err);
      req.flash('error_msg', 'Failed to create website');
      res.redirect('/create-website');
    }
  },

  // Get user's websites dashboard
  getUserWebsites: async (req, res) => {
    try {
      const websites = await Website.find({ user: req.user._id }).sort({ createdAt: -1 });
      const user = await User.findById(req.user._id).populate('activePackage');

      res.render('websites/dashboard', {
        title: 'My Websites - FTRAISE AI',
        websites,
        user,
        package: user.activePackage
      });
    } catch (err) {
      console.error('Error fetching user websites:', err);
      req.flash('error_msg', 'Failed to load websites');
      res.redirect('/dashboard');
    }
  },

  // Get website details
  getWebsiteDetails: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      res.render('websites/details', {
        title: `${website.title} - FTRAISE AI`,
        website,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching website details:', err);
      req.flash('error_msg', 'Failed to load website details');
      res.redirect('/dashboard/websites');
    }
  },

  // Edit website form
  getEditWebsiteForm: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      const user = await User.findById(req.user._id).populate('activePackage');

      res.render('websites/edit', {
        title: `Edit ${website.title} - FTRAISE AI`,
        website,
        user,
        package: user.activePackage
      });
    } catch (err) {
      console.error('Error loading edit website form:', err);
      req.flash('error_msg', 'Failed to load website editor');
      res.redirect('/dashboard/websites');
    }
  },

  // Publish website
  publishWebsite: async (req, res) => {
    try {
      const websiteId = req.params.id;

      // Find the website
      const website = await Website.findById(websiteId).populate('package');

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Check if this is a free package (price = 0)
      const isFreePackage = website.package && website.package.price === 0;

      // Check if user has an active package
      const user = await User.findById(req.user._id).populate('activePackage');

      if (!user.activePackage && !isFreePackage) {
        req.flash('error_msg', 'You need an active package to publish your website');
        return res.redirect(`/payment/create-order/${website.package._id}?websiteId=${website._id}`);
      }

      // Update website to published status
      website.isPublished = true;
      await website.save();

      // If it's a free package and user doesn't have an active package, set this package as active
      if (isFreePackage && !user.activePackage) {
        user.activePackage = website.package._id;
        user.websiteCount = 1;
        user.maxWebsites = 1;

        // Set package expiry date (1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        user.packageExpiryDate = expiryDate;

        await user.save();
      }

      req.flash('success_msg', 'Website published successfully!');
      res.redirect(`/dashboard/websites/${websiteId}`);
    } catch (err) {
      console.error('Error publishing website:', err);
      req.flash('error_msg', 'Failed to publish website');
      res.redirect(`/dashboard/websites/${req.params.id}`);
    }
  },

  // Update website
  updateWebsite: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const { title, description, businessType, theme, colorScheme, isPublished } = req.body;

      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Update website details
      website.title = title;
      website.description = description;
      website.businessType = businessType;
      website.theme = theme || website.theme;
      website.colorScheme = colorScheme || website.colorScheme;
      website.isPublished = isPublished === 'on';

      await website.save();

      req.flash('success_msg', 'Website updated successfully');
      res.redirect(`/dashboard/websites/${websiteId}`);
    } catch (err) {
      console.error('Error updating website:', err);
      req.flash('error_msg', 'Failed to update website');
      res.redirect(`/dashboard/websites/${req.params.id}/edit`);
    }
  },

  // Edit page content form
  getEditPageForm: async (req, res) => {
    try {
      const websiteId = req.params.websiteId;
      const pageId = req.params.pageId;

      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      const page = website.pages.id(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      res.render('websites/edit-page', {
        title: `Edit ${page.title} - FTRAISE AI`,
        website,
        page,
        user: req.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
      });
    } catch (err) {
      console.error('Error loading edit page form:', err);
      req.flash('error_msg', 'Failed to load page editor');
      res.redirect(`/dashboard/websites/${req.params.websiteId}`);
    }
  },

  // Update page content
  updatePage: async (req, res) => {
    try {
      const websiteId = req.params.websiteId;
      const pageId = req.params.pageId;
      const { title, content } = req.body;
      const stayOnPage = req.body.stay_on_page === 'true';

      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      const page = website.pages.id(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // Update page
      page.title = title;
      page.content = content;

      await website.save();

      req.flash('success_msg', 'Page updated successfully');

      // If stay_on_page is true, redirect back to the editor
      // Otherwise, redirect to the website dashboard
      if (stayOnPage) {
        return res.redirect(`/dashboard/websites/${websiteId}/pages/${pageId}/edit`);
      } else {
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }
    } catch (err) {
      console.error('Error updating page:', err);
      req.flash('error_msg', 'Failed to update page');
      res.redirect(`/dashboard/websites/${req.params.websiteId}/pages/${req.params.pageId}/edit`);
    }
  },

  // Delete website
  deleteWebsite: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      await Website.findByIdAndDelete(websiteId);

      // Update user's website count
      const user = await User.findById(req.user._id);
      user.websiteCount = Math.max(0, user.websiteCount - 1);
      await user.save();

      req.flash('success_msg', 'Website deleted successfully');
      res.redirect('/dashboard/websites');
    } catch (err) {
      console.error('Error deleting website:', err);
      req.flash('error_msg', 'Failed to delete website');
      res.redirect('/dashboard/websites');
    }
  },

  // View public website
  viewPublicWebsite: async (req, res) => {
    try {
      const username = req.params.username;
      const websiteSlug = req.params.websiteSlug;

      // Find the user
      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).render('404', { title: '404 - User Not Found' });
      }

      // Find the website
      const website = await Website.findOne({
        user: user._id,
        slug: websiteSlug,
        isPublished: true
      });

      if (!website) {
        return res.status(404).render('404', { title: '404 - Website Not Found' });
      }

      // Find the requested page or default to homepage
      const pageSlug = req.params.pageSlug || 'home';
      const page = website.pages.find(p => p.slug === pageSlug);

      if (!page) {
        return res.status(404).render('404', { title: '404 - Page Not Found' });
      }

      res.render('websites/public-view', {
        title: `${page.title} - ${website.title}`,
        website,
        page,
        pages: website.pages,
        layout: 'layouts/website'
      });
    } catch (err) {
      console.error('Error viewing public website:', err);
      res.status(500).render('500', { title: '500 - Server Error' });
    }
  },

  // Admin: Get all websites
  adminGetAllWebsites: async (req, res) => {
    try {
      const websites = await Website.find()
        .populate('user')
        .populate('package')
        .sort({ createdAt: -1 });

      res.render('admin/websites/index', {
        title: 'All Websites - Admin',
        websites,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching all websites:', err);
      req.flash('error_msg', 'Failed to load websites');
      res.redirect('/admin');
    }
  },

  // Admin: Get website details
  adminGetWebsiteDetails: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId)
        .populate('user')
        .populate('package');

      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/admin/websites');
      }

      res.render('admin/websites/details', {
        title: `${website.title} - Admin`,
        website,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching website details for admin:', err);
      req.flash('error_msg', 'Failed to load website details');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Toggle website published status
  adminToggleWebsiteStatus: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId);

      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/admin/websites');
      }

      website.isPublished = !website.isPublished;
      await website.save();

      req.flash('success_msg', `Website ${website.isPublished ? 'published' : 'unpublished'} successfully`);
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error toggling website status:', err);
      req.flash('error_msg', 'Failed to update website status');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Delete website
  adminDeleteWebsite: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId).populate('user');

      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/admin/websites');
      }

      await Website.findByIdAndDelete(websiteId);

      // Update user's website count
      const user = await User.findById(website.user._id);
      user.websiteCount = Math.max(0, user.websiteCount - 1);
      await user.save();

      req.flash('success_msg', 'Website deleted successfully');
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error deleting website by admin:', err);
      req.flash('error_msg', 'Failed to delete website');
      res.redirect('/admin/websites');
    }
  }
};
