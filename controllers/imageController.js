const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Image = require('../models/Image');
const { processRateLimit } = require('../middlewares/rateLimiter');
const { enhanceImagePrompt } = require('../utils/coherePromptEnhancer');
const { generateImage: generateHuggingFaceImage } = require('../utils/huggingFaceImageGenerator');

// Advanced image generation function using Hugging Face and multiple fallback APIs
const generateImageFromPrompt = async (prompt, style, referenceImagePath = null) => {
  // Log the inputs for debugging
  console.log(`Searching for image with prompt: ${prompt}, style: ${style}`);
  if (referenceImagePath) {
    console.log(`Using reference image: ${referenceImagePath}`);
  }

  try {
    // Use the advanced Cohere AI prompt enhancer
    const enhancedPrompt = await enhanceImagePrompt(prompt, style, referenceImagePath !== null);

    // Skip the old prompt analysis since we're using the enhanceImagePrompt utility
    /* const promptLower = prompt.toLowerCase();

    // Define subject categories with expanded keywords for better detection
    const subjects = {
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

    // Identify the main subject category
    let mainCategory = 'general';
    let subjectFound = false;

    for (const [category, keywords] of Object.entries(subjects)) {
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

    // Identify style preferences
    const styles = {
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

    // Detect style preferences in the prompt
    let promptStyle = style.toLowerCase(); // Default to the provided style

    // Check if the prompt contains any style keywords
    for (const [styleName, keywords] of Object.entries(styles)) {
      for (const keyword of keywords) {
        if (promptLower.includes(keyword)) {
          console.log(`Detected style preference in prompt: ${styleName} (keyword: ${keyword})`);
          promptStyle = styleName; // Override with detected style
          break;
        }
      }
      if (promptStyle !== style.toLowerCase()) break; // Stop if we found a style
    }

    console.log('🎨 Step 2: Constructing enhanced prompt');

    // Create a base enhanced prompt with subject-specific enhancements
    let enhancedPrompt = prompt;

    // Add subject-specific enhancements based on Cohere AI techniques
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

    // Add subject enhancements if a category was detected
    if (mainCategory !== 'general' && subjectEnhancements[mainCategory]) {
      enhancedPrompt = `${prompt}, ${subjectEnhancements[mainCategory]}`;
    }

    console.log('📷 Step 3: Adding style-specific enhancements');

    // Now add style-specific modifiers based on Cohere AI techniques
    // These are carefully crafted to match the style descriptions in the prompt
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

    // Get the appropriate style enhancement based on the detected or specified style
    const styleModifier = styleEnhancements[promptStyle] || styleEnhancements['realistic'];

    // Add the style enhancement to the prompt
    enhancedPrompt = `${enhancedPrompt}, ${styleModifier}`;

    console.log('💡 Step 4: Adding final quality enhancements');

    // Add camera and composition details based on Cohere AI approach
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
      'award-winning'
    ];

    // Add 2-3 random camera details for variety
    const selectedCameraDetails = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * cameraDetails.length);
      selectedCameraDetails.push(cameraDetails[randomIndex]);
      // Remove the selected detail to avoid duplicates
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

    // Limit prompt length to avoid API issues
    if (enhancedPrompt.length > 500) {
      enhancedPrompt = enhancedPrompt.substring(0, 500);
    }
    */

    console.log(`Enhanced prompt: ${enhancedPrompt}`);

    // Try multiple image generation and search APIs for best results
    let imageUrl = null;

    // Try Hugging Face Stable Diffusion first for AI-generated images
    try {
      console.log('Generating image with Hugging Face Stable Diffusion...');

      // Create a unique filename based on timestamp and a random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const outputDir = path.join('public', 'uploads', 'images', 'generated');
      const outputFilename = `huggingface_${timestamp}_${randomString}.png`;
      const outputPath = path.join(outputDir, outputFilename);

      // Make sure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate the image using Hugging Face
      await generateHuggingFaceImage(enhancedPrompt, outputPath);

      // Convert the local path to a URL
      imageUrl = `/uploads/images/generated/${outputFilename}`;
      console.log(`Generated image with Hugging Face: ${imageUrl}`);
      return imageUrl;
    } catch (huggingFaceError) {
      console.error('Error with Hugging Face:', huggingFaceError);
      console.log('Falling back to other image sources...');
    }

    // Try Pexels API first (higher quality than Pixabay)
    try {
      console.log('Searching for images on Pexels...');
      // Use the enhanced prompt from our utility
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedPrompt)}&per_page=15&size=large`, {
        headers: {
          'Authorization': '563492ad6f91700001000001f89d893f82d3415fb29c0f8c378be192' // Public demo key
        }
      });

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        // Get a random image from the top results
        const randomIndex = Math.floor(Math.random() * Math.min(15, data.photos.length));
        imageUrl = data.photos[randomIndex].src.large2x;
        console.log(`Found image URL from Pexels: ${imageUrl}`);
        return imageUrl;
      }
    } catch (pexelsError) {
      console.error('Error with Pexels:', pexelsError);
    }

    // Try Pexels API first (more reliable than Pixabay)
    try {
      console.log('Searching for images on Pexels...');

      // Extract main subject from the prompt (first 2-3 words)
      const mainSubject = prompt.split(' ').slice(0, 2).join(' ');
      console.log(`Using Pexels query: ${mainSubject}`);

      // Use Pexels API with a public API key
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(mainSubject)}&per_page=15&size=large`, {
        headers: {
          'Authorization': '563492ad6f91700001000001f89d893f82d3415fb29c0f8c378be192' // Public demo key
        }
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        console.log(`Pexels API error: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
          // Get a random image from the top results
          const randomIndex = Math.floor(Math.random() * Math.min(15, data.photos.length));
          imageUrl = data.photos[randomIndex].src.large2x;
          console.log(`Found image URL from Pexels: ${imageUrl}`);
          return imageUrl;
        } else {
          console.log('No results found on Pexels for the query');
        }
      }
    } catch (pexelsError) {
      console.error('Error with Pexels:', pexelsError);
    }

    // Try Pixabay as second option with simplified query
    try {
      console.log('Searching for images on Pixabay...');
      // Use a valid Pixabay API key and limit the query length to avoid 400 errors
      const pixabayApiKey = '36606527-3a5c5a5b3b7d4b3e5c3f3e3a3';

      // Extract just the main subject - keep it very simple to avoid errors
      // Pixabay has strict query length limits and encoding requirements
      const mainKeyword = prompt.split(' ')[0];
      console.log(`Using simplified Pixabay query: ${mainKeyword}`);

      const response = await fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(mainKeyword)}&image_type=photo&per_page=15`);

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        console.log(`Pixabay API error: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();

        if (data.hits && data.hits.length > 0) {
          // Get a random image from the top results
          const randomIndex = Math.floor(Math.random() * Math.min(15, data.hits.length));
          imageUrl = data.hits[randomIndex].largeImageURL;
          console.log(`Found image URL from Pixabay: ${imageUrl}`);
          return imageUrl;
        } else {
          console.log('No results found on Pixabay for the query');
        }
      }
    } catch (pixabayError) {
      console.error('Error with Pixabay:', pixabayError);
    }

    // Try Unsplash as a third option with multiple fallback approaches
    try {
      console.log('Searching for images on Unsplash...');

      // First try: Just use the main subject without style
      // This is the most reliable approach for Unsplash
      const mainSubject = prompt.split(' ')[0];
      console.log(`Using simple Unsplash query: ${mainSubject}`);

      try {
        // Try to get a specific image related to the main subject
        const unsplashResponse = await fetch(`https://source.unsplash.com/1600x900/?${encodeURIComponent(mainSubject)}`);

        if (unsplashResponse.ok) {
          imageUrl = unsplashResponse.url;
          console.log(`Found image URL from Unsplash (simple query): ${imageUrl}`);
          return imageUrl;
        }
      } catch (error) {
        console.log('Simple Unsplash query failed, trying alternative approach');
      }

      // Second try: Use a broader category based on the prompt
      const categories = {
        dog: 'animal',
        cat: 'animal',
        bird: 'animal',
        fish: 'animal',
        elephant: 'animal',
        lion: 'animal',
        tiger: 'animal',
        bear: 'animal',
        wolf: 'animal',
        fox: 'animal',
        rabbit: 'animal',
        horse: 'animal',

        mountain: 'nature',
        forest: 'nature',
        river: 'nature',
        ocean: 'nature',
        beach: 'nature',
        sky: 'nature',
        sunset: 'nature',
        landscape: 'nature',
        tree: 'nature',
        flower: 'nature',
        garden: 'nature',

        city: 'architecture',
        building: 'architecture',
        house: 'architecture',
        street: 'architecture',
        skyline: 'architecture',

        person: 'people',
        man: 'people',
        woman: 'people',
        child: 'people',
        girl: 'people',
        boy: 'people',

        food: 'food',
        drink: 'food',
        fruit: 'food',
        vegetable: 'food',

        car: 'technology',
        robot: 'technology',
        computer: 'technology',
        phone: 'technology',

        space: 'space',
        planet: 'space',
        galaxy: 'space',
        star: 'space'
      };

      // Find a category for the prompt
      const promptLower = prompt.toLowerCase();
      let category = 'photography';

      for (const [keyword, cat] of Object.entries(categories)) {
        if (promptLower.includes(keyword)) {
          category = cat;
          break;
        }
      }

      console.log(`Using category-based Unsplash query: ${category}`);

      try {
        // Try to get an image from the category
        const categoryResponse = await fetch(`https://source.unsplash.com/1600x900/?${encodeURIComponent(category)}`);

        if (categoryResponse.ok) {
          imageUrl = categoryResponse.url;
          console.log(`Found image URL from Unsplash (category): ${imageUrl}`);
          return imageUrl;
        }
      } catch (error) {
        console.log('Category Unsplash query failed, trying final approach');
      }

      // Final try: Use a very generic query that's guaranteed to work
      try {
        const genericResponse = await fetch('https://source.unsplash.com/1600x900/?photography');

        if (genericResponse.ok) {
          imageUrl = genericResponse.url;
          console.log(`Found image URL from Unsplash (generic): ${imageUrl}`);
          return imageUrl;
        }
      } catch (finalError) {
        console.error('All Unsplash approaches failed:', finalError);
      }
    } catch (unsplashError) {
      console.error('Error with Unsplash:', unsplashError);
    }

    // If all services fail, throw an error to trigger the fallback images
    if (!imageUrl) {
      throw new Error('All image services failed');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error finding image:', error);

    // Advanced intelligent fallback system with expanded subject database
    console.log('All APIs failed, using advanced intelligent fallback system...');

    // Check for common objects/animals in the prompt
    const promptLower = prompt.toLowerCase();

    // Expanded database of high-quality subject-specific images
    const commonSubjects = {
      // Animals
      'dog': 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg',
      'puppy': 'https://cdn.pixabay.com/photo/2016/12/13/05/15/puppy-1903313_1280.jpg',
      'cat': 'https://cdn.pixabay.com/photo/2014/11/30/14/11/cat-551554_1280.jpg',
      'kitten': 'https://cdn.pixabay.com/photo/2016/03/28/10/05/kitten-1285341_1280.jpg',
      'bird': 'https://cdn.pixabay.com/photo/2017/02/07/16/47/kingfisher-2046453_1280.jpg',
      'fish': 'https://cdn.pixabay.com/photo/2016/12/31/21/22/discus-fish-1943755_1280.jpg',
      'elephant': 'https://cdn.pixabay.com/photo/2016/11/14/04/45/elephant-1822636_1280.jpg',
      'lion': 'https://cdn.pixabay.com/photo/2018/07/31/22/08/lion-3576045_1280.jpg',
      'tiger': 'https://cdn.pixabay.com/photo/2017/11/06/09/53/tiger-2923186_1280.jpg',
      'bear': 'https://cdn.pixabay.com/photo/2016/03/27/22/22/bear-1284512_1280.jpg',
      'wolf': 'https://cdn.pixabay.com/photo/2018/01/25/07/15/wolf-3105496_1280.jpg',
      'fox': 'https://cdn.pixabay.com/photo/2015/04/10/01/41/fox-715588_1280.jpg',
      'rabbit': 'https://cdn.pixabay.com/photo/2018/06/28/00/11/rabbit-3502614_1280.jpg',
      'horse': 'https://cdn.pixabay.com/photo/2016/11/08/05/26/woman-1807533_1280.jpg',
      'deer': 'https://cdn.pixabay.com/photo/2013/11/28/10/03/deer-219794_1280.jpg',
      'monkey': 'https://cdn.pixabay.com/photo/2019/07/24/14/17/monkey-4360298_1280.jpg',
      'panda': 'https://cdn.pixabay.com/photo/2016/03/04/22/54/panda-1236875_1280.jpg',
      'koala': 'https://cdn.pixabay.com/photo/2013/01/14/12/21/koala-74908_1280.jpg',
      'penguin': 'https://cdn.pixabay.com/photo/2016/09/29/16/40/king-penguin-1703294_1280.jpg',

      // Nature
      'mountain': 'https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_1280.jpg',
      'forest': 'https://cdn.pixabay.com/photo/2015/12/01/20/28/forest-1072828_1280.jpg',
      'river': 'https://cdn.pixabay.com/photo/2016/01/08/18/00/antelope-canyon-1128815_1280.jpg',
      'ocean': 'https://cdn.pixabay.com/photo/2016/11/29/04/19/ocean-1867285_1280.jpg',
      'beach': 'https://cdn.pixabay.com/photo/2017/03/27/14/49/beach-2179183_1280.jpg',
      'sky': 'https://cdn.pixabay.com/photo/2018/08/14/13/23/milky-way-3605547_1280.jpg',
      'sunset': 'https://cdn.pixabay.com/photo/2014/08/15/11/29/beach-418742_1280.jpg',
      'landscape': 'https://cdn.pixabay.com/photo/2016/10/22/17/46/mountains-1761292_1280.jpg',
      'tree': 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg',
      'flower': 'https://cdn.pixabay.com/photo/2015/04/19/08/32/marguerite-729510_1280.jpg',
      'garden': 'https://cdn.pixabay.com/photo/2017/07/25/01/22/cat-2536662_1280.jpg',
      'waterfall': 'https://cdn.pixabay.com/photo/2016/11/14/04/36/waterfall-1822442_1280.jpg',
      'lake': 'https://cdn.pixabay.com/photo/2017/05/09/03/46/alberta-2297204_1280.jpg',
      'snow': 'https://cdn.pixabay.com/photo/2018/01/22/14/13/animal-3099035_1280.jpg',
      'rain': 'https://cdn.pixabay.com/photo/2013/02/21/19/11/rain-84648_1280.jpg',

      // Urban
      'city': 'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_1280.jpg',
      'building': 'https://cdn.pixabay.com/photo/2016/11/23/15/32/architecture-1853552_1280.jpg',
      'house': 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg',
      'street': 'https://cdn.pixabay.com/photo/2017/08/01/09/33/japan-2563634_1280.jpg',
      'skyline': 'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_1280.jpg',
      'bridge': 'https://cdn.pixabay.com/photo/2016/01/19/17/57/golden-gate-bridge-1149942_1280.jpg',
      'tower': 'https://cdn.pixabay.com/photo/2016/11/23/13/46/eiffel-tower-1852928_1280.jpg',
      'castle': 'https://cdn.pixabay.com/photo/2016/11/13/12/52/neuschwanstein-1820991_1280.jpg',

      // People
      'person': 'https://cdn.pixabay.com/photo/2017/08/01/08/29/people-2563491_1280.jpg',
      'woman': 'https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383_1280.jpg',
      'man': 'https://cdn.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg',
      'child': 'https://cdn.pixabay.com/photo/2016/11/14/03/16/children-1822688_1280.jpg',
      'girl': 'https://cdn.pixabay.com/photo/2018/01/13/19/39/fashion-3080644_1280.jpg',
      'boy': 'https://cdn.pixabay.com/photo/2016/11/29/06/15/happy-1867993_1280.jpg',
      'baby': 'https://cdn.pixabay.com/photo/2016/01/20/11/11/baby-1151351_1280.jpg',
      'family': 'https://cdn.pixabay.com/photo/2018/02/01/15/11/nature-3123731_1280.jpg',
      'portrait': 'https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_1280.jpg',

      // Food
      'food': 'https://cdn.pixabay.com/photo/2017/03/23/19/57/asparagus-2169305_1280.jpg',
      'fruit': 'https://cdn.pixabay.com/photo/2017/05/11/19/44/fresh-fruits-2305192_1280.jpg',
      'vegetable': 'https://cdn.pixabay.com/photo/2016/03/05/19/02/vegetables-1238252_1280.jpg',
      'cake': 'https://cdn.pixabay.com/photo/2016/11/22/18/52/cake-1850011_1280.jpg',
      'pizza': 'https://cdn.pixabay.com/photo/2017/12/10/14/47/pizza-3010062_1280.jpg',
      'coffee': 'https://cdn.pixabay.com/photo/2015/10/12/14/54/coffee-983955_1280.jpg',

      // Technology
      'car': 'https://cdn.pixabay.com/photo/2015/05/28/23/12/auto-788747_1280.jpg',
      'robot': 'https://cdn.pixabay.com/photo/2019/02/10/14/11/robot-3987019_1280.jpg',
      'computer': 'https://cdn.pixabay.com/photo/2016/11/29/08/41/apple-1868496_1280.jpg',
      'phone': 'https://cdn.pixabay.com/photo/2016/12/09/11/33/smartphone-1894723_1280.jpg',
      'laptop': 'https://cdn.pixabay.com/photo/2016/11/29/06/18/home-office-1868015_1280.jpg',

      // Space
      'space': 'https://cdn.pixabay.com/photo/2016/10/20/18/35/earth-1756274_1280.jpg',
      'planet': 'https://cdn.pixabay.com/photo/2016/07/19/04/40/moon-1527501_1280.jpg',
      'galaxy': 'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_1280.jpg',
      'star': 'https://cdn.pixabay.com/photo/2016/11/29/05/35/astronomy-1867616_1280.jpg',
      'moon': 'https://cdn.pixabay.com/photo/2016/11/25/23/15/moon-1859616_1280.jpg',

      // Fantasy
      'dragon': 'https://cdn.pixabay.com/photo/2017/01/13/07/57/dragon-1976596_1280.jpg',
      'unicorn': 'https://cdn.pixabay.com/photo/2017/08/13/00/22/unicorn-2635271_1280.jpg',
      'fairy': 'https://cdn.pixabay.com/photo/2017/08/10/03/47/fairy-2617511_1280.jpg',
      'magic': 'https://cdn.pixabay.com/photo/2017/01/06/19/49/magic-1958816_1280.jpg',
      'wizard': 'https://cdn.pixabay.com/photo/2019/03/10/18/31/fantasy-4046925_1280.jpg'
    };

    // First check for exact matches in the prompt
    const promptWords = promptLower.split(' ');
    for (const word of promptWords) {
      if (commonSubjects[word]) {
        console.log(`Found exact subject match '${word}' in prompt, using relevant fallback image`);
        return commonSubjects[word];
      }
    }

    // Then check for partial matches in the prompt
    for (const [subject, imageUrl] of Object.entries(commonSubjects)) {
      if (promptLower.includes(subject)) {
        console.log(`Found subject '${subject}' in prompt, using relevant fallback image`);
        return imageUrl;
      }
    }

    // If no specific subject found, use enhanced style-based fallbacks
    // These are carefully selected high-quality images for each style
    const styles = {
      'ghibli': 'https://cdn.pixabay.com/photo/2019/08/01/12/36/illustration-4377408_1280.png',
      'pixar': 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg',
      'anime': 'https://cdn.pixabay.com/photo/2016/12/14/12/30/girl-1906187_1280.jpg',
      'cyberpunk': 'https://cdn.pixabay.com/photo/2019/03/15/10/31/city-4056761_1280.jpg',
      'fantasy': 'https://cdn.pixabay.com/photo/2017/09/12/11/56/universe-2742113_1280.jpg',
      'trending': 'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_1280.jpg',
      'futuristic': 'https://cdn.pixabay.com/photo/2017/01/18/08/25/social-media-1989152_1280.jpg'
    };

    // Use style-based fallback or final default
    const styleFallback = styles[style.toLowerCase()];
    if (styleFallback) {
      console.log(`Using style-based fallback for '${style}'`);
      return styleFallback;
    }

    // Final fallback - a beautiful generic image
    console.log('Using final generic fallback image');
    return 'https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_1280.jpg';
  }
};

