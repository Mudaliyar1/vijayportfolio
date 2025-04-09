/**
 * AI Website Generator API
 * This API provides AI-powered automation for website creation
 */
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Try to load optional dependencies
let fetch;
let cheerio;

try {
  fetch = require('node-fetch');
} catch (e) {
  console.log('node-fetch not installed, web search functionality will be limited');
  // Provide a simple fallback
  fetch = async () => ({ ok: false });
}

try {
  cheerio = require('cheerio');
} catch (e) {
  console.log('cheerio not installed, web search functionality will be limited');
  // We'll handle this in the code
}

// AI website suggestion based on title
router.post('/suggest', isAuthenticated, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website title (at least 3 characters)'
      });
    }

    // Generate website suggestions based on the title
    const suggestion = await generateWebsiteSuggestion(title);

    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Error generating website suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate website suggestion',
      error: error.message
    });
  }
});

/**
 * Generate website suggestions based on the title
 * This function analyzes the title and suggests appropriate website content and styling
 */
async function generateWebsiteSuggestion(title) {
  // Normalize the title
  const normalizedTitle = title.toLowerCase().trim();

  // Analyze the title to determine business type
  let businessType = 'Professional Services'; // Default business type that matches the select options
  let description = '';
  let colorScheme = 'blue';
  let theme = 'modern';

  // Business type detection based on keywords
  if (normalizedTitle.includes('restaurant') ||
      normalizedTitle.includes('cafe') ||
      normalizedTitle.includes('food') ||
      normalizedTitle.includes('catering') ||
      normalizedTitle.includes('bakery') ||
      normalizedTitle.includes('bistro') ||
      normalizedTitle.includes('pizza') ||
      normalizedTitle.includes('grill')) {
    businessType = 'Restaurant';
    colorScheme = 'red';
    theme = 'elegant';
  }
  else if (normalizedTitle.includes('tech') ||
           normalizedTitle.includes('software') ||
           normalizedTitle.includes('digital') ||
           normalizedTitle.includes('app') ||
           normalizedTitle.includes('ai') ||
           normalizedTitle.includes('code') ||
           normalizedTitle.includes('computer') ||
           normalizedTitle.includes('it ')) {
    businessType = 'Technology';
    colorScheme = 'blue';
    theme = 'modern';
  }
  else if (normalizedTitle.includes('shop') ||
           normalizedTitle.includes('store') ||
           normalizedTitle.includes('market') ||
           normalizedTitle.includes('boutique') ||
           normalizedTitle.includes('retail') ||
           normalizedTitle.includes('mall') ||
           normalizedTitle.includes('outlet')) {
    businessType = 'Retail Store';
    colorScheme = 'green';
    theme = 'minimal';
  }
  else if (normalizedTitle.includes('health') ||
           normalizedTitle.includes('clinic') ||
           normalizedTitle.includes('medical') ||
           normalizedTitle.includes('wellness') ||
           normalizedTitle.includes('therapy') ||
           normalizedTitle.includes('doctor') ||
           normalizedTitle.includes('hospital')) {
    businessType = 'Healthcare';
    colorScheme = 'teal';
    theme = 'clean';
  }
  else if (normalizedTitle.includes('fit') ||
           normalizedTitle.includes('gym') ||
           normalizedTitle.includes('workout') ||
           normalizedTitle.includes('exercise') ||
           normalizedTitle.includes('sport')) {
    businessType = 'Fitness';
    colorScheme = 'green';
    theme = 'vibrant';
  }
  else if (normalizedTitle.includes('law') ||
           normalizedTitle.includes('legal') ||
           normalizedTitle.includes('attorney') ||
           normalizedTitle.includes('advocate') ||
           normalizedTitle.includes('counsel') ||
           normalizedTitle.includes('lawyer')) {
    businessType = 'Professional Services';
    colorScheme = 'navy';
    theme = 'professional';
  }
  else if (normalizedTitle.includes('education') ||
           normalizedTitle.includes('school') ||
           normalizedTitle.includes('academy') ||
           normalizedTitle.includes('learning') ||
           normalizedTitle.includes('training') ||
           normalizedTitle.includes('institute') ||
           normalizedTitle.includes('college') ||
           normalizedTitle.includes('university')) {
    businessType = 'Education';
    colorScheme = 'purple';
    theme = 'classic';
  }
  else if (normalizedTitle.includes('art') ||
           normalizedTitle.includes('design') ||
           normalizedTitle.includes('creative') ||
           normalizedTitle.includes('studio') ||
           normalizedTitle.includes('gallery') ||
           normalizedTitle.includes('craft')) {
    businessType = 'Art & Design';
    colorScheme = 'pink';
    theme = 'artistic';
  }
  else if (normalizedTitle.includes('travel') ||
           normalizedTitle.includes('tour') ||
           normalizedTitle.includes('vacation') ||
           normalizedTitle.includes('adventure') ||
           normalizedTitle.includes('journey') ||
           normalizedTitle.includes('trip') ||
           normalizedTitle.includes('holiday')) {
    businessType = 'Travel';
    colorScheme = 'orange';
    theme = 'vibrant';
  }
  else if (normalizedTitle.includes('beauty') ||
           normalizedTitle.includes('salon') ||
           normalizedTitle.includes('spa') ||
           normalizedTitle.includes('cosmetic') ||
           normalizedTitle.includes('hair') ||
           normalizedTitle.includes('makeup')) {
    businessType = 'Beauty';
    colorScheme = 'pink';
    theme = 'elegant';
  }
  else if (normalizedTitle.includes('real estate') ||
           normalizedTitle.includes('property') ||
           normalizedTitle.includes('home') ||
           normalizedTitle.includes('housing') ||
           normalizedTitle.includes('apartment') ||
           normalizedTitle.includes('realty')) {
    businessType = 'Real Estate';
    colorScheme = 'blue';
    theme = 'professional';
  }

  // Always search the web for more detailed information
  try {
    console.log(`Searching web for information about: ${title}`);
    const webInfo = await searchWebForBusinessInfo(title);

    if (webInfo) {
      console.log('Web search results:', webInfo);

      // Update business type if found and we don't already have a specific type
      if (webInfo.businessType && businessType === 'Professional Services') {
        const mappedType = mapToSelectOption(webInfo.businessType);
        console.log(`Mapped business type from web search: ${mappedType}`);
        businessType = mappedType;

        // Update color scheme and theme based on the new business type
        const styleInfo = getStylesForBusinessType(businessType);
        colorScheme = styleInfo.colorScheme;
        theme = styleInfo.theme;
      }

      // Always use the web description if available as it's more detailed
      if (webInfo.description) {
        description = webInfo.description;
      }
    }
  } catch (error) {
    console.error('Error searching web for business info:', error);
  }

  // If we still don't have a description, generate one based on the business type
  if (!description) {
    description = generateDescriptionFromBusinessType(title, businessType);
  }

  return {
    title,
    description,
    businessType,
    colorScheme,
    theme
  };
}

