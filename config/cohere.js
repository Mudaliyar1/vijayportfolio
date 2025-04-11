// Using the Cohere API directly with axios
const axios = require('axios');

// Create a simple Cohere client
const cohere = {
  apiKey: process.env.COHERE_API_KEY || 'your-cohere-api-key', // Replace with your actual API key in .env file

  // Generate text using Cohere API
  generate: async function(options) {
    try {
      // Check if API key is set
      if (!this.apiKey || this.apiKey === 'your-cohere-api-key') {
        console.error('Cohere API key is not set');
        return {
          generations: [{
            text: 'Error: Cohere API key is not set. Please configure your API key in the .env file.'
          }]
        };
      }

      const response = await axios.post('https://api.cohere.ai/v1/generate', {
        prompt: options.prompt,
        max_tokens: options.max_tokens || 300,
        temperature: options.temperature || 0.7,
        k: options.k || 0,
        stop_sequences: options.stop_sequences || [],
        return_likelihoods: options.return_likelihoods || 'NONE'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        generations: [{
          text: response.data.generations[0].text
        }]
      };
    } catch (error) {
      console.error('Error calling Cohere API:', error.response ? error.response.data : error.message);

      // Return a more user-friendly error message
      return {
        generations: [{
          text: 'I apologize, but I encountered an error while processing your request. Please try again later or contact support if the issue persists.'
        }]
      };
    }
  }
}

module.exports = { cohere };
