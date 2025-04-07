const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const User = require('../models/User');
const Package = require('../models/Package');
const Payment = require('../models/Payment');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = {
  // Create order for package purchase
  createOrder: async (req, res) => {
    try {
      const packageId = req.params.id;
      const websiteId = req.query.websiteId; // Get website ID if available
      const isPackageUpdate = req.query.isPackageUpdate === 'true'; // Check if this is a package update
      const package = await Package.findById(packageId);

      if (!package) {
        req.flash('error_msg', 'This package has been deleted by the administrator. Please choose another package.');
        return res.redirect('/buy-package');
      }

      if (!package.active || package.isDeleted) {
        req.flash('error_msg', 'This package has been deactivated by the administrator. Please choose another package.');
        return res.redirect('/buy-package');
      }

      // If the package is free, redirect to publish directly
      if (package.isFree && websiteId) {
        // Get the website
        const Website = require('../models/Website');
        const website = await Website.findById(websiteId);

        if (website && website.user.toString() === req.user._id.toString()) {
          // Update website package
          website.package = packageId;

          // If it's a package update, just update the package
          if (isPackageUpdate) {
            await website.save();
            req.flash('success_msg', `Website package updated to ${package.name}`);
            return res.redirect(`/dashboard/websites/${websiteId}`);
          } else {
            // Otherwise, publish the website
            website.isPublished = true;
            await website.save();
            req.flash('success_msg', `Your website has been published with the free ${package.name} package!`);
            return res.redirect(`/dashboard/websites/${websiteId}`);
          }
        }
      }

      // If this is a package update, check if the website exists and belongs to the user
      if (isPackageUpdate && websiteId) {
        const Website = require('../models/Website');
        const website = await Website.findById(websiteId);

        if (!website || website.user.toString() !== req.user._id.toString()) {
          req.flash('error_msg', 'Website not found');
          return res.redirect('/dashboard/websites');
        }
      }

      // Check if we're coming from the scratch card (with discount applied)
      const hasDiscount = req.query.hasDiscount === 'true';
      let finalPrice = package.price;
      let discountAmount = 0;

      // Create a unique key for this package and website combination
      const discountKey = `discount_${packageId}_${websiteId || 'no_website'}`;

      // Check if package price has changed since the discount was generated
      const priceChanged = req.session[discountKey] &&
                          req.session[discountKey].originalPrice !== package.price;

      // Clear session discount if price has changed
      if (priceChanged) {
        console.log('Package price changed, clearing discount');
        delete req.session[discountKey];
      }

      if (hasDiscount) {
        // Get the discount amount from the query parameters
        discountAmount = parseInt(req.query.discountAmount) || 0;
        finalPrice = parseInt(req.query.finalPrice) || package.price;

        // Store in session for persistence
        req.session[discountKey] = {
          discountAmount,
          finalPrice,
          originalPrice: package.price
        };
      } else if (req.session[discountKey]) {
        // If user refreshes, use the same discount from session
        console.log('Using existing discount from session');
        discountAmount = req.session[discountKey].discountAmount;
        finalPrice = req.session[discountKey].finalPrice;
      } else {
        // Show scratch card first before proceeding to payment
        // Generate a random discount between 5% and 20% of the package price
        const minDiscount = Math.ceil(package.price * 0.05); // Minimum 5%
        const maxDiscount = Math.ceil(package.price * 0.20); // Maximum 20%
        discountAmount = Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;

        // Ensure discount doesn't exceed package price
        discountAmount = Math.min(discountAmount, package.price - 1);
        finalPrice = package.price - discountAmount;

        // Store in session for persistence
        req.session[discountKey] = {
          discountAmount,
          finalPrice,
          originalPrice: package.price
        };

        return res.render('payments/scratch-card', {
          title: 'Scratch & Save - FTRAISE AI',
          package,
          user: req.user,
          websiteId,
          isPackageUpdate,
          discountAmount,
          finalPrice,
          layout: 'layouts/blank' // Use the blank layout with no header or footer
        });
      }

      // Create Razorpay order with discounted price
      const options = {
        amount: finalPrice * 100, // Razorpay amount is in paise
        currency: 'INR',
        receipt: `receipt_${uuidv4().substring(0, 8)}`,
        payment_capture: 1 // Auto-capture
      };

      const order = await razorpay.orders.create(options);

      // Save payment record with website reference if available
      const payment = new Payment({
        user: req.user._id,
        package: packageId,
        razorpayOrderId: order.id,
        amount: finalPrice,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        notes: websiteId ? {
          websiteId,
          isPackageUpdate: isPackageUpdate || false,
          originalPrice: package.price,
          discountAmount: discountAmount
        } : {
          originalPrice: package.price,
          discountAmount: discountAmount
        }
      });

      await payment.save();

      // Render checkout page
      res.render('payments/checkout', {
        title: 'Checkout - FTRAISE AI',
        package,
        order,
        user: req.user,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        websiteId,
        isPackageUpdate,
        originalPrice: package.price,
        discountAmount,
        finalPrice
      });
    } catch (err) {
      console.error('Error creating order:', err);
      req.flash('error_msg', 'Failed to create payment order');
      res.redirect('/buy-package');
    }
  },

  // Verify payment and update user package
  verifyPayment: async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        websiteId,
        isPackageUpdate
      } = req.body;

      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        req.flash('error_msg', 'Payment verification failed');
        return res.redirect('/buy-package');
      }

      // Update payment record
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

      if (!payment) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/buy-package');
      }

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'paid';
      await payment.save();

      // Update user package
      const package = await Package.findById(payment.package);
      const user = await User.findById(req.user._id);

      // Set package expiry date (1 year from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      user.activePackage = payment.package;
      user.packageExpiryDate = expiryDate;
      user.maxWebsites = 999999; // Set to effectively unlimited websites

      await user.save();

      // Check if this payment is for a specific website
      const websiteIdFromNotes = payment.notes && payment.notes.websiteId;
      const isPackageUpdateFromNotes = payment.notes && payment.notes.isPackageUpdate;
      const siteId = websiteId || websiteIdFromNotes;
      const isUpdatingPackage = isPackageUpdate === 'true' || isPackageUpdateFromNotes === true;

      if (siteId) {
        // Get the website
        const Website = require('../models/Website');
        const website = await Website.findById(siteId);

        if (website && website.user.toString() === user._id.toString()) {
          // If this is a package update, update the package and clear the needsPackageUpdate flag
          if (isUpdatingPackage) {
            website.package = payment.package;
            website.needsPackageUpdate = false;
            website.isPublished = true; // Re-publish the website
            await website.save();

            req.flash('success_msg', `Successfully updated to ${package.name} package! Your website is now published.`);
            return res.redirect(`/dashboard/websites/${siteId}`);
          } else {
            // Regular website publishing
            website.isPublished = true;
            await website.save();

            // Increment user's website count
            user.websiteCount += 1;
            await user.save();

            req.flash('success_msg', `Successfully purchased ${package.name} package! Your website is now published.`);
            return res.redirect(`/dashboard/websites/${siteId}`);
          }
        }
      }

      req.flash('success_msg', `Successfully purchased ${package.name} package!`);
      res.redirect('/dashboard/websites');
    } catch (err) {
      console.error('Error verifying payment:', err);
      req.flash('error_msg', 'Failed to verify payment');
      res.redirect('/buy-package');
    }
  },

  // Apply discount from scratch card
  applyDiscount: async (req, res) => {
    try {
      const { packageId, websiteId, discountAmount, finalPrice, isPackageUpdate, scratchComplete } = req.body;

      // Verify the scratch card was completed
      if (scratchComplete !== 'true') {
        req.flash('error_msg', 'Please scratch the card completely to reveal your discount');
        return res.redirect(`/payment/create-order/${packageId}?websiteId=${websiteId}&isPackageUpdate=${isPackageUpdate}`);
      }

      // Redirect to create order with discount applied
      return res.redirect(`/payment/create-order/${packageId}?websiteId=${websiteId}&isPackageUpdate=${isPackageUpdate}&hasDiscount=true&discountAmount=${discountAmount}&finalPrice=${finalPrice}`);
    } catch (err) {
      console.error('Error applying discount:', err);
      req.flash('error_msg', 'Failed to apply discount');
      res.redirect('/dashboard/websites');
    }
  },

  // Payment success page
  paymentSuccess: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId)
        .populate('package')
        .populate('user');

      if (!payment || payment.user._id.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/dashboard/websites');
      }

      res.render('payments/success', {
        title: 'Payment Success - FTRAISE AI',
        payment,
        user: req.user,
        layout: 'layouts/no-footer' // Use the no-footer layout to match admin pages
      });
    } catch (err) {
      console.error('Error loading payment success page:', err);
      req.flash('error_msg', 'Failed to load payment details');
      res.redirect('/dashboard/websites');
    }
  },

  // Download payment receipt
  downloadReceipt: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId)
        .populate('package')
        .populate('user');

      if (!payment || payment.user._id.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/dashboard/websites');
      }

      // Generate PDF receipt
      const { generatePaymentReceipt } = require('../utils/pdfGenerator');
      const tempDir = path.join(__dirname, '../temp');

      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `receipt_${payment._id}.pdf`);

      await generatePaymentReceipt(payment, outputPath);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.razorpayOrderId}.pdf`);

      // Stream the file to the response
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Delete the file after sending
      fileStream.on('end', () => {
        fs.unlinkSync(outputPath);
      });
    } catch (err) {
      console.error('Error generating receipt:', err);
      req.flash('error_msg', 'Failed to generate receipt');
      res.redirect('/payment/history');
    }
  },

  // Admin download payment receipt
  adminDownloadReceipt: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId)
        .populate('package')
        .populate('user');

      if (!payment) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/admin/payments');
      }

      // Generate PDF receipt
      const { generatePaymentReceipt } = require('../utils/pdfGenerator');
      const tempDir = path.join(__dirname, '../temp');

      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `receipt_${payment._id}.pdf`);

      await generatePaymentReceipt(payment, outputPath);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.razorpayOrderId}.pdf`);

      // Stream the file to the response
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Delete the file after sending
      fileStream.on('end', () => {
        fs.unlinkSync(outputPath);
      });
    } catch (err) {
      console.error('Error generating receipt:', err);
      req.flash('error_msg', 'Failed to generate receipt');
      res.redirect('/admin/payments');
    }
  },

  // Retry payment for an existing order
  retryPayment: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId)
        .populate('package');

      if (!payment || payment.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/payment/history');
      }

      if (payment.status !== 'created') {
        req.flash('error_msg', 'This payment cannot be retried');
        return res.redirect('/payment/history');
      }

      // Check if package still exists and is active
      const package = await Package.findById(payment.package._id);
      if (!package) {
        req.flash('error_msg', 'This package has been deleted by the administrator. Please choose another package.');
        return res.redirect('/buy-package');
      }

      // Check if the package has been changed from paid to free
      if (package.isFree) {
        // Get website ID from payment notes
        const websiteId = payment.notes && payment.notes.websiteId ? payment.notes.websiteId : null;

        if (websiteId) {
          // Update the website with the free package
          const Website = require('../models/Website');
          const website = await Website.findById(websiteId);

          if (website) {
            // Update website package
            website.package = package._id;
            website.isPublished = true;
            await website.save();

            // Delete the payment record since it's no longer needed
            await Payment.findByIdAndDelete(paymentId);

            req.flash('success_msg', 'Good news! This package is now free. Your website has been published at no cost.');
            return res.redirect(`/dashboard/websites/${websiteId}`);
          }
        }

        // If no website ID or website not found
        req.flash('success_msg', 'Good news! This package is now free. You can use it at no cost.');
        return res.redirect('/dashboard/websites');
      }

      if (!package.active || package.isDeleted) {
        // Get website ID from payment notes
        const websiteId = payment.notes && payment.notes.websiteId ? payment.notes.websiteId : null;

        if (websiteId) {
          // Update the website to indicate it needs a package update
          const Website = require('../models/Website');
          const website = await Website.findById(websiteId);

          if (website) {
            website.needsPackageUpdate = true;
            await website.save();
          }
        }

        req.flash('error_msg', 'This package has been deactivated by the administrator. Please choose another package.');
        return res.redirect('/buy-package');
      }

      // Check if package price has changed
      const priceChanged = payment.notes &&
                          payment.notes.originalPrice !== package.price;

      // If price has changed, always show a new scratch card
      if (priceChanged) {
        console.log('Package price changed, showing new scratch card');
        const websiteId = payment.notes && payment.notes.websiteId ? payment.notes.websiteId : null;
        const isPackageUpdate = payment.notes && payment.notes.isPackageUpdate ? payment.notes.isPackageUpdate : false;

        // Clear any existing discount for this package
        const discountKey = `discount_${package._id}_${websiteId || 'no_website'}`;
        if (req.session[discountKey]) {
          delete req.session[discountKey];
        }

        // Generate a new random discount between 5% and 20% of the package price
        const minDiscount = Math.ceil(package.price * 0.05); // Minimum 5%
        const maxDiscount = Math.ceil(package.price * 0.20); // Maximum 20%
        const discountAmount = Math.floor(Math.random() * (maxDiscount - minDiscount + 1)) + minDiscount;

        // Ensure discount doesn't exceed package price
        const finalDiscount = Math.min(discountAmount, package.price - 1);
        const finalPrice = package.price - finalDiscount;

        // Store in session for persistence
        req.session[discountKey] = {
          discountAmount: finalDiscount,
          finalPrice,
          originalPrice: package.price
        };

        // Delete the old payment record since we're creating a new one
        await Payment.findByIdAndDelete(paymentId);

        // Render the scratch card page
        return res.render('payments/scratch-card', {
          title: 'Scratch & Save - FTRAISE AI',
          package,
          user: req.user,
          websiteId,
          isPackageUpdate,
          discountAmount: finalDiscount,
          finalPrice,
          layout: 'layouts/blank' // Use the blank layout with no header or footer
        });
      }

      // If price hasn't changed, render checkout page with existing order
      res.render('payments/checkout', {
        title: 'Checkout - FTRAISE AI',
        package: payment.package,
        order: {
          id: payment.razorpayOrderId,
          amount: payment.amount * 100, // Convert to paise for Razorpay
          currency: payment.currency
        },
        user: req.user,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        websiteId: payment.notes && payment.notes.websiteId ? payment.notes.websiteId : null,
        isPackageUpdate: payment.notes && payment.notes.isPackageUpdate ? payment.notes.isPackageUpdate : false,
        originalPrice: payment.notes && payment.notes.originalPrice ? payment.notes.originalPrice : payment.amount,
        discountAmount: payment.notes && payment.notes.discountAmount ? payment.notes.discountAmount : 0,
        finalPrice: payment.amount
      });
    } catch (err) {
      console.error('Error retrying payment:', err);
      req.flash('error_msg', 'Failed to retry payment');
      res.redirect('/payment/history');
    }
  },

  // Delete payment record (user)
  deletePaymentRecord: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        req.flash('error_msg', 'Payment record not found');
        return res.redirect('/payment/history');
      }

      // Check if the payment belongs to the current user
      if (payment.user.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'You are not authorized to delete this payment record');
        return res.redirect('/payment/history');
      }

      // Don't allow deleting paid payments that are linked to websites
      if (payment.status === 'paid' && payment.notes && payment.notes.websiteId) {
        req.flash('error_msg', 'Cannot delete payment record linked to an active website');
        return res.redirect('/payment/history');
      }

      // Delete the payment record
      await Payment.findByIdAndDelete(paymentId);

      req.flash('success_msg', 'Payment record deleted successfully');
      return res.redirect('/payment/history');
    } catch (err) {
      console.error('Error deleting payment record:', err);
      req.flash('error_msg', 'Failed to delete payment record');
      return res.redirect('/payment/history');
    }
  },

  // Get payment history for user
  getPaymentHistory: async (req, res) => {
    try {
      const payments = await Payment.find({ user: req.user._id })
        .populate('package')
        .sort({ createdAt: -1 });

      res.render('payments/history', {
        title: 'Payment History - FTRAISE AI',
        payments,
        user: req.user,
        layout: 'layouts/no-footer' // Use the no-footer layout to match admin pages
      });
    } catch (err) {
      console.error('Error fetching payment history:', err);
      req.flash('error_msg', 'Failed to load payment history');
      res.redirect('/dashboard/websites');
    }
  },

  // Admin: Get all payments
  adminGetAllPayments: async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate('user')
        .populate('package')
        .sort({ createdAt: -1 });

      res.render('admin/payments/index', {
        title: 'All Payments - Admin',
        payments,
        user: req.user,
        path: '/admin/payments',
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error fetching all payments:', err);
      req.flash('error_msg', 'Failed to load payments');
      res.redirect('/admin');
    }
  },

  // Admin: Get payment details
  adminGetPaymentDetails: async (req, res) => {
    try {
      const paymentId = req.params.id;
      const payment = await Payment.findById(paymentId)
        .populate('user')
        .populate('package');

      if (!payment) {
        req.flash('error_msg', 'Payment not found');
        return res.redirect('/admin/payments');
      }

      res.render('admin/payments/details', {
        title: 'Payment Details - Admin',
        payment,
        user: req.user,
        layout: 'layouts/no-footer'
      });
    } catch (err) {
      console.error('Error fetching payment details:', err);
      req.flash('error_msg', 'Failed to load payment details');
      res.redirect('/admin/payments');
    }
  },

  // Admin: Bulk delete payments
  adminBulkDeletePayments: async (req, res) => {
    try {
      const { paymentIds } = req.body;

      if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
        req.flash('error_msg', 'No payments selected for deletion');
        return res.redirect('/admin/payments');
      }

      // Delete all selected payments
      const result = await Payment.deleteMany({ _id: { $in: paymentIds } });

      req.flash('success_msg', `${result.deletedCount} payment records deleted successfully`);
      res.redirect('/admin/payments');
    } catch (err) {
      console.error('Error bulk deleting payments:', err);
      req.flash('error_msg', 'An error occurred while deleting the payment records');
      res.redirect('/admin/payments');
    }
  }
};
