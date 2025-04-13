const Payment = require('../models/Payment');
const Website = require('../models/Website');
const Package = require('../models/Package');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = {
  // Get payment history for user
  getPaymentHistory: async (req, res) => {
    try {
      const payments = await Payment.find({ userId: req.user._id })
        .populate('websiteId', 'name domain')
        .populate('packageId', 'name price')
        .sort({ createdAt: -1 });
      
      res.render('website-builder/payment-history', {
        title: 'Payment History - FTRAISE AI',
        payments,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payment history:', err);
      req.flash('error_msg', 'Failed to load payment history. Please try again later.');
      res.redirect('/website-builder/dashboard');
    }
  },
  
  // Get payment details
  getPaymentDetails: async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      const payment = await Payment.findById(paymentId)
        .populate('websiteId', 'name domain')
        .populate('packageId', 'name price');
      
      if (!payment || payment.userId.toString() !== req.user._id.toString()) {
        req.flash('error_msg', 'Payment not found or you do not have permission to view it.');
        return res.redirect('/website-builder/payment-history');
      }
      
      res.render('website-builder/payment-details', {
        title: 'Payment Details - FTRAISE AI',
        payment,
        user: req.user
      });
    } catch (err) {
      console.error('Error fetching payment details:', err);
      req.flash('error_msg', 'Failed to load payment details. Please try again later.');
      res.redirect('/website-builder/payment-history');
    }
  },
  
  // Create a new payment
  createPayment: async (req, res) => {
    try {
      const { websiteId } = req.params;
      
      // Get website and check ownership
      const website = await Website.findById(websiteId)
        .populate('packageId');
      
      if (!website || website.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      // Check if already paid
      if (website.isPaid) {
        return res.status(400).json({ success: false, message: 'Payment has already been completed for this website' });
      }
      
      // Check if it's a free package
      if (website.packageId.isFree) {
        return res.status(400).json({ success: false, message: 'This is a free package and does not require payment' });
      }
      
      // Create Razorpay order
      const options = {
        amount: website.packageId.price * 100, // amount in paise
        currency: 'INR',
        receipt: `website_${websiteId}`,
        payment_capture: 1
      };
      
      const order = await razorpay.orders.create(options);
      
      // Save payment details
      const payment = new Payment({
        userId: req.user._id,
        websiteId,
        packageId: website.packageId._id,
        amount: website.packageId.price,
        razorpayOrderId: order.id
      });
      
      await payment.save();
      
      return res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        payment_id: payment._id
      });
    } catch (err) {
      console.error('Error creating payment:', err);
      return res.status(500).json({ success: false, message: 'Failed to create payment' });
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
      const website = await Website.findById(websiteId);
      
      if (!website) {
        return res.status(404).json({ success: false, message: 'Website not found' });
      }
      
      website.isPaid = true;
      await website.save();
      
      return res.json({ success: true, message: 'Payment verified successfully' });
    } catch (err) {
      console.error('Error verifying payment:', err);
      return res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
  }
};