/**
 * Get color scheme and theme based on business type
 */
function getStylesForBusinessType(businessType) {
  const type = businessType.toLowerCase();

  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
    return { colorScheme: 'red', theme: 'elegant' };
  } else if (type.includes('tech') || type.includes('software') || type.includes('digital')) {
    return { colorScheme: 'blue', theme: 'modern' };
  } else if (type.includes('retail') || type.includes('store') || type.includes('shop')) {
    return { colorScheme: 'green', theme: 'minimal' };
  } else if (type.includes('health') || type.includes('clinic') || type.includes('medical')) {
    return { colorScheme: 'teal', theme: 'clean' };
  } else if (type.includes('fitness') || type.includes('gym')) {
    return { colorScheme: 'green', theme: 'vibrant' };
  } else if (type.includes('law') || type.includes('legal') || type.includes('professional')) {
    return { colorScheme: 'navy', theme: 'professional' };
  } else if (type.includes('education') || type.includes('school') || type.includes('academy')) {
    return { colorScheme: 'purple', theme: 'classic' };
  } else if (type.includes('art') || type.includes('design') || type.includes('creative')) {
    return { colorScheme: 'pink', theme: 'artistic' };
  } else if (type.includes('travel') || type.includes('tour') || type.includes('vacation')) {
    return { colorScheme: 'orange', theme: 'vibrant' };
  } else if (type.includes('beauty') || type.includes('salon') || type.includes('spa')) {
    return { colorScheme: 'pink', theme: 'elegant' };
  } else if (type.includes('real estate') || type.includes('property')) {
    return { colorScheme: 'blue', theme: 'professional' };
  }

  // Default styles
  return { colorScheme: 'blue', theme: 'modern' };
}

/**
 * Search the web for information about a business based on its title
 */
