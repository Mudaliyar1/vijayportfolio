const mongoose = require('mongoose');
const MarketingPackage = require('../models/MarketingPackage');
const PackageInquiry = require('../models/PackageInquiry');
const { sendPackageInquiryConfirmation, sendPackageApprovalNotification } = require('../utils/emailService');

module.exports = {
  // Get all packages for public display
  getPublicPackages: async (req, res) => {
    try {
      const packages = await MarketingPackage.find({ isActive: true })
        .sort({ price: 1 });

      // Calculate max price for the budget slider
      let maxPrice = 1000; // Default minimum
      if (packages.length > 0) {
        const highestPackage = packages.reduce((prev, current) => {
          return (prev.price > current.price) ? prev : current;
        });
        maxPrice = Math.max(highestPackage.price, 1000); // At least 1000
        // Round up to nearest 1000
        maxPrice = Math.ceil(maxPrice / 1000) * 1000;
      }

      res.render('packages/index', {
        title: 'Website Packages - FTRAISE AI',
        packages,
        maxPrice,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching packages:', err);
      req.flash('error_msg', 'Failed to load packages. Please try again later.');
      res.redirect('/');
    }
  },

  // Get package details
  getPackageDetails: async (req, res) => {
    try {
      const { packageId } = req.params;

      const package = await MarketingPackage.findById(packageId);

      if (!package || !package.isActive) {
        req.flash('error_msg', 'Package not found or no longer available.');
        return res.redirect('/packages');
      }

      // Get all packages to calculate max price
      const allPackages = await MarketingPackage.find({ isActive: true });

      // Calculate max price for the budget slider
      let maxPrice = 1000; // Default minimum
      if (allPackages.length > 0) {
        const highestPackage = allPackages.reduce((prev, current) => {
          return (prev.price > current.price) ? prev : current;
        });
        maxPrice = Math.max(highestPackage.price, 1000); // At least 1000
        // Round up to nearest 1000
        maxPrice = Math.ceil(maxPrice / 1000) * 1000;
      }

      res.render('packages/details', {
        title: `${package.name} Package - FTRAISE AI`,
        package,
        maxPrice,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching package details:', err);
      req.flash('error_msg', 'Failed to load package details. Please try again later.');
      res.redirect('/packages');
    }
  },

  // Submit package inquiry
  submitInquiry: async (req, res) => {
    try {
      // Log the entire request body for debugging
      console.log('Received inquiry submission with body:', req.body);

      const { packageId, name, email, phone, message, budget, preferences } = req.body;

      // Validate package exists
      let package;
      try {
        // Check if packageId is valid
        if (!packageId) {
          console.error(`Missing packageId in request body`);
          req.flash('error_msg', 'Package ID is missing. Please try again.');
          return res.redirect('/packages');
        }

        if (!mongoose.Types.ObjectId.isValid(packageId)) {
          console.error(`Invalid packageId format: ${packageId}`);
          req.flash('error_msg', 'Invalid package format. Please try again.');
          return res.redirect('/packages');
        }

        package = await MarketingPackage.findById(packageId);

        if (!package) {
          console.error(`Package not found with ID: ${packageId}`);
          req.flash('error_msg', 'Package not found. Please select another package.');
          return res.redirect('/packages');
        }

        if (!package.isActive) {
          console.error(`Package is inactive: ${package.name} (${package._id})`);
          req.flash('error_msg', 'This package is no longer available. Please select another package.');
          return res.redirect('/packages');
        }

        // Log package information for debugging
        console.log(`Creating inquiry for package: ${package.name} (${package._id})`);
        console.log(`Package details: Price=${package.price}, Active=${package.isActive}`);
      } catch (packageError) {
        console.error('Error validating package:', packageError);
        req.flash('error_msg', 'There was an error processing your request. Please try again.');
        return res.redirect('/packages');
      }


      // Create new inquiry
      const newInquiry = new PackageInquiry({
        packageId,
        name,
        email,
        phone,
        message: message || '',
        budget: budget ? parseInt(budget, 10) : 0,
        preferences: preferences ? (Array.isArray(preferences) ? preferences : [preferences]) : []
      });

      await newInquiry.save();

      // Send confirmation email to the user
      try {
        await sendPackageInquiryConfirmation(email, name, package.name);
        console.log(`Confirmation email sent to ${email} for package inquiry`);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue with the process even if email fails
      }

      // Check if it's an AJAX request
      const isAjaxRequest = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
      console.log('Request headers:', req.headers);
      console.log('Is AJAX request:', isAjaxRequest);

      if (isAjaxRequest) {
        // For AJAX requests, return a JSON response
        console.log('Sending JSON success response');
        return res.status(200).json({
          success: true,
          message: 'Your inquiry has been submitted successfully. We will contact you soon!',
          packageId: packageId
        });
      } else {
        // For regular form submissions, use flash message and redirect
        console.log('Sending redirect response with flash message');
        req.flash('success_msg', 'Your inquiry has been submitted successfully. We will contact you soon!');
        res.redirect(`/packages/${packageId}?success=true`);
      }
    } catch (err) {
      console.error('Error submitting package inquiry:', err);

      // Check if it's an AJAX request
      const isAjaxRequest = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
      console.log('Error handling - Request headers:', req.headers);
      console.log('Error handling - Is AJAX request:', isAjaxRequest);

      if (isAjaxRequest) {
        // For AJAX requests, return a JSON error
        console.log('Sending JSON error response');
        return res.status(500).json({
          success: false,
          message: 'Failed to submit inquiry. Please try again later.',
          error: err.message
        });
      } else {
        // For regular form submissions, use flash message and redirect
        console.log('Sending redirect response with error flash message');
        req.flash('error_msg', 'Failed to submit inquiry. Please try again later.');
        res.redirect('/packages');
      }
    }
  },

  // Get AI package recommendation
  getAiRecommendation: async (req, res) => {
    try {
      const { budget, preferences } = req.body;

      // Convert budget to number
      const budgetNum = parseInt(budget, 10) || 0;

      // Get all active packages
      const packages = await MarketingPackage.find({ isActive: true }).sort({ price: 1 });

      // Filter packages by budget
      const affordablePackages = packages.filter(pkg => pkg.price <= budgetNum);

      if (affordablePackages.length === 0) {
        return res.json({
          success: false,
          message: 'No packages found within your budget. Please increase your budget or contact us for a custom solution.'
        });
      }

      // Simple recommendation algorithm - can be enhanced later
      let recommendedPackage;

      // If preferences are provided, try to match them
      if (preferences && preferences.length > 0) {
        // Convert preferences to array if it's not already
        const prefsArray = Array.isArray(preferences) ? preferences : [preferences];

        // Score each package based on preferences
        const scoredPackages = affordablePackages.map(pkg => {
          let score = 0;

          // Check for AI content feature
          if (prefsArray.includes('ai-content') && pkg.features.aiContent) {
            score += 1;
          }

          // Check for SEO feature
          if (prefsArray.includes('seo') && pkg.features.seo) {
            score += 1;
          }

          // Check for full AI feature
          if (prefsArray.includes('full-ai') && pkg.features.fullAi) {
            score += 1;
          }

          // Check for multiple pages
          if (prefsArray.includes('multiple-pages') && pkg.pagesAllowed > 1) {
            score += 1;
          }

          return { package: pkg, score };
        });

        // Sort by score (highest first)
        scoredPackages.sort((a, b) => b.score - a.score);

        // Get the highest scored package
        recommendedPackage = scoredPackages[0].package;
      } else {
        // If no preferences, recommend the most expensive affordable package
        recommendedPackage = affordablePackages[affordablePackages.length - 1];
      }

      return res.json({
        success: true,
        package: {
          id: recommendedPackage._id,
          name: recommendedPackage.name,
          price: recommendedPackage.price,
          description: recommendedPackage.description,
          features: recommendedPackage.features,
          pagesAllowed: recommendedPackage.pagesAllowed,
          isFree: recommendedPackage.isFree
        }
      });
    } catch (err) {
      console.error('Error getting AI recommendation:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to get recommendation. Please try again later.'
      });
    }
  },

  // Admin: Get all package inquiries
  getAdminInquiries: async (req, res) => {
    try {
      // Check if we need to repair inquiries or force refresh
      const repair = req.query.repair === 'true';
      const forceRefresh = req.query.force === 'true';

      // Find all inquiries - force database refresh by using lean() and timeout options
      let query = PackageInquiry.find();

      // If force refresh is enabled, use a fresh query with no caching
      if (forceRefresh) {
        // Add a timestamp parameter to bypass any caching
        query = query.setOptions({
          maxTimeMS: 60000, // Increase timeout for force refresh
          noCursorTimeout: true,
          lean: { virtuals: true }
        });
        console.log('Force refresh enabled - using extended query timeout');
      } else {
        query = query.lean({ virtuals: true }).maxTimeMS(30000);
      }

      // Execute the query
      const inquiries = await query.sort({ createdAt: -1 });

      // Log the number of inquiries found and their details
      console.log(`Found ${inquiries.length} package inquiries`);

      // Log each inquiry for debugging
      inquiries.forEach((inquiry, index) => {
        console.log(`Inquiry ${index + 1}: ID=${inquiry._id}, Name=${inquiry.name}, Email=${inquiry.email}, Package=${inquiry.packageId}, Status=${inquiry.status}, Created=${inquiry.createdAt}`);
      });

      // Double-check total count directly from the database
      const totalCount = await PackageInquiry.countDocuments();
      console.log(`Total inquiries in database: ${totalCount}`);

      if (totalCount !== inquiries.length) {
        console.warn(`Warning: Inquiry count mismatch. Database has ${totalCount} but only ${inquiries.length} were retrieved.`);
      }

      // Get all active packages for reference
      const allPackages = await MarketingPackage.find({ isActive: true });
      console.log(`Found ${allPackages.length} active packages for reference`);

      // Create a map of package IDs to package objects for quick lookup
      const packageMap = {};
      allPackages.forEach(pkg => {
        packageMap[pkg._id.toString()] = pkg;
      });

      // Try to populate package details for each inquiry
      for (let i = 0; i < inquiries.length; i++) {
        try {
          // Check if packageId exists and is valid
          if (inquiries[i].packageId) {
            // Convert packageId to string for comparison if it's an ObjectId
            const packageIdStr = typeof inquiries[i].packageId === 'object' && inquiries[i].packageId._id
              ? inquiries[i].packageId._id.toString()
              : inquiries[i].packageId.toString();

            // Try to find the package in our map first (faster than database query)
            if (packageMap[packageIdStr]) {
              inquiries[i].packageId = packageMap[packageIdStr];
              console.log(`Successfully mapped package ${packageMap[packageIdStr].name} for inquiry ${inquiries[i]._id}`);
            } else {
              // If not in our map, try to find it directly in the database
              try {
                // Make sure packageId is valid before trying to find it
                if (mongoose.Types.ObjectId.isValid(packageIdStr)) {
                  const package = await MarketingPackage.findById(packageIdStr);
                  if (package) {
                    inquiries[i].packageId = package;
                    console.log(`Successfully retrieved package ${package.name} for inquiry ${inquiries[i]._id}`);
                    // Add to our map for future reference
                    packageMap[packageIdStr] = package;
                  } else {
                    console.log(`Package not found for ID: ${packageIdStr}`);
                    inquiries[i].packageId = { name: 'Unknown Package', price: 0 };
                  }
                } else {
                  console.log(`Invalid packageId for inquiry ${inquiries[i]._id}: ${packageIdStr}`);
                  inquiries[i].packageId = { name: 'Invalid Package', price: 0 };

                  // If repair mode is on, try to fix the invalid packageId
                  if (repair) {
                    try {
                      // Use the first active package as a fallback
                      const anyPackage = allPackages.length > 0 ? allPackages[0] : await MarketingPackage.findOne({ isActive: true });
                      if (anyPackage) {
                        // Update the inquiry with a valid package
                        const inquiryToUpdate = await PackageInquiry.findById(inquiries[i]._id);
                        if (inquiryToUpdate) {
                          inquiryToUpdate.packageId = anyPackage._id;
                          await inquiryToUpdate.save();
                          console.log(`Fixed invalid packageId for inquiry ${inquiryToUpdate._id} with package ${anyPackage.name}`);
                          // Update the in-memory object too
                          inquiries[i].packageId = anyPackage;
                        }
                      }
                    } catch (fixError) {
                      console.error(`Error fixing invalid packageId:`, fixError);
                    }
                  }
                }
              } catch (findError) {
                console.error(`Error finding package for inquiry ${inquiries[i]._id}:`, findError);
                // Set a default package object to prevent null reference errors
                inquiries[i].packageId = { name: 'Error Loading Package', price: 0 };
              }
            }
          } else {
            console.log(`No packageId for inquiry ${inquiries[i]._id}`);
            inquiries[i].packageId = { name: 'Missing Package', price: 0 };
          }
        } catch (processError) {
          console.error(`Error processing inquiry ${i}:`, processError);
          inquiries[i].packageId = { name: 'Error Processing', price: 0 };
        }


      }

      // Special fix for specific inquiry if requested
      if (repair && req.query.specific) {
        try {
          // Get the specific inquiry ID from the query parameter
          const specificInquiryId = req.query.specific;

          if (specificInquiryId && mongoose.Types.ObjectId.isValid(specificInquiryId)) {
            console.log(`Attempting to fix specific inquiry: ${specificInquiryId}`);
            const specificInquiry = await PackageInquiry.findById(specificInquiryId);

            if (specificInquiry) {
              // Find any active package to use as a replacement
              const anyPackage = await MarketingPackage.findOne({ isActive: true });
              if (anyPackage) {
                specificInquiry.packageId = anyPackage._id;
                await specificInquiry.save();
                console.log(`Fixed specific inquiry ${specificInquiryId} with package ${anyPackage.name}`);
                req.flash('success_msg', `Successfully fixed inquiry ${specificInquiryId} with package ${anyPackage.name}`);

                // Update the inquiry in the inquiries array if it exists there
                const inquiryIndex = inquiries.findIndex(inq => inq._id.toString() === specificInquiryId);
                if (inquiryIndex !== -1) {
                  inquiries[inquiryIndex].packageId = anyPackage;
                  console.log(`Updated in-memory inquiry at index ${inquiryIndex}`);
                }
              } else {
                console.log(`No active packages found to fix inquiry ${specificInquiryId}`);
                req.flash('error_msg', 'No active packages found to fix the inquiry');
              }
            } else {
              console.log(`Specific inquiry not found: ${specificInquiryId}`);
              req.flash('error_msg', `Inquiry with ID ${specificInquiryId} not found`);
            }
          } else {
            console.log(`Invalid inquiry ID: ${specificInquiryId}`);
            req.flash('error_msg', `Invalid inquiry ID format: ${specificInquiryId}`);
          }
        } catch (specialFixError) {
          console.error('Error applying special fix:', specialFixError);
          req.flash('error_msg', 'Error fixing specific inquiry: ' + specialFixError.message);
        }
      }

      // Add appropriate success messages
      if (repair && !req.query.specific) {
        req.flash('success_msg', 'Inquiry repair process completed. Any issues with package references have been fixed.');
      }

      if (forceRefresh) {
        req.flash('success_msg', `Force refresh completed. Found ${inquiries.length} inquiries.`);
      }

      res.render('admin/package-inquiries', {
        title: 'Package Inquiries - Admin',
        inquiries,
        user: req.user,
        repairMode: repair,
        forceRefresh: forceRefresh
      });
    } catch (err) {
      console.error('Error fetching package inquiries:', err);
      req.flash('error_msg', 'Failed to load inquiries. Please try again later.');
      res.redirect('/admin');
    }
  },

  // Admin: Update inquiry status
  updateInquiryStatus: async (req, res) => {
    try {
      const { inquiryId, status } = req.body;

      const inquiry = await PackageInquiry.findById(inquiryId);

      if (!inquiry) {
        req.flash('error_msg', 'Inquiry not found.');
        return res.redirect('/admin/package-inquiries');
      }

      // Store the old status to check if this is a new approval
      const oldStatus = inquiry.status;

      // Update the inquiry
      inquiry.status = status;
      inquiry.updatedAt = Date.now();
      await inquiry.save();

      // If the status is being changed to 'approved', send an approval email
      if (status === 'approved' && oldStatus !== 'approved') {
        try {
          let packageName = 'Website Package';

          // Try to get package details
          if (inquiry.packageId) {
            try {
              // Populate the package details if not already populated
              if (typeof inquiry.packageId === 'string' || !inquiry.packageId.name) {
                await inquiry.populate({
                  path: 'packageId',
                  model: 'MarketingPackage'
                });
              }

              // If population failed, try to get the package directly
              if (typeof inquiry.packageId === 'string' || !inquiry.packageId.name) {
                if (mongoose.Types.ObjectId.isValid(inquiry.packageId)) {
                  const package = await MarketingPackage.findById(inquiry.packageId);
                  if (package && package.name) {
                    packageName = package.name;
                  }
                }
              } else {
                // Population succeeded
                packageName = inquiry.packageId.name;
              }
            } catch (packageError) {
              console.error('Error getting package details for approval email:', packageError);
              // Continue with default package name
            }
          }

          // Send approval email
          await sendPackageApprovalNotification(inquiry.email, inquiry.name, packageName);
          console.log(`Approval email sent to ${inquiry.email} for package ${packageName}`);
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Continue with the process even if email fails
        }
      }

      req.flash('success_msg', 'Inquiry status updated successfully.');
      res.redirect('/admin/package-inquiries');
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      req.flash('error_msg', 'Failed to update inquiry status. Please try again later.');
      res.redirect('/admin/package-inquiries');
    }
  },

  // Admin: Delete inquiry
  deleteInquiry: async (req, res) => {
    try {
      const { inquiryId } = req.params;

      await PackageInquiry.findByIdAndDelete(inquiryId);

      req.flash('success_msg', 'Inquiry deleted successfully.');
      res.redirect('/admin/package-inquiries');
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      req.flash('error_msg', 'Failed to delete inquiry. Please try again later.');
      res.redirect('/admin/package-inquiries');
    }
  }
};
