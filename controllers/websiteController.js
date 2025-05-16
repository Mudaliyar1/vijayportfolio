const Website = require('../models/Website');
const WebsitePage = require('../models/WebsitePage');
const WebsiteElement = require('../models/WebsiteElement');
const Package = require('../models/Package');
const User = require('../models/User');
const Payment = require('../models/Payment');
const WebsiteTemplate = require('../models/WebsiteTemplate');
const TemplatePage = require('../models/TemplatePage');
const crypto = require('crypto');
const cohere = require('cohere-ai');

// Initialize Cohere client
cohere.init(process.env.COHERE_API_KEY);

// Initialize Razorpay with error handling
let Razorpay;
let razorpay;

// Function to create a mock Razorpay client
function createMockRazorpay(reason) {
  console.log(`Using mock Razorpay client in websiteController: ${reason}`);
  return {
    orders: {
      create: async (options) => {
        console.log('Using mock Razorpay order:', options);
        return {
          id: 'mock_order_' + Date.now(),
          amount: options.amount || 0,
          currency: options.currency || 'INR',
          receipt: options.receipt || 'mock_receipt'
        };
      }
    }
  };
}

try {
  // Check if required keys are present
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay API keys are missing. Payment functionality will be limited.');
    // Create a mock Razorpay for fallback
    razorpay = createMockRazorpay('API keys missing');
  } else {
    // Initialize with actual keys
    try {
      Razorpay = require('razorpay');
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('Razorpay initialized successfully in websiteController');
    } catch (initError) {
      console.error('Failed to initialize Razorpay with provided keys:', initError.message);
      razorpay = createMockRazorpay('initialization error with provided keys');
    }
  }
} catch (error) {
  console.error('Failed to initialize Razorpay in websiteController:', error.message);
  console.error('Payment functionality will be limited. Please ensure razorpay package is installed.');

  // Create a mock Razorpay for fallback
  razorpay = createMockRazorpay('unexpected error');
}

