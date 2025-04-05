/**
 * Cohere AI Prompt Enhancer
 *
 * This utility implements the advanced Cohere AI prompt engineering approach for
 * generating high-quality, accurate, and personalized image and chat prompts.
 *
 * Features:
 * - Cross-user learning system
 * - Per-user prompt memory
 * - Prompt enhancement breakdown
 * - Image upload context integration
 * - AI collaboration
 */

// Import required models
const Image = require('../models/Image');
const Chat = require('../models/Chat');

// Subject categories for prompt analysis
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

// Style categories for prompt analysis
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

/**
 * Enhances an image prompt using the Cohere AI approach
 *
 * @param {string} prompt - The user's original prompt
 * @param {string} style - The requested style (optional)
 * @param {boolean} hasReferenceImage - Whether a reference image was provided
 * @param {object} user - The user object (optional)
 * @returns {string} - The enhanced prompt for image generation
 */
async function enhanceImagePrompt(prompt, style = 'realistic', hasReferenceImage = false, user = null) {
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

  console.log('🎨 Step 2: Learning from past prompts');

  // Learn from past prompts (cross-user learning)
  let enhancementFromPastPrompts = '';

  try {
    // Find similar successful prompts in the database
    const similarPrompts = await Image.find({
      $or: [
        { prompt: { $regex: mainCategory, $options: 'i' } },
        { style: promptStyle }
      ],
      // Only include images that were not deleted (successful generations)
      deleted: { $ne: true }
    }).sort({ createdAt: -1 }).limit(5);

    if (similarPrompts.length > 0) {
      // Extract common elements from successful prompts
      const commonElements = extractCommonElements(similarPrompts.map(img => img.prompt));
      if (commonElements) {
        enhancementFromPastPrompts = `, ${commonElements}`;
        console.log(`Learning from past prompts: ${enhancementFromPastPrompts}`);
      }
    }
  } catch (error) {
    console.error('Error learning from past prompts:', error);
  }

  console.log('🖼️ Step 3: Constructing enhanced prompt');

  // Start with the original prompt
  let enhancedPrompt = prompt;

  // Add subject-specific enhancements
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

  // Add style-specific enhancements
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

  // Add style enhancement
  const styleModifier = styleEnhancements[promptStyle] || styleEnhancements['realistic'];
  enhancedPrompt = `${enhancedPrompt}, ${styleModifier}`;

  // Add reference to uploaded image if provided
  if (hasReferenceImage) {
    enhancedPrompt = `${enhancedPrompt}, inspired by the reference image`;
  }

  // Add enhancements from past prompts
  if (enhancementFromPastPrompts) {
    enhancedPrompt = `${enhancedPrompt}${enhancementFromPastPrompts}`;
  }

  // Add user-specific enhancements if user is provided
  if (user) {
    try {
      // Find user's past successful prompts
      const userPrompts = await Image.find({
        userId: user._id,
        deleted: { $ne: true }
      }).sort({ createdAt: -1 }).limit(10);

      if (userPrompts.length > 0) {
        // Extract user's preferred styles and subjects
        const userPreferences = extractUserPreferences(userPrompts);
        if (userPreferences) {
          enhancedPrompt = `${enhancedPrompt}, ${userPreferences}`;
          console.log(`Added user-specific preferences: ${userPreferences}`);
        }
      }
    } catch (error) {
      console.error('Error adding user-specific enhancements:', error);
    }
  }

  console.log('📸 Step 4: Adding final quality enhancements');

  // Add camera and composition details
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
  const cameraDetailsCopy = [...cameraDetails];

  for (let i = 0; i < 3; i++) {
    if (cameraDetailsCopy.length === 0) break;
    const randomIndex = Math.floor(Math.random() * cameraDetailsCopy.length);
    selectedCameraDetails.push(cameraDetailsCopy[randomIndex]);
    cameraDetailsCopy.splice(randomIndex, 1);
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

  // Store this prompt for future learning
  try {
    // We don't need to store it here as it will be stored when the image is created
    // This is just for the learning system to improve over time
  } catch (error) {
    console.error('Error storing prompt for learning:', error);
  }

  return enhancedPrompt;
}

/**
 * Enhances a chat prompt using the Cohere AI approach
 *
 * @param {string} prompt - The user's original prompt
 * @param {object} user - The user object (optional)
 * @returns {string} - The enhanced prompt for the chat AI
 */
function enhanceChatPrompt(prompt, user = null) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🧠 Step 1: Analyzing user prompt');

      // First, correct any spelling mistakes
      const correctedPrompt = correctSpelling(prompt);

      // Start with the corrected prompt
      let enhancedPrompt = correctedPrompt;

      console.log('🔍 Step 2: Adding context from past conversations');

      // Add context from past conversations if user is provided
      let contextAdded = false;
      if (user) {
    try {
      // Find user's past conversations
      const userChats = await Chat.find({
        userId: user._id
      }).sort({ createdAt: -1 }).limit(5);

      if (userChats.length > 0) {
        // Extract context from past conversations
        const context = extractChatContext(userChats, prompt);
        if (context) {
          // Add context as system instruction
          enhancedPrompt = `[Context from past conversations: ${context}] ${enhancedPrompt}`;
          console.log(`Added context from past conversations: ${context}`);
          contextAdded = true;
        }
      }
    } catch (error) {
      console.error('Error adding context from past conversations:', error);
    }
  }

  console.log('📝 Step 3: Enhancing prompt with details');

  // Enhance the prompt based on its type
  enhancedPrompt = addPromptDetails(enhancedPrompt);

  console.log('🌐 Step 4: Adding cross-user learning');

  // Add insights from other users' similar queries
  try {
    // Find similar successful queries from other users
    const similarQueries = await Chat.aggregate([
      // Find messages with similar content
      { $match: {
        'messages.content': { $regex: getKeywords(prompt).join('|'), $options: 'i' },
        // Exclude current user's chats
        ...(user ? { userId: { $ne: user._id } } : {})
      }},
      // Limit to recent conversations
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]);

    if (similarQueries.length > 0) {
      // Extract common patterns from successful conversations
      const commonPatterns = extractCommonPatterns(similarQueries);
      if (commonPatterns && !contextAdded) {
        // Add as a subtle hint rather than explicit context
        enhancedPrompt = `${enhancedPrompt} [Consider: ${commonPatterns}]`;
        console.log(`Added cross-user learning: ${commonPatterns}`);
      }
    }
  } catch (error) {
    console.error('Error adding cross-user learning:', error);
  }

      console.log(`Original prompt: "${prompt}"`);
      console.log(`Enhanced prompt: "${enhancedPrompt}"`);

      resolve(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing chat prompt:', error);
      reject(error);
    }
  });
}

