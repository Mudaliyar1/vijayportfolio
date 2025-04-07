const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Website = require('../models/Website');
const Package = require('../models/Package');
const Payment = require('../models/Payment');

// Helper function to generate AI website content
const generateWebsiteContent = async (title, description, businessType, theme, pages) => {
  try {
    // This is a placeholder for the actual AI content generation
    // In a real implementation, you would call your AI service here

    // Only generate 1-2 initial pages regardless of package limit
    const websitePages = [];

    // Generate homepage
    websitePages.push({
      title: 'Home',
      slug: 'home',
      content: `
        <section class="hero">
          <h1>${title}</h1>
          <p>${description}</p>
          <a href="#contact" class="btn website-internal-link">Contact Us</a>
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

    // Only add About page as the second page, regardless of package limit
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

    // Store the maximum number of pages allowed by the package
    // This will be used later when the user wants to add more pages
    websitePages.maxAllowedPages = pages;

    /* Don't add any more pages initially, even if the package allows more
    if (false) {
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

    // Add Gallery page (5th page)
    if (pages > 4) {
      websitePages.push({
        title: 'Gallery',
        slug: 'gallery',
        content: `
          <section class="gallery-page">
            <h1>Our Gallery</h1>
            <p>Browse through our collection of images showcasing our work and achievements.</p>

            <div class="gallery-grid">
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 1">
                <p>Project 1</p>
              </div>
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 2">
                <p>Project 2</p>
              </div>
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 3">
                <p>Project 3</p>
              </div>
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 4">
                <p>Project 4</p>
              </div>
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 5">
                <p>Project 5</p>
              </div>
              <div class="gallery-item">
                <img src="https://via.placeholder.com/300x200" alt="Gallery Image 6">
                <p>Project 6</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 4
      });
    }

    // Add Team page (6th page)
    if (pages > 5) {
      websitePages.push({
        title: 'Team',
        slug: 'team',
        content: `
          <section class="team-page">
            <h1>Our Team</h1>
            <p>Meet the talented professionals behind our success.</p>

            <div class="team-grid">
              <div class="team-member">
                <img src="https://via.placeholder.com/200x200" alt="Team Member 1">
                <h3>John Doe</h3>
                <p>CEO & Founder</p>
                <p>John has over 15 years of experience in the industry.</p>
              </div>
              <div class="team-member">
                <img src="https://via.placeholder.com/200x200" alt="Team Member 2">
                <h3>Jane Smith</h3>
                <p>Creative Director</p>
                <p>Jane leads our creative team with passion and innovation.</p>
              </div>
              <div class="team-member">
                <img src="https://via.placeholder.com/200x200" alt="Team Member 3">
                <h3>Michael Johnson</h3>
                <p>Technical Lead</p>
                <p>Michael ensures the technical excellence of all our projects.</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 5
      });
    }

    // Add Testimonials page (7th page)
    if (pages > 6) {
      websitePages.push({
        title: 'Testimonials',
        slug: 'testimonials',
        content: `
          <section class="testimonials-page">
            <h1>Client Testimonials</h1>
            <p>See what our clients have to say about our services.</p>

            <div class="testimonials-grid">
              <div class="testimonial">
                <blockquote>"${title} provided exceptional service. I'm extremely satisfied with the results."</blockquote>
                <p class="client-name">- Sarah Johnson, CEO of XYZ Company</p>
              </div>
              <div class="testimonial">
                <blockquote>"Working with ${title} was a pleasure. They delivered beyond our expectations."</blockquote>
                <p class="client-name">- Robert Brown, Marketing Director</p>
              </div>
              <div class="testimonial">
                <blockquote>"I highly recommend ${title} for their professionalism and quality of work."</blockquote>
                <p class="client-name">- Emily Davis, Small Business Owner</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 6
      });
    }

    // Add FAQ page (8th page)
    if (pages > 7) {
      websitePages.push({
        title: 'FAQ',
        slug: 'faq',
        content: `
          <section class="faq-page">
            <h1>Frequently Asked Questions</h1>
            <p>Find answers to common questions about our services.</p>

            <div class="faq-list">
              <div class="faq-item">
                <h3>What services do you offer?</h3>
                <p>We offer a wide range of ${businessType} services including [Service 1], [Service 2], and [Service 3].</p>
              </div>
              <div class="faq-item">
                <h3>How much do your services cost?</h3>
                <p>Our pricing varies depending on the specific requirements of your project. Please contact us for a custom quote.</p>
              </div>
              <div class="faq-item">
                <h3>How long does it take to complete a project?</h3>
                <p>Project timelines vary based on complexity and scope. We'll provide you with a detailed timeline during our initial consultation.</p>
              </div>
              <div class="faq-item">
                <h3>Do you offer ongoing support?</h3>
                <p>Yes, we provide ongoing support and maintenance for all our projects to ensure long-term success.</p>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 7
      });
    }

    // Add Blog page (9th page)
    if (pages > 8) {
      websitePages.push({
        title: 'Blog',
        slug: 'blog',
        content: `
          <section class="blog-page">
            <h1>Our Blog</h1>
            <p>Stay updated with our latest news, insights, and industry trends.</p>

            <div class="blog-grid">
              <div class="blog-post">
                <img src="https://via.placeholder.com/400x250" alt="Blog Post 1">
                <h2>The Future of ${businessType}</h2>
                <p class="post-meta">Posted on January 15, 2023</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <a href="#" class="read-more">Read More</a>
              </div>
              <div class="blog-post">
                <img src="https://via.placeholder.com/400x250" alt="Blog Post 2">
                <h2>5 Tips for Success in ${businessType}</h2>
                <p class="post-meta">Posted on February 22, 2023</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <a href="#" class="read-more">Read More</a>
              </div>
              <div class="blog-post">
                <img src="https://via.placeholder.com/400x250" alt="Blog Post 3">
                <h2>Industry Insights: What's New in ${businessType}</h2>
                <p class="post-meta">Posted on March 10, 2023</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
                <a href="#" class="read-more">Read More</a>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 8
      });
    }

    // Add Custom pages for any remaining pages (beyond the 9 predefined ones)
    if (pages > 9) {
      // Calculate how many additional custom pages to add
      const additionalPages = pages - 9;

      // Add each additional custom page
      for (let i = 0; i < additionalPages; i++) {
        const pageNumber = i + 1;
        websitePages.push({
          title: `Custom Page ${pageNumber}`,
          slug: `custom-page-${pageNumber}`,
          content: `
            <section class="custom-page">
              <h1>Custom Page ${pageNumber}</h1>
              <p>This is a custom page that you can modify to suit your specific needs.</p>

              <div class="custom-content">
                <h2>Section 1</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

                <h2>Section 2</h2>
                <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

                <h2>Section 3</h2>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              </div>
            </section>
          `,
          isHomepage: false,
          order: 9 + i
        });
      }
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
    */

    return websitePages;
  } catch (error) {
    console.error('Error generating website content:', error);
    throw new Error('Failed to generate website content');
  }
};

