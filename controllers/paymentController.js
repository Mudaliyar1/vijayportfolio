const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
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
      const package = await Package.findById(packageId);

      if (!package || !package.active) {
        req.flash('error_msg', 'Package not found or inactive');
        return res.redirect('/buy-package');
      }

      // Create Razorpay order
      const options = {
        amount: package.price * 100, // Razorpay amount is in paise
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
        amount: package.price,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        notes: websiteId ? { websiteId } : {}
      });

      await payment.save();

      // Render checkout page
      res.render('payments/checkout', {
        title: 'Checkout - FTRAISE AI',
        package,
        order,
        user: req.user,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        websiteId
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
        websiteId
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
      user.maxWebsites = Math.max(user.maxWebsites, 1); // Ensure at least 1 website

      await user.save();

      // Check if this payment is for a specific website
      const websiteIdFromNotes = payment.notes && payment.notes.websiteId;
      const siteId = websiteId || websiteIdFromNotes;

      if (siteId) {
        // Update the website to published status
        const Website = require('../models/Website');
        const website = await Website.findById(siteId);

        if (website && website.user.toString() === user._id.toString()) {
          website.isPublished = true;
          await website.save();

          // Increment user's website count
          user.websiteCount += 1;
          await user.save();

          req.flash('success_msg', `Successfully purchased ${package.name} package! Your website is now published.`);
          return res.redirect(`/dashboard/websites/${siteId}`);
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
        user: req.user
      });
    } catch (err) {
      console.error('Error loading payment success page:', err);
      req.flash('error_msg', 'Failed to load payment details');
      res.redirect('/dashboard/websites');
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
        user: req.user
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
        user: req.user
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
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payment details:', err);
      req.flash('error_msg', 'Failed to load payment details');
      res.redirect('/admin/payments');
    }
  }
};