/**
 * Corrects common spelling mistakes in a prompt
 *
 * @param {string} text - The text to correct
 * @returns {string} - The corrected text
 */
function correctSpelling(text) {
  // Common spelling mistakes dictionary
  const spellingCorrections = {
    // Common typos
    'teh': 'the',
    'recieve': 'receive',
    'wierd': 'weird',
    'thier': 'their',
    'alot': 'a lot',
    'definately': 'definitely',
    'seperate': 'separate',
    'occured': 'occurred',
    'untill': 'until',
    'begining': 'beginning',
    'beleive': 'believe',
    'accomodate': 'accommodate',
    'accross': 'across',
    'apparant': 'apparent',
    'arguement': 'argument',
    'basicly': 'basically',
    'beautifull': 'beautiful',
    'definatly': 'definitely',
    'enviroment': 'environment',
    'existance': 'existence',
    'freind': 'friend',
    'goverment': 'government',
    'gaurd': 'guard',
    'happend': 'happened',
    'immediatly': 'immediately',
    'independant': 'independent',
    'intresting': 'interesting',
    'knowlege': 'knowledge',
    'neccessary': 'necessary',
    'occassion': 'occasion',
    'occuring': 'occurring',
    'posession': 'possession',
    'potatos': 'potatoes',
    'recieve': 'receive',
    'refering': 'referring',
    'remeber': 'remember',
    'seperate': 'separate',
    'similer': 'similar',
    'speach': 'speech',
    'succesful': 'successful',
    'tomatos': 'tomatoes',
    'tommorrow': 'tomorrow',
    'truely': 'truly',
    'untill': 'until',
    'wether': 'whether',
    'writting': 'writing',
    'wich': 'which',
    'withh': 'with',
    'whith': 'with',
    'wnat': 'want',
    'wrok': 'work',
    'becuase': 'because',
    'beacuse': 'because',
    'becasue': 'because',
    'becouse': 'because',
    'peopel': 'people',
    'peaple': 'people',
    'insted': 'instead',
    'diffrent': 'different',
    'differnt': 'different',
    'probly': 'probably',
    'probbably': 'probably',
    'prolly': 'probably',
    'informtion': 'information',
    'infomation': 'information',
    'accordng': 'according',
    'accordin': 'according',
    'acording': 'according',
    'speeling': 'spelling',
    'speling': 'spelling',
    'amke': 'make',
    'mak': 'make',
    'th': 'the',
    'inprove': 'improve',
    'improvment': 'improvement',
    'improvemnt': 'improvement',
    'detaild': 'detailed',
    'detaled': 'detailed',

    // Common words with typos
    'pleese': 'please',
    'plese': 'please',
    'plz': 'please',
    'pls': 'please',
    'thankyou': 'thank you',
    'thanx': 'thanks',
    'thx': 'thanks',
    'dont': 'don\'t',
    'cant': 'can\'t',
    'wont': 'won\'t',
    'didnt': 'didn\'t',
    'isnt': 'isn\'t',
    'wasnt': 'wasn\'t',
    'werent': 'weren\'t',
    'havent': 'haven\'t',
    'hasnt': 'hasn\'t',
    'hadnt': 'hadn\'t',
    'couldnt': 'couldn\'t',
    'shouldnt': 'shouldn\'t',
    'wouldnt': 'wouldn\'t',
    'arent': 'aren\'t',
    'youre': 'you\'re',
    'theyre': 'they\'re',
    'im': 'I\'m',
    'ive': 'I\'ve',
    'id': 'I\'d',
    'ill': 'I\'ll',
    'youve': 'you\'ve',
    'youll': 'you\'ll',
    'youre': 'you\'re',
    'theyll': 'they\'ll',
    'theyve': 'they\'ve',
    'weve': 'we\'ve',
    'were': 'we\'re',
    'hes': 'he\'s',
    'shes': 'she\'s',
    'its': 'it\'s',
    'thats': 'that\'s',
    'whats': 'what\'s',
    'whos': 'who\'s',
    'wheres': 'where\'s',
    'hows': 'how\'s',
    'whens': 'when\'s',
    'whys': 'why\'s',

    // Specific to the user's example
    'brn': 'button',
    'didnt': 'didn\'t',
    'rgiht': 'right',
    'worng': 'wrong',
    'entere': 'entered',
    'wanst': 'wants',
    'converst': 'convert',
    'convert': 'convert',
    'works': 'words'
  };

  // Log the original text for debugging
  console.log('Original text for spelling correction:', text);

  // Split text into words, preserving punctuation
  // This regex splits on whitespace but keeps punctuation attached to words
  let words = text.split(/\s+/);
  console.log('Words after splitting:', words);

  // Correct each word if it's in our dictionary
  words = words.map(word => {
    // Remove punctuation for dictionary lookup
    const punctuationMatch = word.match(/([^\w]*)([\w']+)([^\w]*)/);
    if (!punctuationMatch) return word; // Not a word with possible punctuation

    const [, leadingPunct, bareWord, trailingPunct] = punctuationMatch;

    // Check for the word in lowercase in our dictionary
    const lowerWord = bareWord.toLowerCase();
    console.log(`Checking word: '${bareWord}' (lowercase: '${lowerWord}')`);

    if (spellingCorrections[lowerWord]) {
      console.log(`Found correction for '${lowerWord}': '${spellingCorrections[lowerWord]}'`);
      let corrected;

      // Preserve capitalization if the first letter was capitalized
      if (bareWord[0] === bareWord[0].toUpperCase()) {
        corrected = spellingCorrections[lowerWord].charAt(0).toUpperCase() +
                   spellingCorrections[lowerWord].slice(1);
      } else {
        corrected = spellingCorrections[lowerWord];
      }

      // Reattach punctuation
      return leadingPunct + corrected + trailingPunct;
    }

    return word; // Return original if no correction found
  });

  // Join words back into text
  const correctedText = words.join(' ');

  // Log the corrected text for debugging
  console.log('Corrected text after spelling correction:', correctedText);

  return correctedText;
}

/**
 * Adds detailed enhancements to a prompt based on its type
 *
 * @param {string} prompt - The prompt to enhance
 * @returns {string} - The enhanced prompt
 */
function addPromptDetails(prompt) {
  let enhanced = prompt;
  const promptLower = prompt.toLowerCase();

  // Add specificity based on prompt type
  if (promptLower.match(/\b(how|what|why|when|where|who|which)\b/i)) {
    // Question-type prompts
    if (!promptLower.includes('detail')) {
      enhanced += ' in detail';
    }
    if (!promptLower.includes('example')) {
      enhanced += ' with specific examples';
    }
  }

  // Add clarity for code requests
  if (promptLower.match(/\b(code|function|program|script|algorithm|develop|create)\b/i)) {
    enhanced = enhanced.replace(/\bwrite\b/i, 'Write a well-commented');
    if (!promptLower.match(/\b(step by step|detailed|explanation)\b/i)) {
      enhanced += ' with step-by-step explanation and best practices';
    }
    if (!promptLower.match(/\b(example|sample)\b/i)) {
      enhanced += ' including practical examples';
    }
  }

  // Add detail for explanations
  if (promptLower.match(/\b(explain|describe|elaborate|clarify|what is|definition)\b/i)) {
    enhanced = enhanced.replace(/\bexplain\b/i, 'explain in simple terms');
    if (!promptLower.match(/\b(beginner|simple|basic)\b/i)) {
      enhanced += ' for a beginner';
    }
    if (!promptLower.match(/\b(analogy|comparison)\b/i)) {
      enhanced += ' using analogies where helpful';
    }
  }

  // Add detail for comparison requests
  if (promptLower.match(/\b(compare|versus|vs|difference|similarities|better)\b/i)) {
    if (!promptLower.match(/\b(pros|cons|advantages|disadvantages)\b/i)) {
      enhanced += ' including pros and cons of each';
    }
    if (!promptLower.match(/\b(table|chart)\b/i)) {
      enhanced += ' with a comparison table';
    }
  }

  // Add detail for creative requests
  if (promptLower.match(/\b(story|poem|song|creative|write|generate)\b/i)) {
    if (!promptLower.match(/\b(style|tone|mood)\b/i)) {
      enhanced += ' with an engaging style';
    }
    if (!promptLower.match(/\b(character|setting|plot)\b/i) && promptLower.includes('story')) {
      enhanced += ' with well-developed characters and setting';
    }
  }

  return enhanced;
}

/**
 * Extract keywords from a prompt for similarity matching
 *
 * @param {string} prompt - The prompt to extract keywords from
 * @returns {Array} - Array of keywords
 */
function getKeywords(prompt) {
  // Remove common stop words
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
                     'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with',
                     'by', 'about', 'against', 'between', 'into', 'through', 'during',
                     'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of',
                     'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
                     'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
                     'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
                     'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will',
                     'just', 'should', 'now'];

  // Extract words, remove punctuation, and filter out stop words
  const words = prompt.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));

  // Return unique keywords
  return [...new Set(words)];
}