async function searchWebForBusinessInfo(title) {
  // If fetch is not available, return null
  if (typeof fetch !== 'function' || fetch.toString().includes('ok: false')) {
    console.log('Web search functionality is disabled because node-fetch is not installed');
    return null;
  }

  try {
    // First, search for business type
    const businessTypeInfo = await searchForBusinessType(title);

    // Then, search for a detailed description
    const detailedDescription = await searchForDetailedDescription(title, businessTypeInfo?.businessType || '');

    // Combine the results
    return {
      businessType: businessTypeInfo?.businessType || '',
      description: detailedDescription || businessTypeInfo?.description || ''
    };
  } catch (error) {
    console.error('Error searching web:', error);
    return null;
  }
}

/**
 * Search for business type information
 */
async function searchForBusinessType(title) {
  try {
    // Encode the title for the search query
    const query = encodeURIComponent(`${title} business type what is`);
    const searchUrl = `https://www.google.com/search?q=${query}`;

    // Fetch the search results
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch search results: ${response.status}`);
    }

    const html = await response.text();

    // Try to extract information from the search results
    let businessType = '';
    let description = '';

    // Simple extraction based on common patterns
    // This is a basic implementation - in a production environment, you would use more sophisticated methods

    // Look for business type indicators
    const businessTypeIndicators = [
      'is a', 'specializes in', 'offers', 'provides', 'company', 'business',
      'organization', 'enterprise', 'firm', 'establishment'
    ];

    // Extract text snippets that might contain business information
    // Use a simple regex approach that doesn't require cheerio
    const snippets = html.match(/<span[^>]*>(.*?)<\/span>/g) || [];
    const divSnippets = html.match(/<div[^>]*>(.*?)<\/div>/g) || [];
    const allSnippets = [...snippets, ...divSnippets];

    for (const snippet of allSnippets) {
      const text = snippet.replace(/<[^>]*>/g, '').toLowerCase();

      // Look for business type indicators
      for (const indicator of businessTypeIndicators) {
        if (text.includes(indicator) && text.includes(title.toLowerCase())) {
          businessType = text;
          break;
        }
      }

      // If we found a business type, also use it for description
      if (businessType) {
        description = `${title} ${businessType}`;
        break;
      }
    }

    // If we couldn't find anything, try a simpler approach
    if (!businessType) {
      // Look for common business descriptions in the HTML
      const lowerHtml = html.toLowerCase();
      const titleLower = title.toLowerCase();

      // Check for common patterns
      for (const type of ['restaurant', 'cafe', 'shop', 'store', 'technology', 'healthcare',
                          'fitness', 'legal', 'education', 'art', 'design', 'travel', 'beauty', 'real estate']) {
        if (lowerHtml.includes(`${titleLower} is a ${type}`) ||
            lowerHtml.includes(`${titleLower} ${type}`) ||
            lowerHtml.includes(`${type} ${titleLower}`)) {
          businessType = type;
          description = `${title} is a ${type} business.`;
          break;
        }
      }
    }

    return {
      businessType,
      description
    };
  } catch (error) {
    console.error('Error searching for business type:', error);
    return null;
  }
}

/**
 * Search for a detailed description of a business
 */
async function searchForDetailedDescription(title, businessType) {
  try {
    // Create a more specific query based on the business type if available
    let query;
    if (businessType) {
      query = encodeURIComponent(`${title} ${businessType} business description about`);
    } else {
      query = encodeURIComponent(`${title} business description about`);
    }

    const searchUrl = `https://www.google.com/search?q=${query}`;

    // Fetch the search results
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch description search results: ${response.status}`);
    }

    const html = await response.text();

    // Extract potential description snippets
    // Look for meta descriptions, snippets, and other content that might contain business descriptions
    const metaDescriptions = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/g) || [];
    const snippets = html.match(/<span[^>]*>(.*?)<\/span>/g) || [];
    const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/g) || [];

    // Extract and clean text from meta descriptions
    const metaTexts = metaDescriptions.map(meta => {
      const match = meta.match(/content=["']([^"']*)["']/i);
      return match ? match[1] : '';
    }).filter(text => text.length > 50); // Only consider substantial descriptions

    // Extract and clean text from snippets and paragraphs
    const cleanedSnippets = [...snippets, ...paragraphs].map(snippet => {
      return snippet.replace(/<[^>]*>/g, '').trim();
    }).filter(text =>
      text.length > 50 && // Only consider substantial snippets
      text.toLowerCase().includes(title.toLowerCase()) // Must mention the business name
    );

    // Combine all potential descriptions
    const potentialDescriptions = [...metaTexts, ...cleanedSnippets];

    // Find the best description
    let bestDescription = '';
    let bestScore = 0;

    for (const desc of potentialDescriptions) {
      // Score the description based on various factors
      let score = 0;

      // Length is good but not too long
      if (desc.length > 100 && desc.length < 500) score += 3;
      else if (desc.length >= 50 && desc.length <= 100) score += 2;
      else if (desc.length > 500) score += 1;

      // Contains the business name
      if (desc.toLowerCase().includes(title.toLowerCase())) score += 3;

      // Contains business type keywords
      if (businessType && desc.toLowerCase().includes(businessType.toLowerCase())) score += 2;

      // Contains descriptive keywords
      const descriptiveKeywords = ['provide', 'offer', 'specialize', 'service', 'product', 'quality', 'experience', 'professional'];
      for (const keyword of descriptiveKeywords) {
        if (desc.toLowerCase().includes(keyword)) score += 1;
      }

      // Update best description if this one has a higher score
      if (score > bestScore) {
        bestScore = score;
        bestDescription = desc;
      }
    }

    // If we found a good description, return it
    if (bestDescription && bestScore > 3) {
      return bestDescription;
    }

    // If we couldn't find a good description, generate one based on the business type
    if (businessType) {
      // Generate a more detailed description based on the business type
      return generateDescriptionFromBusinessType(title, businessType);
    }

    return null;
  } catch (error) {
    console.error('Error searching for detailed description:', error);
    return null;
  }
}

/**
 * Generate a detailed description based on business type
 */
function generateDescriptionFromBusinessType(title, businessType) {
  const lowerType = businessType.toLowerCase();

  // Restaurant/Food
  if (lowerType.includes('restaurant') || lowerType.includes('cafe') || lowerType.includes('food') || lowerType.includes('catering')) {
    return `${title} is a distinguished dining establishment offering exceptional culinary experiences in a welcoming atmosphere. We pride ourselves on using the finest ingredients to create memorable dishes that delight our customers. Our dedicated team provides attentive service, ensuring each visit is special. Whether you're joining us for a casual meal or celebrating a special occasion, we're committed to exceeding your expectations with our delicious food, inviting ambiance, and outstanding hospitality.`;
  }

  // Retail
  if (lowerType.includes('shop') || lowerType.includes('store') || lowerType.includes('retail')) {
    return `${title} is a premier retail destination offering a carefully curated selection of high-quality products. We're dedicated to providing exceptional customer service and a unique shopping experience that keeps our customers coming back. Our knowledgeable staff is always ready to assist you in finding exactly what you need. At ${title}, we pride ourselves on offering products that combine quality, value, and style, all in a welcoming shopping environment designed with our customers in mind.`;
  }

  // Technology
  if (lowerType.includes('tech') || lowerType.includes('software') || lowerType.includes('digital') || lowerType.includes('it')) {
    return `${title} is an innovative technology company at the forefront of digital transformation. We develop cutting-edge solutions that help businesses optimize their operations and achieve their strategic goals. Our team of experienced professionals combines technical expertise with industry knowledge to deliver customized solutions that address complex challenges. We're committed to staying ahead of technological trends and providing our clients with the tools they need to succeed in an increasingly digital world.`;
  }

  // Healthcare
  if (lowerType.includes('health') || lowerType.includes('clinic') || lowerType.includes('medical') || lowerType.includes('wellness')) {
    return `${title} is dedicated to improving health and wellness through comprehensive care and personalized treatment plans. Our team of healthcare professionals is committed to providing the highest standard of care in a compassionate and supportive environment. We combine advanced medical knowledge with a patient-centered approach to address your unique health needs. At ${title}, we believe in empowering our patients through education and preventive care, helping you achieve and maintain optimal health for years to come.`;
  }

  // Fitness
  if (lowerType.includes('fitness') || lowerType.includes('gym') || lowerType.includes('workout')) {
    return `${title} is a state-of-the-art fitness center dedicated to helping clients achieve their health and wellness goals. Our facility offers modern equipment, expert personal training, and a variety of group fitness classes designed for all fitness levels. We create a motivating and supportive environment where members feel inspired to push their limits and transform their lives. At ${title}, we believe fitness is a journey, and we're committed to supporting you every step of the way with personalized guidance and encouragement.`;
  }

  // Professional Services
  if (lowerType.includes('law') || lowerType.includes('legal') || lowerType.includes('consult') || lowerType.includes('service') || lowerType.includes('professional')) {
    return `${title} provides expert professional services tailored to meet the unique needs of our clients. With years of industry experience and specialized knowledge, our team delivers solutions that help you navigate complex challenges and achieve your objectives. We pride ourselves on building long-term relationships based on trust, integrity, and results. At ${title}, we're committed to understanding your specific requirements and providing personalized service that exceeds your expectations.`;
  }

  // Education
  if (lowerType.includes('education') || lowerType.includes('school') || lowerType.includes('academy') || lowerType.includes('learning')) {
    return `${title} is an educational institution committed to fostering learning and academic excellence in a supportive environment. We provide quality education that prepares students for success in a rapidly changing world. Our dedicated educators employ innovative teaching methods that engage students and inspire a lifelong love of learning. At ${title}, we believe in developing the whole person, nurturing not only academic skills but also character, creativity, and critical thinking abilities that will serve our students throughout their lives.`;
  }

  // Creative/Design
  if (lowerType.includes('art') || lowerType.includes('design') || lowerType.includes('creative')) {
    return `${title} is a creative studio specializing in innovative design and artistic expression. Our talented team blends creativity with technical expertise to deliver stunning visual solutions that captivate audiences and communicate powerful messages. We approach each project with fresh perspective and attention to detail, ensuring unique results that align with our clients' vision and objectives. At ${title}, we're passionate about pushing creative boundaries and transforming ideas into impactful visual experiences that leave a lasting impression.`;
  }

  // Travel
  if (lowerType.includes('travel') || lowerType.includes('tour') || lowerType.includes('vacation')) {
    return `${title} specializes in creating unforgettable travel experiences tailored to your preferences and dreams. We curate exceptional journeys that combine adventure, comfort, and authentic cultural experiences. Our travel experts have extensive knowledge of destinations worldwide and work closely with you to plan every detail of your perfect trip. At ${title}, we believe travel should be transformative, and we're dedicated to crafting journeys that create lasting memories and broaden your perspective of the world.`;
  }

  // Beauty
  if (lowerType.includes('beauty') || lowerType.includes('salon') || lowerType.includes('spa')) {
    return `${title} is a premier beauty destination offering exceptional services in a luxurious and relaxing environment. Our skilled professionals use premium products and advanced techniques to help you look and feel your best. We provide personalized treatments tailored to your unique needs and preferences, ensuring results that enhance your natural beauty. At ${title}, we're committed to creating a rejuvenating experience where you can escape the everyday and emerge feeling refreshed, confident, and beautiful.`;
  }

  // Real Estate
  if (lowerType.includes('real estate') || lowerType.includes('property')) {
    return `${title} is a trusted real estate firm dedicated to helping clients achieve their property goals with expert guidance and personalized service. Our knowledgeable team has deep market insights and a commitment to understanding each client's unique needs. Whether you're buying, selling, or investing, we provide comprehensive support throughout the entire process. At ${title}, we build relationships based on integrity and results, ensuring a smooth and successful real estate experience for every client we serve.`;
  }

  // Default description for other business types
  return `${title} is a distinguished organization committed to excellence in all aspects of our operations. We combine industry expertise with innovative approaches to deliver outstanding results for our clients. Our dedicated team works tirelessly to understand your specific needs and provide solutions that exceed expectations. At ${title}, we believe in building lasting relationships based on trust, quality, and exceptional service, making us a preferred choice in our field.`;
}

