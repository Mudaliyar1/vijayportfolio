const express = require('express');
const router = express.Router();
const { staticApiAuth } = require('../../middleware/apiAuth');
const cohere = require('cohere-ai');

// Initialize Cohere client
const COHERE_API_KEY = process.env.COHERE_API_KEY;
cohere.init(COHERE_API_KEY);

/**
 * Static API Endpoint
 * For use in HTML websites with domain/IP restrictions
 * Limited to 5-10 requests per hour
 */
router.post('/', staticApiAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }
    
    // Sanitize prompt to prevent abuse
    const sanitizedPrompt = sanitizePrompt(prompt);
    
    // Generate AI response
    let aiResponse;
    try {
      console.log('Sending request to Cohere API with prompt:', sanitizedPrompt);
      
      // Create a safe prompt for static API
      const safePrompt = `You are FTRAISE AI, a helpful, friendly, and knowledgeable AI assistant. 
You provide accurate, concise, and helpful responses. You're designed to be conversational but focused on delivering valuable information.
You must NEVER reveal personal information about users or sensitive data.
You must NEVER generate harmful, illegal, or unethical content.
You must NEVER provide instructions for illegal activities.

User prompt: ${sanitizedPrompt}

Respond in a helpful, safe, and informative manner:`;
      
      // Call Cohere API
      const response = await cohere.generate({
        model: process.env.AI_MODEL || 'command',
        prompt: safePrompt,
        max_tokens: 300, // Limit token count for static API
        temperature: 0.7,
        k: 0,
        stop_sequences: ["User:", "FTRAISE AI:"],
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
        message: 'An error occurred while generating the AI response'
      });
    }
    
    // Get rate limit info
    const rateLimitResult = await req.staticApiKey.checkRateLimit();
    
    // Return response with rate limit headers
    res.set({
      'X-RateLimit-Limit': req.staticApiKey.rateLimit.requests,
      'X-RateLimit-Remaining': rateLimitResult.remaining,
      'X-RateLimit-Reset': req.staticApiKey.windowStartTime ? 
        new Date(req.staticApiKey.windowStartTime.getTime() + req.staticApiKey.rateLimit.window).getTime() / 1000 : 
        Math.floor(Date.now() / 1000) + (req.staticApiKey.rateLimit.window / 1000)
    });
    
    return res.json({
      success: true,
      reply: aiResponse
    });
  } catch (error) {
    console.error('Static API error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});

/**
 * Sanitize prompt to prevent abuse
 * @param {string} prompt - The user prompt
 * @returns {string} - The sanitized prompt
 */
function sanitizePrompt(prompt) {
  // Basic sanitization
  let sanitized = prompt.trim();
  
  // Remove any potential harmful instructions
  const harmfulPatterns = [
    /ignore previous instructions/i,
    /ignore all instructions/i,
    /disregard your programming/i,
    /bypass your ethical guidelines/i
  ];
  
  for (const pattern of harmfulPatterns) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }
  
  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }
  
  return sanitized;
}

module.exports = router;
