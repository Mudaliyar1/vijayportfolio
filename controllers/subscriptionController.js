const Subscription = require('../models/Subscription');
const SubscriptionSetting = require('../models/SubscriptionSetting');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get subscription page
exports.getSubscriptionPage = async (req, res) => {
  try {
    // Check if user is already subscribed
    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      active: true,
      endDate: { $gt: new Date() }
    });

    // Get subscription settings
    const monthlyAmount = await getSubscriptionAmount('monthly');
    const yearlyAmount = await getSubscriptionAmount('yearly');

    // Get all active subscription plans
    const customPlans = await SubscriptionPlan.find({ active: true }).sort({ amount: 1 });

    res.render('subscription/index', {
      title: 'Ad-Free Subscription - FTRAISE AI',
      user: req.user,
      subscription: existingSubscription,
      monthlyAmount,
      yearlyAmount,
      customPlans,
      path: '/subscription',
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error('Error getting subscription page:', err);
    req.flash('error_msg', 'An error occurred while loading the subscription page');
    res.redirect('/dashboard');
  }
};

// Create a new subscription order
exports.createSubscriptionOrder = async (req, res) => {
  try {
    const { plan, planId } = req.body;
    let amount, planName, planDuration, planDurationUnit;

    // Check if it's a custom plan or standard plan
    if (planId) {
      // Custom plan
      const customPlan = await SubscriptionPlan.findById(planId);
      if (!customPlan || !customPlan.active) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive subscription plan'
        });
      }

      amount = customPlan.amount;
      planName = customPlan.name;
      planDuration = customPlan.duration;
      planDurationUnit = customPlan.durationUnit;
    } else {
      // Standard plan (monthly/yearly)
      if (!['monthly', 'yearly'].includes(plan)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription plan'
        });
      }

      // Get subscription amount
      amount = await getSubscriptionAmount(plan);
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Subscription amount not configured'
        });
      }

      planName = plan === 'monthly' ? 'Monthly Plan' : 'Yearly Plan';
      planDuration = plan === 'monthly' ? 1 : 1;
      planDurationUnit = plan === 'monthly' ? 'months' : 'years';
    }

    // Create Razorpay order
    // Generate a shorter receipt ID (max 40 chars)
    const shortUserId = req.user._id.toString().slice(-8); // Last 8 chars of user ID
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits of timestamp
    const receiptId = `sub_${shortUserId}_${timestamp}`;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: amount * 100,
      currency: 'INR',
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || '',
      plan,
      planId,
      planName,
      planDuration,
      planDurationUnit
    });
  } catch (err) {
    console.error('Error creating subscription order:', err);

    // Get detailed error message if available
    let errorMessage = 'An error occurred while creating the subscription order';
    if (err.error && err.error.description) {
      errorMessage = err.error.description;
    }

    res.status(err.statusCode || 500).json({
      success: false,
      message: errorMessage,
      error: err.error || err.message
    });
  }
};