/**
 * Map a business type string to one of the select options
 */
function mapToSelectOption(businessTypeString) {
  // Convert to lowercase for case-insensitive matching
  const type = businessTypeString.toLowerCase();

  // Map to select options
  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe') || type.includes('catering')) {
    return 'Restaurant';
  } else if (type.includes('retail') || type.includes('store') || type.includes('shop')) {
    return 'Retail Store';
  } else if (type.includes('law') || type.includes('legal') || type.includes('consult') || type.includes('service')) {
    return 'Professional Services';
  } else if (type.includes('health') || type.includes('medical') || type.includes('clinic') || type.includes('hospital')) {
    return 'Healthcare';
  } else if (type.includes('education') || type.includes('school') || type.includes('academy') || type.includes('university')) {
    return 'Education';
  } else if (type.includes('tech') || type.includes('software') || type.includes('it') || type.includes('digital')) {
    return 'Technology';
  } else if (type.includes('real estate') || type.includes('property') || type.includes('housing')) {
    return 'Real Estate';
  } else if (type.includes('fitness') || type.includes('gym') || type.includes('sport')) {
    return 'Fitness';
  } else if (type.includes('beauty') || type.includes('salon') || type.includes('spa')) {
    return 'Beauty';
  } else if (type.includes('art') || type.includes('design') || type.includes('creative')) {
    return 'Art & Design';
  } else if (type.includes('travel') || type.includes('tour') || type.includes('vacation')) {
    return 'Travel';
  }

  // Default to Professional Services if no match is found
  return 'Professional Services';
}

module.exports = router;
