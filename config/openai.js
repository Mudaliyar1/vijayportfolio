const { OpenAI } = require('openai');

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key', // Replace with your actual API key in .env file
});

module.exports = { openai };