// Verify and save subscription payment
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan, planId, planDuration, planDurationUnit } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    let amount, endDate;

    // Check if it's a custom plan or standard plan
    if (planId) {
      // Custom plan
      const customPlan = await SubscriptionPlan.findById(planId);
      if (!customPlan || !customPlan.active) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive subscription plan'
        });
      }

      amount = customPlan.amount;

      // Calculate end date based on plan duration and unit
      endDate = new Date();
      switch(customPlan.durationUnit) {
        case 'seconds':
          endDate.setSeconds(endDate.getSeconds() + customPlan.duration);
          break;
        case 'minutes':
          endDate.setMinutes(endDate.getMinutes() + customPlan.duration);
          break;
        case 'hours':
          endDate.setHours(endDate.getHours() + customPlan.duration);
          break;
        case 'days':
          endDate.setDate(endDate.getDate() + customPlan.duration);
          break;
        case 'months':
          endDate.setMonth(endDate.getMonth() + customPlan.duration);
          break;
        case 'years':
          endDate.setFullYear(endDate.getFullYear() + customPlan.duration);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month
      }
    } else {
      // Standard plan (monthly/yearly)
      amount = await getSubscriptionAmount(plan);
      const durationMonths = plan === 'monthly' ? 1 : 12;

      // Calculate end date
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);
    }

    // Create subscription
    const subscription = new Subscription({
      user: req.user._id,
      active: true,
      startDate: new Date(),
      endDate,
      amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    await subscription.save();

    // Update user's ad-free status
    await User.findByIdAndUpdate(req.user._id, {
      adFree: true,
      adFreeUntil: endDate
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription._id,
        endDate: subscription.endDate
      }
    });
  } catch (err) {
    console.error('Error verifying subscription payment:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the payment'
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    // Find active subscription
    const subscription = await Subscription.findOne({
      user: req.user._id,
      active: true
    });

    if (!subscription) {
      req.flash('error_msg', 'No active subscription found');
      return res.redirect('/subscription');
    }

    // Update subscription
    subscription.active = false;
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      adFree: false,
      adFreeUntil: null
    });

    req.flash('success_msg', 'Subscription cancelled successfully');
    res.redirect('/subscription');
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    req.flash('error_msg', 'An error occurred while cancelling the subscription');
    res.redirect('/subscription');
  }
};

// Admin: Get subscription settings page
exports.getSubscriptionSettings = async (req, res) => {
  try {
    // Get subscription settings
    const monthlyAmount = await getSubscriptionAmount('monthly');
    const yearlyAmount = await getSubscriptionAmount('yearly');

    // Get all subscriptions with user details
    const subscriptions = await Subscription.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Calculate total revenue
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

    // Count active subscriptions
    const activeSubscriptions = subscriptions.filter(sub =>
      sub.active && sub.endDate > new Date()
    ).length;

    // Get all subscription plans
    const subscriptionPlans = await SubscriptionPlan.find().sort({ createdAt: -1 });

    // Get common admin data
    const MaintenanceMode = require('../models/MaintenanceMode');
    const ContactMessage = require('../models/ContactMessage');
    const Issue = require('../models/Issue');

    // Check maintenance mode
    const maintenanceSettings = await MaintenanceMode.findOne().sort({ updatedAt: -1 });
    const maintenanceMode = maintenanceSettings &&
                           maintenanceSettings.isEnabled &&
                           (!maintenanceSettings.endTime || new Date() < maintenanceSettings.endTime);

    // Get count of new contact messages
    const newMessageCount = await ContactMessage.countDocuments({ status: 'new' });

    // Get count of open issues
    const openIssueCount = await Issue.countDocuments({ status: 'Open' });

    res.render('admin/subscription-settings', {
      title: 'Subscription Settings - Admin',
      user: req.user,
      monthlyAmount,
      yearlyAmount,
      subscriptions,
      subscriptionPlans,
      totalRevenue,
      activeSubscriptions,
      path: '/subscription/admin/subscription-settings',
      layout: 'layouts/admin', // Explicitly set admin layout
      maintenanceMode, // Add maintenance mode flag
      newMessageCount, // Add new message count
      openIssueCount, // Add open issue count
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg')
    });
  } catch (err) {
    console.error('Error getting subscription settings:', err);
    req.flash('error_msg', 'An error occurred while loading subscription settings');
    res.redirect('/admin');
  }
};

