const Package = require('../models/Package');
const Website = require('../models/Website');
const User = require('../models/User');
const WebsiteTemplate = require('../models/WebsiteTemplate');

module.exports = {
  // Get all packages for users to select
  getPackages: async (req, res) => {
    try {
      const packages = await Package.find({ isActive: true })
        .populate('templates')
        .populate('defaultTemplate')
        .sort({ price: 1 });

      res.render('website-builder/packages', {
        title: 'Website Packages - FTRAISE AI',
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching packages:', err);
      req.flash('error_msg', 'Failed to load packages. Please try again later.');
      res.redirect('/');
    }
  },

  // Select a package and proceed to website creation
  selectPackage: async (req, res) => {
    try {
      const { packageId } = req.body;

      // Validate package exists and populate templates
      const selectedPackage = await Package.findById(packageId)
        .populate('templates')
        .populate('defaultTemplate');

      if (!selectedPackage || !selectedPackage.isActive) {
        req.flash('error_msg', 'Invalid package selected.');
        return res.redirect('/website-builder/packages');
      }

      // Store selected package in session
      req.session.selectedPackage = selectedPackage;

      // Redirect to website creation page
      res.redirect('/website-builder/create');
    } catch (err) {
      console.error('Error selecting package:', err);
      req.flash('error_msg', 'Failed to select package. Please try again.');
      res.redirect('/website-builder/packages');
    }
  },

  // Admin: Get all packages for management
  getAdminPackages: async (req, res) => {
    try {
      const packages = await Package.find().sort({ price: 1 });
      const showDeleted = req.query.showDeleted === 'true';
      const deletedPackages = [];

      res.render('admin/packages', {
        title: 'Manage Packages - Admin',
        packages,
        deletedPackages,
        showDeleted,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching packages for admin:', err);
      req.flash('error_msg', 'Failed to load packages. Please try again later.');
      res.redirect('/admin/websites');
    }
  },

  // Admin: Show create package form
  adminCreatePackageForm: async (req, res) => {
    try {
      // Get all templates for selection
      const templates = await WebsiteTemplate.find({ isActive: true }).sort({ name: 1 });

      res.render('admin/package-create', {
        title: 'Create Package - Admin',
        templates,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading create package form:', err);
      req.flash('error_msg', 'Failed to load create package form. Please try again later.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Show edit package form
  adminEditPackageForm: async (req, res) => {
    try {
      const { id } = req.params;

      // Find package with populated templates
      const package = await Package.findById(id).populate('templates defaultTemplate');

      if (!package) {
        req.flash('error_msg', 'Package not found.');
        return res.redirect('/admin/websites/packages');
      }

      // Get all templates for selection
      const templates = await WebsiteTemplate.find({ isActive: true }).sort({ name: 1 });

      res.render('admin/package-edit', {
        title: 'Edit Package - Admin',
        package,
        templates,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        user: req.user
      });
    } catch (err) {
      console.error('Error loading edit package form:', err);
      req.flash('error_msg', 'Failed to load edit package form. Please try again later.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Create a new package
  adminCreatePackage: async (req, res) => {
    try {
      const {
        name,
        price,
        isFree,
        pagesAllowed,
        aiContent,
        seo,
        fullAi,
        description,
        'templates[]': selectedTemplates,
        defaultTemplate
      } = req.body;

      // Handle templates array (could be a single value or array)
      let templatesArray = [];
      if (selectedTemplates) {
        templatesArray = Array.isArray(selectedTemplates) ? selectedTemplates : [selectedTemplates];
      }

      // Create new package
      const newPackage = new Package({
        name,
        price: parseInt(price, 10) || 0,
        isFree: isFree === 'on',
        pagesAllowed: parseInt(pagesAllowed, 10) || 1,
        features: {
          aiContent: aiContent === 'on',
          seo: seo === 'on',
          fullAi: fullAi === 'on'
        },
        templates: templatesArray,
        defaultTemplate: defaultTemplate || null,
        description
      });

      await newPackage.save();

      req.flash('success_msg', 'Package created successfully.');
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error creating package:', err);
      req.flash('error_msg', 'Failed to create package. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Update a package
  adminUpdatePackage: async (req, res) => {
    try {
      const {
        packageId,
        name,
        price,
        isFree,
        pagesAllowed,
        aiContent,
        seo,
        fullAi,
        description,
        isActive,
        'templates[]': selectedTemplates,
        defaultTemplate
      } = req.body;

      // Handle templates array (could be a single value or array)
      let templatesArray = [];
      if (selectedTemplates) {
        templatesArray = Array.isArray(selectedTemplates) ? selectedTemplates : [selectedTemplates];
      }

      // Find and update package
      const updatedPackage = await Package.findByIdAndUpdate(
        packageId,
        {
          name,
          price: parseInt(price, 10) || 0,
          isFree: isFree === 'on',
          pagesAllowed: parseInt(pagesAllowed, 10) || 1,
          features: {
            aiContent: aiContent === 'on',
            seo: seo === 'on',
            fullAi: fullAi === 'on'
          },
          templates: templatesArray,
          defaultTemplate: defaultTemplate || null,
          description,
          isActive: isActive === 'on'
        },
        { new: true }
      );

      if (!updatedPackage) {
        req.flash('error_msg', 'Package not found.');
        return res.redirect('/admin/websites/packages');
      }

      req.flash('success_msg', 'Package updated successfully.');
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error updating package:', err);
      req.flash('error_msg', 'Failed to update package. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Delete a package
  deletePackage: async (req, res) => {
    try {
      const { packageId } = req.params;

      // Check if any websites are using this package
      const websitesUsingPackage = await Website.countDocuments({ packageId });

      if (websitesUsingPackage > 0) {
        req.flash('error_msg', 'Cannot delete package as it is being used by websites.');
        return res.redirect('/admin/websites/packages');
      }

      // Delete package
      await Package.findByIdAndDelete(packageId);

      req.flash('success_msg', 'Package deleted successfully.');
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error deleting package:', err);
      req.flash('error_msg', 'Failed to delete package. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // For backward compatibility
  createPackage: async (req, res) => {
    try {
      const {
        name,
        price,
        isFree,
        pagesAllowed,
        aiContent,
        seo,
        fullAi,
        description
      } = req.body;

      // Create new package
      const newPackage = new Package({
        name,
        price: parseInt(price, 10) || 0,
        isFree: isFree === 'on',
        pagesAllowed: parseInt(pagesAllowed, 10) || 1,
        features: {
          aiContent: aiContent === 'on',
          seo: seo === 'on',
          fullAi: fullAi === 'on'
        },
        description
      });

      await newPackage.save();

      req.flash('success_msg', 'Package created successfully.');
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error creating package:', err);
      req.flash('error_msg', 'Failed to create package. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // For backward compatibility
  updatePackage: async (req, res) => {
    try {
      console.log('Update Package Request Body:', req.body);

      const {
        packageId,
        name,
        price,
        isFree,
        pagesAllowed,
        aiContent,
        seo,
        fullAi,
        description,
        isActive
      } = req.body;

      console.log('Parsed price:', parseInt(price, 10) || 0);

      // Parse the price as an integer
      const parsedPrice = parseInt(price, 10) || 0;
      console.log('Final price to be saved:', parsedPrice);

      // Find and update package
      const updatedPackage = await Package.findByIdAndUpdate(
        packageId,
        {
          name,
          price: parsedPrice,
          isFree: isFree === 'on',
          pagesAllowed: parseInt(pagesAllowed, 10) || 1,
          features: {
            aiContent: aiContent === 'on',
            seo: seo === 'on',
            fullAi: fullAi === 'on'
          },
          description,
          isActive: isActive === 'on'
        },
        { new: true }
      );

      console.log('Updated package:', updatedPackage);

      if (!updatedPackage) {
        req.flash('error_msg', 'Package not found.');
        return res.redirect('/admin/websites/packages');
      }

      req.flash('success_msg', 'Package updated successfully.');
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error updating package:', err);
      req.flash('error_msg', 'Failed to update package. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Bulk delete packages
  bulkDeletePackages: async (req, res) => {
    try {
      const { packageIds } = req.body;

      if (!packageIds || !Array.isArray(packageIds)) {
        req.flash('error_msg', 'No packages selected for deletion.');
        return res.redirect('/admin/websites/packages');
      }

      // Check if any websites are using these packages
      const websitesUsingPackages = await Website.countDocuments({ packageId: { $in: packageIds } });

      if (websitesUsingPackages > 0) {
        req.flash('error_msg', 'Cannot delete packages as they are being used by websites.');
        return res.redirect('/admin/websites/packages');
      }

      // Delete packages
      const result = await Package.deleteMany({ _id: { $in: packageIds } });

      req.flash('success_msg', `${result.deletedCount} packages deleted successfully.`);
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error bulk deleting packages:', err);
      req.flash('error_msg', 'Failed to delete packages. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  },

  // Admin: Toggle package free/paid status
  togglePackageStatus: async (req, res) => {
    try {
      const { packageId } = req.params;

      // Find package
      const package = await Package.findById(packageId);

      if (!package) {
        req.flash('error_msg', 'Package not found.');
        return res.redirect('/admin/websites/packages');
      }

      // Toggle isFree status
      package.isFree = !package.isFree;
      await package.save();

      req.flash('success_msg', `Package is now ${package.isFree ? 'free' : 'paid'}.`);
      res.redirect('/admin/websites/packages');
    } catch (err) {
      console.error('Error toggling package status:', err);
      req.flash('error_msg', 'Failed to update package status. Please try again.');
      res.redirect('/admin/websites/packages');
    }
  }
};