module.exports = {
  // Get website builder dashboard
  getDashboard: async (req, res) => {
    try {
      // Get user's websites
      const websites = await Website.find({ userId: req.user._id })
        .populate('packageId')
        .populate('templateId')
        .sort({ createdAt: -1 });

      // Set a default package for websites with null packageId
      const defaultPackage = {
        name: 'Basic',
        isFree: true,
        pagesAllowed: 5
      };

      // Process websites to handle null packageId
      const processedWebsites = websites.map(website => {
        if (!website.packageId) {
          // Create a new object to avoid modifying the original mongoose document
          const websiteObj = website.toObject();
          websiteObj.packageId = defaultPackage;
          return websiteObj;
        }
        return website;
      });

      res.render('website-builder/dashboard', {
        title: 'Website Builder Dashboard - FTRAISE AI',
        websites: processedWebsites,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching website dashboard:', err);
      req.flash('error_msg', 'Failed to load dashboard. Please try again later.');
      res.redirect('/');
    }
  },

  // Get website creation page
  getCreateWebsite: async (req, res) => {
    try {
      // Check if package is selected
      if (!req.session.selectedPackage) {
        req.flash('error_msg', 'Please select a package first.');
        return res.redirect('/website-builder/packages');
      }

      const selectedPackage = req.session.selectedPackage;

      res.render('website-builder/create', {
        title: 'Create Website - FTRAISE AI',
        selectedPackage,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading website creation page:', err);
      req.flash('error_msg', 'Failed to load website creation page. Please try again later.');
      res.redirect('/website-builder/packages');
    }
  },

  // Create a new website
  createWebsite: async (req, res) => {
    try {
      // Check if package is selected
      if (!req.session.selectedPackage) {
        req.flash('error_msg', 'Please select a package first.');
        return res.redirect('/website-builder/packages');
      }

      const { name, description } = req.body;
      const selectedPackageId = req.session.selectedPackage._id;

      // Get the full package with populated templates
      const selectedPackage = await Package.findById(selectedPackageId).populate('templates defaultTemplate');

      if (!selectedPackage) {
        req.flash('error_msg', 'Selected package not found.');
        return res.redirect('/website-builder/packages');
      }

      // Generate a unique domain based on username and website name
      const domain = `${req.user.username.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      // Generate a slug from the domain
      const slug = domain;

      // Create new website
      const newWebsite = new Website({
        userId: req.user._id,
        packageId: selectedPackage._id,
        name,
        description,
        domain,
        slug,
        isPaid: selectedPackage.isFree, // Free packages are automatically marked as paid
        templateId: selectedPackage.defaultTemplate ? selectedPackage.defaultTemplate._id : null
      });

      await newWebsite.save();

      // Clear selected package from session
      delete req.session.selectedPackage;

      // If the package has a default template, create pages from that template
      if (selectedPackage.defaultTemplate) {
        // Get template pages
        const templatePages = await TemplatePage.find({ templateId: selectedPackage.defaultTemplate._id }).sort({ order: 1 });

        // Create website pages from template pages
        for (const templatePage of templatePages) {
          const newPage = new WebsitePage({
            websiteId: newWebsite._id,
            title: templatePage.title,
            slug: templatePage.slug,
            isHomePage: templatePage.isHomePage,
            content: templatePage.htmlContent,
            cssContent: templatePage.cssContent,
            jsContent: templatePage.jsContent,
            order: templatePage.order
          });

          await newPage.save();
        }

        req.flash('success_msg', 'Website created with template! You can now customize it.');
        return res.redirect(`/website-builder/dashboard`);
      } else {
        // Create a blank home page if no template is used
        const homePage = new WebsitePage({
          websiteId: newWebsite._id,
          title: 'Home',
          slug: 'home',
          isHomePage: true,
          order: 0
        });

        await homePage.save();

        // For both free and paid packages, redirect to editor
        // Payment will be required only at publish time for paid packages
        if (selectedPackage.isFree) {
          req.flash('success_msg', 'Website created successfully! You can now start building your website.');
        } else {
          req.flash('success_msg', 'Website created! You can start building now, but payment will be required before publishing.');
        }

        return res.redirect(`/website-builder/editor/${newWebsite._id}`);
      }
    } catch (err) {
      console.error('Error creating website:', err);
      req.flash('error_msg', 'Failed to create website. Please try again.');
      res.redirect('/website-builder/create');
    }
  },

  // Get website editor page
  getEditor: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId).populate('packageId');

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to edit it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Allow editing for both free and paid packages
      // Payment will only be checked at publish time

      // Get website pages
      const pages = await WebsitePage.find({ websiteId }).sort({ order: 1 });

      // Get current page (default to home page)
      const pageId = req.query.page || pages.find(p => p.isHomePage)._id;
      const currentPage = await WebsitePage.findById(pageId);

      if (!currentPage) {
        req.flash('error_msg', 'Page not found.');
        return res.redirect('/website-builder/dashboard');
      }

      // Get page elements
      const elements = await WebsiteElement.find({ pageId: currentPage._id });

      res.render('website-builder/editor', {
        title: 'Website Editor - FTRAISE AI',
        website,
        pages,
        currentPage,
        elements,
        user: req.user,
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error loading website editor:', err);
      req.flash('error_msg', 'Failed to load website editor. Please try again later.');
      res.redirect('/website-builder/dashboard');
    }
  },

  // Save website changes
  saveWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;
      const { elements, pageId } = req.body;

      // Get website and check ownership
      const website = await Website.findById(websiteId);

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Delete existing elements for this page
      await WebsiteElement.deleteMany({ pageId });

      // Create new elements
      if (elements && elements.length > 0) {
        for (const element of elements) {
          const newElement = new WebsiteElement({
            pageId,
            type: element.type,
            content: element.content,
            styles: element.styles,
            position: element.position,
            isHidden: element.isHidden || false
          });

          await newElement.save();
        }
      }

      return res.json({ success: true, message: 'Website saved successfully' });
    } catch (err) {
      console.error('Error saving website:', err);
      return res.status(500).json({ success: false, message: 'Failed to save website' });
    }
  },

  // Save template content (HTML, CSS, JS)
  saveTemplateContent: async (req, res) => {
    try {
      const { websiteId } = req.params;
      const { pageId, contentType, content } = req.body;

      // Get website and check ownership
      const website = await Website.findById(websiteId);

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Validate page belongs to website
      const page = await WebsitePage.findOne({ _id: pageId, websiteId });

      if (!page) {
        return res.status(404).json({ success: false, message: 'Page not found or does not belong to this website.' });
      }

      // Update the appropriate content field based on contentType
      if (contentType === 'html') {
        page.content = content;
      } else if (contentType === 'css') {
        page.cssContent = content;
      } else if (contentType === 'js') {
        page.jsContent = content;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid content type.' });
      }

      await page.save();

      return res.json({ success: true, message: `${contentType.toUpperCase()} content saved successfully.` });
    } catch (err) {
      console.error('Error saving template content:', err);
      return res.status(500).json({ success: false, message: 'Failed to save template content. Please try again.' });
    }
  },

  // Create a new page
  createPage: async (req, res) => {
    try {
      console.log('Creating new page with params:', req.params);
      console.log('Request body:', req.body);

      const { websiteId } = req.params;
      const { title, slug } = req.body;

      if (!title) {
        console.error('Title is required but not provided');
        req.flash('error_msg', 'Page title is required.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Get website and check ownership
      const website = await Website.findById(websiteId).populate('packageId');

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to edit it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Prevent adding pages to template-based websites
      if (website.templateId) {
        req.flash('error_msg', 'You cannot add pages to template-based websites. Pages are managed by the template.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Check page limit based on package
      const pagesCount = await WebsitePage.countDocuments({ websiteId });

      if (pagesCount >= website.packageId.pagesAllowed) {
        req.flash('error_msg', `Your package allows a maximum of ${website.packageId.pagesAllowed} pages. Please upgrade to add more pages.`);
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Create new page
      const newPage = new WebsitePage({
        websiteId,
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        order: pagesCount
      });

      await newPage.save();

      req.flash('success_msg', 'Page created successfully.');
      res.redirect(`/website-builder/editor/${websiteId}?page=${newPage._id}`);
    } catch (err) {
      console.error('Error creating page:', err);
      req.flash('error_msg', 'Failed to create page. Please try again.');
      res.redirect(`/website-builder/editor/${req.params.websiteId}`);
    }
  },

  // Delete a page
  deletePage: async (req, res) => {
    try {
      const { websiteId, pageId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId);

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to edit it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Prevent deleting pages from template-based websites
      if (website.templateId) {
        req.flash('error_msg', 'You cannot delete pages from template-based websites. Pages are managed by the template.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Check if it's the home page
      const page = await WebsitePage.findById(pageId);

      if (!page) {
        req.flash('error_msg', 'Page not found.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      if (page.isHomePage) {
        req.flash('error_msg', 'Cannot delete the home page.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Delete page elements
      await WebsiteElement.deleteMany({ pageId });

      // Delete page
      await WebsitePage.findByIdAndDelete(pageId);

      req.flash('success_msg', 'Page deleted successfully.');
      res.redirect(`/website-builder/editor/${websiteId}`);
    } catch (err) {
      console.error('Error deleting page:', err);
      req.flash('error_msg', 'Failed to delete page. Please try again.');
      res.redirect(`/website-builder/editor/${req.params.websiteId}`);
    }
  },

  // Generate content with Cohere AI
  generateContent: async (req, res) => {
    try {
      const { prompt, type } = req.body;

      // Generate content based on type
      let generatedContent = '';

      const response = await cohere.generate({
        model: 'command',
        prompt: `Generate ${type} content for a website about: ${prompt}. Make it professional and engaging.`,
        max_tokens: 300,
        temperature: 0.7,
      });

      generatedContent = response.body.generations[0].text.trim();

      return res.json({ success: true, content: generatedContent });
    } catch (err) {
      console.error('Error generating content:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate content' });
    }
  },

  // Get payment page
  getPaymentPage: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId)
        .populate('packageId')
        .populate('templateId')
        .populate('userId', 'name email');

      if (!website || website.userId._id.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to access it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Check if already paid
      if (website.isPaid) {
        req.flash('info_msg', 'Payment has already been completed for this website.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Check if it's a free package and free template (or no template)
      if (website.packageId.isFree && (!website.templateId || !website.templateId.isPaid)) {
        // Mark as paid and redirect to editor
        website.isPaid = true;
        await website.save();

        req.flash('success_msg', 'Free package activated! You can now start building your website.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Determine the amount to charge based on package or template
      let amount = 0;
      let paymentType = '';
      let paymentItemId = null;

      if (!website.packageId.isFree) {
        // Charge for the package
        amount = website.packageId.price;
        paymentType = 'package';
        paymentItemId = website.packageId._id;
      } else if (website.templateId && website.templateId.isPaid) {
        // Charge for the template
        amount = website.templateId.price;
        paymentType = 'template';
        paymentItemId = website.templateId._id;
      }

      // Create Razorpay order if not already created
      let payment = await Payment.findOne({
        websiteId,
        status: 'created',
        userId: req.user._id
      });

      if (!payment) {
        // Create a new Razorpay order
        const options = {
          amount: amount * 100, // amount in paise
          currency: 'INR',
          receipt: `website_${websiteId}`,
          payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        // Save payment details
        payment = new Payment({
          userId: req.user._id,
          websiteId,
          packageId: paymentType === 'package' ? paymentItemId : website.packageId._id,
          templateId: paymentType === 'template' ? paymentItemId : null,
          amount: amount,
          razorpayOrderId: order.id,
          paymentType: paymentType
        });

        await payment.save();
      }

      res.render('website-builder/payment', {
        title: 'Complete Payment - FTRAISE AI',
        website,
        payment,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        user: req.user
      });
    } catch (err) {
      console.error('Error loading payment page:', err);
      req.flash('error_msg', 'Failed to load payment page. Please try again later.');
      res.redirect('/website-builder/dashboard');
    }
  },

  // Verify payment
  verifyPayment: async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        websiteId
      } = req.body;

      // Verify signature
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }

      // Update payment status
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'captured';
      await payment.save();

      // Update website status
      const website = await Website.findById(websiteId).populate('packageId');

      if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
      }

      console.log('Before payment update - Website:', websiteId);
      console.log('Before payment update - isPaid:', website.isPaid);
      console.log('Before payment update - Package:', website.packageId.name);
      console.log('Before payment update - isFree:', website.packageId.isFree);

      website.isPaid = true;
      website.unpublishedBy = null; // Reset the unpublishedBy field after payment
      await website.save();

      // Double-check that the website was properly marked as paid
      const updatedWebsite = await Website.findById(websiteId);
      console.log('After payment update - isPaid:', updatedWebsite.isPaid);

      return res.json({ success: true, message: 'Payment verified successfully. You can now publish your website!' });
    } catch (err) {
      console.error('Error verifying payment:', err);
      return res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
  },

  // Publish website
  publishWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId)
        .populate('packageId')
        .populate('templateId');

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to publish it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Check if payment is required
      console.log('Publishing website:', websiteId);
      console.log('Website isPaid:', website.isPaid);

      // Handle null packageId
      if (!website.packageId) {
        console.log('Package is null, setting default free package');
        // Create a default package object
        website.packageId = {
          name: 'Basic',
          isFree: true,
          pagesAllowed: 5
        };
      }

      console.log('Package isFree:', website.packageId.isFree);
      console.log('Has template:', !!website.templateId);
      if (website.templateId) {
        console.log('Template isPaid:', website.templateId.isPaid);
      }
      console.log('Unpublished by:', website.unpublishedBy);

      // Skip payment check if the user is an admin
      if (req.user && req.user.isAdmin) {
        console.log('Admin publishing website - skipping payment check');
        website.isPaid = true; // Mark as paid when admin publishes
        website.unpublishedBy = null; // Reset the unpublishedBy field
      }
      // Case 1: Website was unpublished by admin - needs payment again even if previously paid (for non-admins)
      else if (website.unpublishedBy === 'admin' && !website.packageId.isFree) {
        console.log('Website was unpublished by admin, payment required again');
        if (website.isPaid) {
          // If it was previously paid, still require payment again
          website.isPaid = false; // Reset paid status
          await website.save();
        }
        req.flash('error_msg', 'This website was unpublished by an administrator. Payment is required to publish it again.');
        return res.redirect(`/website-builder/payment/${websiteId}`);
      }
      // Case 2: Unpaid website with paid package - always needs payment (for non-admins)
      else if (!website.isPaid && !website.packageId.isFree) {
        console.log('Payment required but not completed');
        req.flash('error_msg', 'Please complete payment before publishing your website.');
        return res.redirect(`/website-builder/payment/${websiteId}`);
      }
      // Case 3: Template-based website with paid template - needs payment
      else if (website.templateId && website.templateId.isPaid && !website.isPaid) {
        console.log('Paid template requires payment');
        req.flash('error_msg', 'This template requires payment before publishing. Please complete payment.');
        return res.redirect(`/website-builder/payment/${websiteId}`);
      }
      // Case 4: Free package or free template - always mark as paid
      else if (website.packageId.isFree || (website.templateId && !website.templateId.isPaid)) {
        // For free packages/templates, ensure they're marked as paid
        if (!website.isPaid) {
          website.isPaid = true;
          await website.save();
        }
      }

      console.log('Payment check passed, proceeding with publish');

      // Update website status
      website.status = 'published';
      website.isPublished = true;
      website.publishedAt = Date.now();
      website.unpublishedBy = null; // Reset the unpublishedBy field
      await website.save();

      req.flash('success_msg', 'Website published successfully! It is now live.');
      res.redirect(`/website-builder/dashboard`);
    } catch (err) {
      console.error('Error publishing website:', err);
      req.flash('error_msg', 'Failed to publish website. Please try again.');
      res.redirect(`/website-builder/editor/${req.params.websiteId}`);
    }
  },

  // Unpublish website
  unpublishWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId);

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to unpublish it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Update website status
      website.status = 'draft';
      website.isPublished = false;
      website.unpublishedBy = 'user'; // Track that user unpublished it
      await website.save();

      req.flash('success_msg', 'Website unpublished successfully.');
      res.redirect('/website-builder/dashboard');
    } catch (err) {
      console.error('Error unpublishing website:', err);
      req.flash('error_msg', 'Failed to unpublish website. Please try again.');
      res.redirect('/website-builder/dashboard');
    }
  },

  // Delete website
  deleteWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId);

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to delete it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Get all pages
      const pages = await WebsitePage.find({ websiteId });

      // Delete all elements for each page
      for (const page of pages) {
        await WebsiteElement.deleteMany({ pageId: page._id });
      }

      // Delete all pages
      await WebsitePage.deleteMany({ websiteId });

      // Delete website
      await Website.findByIdAndDelete(websiteId);

      req.flash('success_msg', 'Website deleted successfully.');
      res.redirect('/website-builder/dashboard');
    } catch (err) {
      console.error('Error deleting website:', err);
      req.flash('error_msg', 'Failed to delete website. Please try again.');
      res.redirect('/website-builder/dashboard');
    }
  },

  // Preview website
  previewWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website and check ownership
      const website = await Website.findById(websiteId).populate('templateId');

      if (!website || website.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Website not found or you do not have permission to preview it.');
        return res.redirect('/website-builder/dashboard');
      }

      // Get all pages
      const pages = await WebsitePage.find({ websiteId }).sort({ order: 1 });

      if (pages.length === 0) {
        req.flash('error_msg', 'Website has no pages to preview.');
        return res.redirect(`/website-builder/editor/${websiteId}`);
      }

      // Get current page (from query or default to homepage)
      let currentPage;
      if (req.query.page) {
        currentPage = await WebsitePage.findById(req.query.page);
      }

      if (!currentPage) {
        currentPage = pages.find(p => p.isHomePage) || pages[0];
      }

      // Check if this is a template-based website or legacy editor website
      if (website.templateId) {
        // Template-based website - render without any layout
        res.render('website-builder/template-only-render', {
          title: `${website.name} - Preview`,
          website,
          pages,
          currentPage,
          elements: [], // Not needed for template-based sites
          isPreview: true,
          user: req.user,
          layout: false // Don't use any layout
        });
      } else {
        // Legacy editor website
        // Get page elements
        const elements = await WebsiteElement.find({ pageId: currentPage._id });

        res.render('website-builder/preview', {
          title: `${website.name} - Preview`,
          website,
          pages,
          currentPage,
          elements,
          isPreview: true,
          user: req.user,
          layout: 'layouts/user-site'
        });
      }
    } catch (err) {
      console.error('Error previewing website:', err);
      req.flash('error_msg', 'Failed to preview website. Please try again.');
      res.redirect(`/website-builder/editor/${req.params.websiteId}`);
    }
  },

  // Render user website
  renderUserWebsite: async (req, res) => {
    try {
      const { domain } = req.params;

      // Find website by domain
      const website = await Website.findOne({
        domain: domain,
        isPublished: true,
        status: 'published'
      }).populate('templateId');

      if (!website) {
        return res.status(404).render('404', {
          title: '404 - Website Not Found',
          user: req.user
        });
      }

      // Find user
      const user = await User.findById(website.userId);

      if (!user) {
        return res.status(404).render('404', {
          title: '404 - User Not Found',
          user: req.user
        });
      }

      // Get all pages
      const pages = await WebsitePage.find({ websiteId: website._id }).sort({ order: 1 });

      if (pages.length === 0) {
        return res.status(404).render('404', {
          title: '404 - No Pages Found',
          user: req.user
        });
      }

      // Get requested page or default to home page
      let currentPage;

      if (req.params.page) {
        currentPage = pages.find(p => p.slug === req.params.page);
      }

      if (!currentPage) {
        currentPage = pages.find(p => p.isHomePage) || pages[0];
      }

      // Increment view count
      website.analytics.views += 1;
      website.analytics.lastViewed = Date.now();
      await website.save();

      // Check if this is a template-based website or legacy editor website
      if (website.templateId) {
        // Template-based website - render without any layout
        res.render('website-builder/template-only-render', {
          title: `${website.name} - ${currentPage.title}`,
          website,
          pages,
          currentPage,
          elements: [], // Not needed for template-based sites
          isPreview: false,
          layout: false // Don't use any layout
        });
      } else {
        // Legacy editor website
        // Get page elements
        const elements = await WebsiteElement.find({ pageId: currentPage._id });

        res.render('website-builder/render', {
          title: `${website.name} - ${currentPage.title}`,
          website,
          pages,
          currentPage,
          elements,
          isPreview: false,
          layout: 'layouts/user-site'
        });
      }
    } catch (err) {
      console.error('Error rendering user website:', err);
      return res.status(500).render('500', {
        title: '500 - Server Error',
        user: req.user
      });
    }
  },

  // Admin: Get all websites
  getAdminWebsites: async (req, res) => {
    try {
      const websites = await Website.find()
        .populate('userId', 'username email')
        .populate('packageId')
        .sort({ createdAt: -1 });

      res.render('admin/websites', {
        title: 'Manage Websites - Admin',
        websites,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching websites for admin:', err);
      req.flash('error_msg', 'Failed to load websites. Please try again later.');
      res.redirect('/admin');
    }
  },

  // Admin: Get all payments
  getAdminPayments: async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate('userId', 'username email')
        .populate('websiteId', 'name domain')
        .populate('packageId', 'name price')
        .sort({ createdAt: -1 });

      res.render('admin/payments', {
        title: 'Manage Payments - Admin',
        payments,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payments for admin:', err);
      req.flash('error_msg', 'Failed to load payments. Please try again later.');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Get payment details
  getAdminPaymentDetails: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId)
        .populate('userId', 'username email')
        .populate('websiteId', 'name domain')
        .populate('packageId', 'name price');

      if (!payment) {
        req.flash('error_msg', 'Payment not found.');
        return res.redirect('/admin/websites/payments');
      }

      res.render('admin/payment-details', {
        title: 'Payment Details - Admin',
        payment,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payment details for admin:', err);
      req.flash('error_msg', 'Failed to load payment details. Please try again later.');
      res.redirect('/admin/websites/payments');
    }
  },

  // Admin: View website details
  getAdminWebsiteDetails: async (req, res) => {
    try {
      const { websiteId } = req.params;

      const website = await Website.findById(websiteId)
        .populate('userId', 'username email')
        .populate('packageId');

      if (!website) {
        req.flash('error_msg', 'Website not found.');
        return res.redirect('/admin/websites');
      }

      // Get pages
      const pages = await WebsitePage.find({ websiteId }).sort({ order: 1 });

      // Get payments
      const payments = await Payment.find({ websiteId }).sort({ createdAt: -1 });

      res.render('admin/website-details', {
        title: `Website Details: ${website.name} - Admin`,
        website,
        pages,
        payments,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching website details for admin:', err);
      req.flash('error_msg', 'Failed to load website details. Please try again later.');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Toggle website status (published/unpublished)
  adminToggleWebsiteStatus: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // First get the website with package info
      const website = await Website.findById(websiteId).populate('packageId');

      if (!website) {
        req.flash('error_msg', 'Website not found.');
        return res.redirect('/admin/websites');
      }

      // Toggle website status
      if (website.isPublished) {
        // Unpublishing
        website.isPublished = false;
        website.status = 'draft';
        website.unpublishedBy = 'admin'; // Track that admin unpublished it

        // If it's a paid package, reset the isPaid status
        if (!website.packageId.isFree) {
          website.isPaid = false; // Reset paid status when admin unpublishes
          console.log(`Admin unpublished website ${websiteId}. Reset isPaid to false for paid package.`);
        }
      } else {
        // Publishing - Admin can publish any website regardless of payment status
        website.isPublished = true;
        website.status = 'published';
        website.publishedAt = new Date();
        website.unpublishedBy = null; // Reset the unpublishedBy field
        website.isPaid = true; // Mark as paid when admin publishes
      }

      await website.save();

      console.log(`Admin ${website.isPublished ? 'published' : 'unpublished'} website ${websiteId}. isPaid set to: ${website.isPaid}`);

      req.flash('success_msg', `Website ${website.isPublished ? 'published' : 'unpublished'} successfully.`);
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error toggling website status:', err);
      req.flash('error_msg', 'Failed to update website status. Please try again.');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Delete website
  adminDeleteWebsite: async (req, res) => {
    try {
      const { websiteId } = req.params;

      // Get website
      const website = await Website.findById(websiteId);

      if (!website) {
        req.flash('error_msg', 'Website not found.');
        return res.redirect('/admin/websites');
      }

      // Get all pages
      const pages = await WebsitePage.find({ websiteId });

      // Delete all elements for each page
      for (const page of pages) {
        await WebsiteElement.deleteMany({ pageId: page._id });
      }

      // Delete all pages
      await WebsitePage.deleteMany({ websiteId });

      // Delete website
      await Website.findByIdAndDelete(websiteId);

      req.flash('success_msg', 'Website deleted successfully.');
      res.redirect('/admin/websites');
    } catch (err) {
      console.error('Error deleting website:', err);
      req.flash('error_msg', 'Failed to delete website. Please try again.');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Get all payments
  getAdminPayments: async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate('userId', 'username email')
        .populate('websiteId', 'name domain')
        .populate('packageId', 'name price')
        .sort({ createdAt: -1 });

      res.render('admin/payments', {
        title: 'Manage Payments - Admin',
        payments,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payments for admin:', err);
      req.flash('error_msg', 'Failed to load payments. Please try again later.');
      res.redirect('/admin');
    }
  },

  // Admin: View payment details
  getAdminPaymentDetails: async (req, res) => {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId)
        .populate('userId', 'username email')
        .populate('websiteId', 'name domain status isPublished')
        .populate('packageId', 'name price');

      if (!payment) {
        req.flash('error_msg', 'Payment not found.');
        return res.redirect('/admin/websites/payments');
      }

      res.render('admin/payment-details', {
        title: 'Payment Details - Admin',
        payment,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payment details for admin:', err);
      req.flash('error_msg', 'Failed to load payment details. Please try again later.');
      res.redirect('/admin/websites/payments');
    }
  },

  // Admin: Delete payment
  adminDeletePayment: async (req, res) => {
    try {
      const { paymentId } = req.params;

      // Find and delete payment
      const payment = await Payment.findByIdAndDelete(paymentId);

      if (!payment) {
        req.flash('error_msg', 'Payment not found.');
        return res.redirect('/admin/websites/payments');
      }

      req.flash('success_msg', 'Payment deleted successfully.');
      res.redirect('/admin/websites/payments');
    } catch (err) {
      console.error('Error deleting payment:', err);
      req.flash('error_msg', 'Failed to delete payment. Please try again.');
      res.redirect('/admin/websites/payments');
    }
  }
};