// Admin: Update subscription settings
exports.updateSubscriptionSettings = async (req, res) => {
  try {
    const { monthlyAmount, yearlyAmount } = req.body;

    // Validate amounts
    if (isNaN(monthlyAmount) || isNaN(yearlyAmount) ||
        monthlyAmount <= 0 || yearlyAmount <= 0) {
      req.flash('error_msg', 'Invalid subscription amounts');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Update monthly amount
    await SubscriptionSetting.findOneAndUpdate(
      { key: 'monthlyAmount' },
      {
        key: 'monthlyAmount',
        value: parseFloat(monthlyAmount),
        description: 'Monthly subscription amount'
      },
      { upsert: true }
    );

    // Update yearly amount
    await SubscriptionSetting.findOneAndUpdate(
      { key: 'yearlyAmount' },
      {
        key: 'yearlyAmount',
        value: parseFloat(yearlyAmount),
        description: 'Yearly subscription amount'
      },
      { upsert: true }
    );

    req.flash('success_msg', 'Subscription settings updated successfully');
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error updating subscription settings:', err);
    req.flash('error_msg', 'An error occurred while updating subscription settings');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Helper function to get subscription amount
async function getSubscriptionAmount(plan) {
  try {
    const setting = await SubscriptionSetting.findOne({
      key: plan === 'monthly' ? 'monthlyAmount' : 'yearlyAmount'
    });

    return setting ? setting.value : null;
  } catch (err) {
    console.error('Error getting subscription amount:', err);
    return null;
  }
}

// Admin: Create a subscription for a user
exports.createSubscriptionForUser = async (req, res) => {
  try {
    const { userEmail, plan, duration, paymentId } = req.body;

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      req.flash('error_msg', `User with email ${userEmail} not found`);
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Get subscription amount
    const amount = await getSubscriptionAmount(plan);
    if (!amount) {
      req.flash('error_msg', 'Subscription amount not configured');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Calculate duration in months
    let durationMonths = parseInt(duration);
    if (plan === 'yearly') {
      durationMonths *= 12; // Convert years to months
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Generate payment ID if not provided
    const subscriptionPaymentId = paymentId || `admin_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Create subscription
    const subscription = new Subscription({
      user: user._id,
      active: true,
      startDate: new Date(),
      endDate,
      amount,
      paymentId: subscriptionPaymentId,
      orderId: `admin_order_${Date.now()}`
    });

    await subscription.save();

    // Update user's ad-free status
    await User.findByIdAndUpdate(user._id, {
      adFree: true,
      adFreeUntil: endDate
    });

    req.flash('success_msg', `Subscription created successfully for ${user.name} (${user.email})`);
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error creating subscription for user:', err);
    req.flash('error_msg', 'An error occurred while creating the subscription');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Cancel a user's subscription
exports.cancelUserSubscription = async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId).populate('user', 'name email');
    if (!subscription) {
      req.flash('error_msg', 'Subscription not found');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Update subscription
    subscription.active = false;
    await subscription.save();

    // Update user's ad-free status
    if (subscription.user) {
      await User.findByIdAndUpdate(subscription.user._id, {
        adFree: false,
        adFreeUntil: null
      });

      req.flash('success_msg', `Subscription cancelled for ${subscription.user.name} (${subscription.user.email})`);
    } else {
      req.flash('success_msg', 'Subscription cancelled successfully');
    }

    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error cancelling user subscription:', err);
    req.flash('error_msg', 'An error occurred while cancelling the subscription');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { name, description, amount, duration, durationUnit } = req.body;

    // Validate inputs
    if (!name || !amount || !duration || !durationUnit) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Check if plan with same name already exists
    const existingPlan = await SubscriptionPlan.findOne({ name });
    if (existingPlan) {
      req.flash('error_msg', `A plan with name "${name}" already exists`);
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Create new plan
    const plan = new SubscriptionPlan({
      name,
      description: description || '',
      amount: parseFloat(amount),
      duration: parseInt(duration),
      durationUnit,
      active: true
    });

    await plan.save();

    req.flash('success_msg', `Subscription plan "${name}" created successfully`);
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error creating subscription plan:', err);
    req.flash('error_msg', 'An error occurred while creating the subscription plan');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Toggle subscription plan status (active/inactive)
exports.toggleSubscriptionPlan = async (req, res) => {
  try {
    const planId = req.params.id;

    // Find plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      req.flash('error_msg', 'Subscription plan not found');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Toggle active status
    plan.active = !plan.active;
    await plan.save();

    req.flash('success_msg', `Subscription plan "${plan.name}" ${plan.active ? 'activated' : 'deactivated'} successfully`);
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error toggling subscription plan status:', err);
    req.flash('error_msg', 'An error occurred while updating the subscription plan');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Delete subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const planId = req.params.id;

    // Find and delete plan
    const plan = await SubscriptionPlan.findByIdAndDelete(planId);
    if (!plan) {
      req.flash('error_msg', 'Subscription plan not found');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    req.flash('success_msg', `Subscription plan "${plan.name}" deleted successfully`);
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error deleting subscription plan:', err);
    req.flash('error_msg', 'An error occurred while deleting the subscription plan');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Reactivate a cancelled subscription
exports.reactivateSubscription = async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId).populate('user', 'name email');
    if (!subscription) {
      req.flash('error_msg', 'Subscription not found');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Check if subscription is already active
    if (subscription.active && subscription.endDate > new Date()) {
      req.flash('error_msg', 'This subscription is already active');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Update subscription
    subscription.active = true;

    // If subscription has expired, extend it by 30 days from now
    if (subscription.endDate <= new Date()) {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 30); // Default 30 days extension
      subscription.endDate = newEndDate;
    }

    await subscription.save();

    // Update user's ad-free status
    if (subscription.user) {
      await User.findByIdAndUpdate(subscription.user._id, {
        adFree: true,
        adFreeUntil: subscription.endDate
      });

      req.flash('success_msg', `Subscription reactivated for ${subscription.user.name} (${subscription.user.email})`);
    } else {
      req.flash('success_msg', 'Subscription reactivated successfully');
    }

    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error reactivating subscription:', err);
    req.flash('error_msg', 'An error occurred while reactivating the subscription');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Admin: Create subscription using a plan
exports.createSubscriptionWithPlan = async (req, res) => {
  try {
    const { userEmail, planId } = req.body;

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      req.flash('error_msg', `User with email ${userEmail} not found`);
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Find plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      req.flash('error_msg', 'Subscription plan not found');
      return res.redirect('/subscription/admin/subscription-settings');
    }

    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = plan.calculateEndDate(startDate);

    // Generate payment ID
    const paymentId = `admin_plan_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Create subscription
    const subscription = new Subscription({
      user: user._id,
      active: true,
      startDate,
      endDate,
      amount: plan.amount,
      paymentId,
      orderId: `admin_order_${Date.now()}`
    });

    await subscription.save();

    // Update user's ad-free status
    await User.findByIdAndUpdate(user._id, {
      adFree: true,
      adFreeUntil: endDate
    });

    req.flash('success_msg', `Subscription (${plan.name}) created successfully for ${user.name} (${user.email})`);
    res.redirect('/subscription/admin/subscription-settings');
  } catch (err) {
    console.error('Error creating subscription with plan:', err);
    req.flash('error_msg', 'An error occurred while creating the subscription');
    res.redirect('/subscription/admin/subscription-settings');
  }
};

// Initialize subscription settings
exports.initializeSubscriptionSettings = async () => {
  try {
    // Check if monthly amount exists
    const monthlyAmount = await SubscriptionSetting.findOne({ key: 'monthlyAmount' });
    if (!monthlyAmount) {
      await SubscriptionSetting.create({
        key: 'monthlyAmount',
        value: 99, // Default monthly amount: ₹99
        description: 'Monthly subscription amount'
      });
    }

    // Check if yearly amount exists
    const yearlyAmount = await SubscriptionSetting.findOne({ key: 'yearlyAmount' });
    if (!yearlyAmount) {
      await SubscriptionSetting.create({
        key: 'yearlyAmount',
        value: 999, // Default yearly amount: ₹999
        description: 'Yearly subscription amount'
      });
    }

    console.log('Subscription settings initialized');
  } catch (err) {
    console.error('Error initializing subscription settings:', err);
  }
};
