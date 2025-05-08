/**
 * Internet Ads Service
 * Fetches free ads from various public sources
 */
const axios = require('axios');
const Ad = require('../models/Ad');
const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');

// List of free ad sources (these are placeholder URLs - replace with actual free ad sources)
const FREE_AD_SOURCES = [
  // Open Source & Community
  {
    name: 'Open Source Projects',
    url: 'https://raw.githubusercontent.com/github/explore/master/topics/open-source/open-source.png',
    link: 'https://opensource.org/',
    title: 'Support Open Source',
    description: 'Discover and contribute to open source projects',
    category: 'open-source'
  },
  {
    name: 'Mozilla',
    url: 'https://www.mozilla.org/media/img/logos/firefox/logo-quantum.9c5e96634f92.png',
    link: 'https://www.mozilla.org/',
    title: 'Mozilla Firefox',
    description: 'Fast, private and secure web browser',
    category: 'browser'
  },
  {
    name: 'Linux Foundation',
    url: 'https://www.linuxfoundation.org/wp-content/uploads/2020/10/lf_logo.svg',
    link: 'https://www.linuxfoundation.org/',
    title: 'Linux Foundation',
    description: 'Supporting open source innovation',
    category: 'open-source'
  },
  {
    name: 'Creative Commons',
    url: 'https://creativecommons.org/wp-content/uploads/2016/06/cc.logo_.white_.png',
    link: 'https://creativecommons.org/',
    title: 'Creative Commons',
    description: 'Share your work with free licenses',
    category: 'open-source'
  },
  {
    name: 'Wikipedia',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png',
    link: 'https://www.wikipedia.org/',
    title: 'Wikipedia',
    description: 'The free encyclopedia anyone can edit',
    category: 'education'
  },
  {
    name: 'Free Software Foundation',
    url: 'https://www.fsf.org/static/img/fsf-logo.png',
    link: 'https://www.fsf.org/',
    title: 'Free Software Foundation',
    description: 'Defending users\' freedom',
    category: 'open-source'
  },

  // Social Media & Tech Giants
  {
    name: 'Facebook',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Facebook_f_logo_%282019%29.svg/1200px-Facebook_f_logo_%282019%29.svg.png',
    link: 'https://www.facebook.com/',
    title: 'Facebook',
    description: 'Connect with friends and the world around you',
    category: 'social-media'
  },
  {
    name: 'Instagram',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png',
    link: 'https://www.instagram.com/',
    title: 'Instagram',
    description: 'Share photos and videos with friends',
    category: 'social-media'
  },
  {
    name: 'Twitter',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/1200px-Logo_of_Twitter.svg.png',
    link: 'https://twitter.com/',
    title: 'Twitter',
    description: 'See what\'s happening in the world right now',
    category: 'social-media'
  },
  {
    name: 'LinkedIn',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/800px-LinkedIn_logo_initials.png',
    link: 'https://www.linkedin.com/',
    title: 'LinkedIn',
    description: 'Connect with professionals around the world',
    category: 'social-media'
  },
  {
    name: 'Google',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png',
    link: 'https://www.google.com/',
    title: 'Google',
    description: 'Search the world\'s information',
    category: 'tech-giant'
  },
  {
    name: 'Microsoft',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1200px-Microsoft_logo.svg.png',
    link: 'https://www.microsoft.com/',
    title: 'Microsoft',
    description: 'Empower every person and organization on the planet',
    category: 'tech-giant'
  },
  {
    name: 'Apple',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png',
    link: 'https://www.apple.com/',
    title: 'Apple',
    description: 'Think different',
    category: 'tech-giant'
  },

  // Developer Tools & Platforms
  {
    name: 'GitHub',
    url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    link: 'https://github.com/',
    title: 'GitHub',
    description: 'Where the world builds software',
    category: 'dev-tool'
  },
  {
    name: 'Stack Overflow',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Stack_Overflow_icon.svg/1200px-Stack_Overflow_icon.svg.png',
    link: 'https://stackoverflow.com/',
    title: 'Stack Overflow',
    description: 'Where developers learn, share, & build careers',
    category: 'dev-tool'
  },
  {
    name: 'VS Code',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Visual_Studio_Code_1.35_icon.svg/1200px-Visual_Studio_Code_1.35_icon.svg.png',
    link: 'https://code.visualstudio.com/',
    title: 'Visual Studio Code',
    description: 'Code editing. Redefined.',
    category: 'dev-tool'
  },
  {
    name: 'Node.js',
    url: 'https://nodejs.org/static/images/logo.svg',
    link: 'https://nodejs.org/',
    title: 'Node.js',
    description: 'JavaScript runtime built on Chrome\'s V8 engine',
    category: 'dev-tool'
  },
  {
    name: 'React',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
    link: 'https://reactjs.org/',
    title: 'React',
    description: 'A JavaScript library for building user interfaces',
    category: 'dev-tool'
  },

  // Cloud Services
  {
    name: 'AWS',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/1200px-Amazon_Web_Services_Logo.svg.png',
    link: 'https://aws.amazon.com/',
    title: 'Amazon Web Services',
    description: 'Cloud computing services for businesses',
    category: 'cloud'
  },
  {
    name: 'Google Cloud',
    url: 'https://cloud.google.com/images/social-icon-google-cloud-1200-630.png',
    link: 'https://cloud.google.com/',
    title: 'Google Cloud',
    description: 'Build on the same infrastructure as Google',
    category: 'cloud'
  },
  {
    name: 'Microsoft Azure',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/1200px-Microsoft_Azure.svg.png',
    link: 'https://azure.microsoft.com/',
    title: 'Microsoft Azure',
    description: 'Cloud computing service for building, testing, and managing applications',
    category: 'cloud'
  },

  // Learning Platforms
  {
    name: 'Coursera',
    url: 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://coursera.s3.amazonaws.com/media/coursera-logo-square.png',
    link: 'https://www.coursera.org/',
    title: 'Coursera',
    description: 'Build skills with courses from top universities',
    category: 'education'
  },
  {
    name: 'edX',
    url: 'https://www.edx.org/images/logos/edx-logo-elm.svg',
    link: 'https://www.edx.org/',
    title: 'edX',
    description: 'Access 2000+ online courses from 140+ institutions',
    category: 'education'
  },
  {
    name: 'Udemy',
    url: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg',
    link: 'https://www.udemy.com/',
    title: 'Udemy',
    description: 'Learn, teach, and thrive',
    category: 'education'
  }
];