module.exports = {
  // Preview website
  previewWebsite: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId)
        .populate('pages')
        .populate('package');

      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Check if the website belongs to the current user
      if (website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'You are not authorized to preview this website');
        return res.redirect('/dashboard/websites');
      }

      // Set a preview flag to indicate this is a preview
      const isPreview = true;

      // Render the website with the preview flag
      res.render('user-site/index', {
        website,
        user: req.user,
        isPreview,
        title: `${website.title} (Preview)`,
        layout: 'layouts/user-site',
        style: '', // Empty string for style
        script: '' // Empty string for script
      });
    } catch (err) {
      console.error('Error previewing website:', err);
      req.flash('error_msg', 'Failed to preview website');
      res.redirect('/dashboard/websites');
    }
  },

  // Render website builder form
  getWebsiteBuilderForm: async (req, res) => {
    try {
      // Get user data
      const user = await User.findById(req.user._id).populate('activePackage');

      // Get available packages for selection
      const packages = await Package.find({ active: true }).sort({ price: 1 });

      // Users can create unlimited websites with the same package
      // No need to check for website limit

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

      if (packageId) {
        // User selected a specific package
        selectedPackage = await Package.findById(packageId);

        if (!selectedPackage) {
          req.flash('error_msg', 'Selected package not found');
          return res.redirect('/create-website');
        }

        // If user has an active package but selected a different one
        if (user.activePackage && user.activePackage._id.toString() !== selectedPackage._id.toString()) {
          console.log('User selected a different package than their active one');

          // If the selected package is free, we can use it
          if (selectedPackage.isFree === true) {
            console.log('Selected package is free, can use it');
          }
          // If the selected package is paid and not the active one, will need payment
          else {
            console.log('Selected package is paid, will need payment');
          }
        }
        // If user has the same active package, they can create unlimited websites
        // But for paid packages, they still need to pay for each new website
        else if (user.activePackage && user.activePackage._id.toString() === selectedPackage._id.toString()) {
          console.log('User is creating another website with their existing package');
          // If it's a paid package, they'll still need to pay during publishing
          // This is handled in the publishWebsite function
        }
        // For free packages with no active package, assign it to the user immediately
        else if (!user.activePackage && selectedPackage.isFree === true) {
          user.activePackage = selectedPackage._id;
          user.maxWebsites = 999999; // Effectively unlimited
          await user.save();
        }
      }
      // Use existing package if available and no specific package selected
      else if (user.activePackage) {
        selectedPackage = user.activePackage;

        // Check if user has reached their website limit
        if (user.websiteCount >= user.maxWebsites) {
          req.flash('error_msg', 'You have reached your website limit. Please upgrade your package to create more websites.');
          return res.redirect('/dashboard/websites');
        }
      }
      else {
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

      // Update the website count for tracking purposes only
      // This doesn't limit the number of websites a user can create
      if (user.activePackage) {
        // Count this website for statistics, but don't enforce a limit
        user.websiteCount += 1;

        // Ensure maxWebsites is set to a high value to allow unlimited websites
        user.maxWebsites = 999999; // Effectively unlimited
        await user.save();
      }

      // For paid packages, NEVER automatically publish - always redirect to the website details page
      // The user will need to click the publish button, which will then check if payment is needed
      if (!selectedPackage.isFree) {
        console.log('Created website with paid package - not publishing automatically');
        req.flash('success_msg', 'Website created successfully! Click the "Pay & Publish" button when you\'re ready to publish.');
        return res.redirect(`/dashboard/websites/${newWebsite._id}`);
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
      const website = await Website.findById(websiteId).populate('package');

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // If website has no package, show a warning
      if (!website.package) {
        req.flash('warning_msg', 'This website has no package assigned. You need to select a package before publishing.');
      } else {
        // Check if the package still exists and is active
        const packageExists = await Package.findById(website.package._id);
        if (!packageExists || !packageExists.active || packageExists.isDeleted) {
          req.flash('warning_msg', 'The package assigned to this website has been deleted or deactivated by the administrator. You need to select another package before publishing.');
          website.needsPackageUpdate = true;
          await website.save();
        }
      }

      // If website's package has been deleted, show a warning
      const isPackageDeleted = website.needsPackageUpdate || (website.package && website.package.isDeleted);
      if (isPackageDeleted) {
        req.flash('warning_msg', 'The package for this website has been discontinued. Please select a new package.');
      }

      // Check if this is a free package - strict check for isFree flag
      const isFreePackage = website.package && website.package.isFree === true;

      // Check if user has this package already
      const user = await User.findById(req.user._id).populate('activePackage');

      // Check if payment exists for this specific website
      let paymentExists = false;
      if (website.package && !isFreePackage) {
        const payment = await Payment.findOne({
          user: req.user._id,
          website: websiteId,
          status: 'completed'
        });
        paymentExists = !!payment;
      }

      console.log('Website details - Package info:', {
        packageName: website.package ? website.package.name : 'No package',
        isFree: isFreePackage,
        paymentExists: paymentExists
      });

      res.render('websites/details', {
        title: `${website.title} - FTRAISE AI`,
        website,
        user: user,
        isFreePackage: isFreePackage,
        paymentExists: paymentExists,
        isPackageDeleted: isPackageDeleted
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

      // Check if the website has a package
      if (!website.package) {
        req.flash('error_msg', 'You need to select a package before publishing');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // Check if the package still exists and is active
      const packageExists = await Package.findById(website.package._id);
      if (!packageExists) {
        req.flash('error_msg', 'This package has been deleted by the administrator. Please select another package before publishing.');
        website.needsPackageUpdate = true;
        await website.save();
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      if (!packageExists.active || packageExists.isDeleted) {
        req.flash('error_msg', 'This package has been deactivated by the administrator. Please select another package before publishing.');
        website.needsPackageUpdate = true;
        await website.save();
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // Check if this is a free package - strict check for isFree flag
      console.log('Package details:', {
        packageId: website.package._id,
        packageName: website.package.name,
        isFree: website.package.isFree,
        price: website.package.price,
        isFreeType: typeof website.package.isFree
      });

      // Force the isFree flag to be a boolean
      // This ensures packages without the isFree flag set are treated as paid
      const isFreePackage = website.package.isFree === true;

      // Log the result of the check
      console.log(`Package ${website.package.name} is ${isFreePackage ? 'FREE' : 'PAID'}`);

      // Check if user has an active package
      const user = await User.findById(req.user._id).populate('activePackage');

      // For free packages, publish directly
      if (isFreePackage) {
        console.log('Publishing free website');
        // Update website to published status
        website.isPublished = true;
        await website.save();

        // If user doesn't have an active package, set this free package as active
        if (!user.activePackage) {
          user.activePackage = website.package._id;
          user.websiteCount = 1;
          user.maxWebsites = 999999; // Effectively unlimited

          // Set package expiry date (1 year from now)
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          user.packageExpiryDate = expiryDate;

          await user.save();
        } else {
          // Even if user already has an active package, ensure maxWebsites is unlimited
          if (user.maxWebsites !== 999999) {
            user.maxWebsites = 999999; // Effectively unlimited
            await user.save();
          }
        }

        req.flash('success_msg', 'Free website published successfully!');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      } else {
        console.log('This is a paid package, not free');
      }

      // This is a paid package - ALWAYS redirect to payment for each new website
      console.log('This is a paid package - payment required for each website');

      // Check if this specific website has already been paid for
      // We need to check if there's a payment specifically for this website
      // This ensures users pay for each new website with a paid package
      const paymentExists = await Payment.findOne({
        user: req.user._id,
        'notes.websiteId': websiteId,
        status: 'paid'
      });

      // If payment exists for this specific website, allow publishing
      if (paymentExists) {
        console.log('Payment found for this specific website');

        // Update website to published status
        website.isPublished = true;
        await website.save();

        // Increment the user's website count
        user.websiteCount += 1;
        await user.save();

        req.flash('success_msg', 'Website published successfully!');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      console.log('No payment found for this website - redirecting to payment');

      // If we get here, it means:
      // 1. This is a paid package
      // 2. User has not purchased this exact package
      console.log('User needs to pay for this package');

      // If user hasn't purchased this package, redirect to payment
      req.flash('error_msg', 'You need to purchase this package to publish your website');
      return res.redirect(`/payment/create-order/${website.package._id}?websiteId=${website._id}`);
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

  // Delete page
  deletePage: async (req, res) => {
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

      // Don't allow deleting the homepage
      if (page.isHomepage) {
        req.flash('error_msg', 'Cannot delete the homepage');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // Remove the page
      website.pages.pull(pageId);

      // Reorder remaining pages
      website.pages.sort((a, b) => a.order - b.order);
      website.pages.forEach((p, index) => {
        p.order = index;
      });

      await website.save();

      req.flash('success_msg', 'Page deleted successfully');
      res.redirect(`/dashboard/websites/${websiteId}`);
    } catch (err) {
      console.error('Error deleting page:', err);
      req.flash('error_msg', 'Failed to delete page');
      res.redirect(`/dashboard/websites/${req.params.websiteId}`);
    }
  },

  // Get add page form
  getAddPageForm: async (req, res) => {
    try {
      const websiteId = req.params.websiteId;
      const website = await Website.findById(websiteId).populate('package');

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Check if the website has reached the maximum number of pages allowed by the package
      if (website.pages.length >= website.package.maxPages) {
        req.flash('error_msg', `You have reached the maximum number of pages (${website.package.maxPages}) allowed by your package`);
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      res.render('websites/add-page', {
        title: `Add New Page - ${website.title} - FTRAISE AI`,
        website,
        user: req.user,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg')
      });
    } catch (err) {
      console.error('Error loading add page form:', err);
      req.flash('error_msg', 'Failed to load add page form');
      res.redirect(`/dashboard/websites/${req.params.websiteId}`);
    }
  },

  // Add new page
  addPage: async (req, res) => {
    try {
      const websiteId = req.params.websiteId;
      const { title, content } = req.body;
      const stayOnPage = req.body.stay_on_page === 'true';

      const website = await Website.findById(websiteId).populate('package');

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Check if the website has reached the maximum number of pages allowed by the package
      if (website.pages.length >= website.package.maxPages) {
        req.flash('error_msg', `You have reached the maximum number of pages (${website.package.maxPages}) allowed by your package`);
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Check if slug already exists in this website
      const slugExists = website.pages.some(page => page.slug === slug);
      if (slugExists) {
        req.flash('error_msg', 'A page with a similar title already exists. Please choose a different title.');
        return res.redirect(`/dashboard/websites/${websiteId}/pages/add`);
      }

      // Create new page
      const newPage = {
        title,
        slug,
        content: content || `<section><h1>${title}</h1><p>This is a new page. Edit this content to add your own.</p></section>`,
        isHomepage: false,
        order: website.pages.length
      };

      // Add the new page
      website.pages.push(newPage);
      await website.save();

      const pageId = website.pages[website.pages.length - 1]._id;

      req.flash('success_msg', 'Page added successfully');

      // If stay_on_page is true, redirect to edit the new page
      // Otherwise, redirect to the website dashboard
      if (stayOnPage) {
        return res.redirect(`/dashboard/websites/${websiteId}/pages/${pageId}/edit`);
      } else {
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }
    } catch (err) {
      console.error('Error adding page:', err);
      req.flash('error_msg', 'Failed to add page');
      res.redirect(`/dashboard/websites/${req.params.websiteId}/pages/add`);
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
        return res.status(404).render('websites/404', { layout: false });
      }

      // Find the website - don't filter by isPublished yet
      const website = await Website.findOne({
        user: user._id,
        slug: websiteSlug
      }).populate('package');

      if (!website) {
        return res.status(404).render('websites/404', { layout: false });
      }

      // Check if the website's package has been deleted or deactivated
      let packageDeleted = false;
      if (website.package) {
        const packageExists = await Package.findById(website.package._id);
        packageDeleted = !packageExists || !packageExists.active || packageExists.isDeleted;
      }

      // If the website is not published or has a deleted package, show the unpublished page
      if (!website.isPublished || packageDeleted || website.needsPackageUpdate) {
        return res.render('websites/unpublished', {
          title: `${website.title} - Currently Unavailable`,
          website,
          user,
          packageDeleted,
          layout: false, // This ensures no layout is used
          style: '',
          script: ''
        });
      }

      // Find the requested page or default to homepage
      const pageSlug = req.params.pageSlug || 'home';
      const page = website.pages.find(p => p.slug === pageSlug);

      if (!page) {
        return res.status(404).render('websites/404', { layout: false });
      }

      // Prepare page URLs for navigation
      const pagesWithUrls = website.pages.map(p => {
        return {
          ...p._doc,
          url: p.slug === 'home'
            ? `/user-site/${user.username}/${website.slug}`
            : `/user-site/${user.username}/${website.slug}/${p.slug}`
        };
      });

      res.render('websites/public-view', {
        title: `${page.title} - ${website.title}`,
        website,
        page,
        pages: pagesWithUrls,
        baseUrl: `/user-site/${user.username}/${website.slug}`,
        layout: 'layouts/website',
        style: '',
        script: ''
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
        user: req.user,
        path: '/admin/websites',
        layout: 'layouts/no-footer'
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
      const website = await Website.findById(websiteId).populate('package').populate('user');

      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/admin/websites');
      }

      // If we're trying to publish the website
      if (!website.isPublished) {
        // Check if the package still exists and is active
        let packageDeleted = false;
        if (website.package) {
          const packageExists = await Package.findById(website.package._id);
          packageDeleted = !packageExists || !packageExists.active || packageExists.isDeleted;
        } else {
          packageDeleted = true; // No package assigned
        }

        // Don't allow publishing if the package is deleted
        if (packageDeleted) {
          req.flash('error_msg', 'Cannot publish this website because its package has been deleted or deactivated. The user needs to select a new package.');
          return res.redirect('/admin/websites');
        }

        // Check if this is a free package - strict check for isFree flag
        const isFreePackage = website.package && website.package.isFree === true;

        // Check if user has an active package that matches the website's package
        const user = await User.findById(website.user._id).populate('activePackage');
        const hasMatchingPackage = user.activePackage &&
                                  user.activePackage._id.toString() === website.package._id.toString();

        // If not a free package and user doesn't have a matching active package, show warning
        if (!isFreePackage && !hasMatchingPackage) {
          req.flash('warning_msg', 'Warning: User has not purchased this package. Website has been published anyway.');
        }
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

      // Delete the website
      await Website.findByIdAndDelete(websiteId);

      // Update user's website count if user exists
      if (website.user && website.user._id) {
        const user = await User.findById(website.user._id);
        if (user) {
          user.websiteCount = Math.max(0, user.websiteCount - 1);

          // If this website's package was the user's active package, reset it
          if (user.activePackage && website.package &&
              user.activePackage.toString() === website.package.toString()) {
            user.activePackage = null;
            user.packageExpiryDate = null;
          }

          await user.save();

          // Create a notification for the user that their website was deleted by admin
          // This is where you would add code to notify users if you have a notification system
        }
      }

      req.flash('success_msg', 'Website deleted successfully');
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error deleting website by admin:', err);
      req.flash('error_msg', 'Failed to delete website');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Bulk delete websites
  adminBulkDeleteWebsites: async (req, res) => {
    try {
      const { websiteIds } = req.body;

      if (!websiteIds || !Array.isArray(websiteIds) || websiteIds.length === 0) {
        req.flash('error_msg', 'No websites selected for deletion');
        return res.redirect('/admin/websites');
      }

      // Get all websites with their users and packages to update user website counts
      const websites = await Website.find({ _id: { $in: websiteIds } })
        .populate('user')
        .populate('package');

      // Create a map to track which users need their active package reset
      const userPackageResets = {};

      // Group websites by user to efficiently update user website counts
      const userWebsiteCounts = {};
      websites.forEach(website => {
        if (website.user && website.user._id) {
          const userId = website.user._id.toString();
          userWebsiteCounts[userId] = (userWebsiteCounts[userId] || 0) + 1;

          // Check if this website's package is the user's active package
          if (website.package &&
              website.user.activePackage &&
              website.user.activePackage.toString() === website.package._id.toString()) {
            userPackageResets[userId] = true;
          }
        }
      });

      // Update user website counts and reset active packages if needed
      for (const [userId, count] of Object.entries(userWebsiteCounts)) {
        const user = await User.findById(userId);
        if (user) {
          user.websiteCount = Math.max(0, user.websiteCount - count);

          // Reset active package if needed
          if (userPackageResets[userId]) {
            user.activePackage = null;
            user.packageExpiryDate = null;
          }

          await user.save();

          // Create a notification for the user that their websites were deleted by admin
          // This is where you would add code to notify users if you have a notification system
        }
      }

      // Delete all selected websites
      const result = await Website.deleteMany({ _id: { $in: websiteIds } });

      req.flash('success_msg', `${result.deletedCount} websites deleted successfully`);
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error bulk deleting websites:', err);
      req.flash('error_msg', 'An error occurred while deleting the websites');
      res.redirect('/admin/websites');
    }
  },

  // Get select package page
  getSelectPackagePage: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const website = await Website.findById(websiteId).populate('package');

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Get all active packages
      const packages = await Package.find({ active: true, isDeleted: { $ne: true } }).sort({ price: 1 });

      res.render('websites/select-package', {
        title: 'Select Package - FTRAISE AI',
        website,
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading select package page:', err);
      req.flash('error_msg', 'Failed to load packages');
      res.redirect(`/dashboard/websites/${req.params.id}`);
    }
  },

  // Update website package
  updateWebsitePackage: async (req, res) => {
    try {
      const websiteId = req.params.id;
      const { packageId } = req.body;

      // Find the website
      const website = await Website.findById(websiteId);

      if (!website || website.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/dashboard/websites');
      }

      // Find the package
      const package = await Package.findById(packageId);

      if (!package) {
        req.flash('error_msg', 'This package has been deleted by the administrator. Please select another package.');
        return res.redirect(`/dashboard/websites/${websiteId}/select-package`);
      }

      if (!package.active || package.isDeleted) {
        req.flash('error_msg', 'This package has been deactivated by the administrator. Please select another package.');
        return res.redirect(`/dashboard/websites/${websiteId}/select-package`);
      }

      // Check if this is a free package - strict check for isFree flag
      const isFreePackage = package.isFree === true;

      // If it's a free package, update the website directly
      if (isFreePackage) {
        // Update the website package
        website.package = packageId;
        website.needsPackageUpdate = false;
        await website.save();

        // Update user's active package if they don't have one
        const user = await User.findById(req.user._id);
        if (!user.activePackage) {
          user.activePackage = packageId;
          user.websiteCount = 1;
          user.maxWebsites = 999999; // Effectively unlimited

          // Set package expiry date (1 year from now)
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          user.packageExpiryDate = expiryDate;

          await user.save();
        } else {
          // Even if user already has an active package, ensure maxWebsites is unlimited
          if (user.maxWebsites !== 999999) {
            user.maxWebsites = 999999; // Effectively unlimited
            await user.save();
          }
        }

        req.flash('success_msg', 'Package updated successfully');
        return res.redirect(`/dashboard/websites/${websiteId}`);
      }

      // For paid packages, redirect to payment
      return res.redirect(`/payment/create-order/${packageId}?websiteId=${websiteId}&isPackageUpdate=true`);
    } catch (err) {
      console.error('Error updating website package:', err);
      req.flash('error_msg', 'Failed to update package');
      res.redirect(`/dashboard/websites/${req.params.id}`);
    }
  }
};