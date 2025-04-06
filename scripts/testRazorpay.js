require('dotenv').config();
const Razorpay = require('razorpay');

// Function to test Razorpay connection
async function testRazorpayConnection() {
  console.log('Testing Razorpay connection...');
  
  try {
    // Initialize Razorpay with keys from .env
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    // Log the keys (first few characters only for security)
    console.log(`Using Key ID: ${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...`);
    console.log(`Using Key Secret: ${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...`);
    
    // Create a test order
    const options = {
      amount: 50000, // 500 INR in paise
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      payment_capture: 1
    };
    
    // Try to create an order to verify API connection
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay connection successful!');
    console.log('Test order created:');
    console.log(`Order ID: ${order.id}`);
    console.log(`Amount: ${order.amount / 100} ${order.currency}`);
    console.log(`Receipt: ${order.receipt}`);
    console.log(`Status: ${order.status}`);
    
    return true;
  } catch (error) {
    console.error('❌ Razorpay connection failed:');
    console.error(error.message);
    
    if (error.error && error.error.description) {
      console.error(`Error description: ${error.error.description}`);
    }
    
    return false;
  }
}

// Run the test
testRazorpayConnection()
  .then(success => {
    if (success) {
      console.log('\nYour Razorpay integration is configured correctly! 🎉');
    } else {
      console.log('\nPlease check your Razorpay API keys and try again.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
