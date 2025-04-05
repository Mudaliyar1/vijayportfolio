/**
 * Hugging Face Stable Diffusion Image Generator
 * 
 * This utility uses the Hugging Face API to generate images from text prompts
 * using the Stable Diffusion model.
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Hugging Face token from environment variables for security
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

// Hugging Face Stable Diffusion Model URL
const MODEL_URL = 'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4';

/**
 * Generate an image from a text prompt using Hugging Face Stable Diffusion
 * 
 * @param {string} prompt - The text prompt to generate an image from
 * @param {string} outputPath - The path to save the generated image
 * @returns {Promise<string>} - The path to the generated image
 */
async function generateImage(prompt, outputPath) {
  try {
    console.log(`Generating image from prompt: "${prompt}"`);
    
    if (!HF_TOKEN) {
      throw new Error('Hugging Face token not found in environment variables');
    }
    
    // Make sure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Make the API request to Hugging Face
    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        inputs: prompt,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }

    // Save the image to the specified path
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✅ Image saved as ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error('❌ Error generating image:', err.message);
    throw err;
  }
}

/**
 * Generate multiple images from a text prompt
 * 
 * @param {string} prompt - The text prompt to generate images from
 * @param {number} count - The number of images to generate
 * @param {string} outputDir - The directory to save the generated images
 * @returns {Promise<string[]>} - The paths to the generated images
 */
async function generateMultipleImages(prompt, count, outputDir) {
  try {
    const imagePaths = [];
    
    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const outputPath = path.join(outputDir, `generated_${timestamp}_${i}.png`);
      
      const imagePath = await generateImage(prompt, outputPath);
      imagePaths.push(imagePath);
    }
    
    return imagePaths;
  } catch (err) {
    console.error('❌ Error generating multiple images:', err.message);
    throw err;
  }
}

module.exports = {
  generateImage,
  generateMultipleImages
};