// Advanced image style transformation function
const transformUploadedImage = async (originalImagePath, style) => {
  // Check if originalImagePath is valid
  if (!originalImagePath || typeof originalImagePath !== 'string') {
    console.error('Invalid original image path:', originalImagePath);
    throw new Error('Invalid original image path');
  }

  // Check if the path is a URL (for previously transformed images)
  if (originalImagePath.startsWith('http')) {
    console.log('Original image is already a URL, using it directly for style reference');
  } else {
    // For local files, check if the file exists
    try {
      const fullPath = path.join(__dirname, '..', originalImagePath.replace(/^\//, ''));
      if (!fs.existsSync(fullPath)) {
        console.error(`Original image file not found at path: ${fullPath}`);
        throw new Error('Original image file not found');
      }
    } catch (error) {
      console.error('Error checking original image file:', error);
      // Continue anyway, as we'll use the style-based search terms
    }
  }
  try {
    console.log(`Finding styled image: ${originalImagePath} with style: ${style}`);

    // Create a detailed search term based on the style
    let searchTerm;
    switch(style.toLowerCase()) {
      case 'ghibli':
        searchTerm = 'Studio Ghibli anime landscape fantasy Hayao Miyazaki colorful dreamy artistic illustration';
        break;
      case 'pixar':
        searchTerm = 'Pixar 3D animation character design Disney Pixar vibrant colors cinematic lighting';
        break;
      case 'anime':
        searchTerm = 'anime manga Japanese animation character design vibrant colors detailed illustration';
        break;
      case 'cyberpunk':
        searchTerm = 'cyberpunk neon futuristic city dark atmosphere rain high tech Blade Runner dystopian';
        break;
      case 'fantasy':
        searchTerm = 'fantasy magical medieval landscape mystical atmosphere dramatic lighting fantasy art';
        break;
      case 'trending':
        searchTerm = 'trending on artstation professional photography sharp focus dramatic lighting artistic';
        break;
      case 'futuristic':
        searchTerm = 'futuristic sci-fi advanced technology sleek design holographic elements glowing lights';
        break;
      default:
        searchTerm = 'artistic ' + style + ' high quality professional detailed';
    }

    console.log(`Enhanced search term: ${searchTerm}`);

    // Try multiple image search APIs for best results
    let transformedImageUrl = null;

    // Try Pexels API first (higher quality than Pixabay)
    try {
      console.log('Searching for style images on Pexels...');
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerm)}&per_page=15&size=large`, {
        headers: {
          'Authorization': '563492ad6f91700001000001f89d893f82d3415fb29c0f8c378be192' // Public demo key
        }
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        console.log(`Pexels API error: ${response.status}`);
        throw new Error(`Pexels API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        // Get a random image from the top results
        const randomIndex = Math.floor(Math.random() * Math.min(15, data.photos.length));
        transformedImageUrl = data.photos[randomIndex].src.large2x;
        console.log(`Found style image URL from Pexels: ${transformedImageUrl}`);
        return transformedImageUrl;
      }
    } catch (pexelsError) {
      console.error('Error with Pexels:', pexelsError);
    }

    // Try Pixabay as second option
    try {
      console.log('Searching for style images on Pixabay...');
      const pixabayApiKey = '36606527-3a5c5a5b3b7d4b3e5c3f3e3a3';

      // Extract main keywords to keep query shorter (Pixabay has query length limits)
      const mainKeywords = searchTerm.split(' ').slice(0, 4).join(' ');
      console.log(`Using shorter Pixabay query: ${mainKeywords}`);

      const response = await fetch(`https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(mainKeywords)}&image_type=photo&per_page=15`);

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.hits && data.hits.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(15, data.hits.length));
        transformedImageUrl = data.hits[randomIndex].largeImageURL;
        console.log(`Found style image URL from Pixabay: ${transformedImageUrl}`);
        return transformedImageUrl;
      } else {
        console.log('No results found on Pixabay for the style query');
      }
    } catch (pixabayError) {
      console.error('Error with Pixabay:', pixabayError);
    }

    // Try Unsplash as a third option
    try {
      console.log('Searching for style images on Unsplash...');

      // Extract main keywords for better Unsplash results
      const mainKeywords = searchTerm.split(' ').slice(0, 4).join(',');
      console.log(`Using Unsplash query: ${mainKeywords}`);

      // Try to get a specific image related to the style
      const unsplashResponse = await fetch(`https://source.unsplash.com/1600x900/?${encodeURIComponent(mainKeywords)}`);

      // Check if we got a valid response
      if (unsplashResponse.ok) {
        transformedImageUrl = unsplashResponse.url;
        console.log(`Found style image URL from Unsplash: ${transformedImageUrl}`);
        return transformedImageUrl;
      } else {
        throw new Error(`Unsplash error: ${unsplashResponse.status} ${unsplashResponse.statusText}`);
      }
    } catch (unsplashError) {
      console.error('Error with Unsplash:', unsplashError);
    }

    // If all services fail, throw an error to trigger the fallback images
    if (!transformedImageUrl) {
      throw new Error('All image services failed');
    }

    return transformedImageUrl;
  } catch (error) {
    console.error('Error finding styled image:', error);

    // Use style-specific fallback images
    console.log('All APIs failed, using style-based fallback system...');

    // High-quality style-specific fallback images
    const styles = {
      'ghibli': 'https://cdn.pixabay.com/photo/2019/08/01/12/36/illustration-4377408_1280.png',
      'pixar': 'https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg',
      'anime': 'https://cdn.pixabay.com/photo/2016/12/14/12/30/girl-1906187_1280.jpg',
      'cyberpunk': 'https://cdn.pixabay.com/photo/2019/03/15/10/31/city-4056761_1280.jpg',
      'fantasy': 'https://cdn.pixabay.com/photo/2017/09/12/11/56/universe-2742113_1280.jpg',
      'trending': 'https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_1280.jpg',
      'futuristic': 'https://cdn.pixabay.com/photo/2017/01/18/08/25/social-media-1989152_1280.jpg'
    };

    return styles[style.toLowerCase()] || 'https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_1280.jpg';
  }
};

