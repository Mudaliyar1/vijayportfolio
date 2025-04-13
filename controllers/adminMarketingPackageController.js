const MarketingPackage = require('../models/MarketingPackage');

module.exports = {
  // Get all marketing packages
  getMarketingPackages: async (req, res) => {
    try {
      const packages = await MarketingPackage.find().sort({ displayOrder: 1, price: 1 });

      res.render('admin/marketing-packages', {
        title: 'Marketing Packages - Admin',
        packages,
        user: req.user,
        path: '/admin/marketing-packages'
      });
    } catch (err) {
      console.error('Error fetching marketing packages:', err);
      req.flash('error_msg', 'Failed to load marketing packages. Please try again later.');
      res.redirect('/admin');
    }
  },

  // Get add marketing package form
  getAddMarketingPackage: async (req, res) => {
    res.render('admin/marketing-package-form', {
      title: 'Add Marketing Package - Admin',
      package: null,
      isEdit: false,
      user: req.user,
      path: '/admin/marketing-packages/add'
    });
  },

  // Add new marketing package
  addMarketingPackage: async (req, res) => {
    try {
      const {
        name,
        price,
        description,
        pagesAllowed,
        isFree,
        isActive,
        displayOrder,
        aiContent,
        seo,
        fullAi,
        customFeatureNames,
        customFeatureValues
      } = req.body;

      // Prepare custom features array
      const customFeatures = [];
      if (customFeatureNames && customFeatureNames.length > 0) {
        for (let i = 0; i < customFeatureNames.length; i++) {
          if (customFeatureNames[i].trim()) {
            customFeatures.push({
              name: customFeatureNames[i].trim(),
              included: customFeatureValues[i] === 'on'
            });
          }
        }
      }

      // Create new package
      const newPackage = new MarketingPackage({
        name,
        price: parseInt(price, 10) || 0,
        description: description || '',
        pagesAllowed: parseInt(pagesAllowed, 10) || 1,
        isFree: isFree === 'on',
        isActive: isActive === 'on',
        displayOrder: parseInt(displayOrder, 10) || 0,
        features: {
          aiContent: aiContent === 'on',
          seo: seo === 'on',
          fullAi: fullAi === 'on',
          customFeatures
        }
      });

      await newPackage.save();

      req.flash('success_msg', 'Marketing package added successfully.');
      res.redirect('/admin/marketing-packages');
    } catch (err) {
      console.error('Error adding marketing package:', err);
      req.flash('error_msg', 'Failed to add marketing package. Please try again later.');
      res.redirect('/admin/marketing-packages/add');
    }
  },

  // Get edit marketing package form
  getEditMarketingPackage: async (req, res) => {
    try {
      const { packageId } = req.params;

      const package = await MarketingPackage.findById(packageId);

      if (!package) {
        req.flash('error_msg', 'Marketing package not found.');
        return res.redirect('/admin/marketing-packages');
      }

      res.render('admin/marketing-package-form', {
        title: 'Edit Marketing Package - Admin',
        package,
        isEdit: true,
        user: req.user,
        path: `/admin/marketing-packages/edit/${packageId}`
      });
    } catch (err) {
      console.error('Error fetching marketing package for edit:', err);
      req.flash('error_msg', 'Failed to load marketing package. Please try again later.');
      res.redirect('/admin/marketing-packages');
    }
  },

  // Update marketing package
  updateMarketingPackage: async (req, res) => {
    try {
      const { packageId } = req.params;
      const {
        name,
        price,
        description,
        pagesAllowed,
        isFree,
        isActive,
        displayOrder,
        aiContent,
        seo,
        fullAi,
        customFeatureNames,
        customFeatureValues
      } = req.body;

      // Find package
      const package = await MarketingPackage.findById(packageId);

      if (!package) {
        req.flash('error_msg', 'Marketing package not found.');
        return res.redirect('/admin/marketing-packages');
      }

      // Prepare custom features array
      const customFeatures = [];
      if (customFeatureNames && customFeatureNames.length > 0) {
        for (let i = 0; i < customFeatureNames.length; i++) {
          if (customFeatureNames[i].trim()) {
            customFeatures.push({
              name: customFeatureNames[i].trim(),
              included: customFeatureValues[i] === 'on'
            });
          }
        }
      }

      // Update package
      package.name = name;
      package.price = parseInt(price, 10) || 0;
      package.description = description || '';
      package.pagesAllowed = parseInt(pagesAllowed, 10) || 1;
      package.isFree = isFree === 'on';
      package.isActive = isActive === 'on';
      package.displayOrder = parseInt(displayOrder, 10) || 0;
      package.features = {
        aiContent: aiContent === 'on',
        seo: seo === 'on',
        fullAi: fullAi === 'on',
        customFeatures
      };
      package.updatedAt = Date.now();

      await package.save();

      req.flash('success_msg', 'Marketing package updated successfully.');
      res.redirect('/admin/marketing-packages');
    } catch (err) {
      console.error('Error updating marketing package:', err);
      req.flash('error_msg', 'Failed to update marketing package. Please try again later.');
      res.redirect(`/admin/marketing-packages/edit/${req.params.packageId}`);
    }
  },

  // Delete marketing package
  deleteMarketingPackage: async (req, res) => {
    try {
      const { packageId } = req.params;

      await MarketingPackage.findByIdAndDelete(packageId);

      req.flash('success_msg', 'Marketing package deleted successfully.');
      res.redirect('/admin/marketing-packages');
    } catch (err) {
      console.error('Error deleting marketing package:', err);
      req.flash('error_msg', 'Failed to delete marketing package. Please try again later.');
      res.redirect('/admin/marketing-packages');
    }
  }
};
