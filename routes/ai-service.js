const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

/**
 * AI Image Generation Service
 * This route acts as a secure proxy for AI image generation services
 * It keeps API keys on the server side for security
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    
    // Default to a reliable model if none specified
    const aiModel = model || 'runwayml/stable-diffusion-v1-5';
    console.log(`Generating image with model ${aiModel} and prompt: ${prompt}`);
    
    // Set a timeout for the request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      // Get API key from environment variables
      const apiKey = process.env.HUGGING_FACE_API_KEY;
      
      if (!apiKey) {
        console.log('No API key found in environment variables');
        throw new Error('API key not configured');
      }
      
      // Make the request to Hugging Face
      const response = await fetch(`https://api-inference.huggingface.co/models/${aiModel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 30
          }
        }),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
      }
      
      // Get the image as a buffer
      const imageBuffer = await response.buffer();
      
      // Convert to base64 for sending to client
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      
      // Return the image
      return res.json({
        success: true,
        image: base64Image
      });
    } catch (error) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error('Error in AI service:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating image',
      error: error.message
    });
  }
});

/**
 * AI Image Search Service
 * This route searches for AI-generated images
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    
    console.log(`Searching for AI images with query: ${query}`);
    
    // Try Lexica API which has a database of AI-generated images
    try {
      const response = await fetch(`https://lexica.art/api/v1/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Lexica API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.images && data.images.length > 0) {
        // Return the top 5 results
        const results = data.images.slice(0, 5).map(img => ({
          url: img.src,
          width: img.width,
          height: img.height,
          prompt: img.prompt || query
        }));
        
        return res.json({
          success: true,
          results
        });
      } else {
        throw new Error('No results found');
      }
    } catch (lexicaError) {
      console.error('Error with Lexica API:', lexicaError);
      throw lexicaError;
    }
  } catch (error) {
    console.error('Error in AI search service:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching for AI images',
      error: error.message
    });
  }
});

module.exports = router;