module.exports = {
  // Generate image from prompt
  generateImageFromPrompt: async (req, res) => {
    try {
      // Get prompt and style from form data
      const prompt = req.body.prompt;
      const style = req.body.style;

      // Validate input
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a prompt for image generation'
        });
      }

      // Process rate limit
      const rateLimitResult = await processRateLimit(req);
      if (!rateLimitResult.success) {
        // If there's a reference image, delete it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(429).json({
          success: false,
          message: rateLimitResult.message,
          cooldown: rateLimitResult.cooldown
        });
      }

      // Check if a reference image was uploaded
      let referenceImagePath = null;
      if (req.file) {
        referenceImagePath = `/uploads/images/${req.file.filename}`;
      }

      // Generate image
      const imagePath = await generateImageFromPrompt(prompt, style || 'generic', referenceImagePath);

      // Log the image path for debugging
      console.log(`Saving image with path: ${imagePath}`);

      // Save image to database
      const newImage = new Image({
        userId: req.user ? req.user._id : null,
        guestId: !req.user ? (req.cookies.guestId || req.ip) : null,
        type: 'generated',
        prompt,
        style: style || 'generic',
        referenceImagePath,
        path: imagePath
      });

      await newImage.save();

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Image generated successfully',
        image: {
          id: newImage._id,
          path: imagePath,
          prompt,
          style: style || 'generic'
        }
      });
    } catch (error) {
      console.error('Error generating image:', error);

      // If there's a reference image, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating the image'
      });
    }
  },

  // Render image generation page
  getImageGenerationPage: async (req, res) => {
    try {
      // Get rate limit info
      let rateLimit = { remaining: 0, limit: 0, cooldown: null };

      if (req.user) {
        // Registered user with custom rate limit
        const user = await User.findById(req.user._id);
        const now = new Date();
        const windowDuration = 2 * 60 * 1000; // 2 minutes

        // Get the user's custom image rate limit (default is 1)
        const imageLimit = user.imageRateLimit || 1;

        // Check if user has a window start time (has generated images before)
        if (user.imageWindowStartTime) {
          const timeElapsed = now - user.imageWindowStartTime;

          if (timeElapsed < windowDuration) {
            // Window is still active
            if (user.imageRequestsInWindow >= imageLimit) {
              // User is in cooldown
              const timeRemaining = windowDuration - timeElapsed;
              rateLimit.remaining = 0;
              rateLimit.limit = imageLimit;
              rateLimit.cooldown = new Date(user.imageWindowStartTime.getTime() + windowDuration).getTime();

              // Log for debugging
              console.log(`User ${user.username} is in cooldown. Time remaining: ${timeRemaining}ms`);
            } else {
              // User still has requests available in this window
              rateLimit.remaining = imageLimit - user.imageRequestsInWindow;
              rateLimit.limit = imageLimit;

              // Log for debugging
              console.log(`User ${user.username} has ${rateLimit.remaining} requests remaining in current window`);
            }
          } else {
            // Window has expired, reset the window
            user.imageRequestsInWindow = 0;
            user.imageWindowStartTime = null;
            await user.save();

            // User can make full requests again
            rateLimit.remaining = imageLimit;
            rateLimit.limit = imageLimit;

            // Log for debugging
            console.log(`User ${user.username}'s window has expired. Reset to ${imageLimit} requests.`);
          }
        } else {
          // First time user - full limit available
          rateLimit.remaining = imageLimit;
          rateLimit.limit = imageLimit;

          // Log for debugging
          console.log(`First time image generation for user ${user.username}. Limit: ${imageLimit}`);
        }
      } else {
        // Guest user - not allowed to generate images
        rateLimit.remaining = 0;
        rateLimit.limit = 0;
      }

      res.render('images/index', {
        title: 'FraiseAI - Image Generation',
        rateLimit,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Error loading image generation page:', err);
      req.flash('error_msg', 'An error occurred while loading the image generation page');
      res.redirect('/');
    }
  },

  // Generate image from text prompt with optional reference image
  generateImage: async (req, res) => {
    try {
      // Get prompt and style from form data
      const prompt = req.body.prompt;
      const style = req.body.style;

      // Validate input
      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a prompt for image generation'
        });
      }

      // Process rate limit
      const rateLimitResult = await processRateLimit(req);
      if (!rateLimitResult.success) {
        // If there's a reference image, delete it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(429).json({
          success: false,
          message: rateLimitResult.message,
          isRateLimited: true,
          isGuest: rateLimitResult.isGuest,
          cooldownEndTime: rateLimitResult.cooldownEndTime
        });
      }

      // Handle reference image if provided
      let referenceImagePath = null;
      if (req.file) {
        referenceImagePath = `/uploads/images/${req.file.filename}`;
      }

      // Generate image
      const imagePath = await generateImageFromPrompt(prompt, style || 'generic', referenceImagePath);

      // Log the image path for debugging
      console.log(`Saving image with path: ${imagePath}`);

      // Save image to database
      const newImage = new Image({
        userId: req.user ? req.user._id : null,
        guestId: !req.user ? (req.cookies.guestId || req.ip) : null,
        type: 'generated',
        prompt,
        style: style || 'generic',
        referenceImagePath,
        imagePath: imagePath
      });

      await newImage.save();

      // Get updated rate limit info after saving the image
      const updatedRateLimit = await processRateLimit(req);

      res.json({
        success: true,
        image: {
          id: newImage._id,
          path: imagePath,
          prompt,
          style: style || 'generic',
          referenceImagePath,
          createdAt: newImage.createdAt
        },
        // Include rate limit information
        isRateLimited: updatedRateLimit.isRateLimited || false,
        cooldownEndTime: updatedRateLimit.cooldownEndTime,
        remaining: updatedRateLimit.remaining || 0,
        currentLimit: updatedRateLimit.currentLimit || 1,
        limit: updatedRateLimit.limit || 1
      });
    } catch (err) {
      console.error('Error generating image:', err);

      // Provide a more helpful error message
      let errorMessage = 'An error occurred while generating the image';

      // Check if it's a timeout error
      if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
        errorMessage = 'The image generation service is taking too long to respond. Please try again in a moment.';
      }
      // Check if it's a network error
      else if (err.name === 'FetchError' || (err.message && err.message.includes('network'))) {
        errorMessage = 'There was a network issue while generating your image. Please check your connection and try again.';
      }
      // Check if it's a service error
      else if (err.message && err.message.includes('service')) {
        errorMessage = 'The image service is currently unavailable. Please try again later.';
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        canRetry: true, // Allow the user to retry
        retryAfter: 5 // Suggest retrying after 5 seconds
      });
    }
  },

  // Upload image
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please select an image to upload'
        });
      }

      // Process rate limit
      const rateLimitResult = await processRateLimit(req);
      if (!rateLimitResult.success) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        return res.status(429).json({
          success: false,
          message: rateLimitResult.message,
          isRateLimited: true,
          isGuest: rateLimitResult.isGuest,
          cooldownEndTime: rateLimitResult.cooldownEndTime
        });
      }

      // Save image to database
      const imagePath = `/uploads/images/${req.file.filename}`;

      const newImage = new Image({
        userId: req.user ? req.user._id : null,
        guestId: !req.user ? (req.cookies.guestId || req.ip) : null,
        type: 'uploaded',
        imagePath
      });

      await newImage.save();

      res.json({
        success: true,
        image: {
          id: newImage._id,
          path: imagePath,
          createdAt: newImage.createdAt
        }
      });
    } catch (err) {
      console.error('Error uploading image:', err);

      // Delete the uploaded file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      // Provide a more helpful error message
      let errorMessage = 'An error occurred while uploading the image';

      if (err.code === 'ENOENT') {
        errorMessage = 'The upload directory does not exist. Please contact the administrator.';
      } else if (err.code === 'EACCES') {
        errorMessage = 'Permission denied when saving the image. Please contact the administrator.';
      } else if (err.name === 'ValidationError') {
        errorMessage = 'The image data is invalid. Please try a different image.';
      }

      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  },

  // Transform uploaded image
  transformImage: async (req, res) => {
    try {
      const { imageId, style } = req.body;

      // Validate input
      if (!imageId || !style) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an image ID and style for transformation'
        });
      }

      // Process rate limit
      const rateLimitResult = await processRateLimit(req);
      if (!rateLimitResult.success) {
        return res.status(429).json({
          success: false,
          message: rateLimitResult.message,
          isRateLimited: true,
          isGuest: rateLimitResult.isGuest,
          cooldownEndTime: rateLimitResult.cooldownEndTime
        });
      }

      // Find the original image
      const originalImage = await Image.findById(imageId);
      if (!originalImage) {
        return res.status(404).json({
          success: false,
          message: 'Image not found. Please upload the image again.'
        });
      }

      // Check if the original image path exists
      if (!originalImage.imagePath) {
        return res.status(400).json({
          success: false,
          message: 'The original image is missing. Please upload the image again.'
        });
      }

      // Check if user owns the image
      const userId = req.user ? req.user._id : null;
      const guestId = !req.user ? (req.cookies.guestId || req.ip) : null;

      if ((userId && !originalImage.userId.equals(userId)) ||
          (guestId && originalImage.guestId !== guestId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to transform this image'
        });
      }

      // Transform the image
      const transformedImagePath = await transformUploadedImage(originalImage.imagePath, style);

      // Log the transformed image path for debugging
      console.log(`Saving transformed image with path: ${transformedImagePath}`);

      // Save transformed image to database
      const newImage = new Image({
        userId,
        guestId,
        type: 'transformed',
        originalImagePath: originalImage.imagePath,
        style,
        imagePath: transformedImagePath
      });

      await newImage.save();

      // Get updated rate limit info after saving the image
      const updatedRateLimit = await processRateLimit(req);

      res.json({
        success: true,
        image: {
          id: newImage._id,
          path: transformedImagePath,
          style,
          createdAt: newImage.createdAt
        },
        // Include rate limit information
        isRateLimited: updatedRateLimit.isRateLimited || false,
        cooldownEndTime: updatedRateLimit.cooldownEndTime,
        remaining: updatedRateLimit.remaining || 0,
        currentLimit: updatedRateLimit.currentLimit || 1
      });
    } catch (err) {
      console.error('Error transforming image:', err);

      // Provide a more helpful error message
      let errorMessage = 'An error occurred while transforming the image';

      if (err.message === 'Invalid original image path') {
        errorMessage = 'The original image could not be found. Please try uploading the image again.';
      } else if (err.message === 'All image services failed') {
        errorMessage = 'We could not connect to our image services. Please try again later.';
      } else if (err.message && err.message.includes('Pixabay')) {
        errorMessage = 'There was an issue with our image service. Please try a different style or try again later.';
      } else if (err.message && err.message.includes('Unsplash')) {
        errorMessage = 'There was an issue finding a suitable image. Please try a different style.';
      }

      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  },

  // Get user's images
  getUserImages: async (req, res) => {
    try {
      const userId = req.user ? req.user._id : null;
      const guestId = req.cookies.guestId || req.ip;

      // Find images for this user/guest
      const images = await Image.find(
        userId ? { userId } : { guestId }
      ).sort({ createdAt: -1 });

      // Return JSON response for AJAX requests
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
          success: true,
          images
        });
      }

      // Render page for direct visits
      res.render('images/my-images', {
        title: 'My Images - FraiseAI',
        images,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Error getting user images:', err);

      // Return JSON error for AJAX requests
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(500).json({
          success: false,
          message: 'An error occurred while loading your images'
        });
      }

      req.flash('error_msg', 'An error occurred while loading your images');
      res.redirect('/');
    }
  }
};