/**
 * Check if internet ads are enabled
 * @returns {Promise<boolean>} Whether internet ads are enabled
 */
async function areInternetAdsEnabled() {
  try {
    const setting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
    return setting ? setting.value === true : false;
  } catch (error) {
    console.error('Error checking if internet ads are enabled:', error);
    return false;
  }
}

/**
 * Fetch internet ads and store them in the database
 * @returns {Promise<number>} Number of ads fetched
 */
async function fetchAndStoreInternetAds() {
  try {
    // Check if internet ads are enabled
    const enabled = await areInternetAdsEnabled();
    if (!enabled) {
      console.log('Internet ads are disabled. Skipping fetch.');
      return 0;
    }

    // Delete existing internet ads
    await Ad.deleteMany({ source: 'internet' });

    // Create new internet ads
    const ads = [];
    for (const source of FREE_AD_SOURCES) {
      // Validate the image URL
      let imageUrl = source.url;
      try {
        // Check if the image URL is valid
        await axios.head(source.url, { timeout: 5000 });
      } catch (error) {
        console.warn(`Invalid image URL for ${source.name}: ${source.url}`);
        // Use a default image if the URL is invalid
        imageUrl = '/images/default-avatar.png';
      }

      // Create a new ad
      const ad = new Ad({
        source: 'internet',
        category: source.category || 'other',
        title: source.title,
        description: source.description,
        imageUrl: imageUrl,
        link: source.link,
        positions: ['sidebar', 'content'], // Default positions for internet ads
        pages: ['all'], // Show on all pages
        active: true,
        startDate: new Date(),
        endDate: null,
        delay: 0,
        displayFrequency: 1
      });

      ads.push(ad);
    }

    // Save all ads
    await Ad.insertMany(ads);
    console.log(`Fetched and stored ${ads.length} internet ads`);
    return ads.length;
  } catch (error) {
    console.error('Error fetching and storing internet ads:', error);
    return 0;
  }
}

/**
 * Check if all ads are disabled
 * @returns {Promise<boolean>} Whether all ads are disabled
 */
async function areAllAdsDisabled() {
  try {
    const setting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
    return setting ? setting.value === true : false;
  } catch (error) {
    console.error('Error checking if all ads are disabled:', error);
    return false;
  }
}

/**
 * Initialize internet ads settings
 */
async function initializeInternetAdsSettings() {
  try {
    // Check if the internet ads setting already exists
    const internetAdsSetting = await SystemSetting.findOne({ key: 'internetAdsEnabled' });
    if (!internetAdsSetting) {
      // Create the setting
      await SystemSetting.create({
        key: 'internetAdsEnabled',
        value: false, // Disabled by default
        description: 'Whether to show free ads from the internet'
      });
      console.log('Initialized internet ads settings');
    }

    // Check if the all ads disabled setting already exists
    const allAdsDisabledSetting = await SystemSetting.findOne({ key: 'allAdsDisabled' });
    if (!allAdsDisabledSetting) {
      // Create the setting
      await SystemSetting.create({
        key: 'allAdsDisabled',
        value: false, // Disabled by default
        description: 'Whether to disable all ads across the site'
      });
      console.log('Initialized all ads disabled setting');
    }
  } catch (error) {
    console.error('Error initializing ad settings:', error);
  }
}

/**
 * Check if a user has an active ad-free subscription
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} Whether the user has an active ad-free subscription
 */
async function isUserAdFree(userId) {
  try {
    if (!userId) return false;

    const user = await User.findById(userId);
    if (!user) return false;

    // Check if user has an active ad-free subscription
    return user.adFree && user.adFreeUntil && new Date(user.adFreeUntil) > new Date();
  } catch (error) {
    console.error('Error checking if user is ad-free:', error);
    return false;
  }
}

/**
 * Update user's ad-free status if subscription has expired
 * @param {string} userId - The user ID to update
 * @returns {Promise<boolean>} Whether the user's status was updated
 */
async function updateUserAdFreeStatus(userId) {
  try {
    if (!userId) return false;

    const user = await User.findById(userId);
    if (!user) return false;

    // If subscription has expired, update user status
    if (user.adFree && (!user.adFreeUntil || new Date(user.adFreeUntil) <= new Date())) {
      await User.findByIdAndUpdate(userId, {
        adFree: false,
        adFreeUntil: null
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating user ad-free status:', error);
    return false;
  }
}

module.exports = {
  areInternetAdsEnabled,
  areAllAdsDisabled,
  fetchAndStoreInternetAds,
  initializeInternetAdsSettings,
  isUserAdFree,
  updateUserAdFreeStatus,
  FREE_AD_SOURCES
};
