const express = require('express');
const router = express.Router();
const { dynamicApiAuth } = require('../../middleware/apiAuth');
const cohere = require('cohere-ai');
const { enhanceChatPrompt } = require('../../utils/coherePromptEnhancer');

// Initialize Cohere client
const COHERE_API_KEY = process.env.COHERE_API_KEY;
cohere.init(COHERE_API_KEY);

/**
 * Dynamic API Endpoint
 * For use in backend applications with higher rate limits
 * Provides full access to AI response
 */
router.post('/', dynamicApiAuth, async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    // Parse options
    const parsedOptions = parseOptions(options);
    
    // Generate AI response
    let aiResponse;
    try {
      console.log('Sending request to Cohere API with prompt:', prompt);
      
      // Try to enhance the prompt
      let enhancedPrompt;
      try {
        enhancedPrompt = await enhanceChatPrompt(prompt);
      } catch (enhanceError) {
        console.error('Error enhancing prompt:', enhanceError);
        enhancedPrompt = prompt; // Use original prompt if enhancement fails
      }
      
      // Create a comprehensive prompt
      const fullPrompt = `You are FTRAISE AI, a helpful, friendly, and knowledgeable AI assistant created by ftraise59/vijay. You provide accurate, concise, and helpful responses. You're designed to be conversational but focused on delivering valuable information.

User prompt: ${enhancedPrompt}

Respond in a helpful and informative manner:`;
      
      // Call Cohere API
      const response = await cohere.generate({
        model: parsedOptions.model || process.env.AI_MODEL || 'command',
        prompt: fullPrompt,
        max_tokens: parsedOptions.maxTokens || 800,
        temperature: parsedOptions.temperature || 0.7,
        k: parsedOptions.k || 0,
        stop_sequences: parsedOptions.stopSequences || ["User:", "FTRAISE AI:"],
        return_likelihoods: 'NONE'
      });
      
      if (response.body && response.body.generations && response.body.generations.length > 0) {
        aiResponse = response.body.generations[0].text.trim();
      } else {
        throw new Error('No response from Cohere API');
      }
    } catch (error) {
      console.error('Error calling Cohere API:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating the AI response',
        error: error.message
      });
    }
    
    // Get rate limit info
    const rateLimitResult = await req.dynamicApiKey.checkRateLimit();
    
    // Return response with rate limit headers
    res.set({
      'X-RateLimit-Limit': req.dynamicApiKey.rateLimit.requests,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': req.dynamicApiKey.windowStartTime ? 
        new Date(req.dynamicApiKey.windowStartTime.getTime() + req.dynamicApiKey.rateLimit.window).getTime() / 1000 : 
        Math.floor(Date.now() / 1000) + (req.dynamicApiKey.rateLimit.window / 1000)
    });
    
    return res.json({
      success: true,
      reply: aiResponse,
      metadata: {
        model: parsedOptions.model || process.env.AI_MODEL || 'command',
        tokens: aiResponse.split(/\s+/).length, // Rough estimate
        enhanced: enhancedPrompt !== prompt
      }
    });
  } catch (error) {
    console.error('Dynamic API error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: error.message
    });
  }
});

/**
 * Parse options from request
 * @param {object} options - The options object from the request
 * @returns {object} - The parsed options
 */
function parseOptions(options) {
  const defaultOptions = {
    model: process.env.AI_MODEL || 'command',
    maxTokens: 800,
    temperature: 0.7,
    k: 0,
    stopSequences: ["User:", "FTRAISE AI:"]
  };
  
  if (!options) {
    return defaultOptions;
  }
  
  // Parse and validate options
  const parsedOptions = {
    model: options.model || defaultOptions.model,
    maxTokens: options.max_tokens || options.maxTokens || defaultOptions.maxTokens,
    temperature: options.temperature || defaultOptions.temperature,
    k: options.k || defaultOptions.k,
    stopSequences: options.stop_sequences || options.stopSequences || defaultOptions.stopSequences
  };
  
  // Validate maxTokens
  if (parsedOptions.maxTokens > 2000) {
    parsedOptions.maxTokens = 2000; // Cap at 2000 tokens
  }
  
  // Validate temperature
  if (parsedOptions.temperature < 0 || parsedOptions.temperature > 1) {
    parsedOptions.temperature = defaultOptions.temperature;
  }
  
  return parsedOptions;
}

module.exports = router;
