/**
 * Advanced Image Prompt Enhancer
 * 
 * This utility implements the Cohere AI prompt engineering approach for image generation.
 * It analyzes user prompts, detects subjects and styles, and creates highly detailed
 * prompts for AI image generation models.
 */

// Subject categories with expanded keywords for better detection
const subjectCategories = {
  animals: ['dog', 'puppy', 'cat', 'kitten', 'bird', 'fish', 'horse', 'lion', 'tiger', 'elephant', 'wolf', 'fox', 'bear', 'rabbit', 'pet', 'animal', 'wildlife', 'creature'],
  nature: ['mountain', 'forest', 'river', 'ocean', 'beach', 'sky', 'sunset', 'sunrise', 'landscape', 'tree', 'flower', 'garden', 'waterfall', 'lake', 'sea', 'desert', 'jungle', 'woods', 'nature', 'outdoor'],
  people: ['person', 'man', 'woman', 'child', 'girl', 'boy', 'people', 'face', 'portrait', 'human', 'family', 'baby', 'teenager', 'adult', 'elderly', 'crowd'],
  urban: ['city', 'building', 'street', 'architecture', 'skyline', 'urban', 'house', 'interior', 'room', 'office', 'apartment', 'downtown', 'skyscraper', 'bridge', 'road', 'highway'],
  fantasy: ['dragon', 'wizard', 'magic', 'castle', 'fantasy', 'mythical', 'creature', 'fairy', 'elf', 'unicorn', 'magical', 'enchanted', 'spell', 'sorcery', 'mystical', 'legendary'],
  scifi: ['robot', 'spaceship', 'alien', 'futuristic', 'space', 'planet', 'galaxy', 'cyberpunk', 'tech', 'technology', 'future', 'sci-fi', 'spacecraft', 'cyborg', 'android', 'hologram'],
  abstract: ['abstract', 'pattern', 'geometric', 'colorful', 'minimalist', 'surreal', 'dream', 'conceptual', 'artistic', 'modern', 'contemporary', 'digital', 'design', 'creative'],
  food: ['food', 'meal', 'dish', 'cuisine', 'restaurant', 'cooking', 'baking', 'dessert', 'fruit', 'vegetable', 'meat', 'breakfast', 'lunch', 'dinner', 'snack', 'cake', 'pizza'],
  vehicle: ['car', 'vehicle', 'motorcycle', 'bike', 'bicycle', 'truck', 'bus', 'train', 'plane', 'aircraft', 'boat', 'ship', 'submarine', 'rocket', 'spaceship', 'helicopter']
};

// Style categories with keywords for detection
const styleCategories = {
  'ghibli': ['ghibli', 'miyazaki', 'totoro', 'spirited away', 'howl', 'mononoke'],
  'pixar': ['pixar', 'disney', '3d animation', 'toy story', 'incredibles', 'up', 'finding nemo'],
  'anime': ['anime', 'manga', 'japanese animation', 'cartoon', 'animated'],
  'cyberpunk': ['cyberpunk', 'neon', 'blade runner', 'dystopian', 'cyber', 'tech noir'],
  'fantasy': ['fantasy', 'magical', 'medieval', 'mystical', 'enchanted', 'fairy tale'],
  'trending': ['trending', 'popular', 'viral', 'artstation', 'deviantart', 'contemporary'],
  'futuristic': ['futuristic', 'future', 'advanced', 'sci-fi', 'technology', 'tomorrow'],
  'realistic': ['realistic', 'photorealistic', 'real', 'photograph', 'lifelike', 'hyperrealistic'],
  'abstract': ['abstract', 'surreal', 'conceptual', 'non-representational', 'expressionist'],
  'vintage': ['vintage', 'retro', 'old', 'classic', 'nostalgic', 'antique', 'old-fashioned']
};

