const Package = require('../models/Package');
const User = require('../models/User');

module.exports = {
  // Get all packages
  getAllPackages: async (req, res) => {
    try {
      const packages = await Package.find({ active: true }).sort({ price: 1 });
      res.render('packages/index', {
        title: 'Website Packages - FTRAISE AI',
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching packages:', err);
      req.flash('error_msg', 'Failed to load packages');
      res.redirect('/');
    }
  },

  // Get package details
  getPackageDetails: async (req, res) => {
    try {
      const packageId = req.params.id;
      const packageDetails = await Package.findById(packageId);

      if (!packageDetails) {
        req.flash('error_msg', 'Package not found');
        return res.redirect('/buy-package');
      }

      res.render('packages/details', {
        title: `${packageDetails.name} Package - FTRAISE AI`,
        package: packageDetails,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching package details:', err);
      req.flash('error_msg', 'Failed to load package details');
      res.redirect('/buy-package');
    }
  },

  // Admin: Get all packages (including inactive)
  adminGetAllPackages: async (req, res) => {
    try {
      const packages = await Package.find().sort({ price: 1 });
      res.render('admin/packages/index', {
        title: 'Manage Packages - Admin',
        packages,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching packages for admin:', err);
      req.flash('error_msg', 'Failed to load packages');
      res.redirect('/admin');
    }
  },

  // Admin: Create package form
  adminCreatePackageForm: (req, res) => {
    res.render('admin/packages/create', {
      title: 'Create Package - Admin',
      user: req.user
    });
  },

  // Admin: Create package
  adminCreatePackage: async (req, res) => {
    try {
      const {
        name,
        price,
        description,
        features,
        maxPages,
        allowBlog,
        allowGallery,
        allowContact,
        allowTestimonials,
        allowEcommerce,
        allowAiContent,
        allowCustomLayout,
        active
      } = req.body;

      // Check if a package with the same name already exists
      const existingPackage = await Package.findOne({ name: name });
      if (existingPackage) {
        req.flash('error_msg', `A package with the name "${name}" already exists. Please choose a different name.`);
        return res.redirect('/admin/packages/create');
      }

      // Convert checkbox values to boolean
      const newPackage = new Package({
        name,
        price,
        description,
        features: features.split(',').map(feature => feature.trim()),
        maxPages,
        allowBlog: allowBlog === 'on',
        allowGallery: allowGallery === 'on',
        allowContact: allowContact === 'on',
        allowTestimonials: allowTestimonials === 'on',
        allowEcommerce: allowEcommerce === 'on',
        allowAiContent: allowAiContent === 'on',
        allowCustomLayout: allowCustomLayout === 'on',
        active: active === 'on'
      });

      await newPackage.save();
      req.flash('success_msg', 'Package created successfully');
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error creating package:', err);

      // Check if this is a duplicate key error
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        req.flash('error_msg', `A package with the name "${err.keyValue.name}" already exists. Please choose a different name.`);
      } else {
        req.flash('error_msg', 'Failed to create package');
      }

      res.redirect('/admin/packages/create');
    }
  },

  // Admin: Edit package form
  adminEditPackageForm: async (req, res) => {
    try {
      const packageId = req.params.id;
      const packageDetails = await Package.findById(packageId);

      if (!packageDetails) {
        req.flash('error_msg', 'Package not found');
        return res.redirect('/admin/packages');
      }

      res.render('admin/packages/edit', {
        title: `Edit ${packageDetails.name} Package - Admin`,
        package: packageDetails,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching package for edit:', err);
      req.flash('error_msg', 'Failed to load package details');
      res.redirect('/admin/packages');
    }
  },

  // Admin: Update package
  adminUpdatePackage: async (req, res) => {
    try {
      const packageId = req.params.id;
      const {
        name,
        price,
        description,
        features,
        maxPages,
        allowBlog,
        allowGallery,
        allowContact,
        allowTestimonials,
        allowEcommerce,
        allowAiContent,
        allowCustomLayout,
        active
      } = req.body;

      // Get the old package to check if name has changed
      const oldPackage = await Package.findById(packageId);

      // If name is being changed, check if the new name already exists
      if (name !== oldPackage.name) {
        const existingPackage = await Package.findOne({ name: name, _id: { $ne: packageId } });
        if (existingPackage) {
          req.flash('error_msg', `A package with the name "${name}" already exists. Please choose a different name.`);
          return res.redirect(`/admin/packages/edit/${packageId}`);
        }
      }

      const updatedPackage = {
        name,
        price,
        description,
        features: features.split(',').map(feature => feature.trim()),
        maxPages,
        allowBlog: allowBlog === 'on',
        allowGallery: allowGallery === 'on',
        allowContact: allowContact === 'on',
        allowTestimonials: allowTestimonials === 'on',
        allowEcommerce: allowEcommerce === 'on',
        allowAiContent: allowAiContent === 'on',
        allowCustomLayout: allowCustomLayout === 'on',
        active: active === 'on'
      };

      await Package.findByIdAndUpdate(packageId, updatedPackage);
      req.flash('success_msg', 'Package updated successfully');
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error updating package:', err);

      // Check if this is a duplicate key error
      if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
        req.flash('error_msg', `A package with the name "${err.keyValue.name}" already exists. Please choose a different name.`);
      } else {
        req.flash('error_msg', 'Failed to update package');
      }

      res.redirect(`/admin/packages/edit/${req.params.id}`);
    }
  },

  // Admin: Delete package
  adminDeletePackage: async (req, res) => {
    try {
      const packageId = req.params.id;

      // Check if any users are using this package
      const usersWithPackage = await User.countDocuments({ activePackage: packageId });

      if (usersWithPackage > 0) {
        req.flash('error_msg', 'Cannot delete package as it is currently in use by users');
        return res.redirect('/admin/packages');
      }

      await Package.findByIdAndDelete(packageId);
      req.flash('success_msg', 'Package deleted successfully');
      res.redirect('/admin/packages');
    } catch (err) {
      console.error('Error deleting package:', err);
      req.flash('error_msg', 'Failed to delete package');
      res.redirect('/admin/packages');
    }
  }
};