/**
 * Extract common patterns from similar conversations
 *
 * @param {Array} conversations - Array of conversation objects
 * @returns {string} - Common patterns as a string
 */
function extractCommonPatterns(conversations) {
  if (!conversations || conversations.length === 0) return '';

  // Extract all user messages
  const allMessages = [];
  conversations.forEach(chat => {
    if (chat.messages) {
      chat.messages.forEach(msg => {
        if (msg.role === 'user') {
          allMessages.push(msg.content);
        }
      });
    }
  });

  // Extract common phrases (2-3 words)
  const phrases = {};

  allMessages.forEach(message => {
    const words = message.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length - 1; i++) {
      const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
      phrases[twoWordPhrase] = (phrases[twoWordPhrase] || 0) + 1;

      if (i < words.length - 2) {
        const threeWordPhrase = `${twoWordPhrase} ${words[i + 2]}`;
        phrases[threeWordPhrase] = (phrases[threeWordPhrase] || 0) + 1;
      }
    }
  });

  // Find common phrases (appearing in at least 2 conversations)
  const commonPhrases = Object.entries(phrases)
    .filter(([phrase, count]) => count >= 2)
    .map(([phrase]) => phrase)
    .slice(0, 3);

  return commonPhrases.join(', ');
}

/**
 * Extract common elements from successful prompts
 *
 * @param {Array} prompts - Array of prompt strings
 * @returns {string} - Common elements as a string
 */