// Subject-specific enhancements
const subjectEnhancements = {
  animals: 'detailed fur texture, natural habitat, realistic anatomy, professional wildlife photography, high detail, perfect lighting, expressive eyes, dynamic pose',
  nature: 'beautiful lighting, atmospheric, detailed textures, professional landscape photography, high resolution, golden hour, dramatic sky, perfect composition, depth of field',
  people: 'detailed features, expressive, professional portrait, perfect lighting, high detail, photorealistic, emotional expression, natural pose, studio quality',
  urban: 'architectural details, perfect perspective, professional photography, dramatic lighting, high detail, urban exploration, city life, street photography',
  fantasy: 'detailed fantasy art, magical atmosphere, dramatic lighting, highly detailed, concept art, digital painting, epic scene, mystical elements, fantasy illustration',
  scifi: 'futuristic details, advanced technology, dramatic lighting, highly detailed, concept art, digital painting, sci-fi environment, holographic elements, cinematic',
  abstract: 'vibrant colors, perfect composition, artistic, creative, professional art, high detail, modern design, contemporary art, expressive',
  food: 'appetizing, delicious, food photography, professional lighting, high detail, culinary art, gourmet, fresh ingredients, perfect composition',
  vehicle: 'detailed engineering, perfect lighting, showroom quality, professional automotive photography, reflective surfaces, dramatic angle, motion blur'
};

// Style-specific enhancements
const styleEnhancements = {
  'ghibli': 'Studio Ghibli style, anime, Hayao Miyazaki, fantasy landscape, colorful, dreamy, detailed illustration, artistic, hand-drawn animation, whimsical, charming characters, soft lighting, pastel colors, magical atmosphere, peaceful scenery, slightly exaggerated features',
  'pixar': 'Pixar animation style, 3D rendered, character design, vibrant colors, high detail, cinematic lighting, Disney Pixar, expressive characters, emotional storytelling, perfect rendering, subsurface scattering, ambient occlusion, global illumination, heartwarming, family-friendly',
  'anime': 'anime style, manga illustration, detailed, vibrant colors, Japanese animation, anime art, character design, clean lines, expressive eyes, dynamic poses, cel shading, beautiful backgrounds, professional anime artwork, distinctive art style, emotional expression',
  'cyberpunk': 'cyberpunk style, neon lights, futuristic city, dark atmosphere, rain, high tech, low life, detailed, Blade Runner, cybernetic enhancements, holographic displays, dystopian future, urban decay, digital artifacts, lens flares, reflective surfaces, gritty realism',
  'fantasy': 'fantasy art, magical, medieval, detailed landscape, mystical atmosphere, dramatic lighting, high quality, fantasy illustration, epic scene, magical effects, detailed textures, professional fantasy concept art, dramatic composition, otherworldly, enchanted',
  'trending': 'trending on artstation, highly detailed, professional photography, sharp focus, dramatic lighting, artistic, popular, award-winning, viral, perfect composition, masterpiece, trending digital art, photorealistic, 8k resolution, contemporary, modern aesthetic',
  'futuristic': 'futuristic, sci-fi, advanced technology, sleek design, holographic elements, glowing lights, future concept art, clean aesthetic, high-tech materials, innovative architecture, utopian society, cutting-edge technology, perfect lighting, minimalist, sophisticated',
  'realistic': 'photorealistic, hyperdetailed, 8k resolution, professional photography, perfect lighting, sharp focus, high detail, realistic textures, natural colors, studio quality, DSLR, award-winning photography, lifelike, authentic, true-to-life representation',
  'abstract': 'abstract art, non-representational, vibrant colors, geometric shapes, modern art, contemporary design, artistic expression, creative composition, minimalist elements, bold colors, conceptual, expressive brushstrokes, digital art, avant-garde, museum quality',
  'vintage': 'vintage aesthetic, retro style, nostalgic, film grain, muted colors, classic composition, old-fashioned, antique feel, historical, timeless quality, analog photography, aged texture, sepia tones, traditional techniques, period-accurate details'
};