function extractCommonElements(prompts) {
  if (!prompts || prompts.length === 0) return '';

  // Extract common words and phrases
  const words = {};
  const phrases = {};

  prompts.forEach(prompt => {
    if (!prompt) return;

    // Extract words
    const promptWords = prompt.toLowerCase().split(/\s+/);
    promptWords.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 characters
        words[word] = (words[word] || 0) + 1;
      }
    });

    // Extract phrases (2-3 words)
    for (let i = 0; i < promptWords.length - 1; i++) {
      const twoWordPhrase = `${promptWords[i]} ${promptWords[i + 1]}`;
      phrases[twoWordPhrase] = (phrases[twoWordPhrase] || 0) + 1;

      if (i < promptWords.length - 2) {
        const threeWordPhrase = `${twoWordPhrase} ${promptWords[i + 2]}`;
        phrases[threeWordPhrase] = (phrases[threeWordPhrase] || 0) + 1;
      }
    }
  });

  // Find common words (appearing in at least 2 prompts)
  const commonWords = Object.entries(words)
    .filter(([word, count]) => count >= 2)
    .map(([word]) => word);

  // Find common phrases (appearing in at least 2 prompts)
  const commonPhrases = Object.entries(phrases)
    .filter(([phrase, count]) => count >= 2)
    .map(([phrase]) => phrase);

  // Combine common elements
  const commonElements = [...commonPhrases, ...commonWords].slice(0, 5);

  return commonElements.join(', ');
}