// Camera and composition details
const cameraDetails = [
  'perfect composition',
  'masterful photography',
  'professional lighting',
  'high resolution',
  '8k quality',
  'sharp focus',
  'detailed textures',
  'dramatic lighting',
  'cinematic',
  'award-winning',
  'wide angle lens',
  'telephoto lens',
  'bokeh effect',
  'depth of field',
  'rule of thirds',
  'golden ratio',
  'symmetrical composition',
  'asymmetrical balance',
  'leading lines',
  'framing',
  'foreground interest',
  'background blur',
  'high contrast',
  'low key lighting',
  'high key lighting',
  'rim lighting',
  'silhouette',
  'backlit',
  'front lit',
  'side lit'
];

/**
 * Enhances a user prompt for image generation using advanced Cohere AI techniques
 * 
 * @param {string} prompt - The user's original prompt
 * @param {string} style - The requested style (optional)
 * @param {boolean} hasReferenceImage - Whether a reference image was provided
 * @returns {string} - The enhanced prompt for image generation
 */
function enhancePrompt(prompt, style = 'realistic', hasReferenceImage = false) {
  console.log('🔍 Step 1: Understanding the user prompt');
  
  // Convert prompt to lowercase for analysis
  const promptLower = prompt.toLowerCase();
  
  // Detect subject category
  let mainCategory = 'general';
  let subjectFound = false;
  
  for (const [category, keywords] of Object.entries(subjectCategories)) {
    for (const keyword of keywords) {
      if (promptLower.includes(keyword)) {
        mainCategory = category;
        subjectFound = true;
        console.log(`Detected subject category: ${category} (keyword: ${keyword})`);
        break;
      }
    }
    if (subjectFound) break;
  }
  
  // Detect style from prompt
  let promptStyle = style.toLowerCase();
  
  for (const [styleName, keywords] of Object.entries(styleCategories)) {
    for (const keyword of keywords) {
      if (promptLower.includes(keyword)) {
        console.log(`Detected style in prompt: ${styleName} (keyword: ${keyword})`);
        promptStyle = styleName;
        break;
      }
    }
    if (promptStyle !== style.toLowerCase()) break;
  }
  
  console.log('🎨 Step 2: Constructing enhanced prompt');
  
  // Start with the original prompt
  let enhancedPrompt = prompt;
  
  // Add subject-specific enhancements
  if (mainCategory !== 'general' && subjectEnhancements[mainCategory]) {
    enhancedPrompt = `${prompt}, ${subjectEnhancements[mainCategory]}`;
  }
  
  // Add style-specific enhancements
  const styleModifier = styleEnhancements[promptStyle] || styleEnhancements['realistic'];
  enhancedPrompt = `${enhancedPrompt}, ${styleModifier}`;
  
  // Add reference to uploaded image if provided
  if (hasReferenceImage) {
    enhancedPrompt = `${enhancedPrompt}, inspired by the reference image`;
  }
  
  // Add camera and composition details
  const selectedCameraDetails = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * cameraDetails.length);
    selectedCameraDetails.push(cameraDetails[randomIndex]);
    cameraDetails.splice(randomIndex, 1);
    if (cameraDetails.length === 0) break;
  }
  
  // Add the camera details to the prompt
  enhancedPrompt = `${enhancedPrompt}, ${selectedCameraDetails.join(', ')}`;
  
  // Add universal quality enhancers
  enhancedPrompt += ', highly detailed, professional quality, masterpiece';
  
  // Log the final prompt construction steps
  console.log(`Original prompt: "${prompt}"`);
  console.log(`Detected subject: ${mainCategory}`);
  console.log(`Detected/selected style: ${promptStyle}`);
  console.log(`Added camera details: ${selectedCameraDetails.join(', ')}`);
  
  // Limit prompt length to avoid API issues
  if (enhancedPrompt.length > 500) {
    console.log(`Prompt too long (${enhancedPrompt.length} chars), truncating to 500 chars`);
    enhancedPrompt = enhancedPrompt.substring(0, 500);
  }
  
  return enhancedPrompt;
}

module.exports = {
  enhancePrompt
};