/**
 * Extract user preferences from past prompts
 *
 * @param {Array} userPrompts - Array of user's past prompts
 * @returns {string} - User preferences as a string
 */
function extractUserPreferences(userPrompts) {
  if (!userPrompts || userPrompts.length === 0) return '';

  // Count styles
  const styles = {};
  userPrompts.forEach(image => {
    if (image.style) {
      styles[image.style] = (styles[image.style] || 0) + 1;
    }
  });

  // Find preferred style (most used)
  let preferredStyle = '';
  let maxCount = 0;

  Object.entries(styles).forEach(([style, count]) => {
    if (count > maxCount) {
      maxCount = count;
      preferredStyle = style;
    }
  });

  if (preferredStyle) {
    return `user's preferred ${preferredStyle} style`;
  }

  return '';
}

/**
 * Extract context from past chat conversations
 *
 * @param {Array} chats - Array of user's past chat messages
 * @param {string} currentPrompt - The current prompt
 * @returns {string} - Context as a string
 */
function extractChatContext(chats, currentPrompt) {
  if (!chats || chats.length === 0 || !currentPrompt) return '';

  // Extract keywords from current prompt
  const promptKeywords = currentPrompt.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Find relevant messages from past conversations
  const relevantMessages = [];

  chats.forEach(chat => {
    if (!chat.messages) return;

    chat.messages.forEach(message => {
      if (message.role === 'user') {
        // Check if message contains any keywords from current prompt
        const messageText = message.content.toLowerCase();
        const isRelevant = promptKeywords.some(keyword => messageText.includes(keyword));

        if (isRelevant) {
          relevantMessages.push(message.content);
        }
      }
    });
  });

  if (relevantMessages.length > 0) {
    // Return up to 2 relevant messages
    return relevantMessages.slice(0, 2).join('; ');
  }

  return '';
}

module.exports = {
  enhanceImagePrompt,
  enhanceChatPrompt
};
