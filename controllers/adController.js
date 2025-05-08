const Ad = require('../models/Ad');
const axios = require('axios');
const { URL } = require('url');

module.exports = {
  // Admin: Get ad management dashboard
  getAdDashboard: async (req, res) => {
    try {
      // Get all ads
      const ads = await Ad.find().sort({ createdAt: -1 });

      // Count active ads
      const activeAds = ads.filter(ad => ad.isCurrentlyActive()).length;

      // Count ads by position
      const positionCounts = {
        popup: 0,
        top: 0,
        bottom: 0,
        sidebar: 0,
        content: 0
      };

      // Count positions across all ads
      ads.forEach(ad => {
        // Handle both old format (position) and new format (positions array)
        const positions = ad.positions || [ad.position];

        positions.forEach(position => {
          if (positionCounts[position] !== undefined) {
            positionCounts[position]++;
          }
        });
      });

      res.render('admin/ads/dashboard', {
        title: 'Ad Management - FTRAISE AI',
        ads,
        activeAds,
        positionCounts,
        totalAds: ads.length
      });
    } catch (err) {
      console.error('Error loading ad management dashboard:', err);
      req.flash('error_msg', 'An error occurred while loading the ad management dashboard');
      res.redirect('/admin');
    }
  },

  // Admin: Get add ad form
  getAddAdForm: (req, res) => {
    res.render('admin/ads/add', {
      title: 'Add New Ad - FTRAISE AI'
    });
  },

  // Admin: Add new ad
  addAd: async (req, res) => {
    try {
      const {
        title,
        description,
        imageUrl,
        link,
        position,
        positions,
        pages,
        overlayText,
        active,
        startDate,
        endDate,
        delay,
        displayFrequency
      } = req.body;

      // Validate required fields
      if (!title || !link) {
        req.flash('error_msg', 'Title and link are required');
        return res.redirect('/admin/ads/add');
      }

      // Validate image URL if provided
      if (imageUrl && imageUrl.trim() !== '') {
        try {
          const isValid = await validateImage(imageUrl);
          if (!isValid) {
            req.flash('warning_msg', 'The image URL could not be validated. A default image will be used if it doesn\'t load.');
            // Continue with the process instead of redirecting
          }
        } catch (error) {
          req.flash('warning_msg', 'Error validating image URL: ' + error.message + '. A default image will be used if it doesn\'t load.');
          // Continue with the process instead of redirecting
        }
      }

      // Create new ad
      const newAd = new Ad({
        title,
        description: description || '',
        imageUrl,
        link,
        positions: positions ? (Array.isArray(positions) ? positions : [positions]) : ['popup'],
        pages: pages ? (Array.isArray(pages) ? pages : [pages]) : ['home'],
        overlayText: overlayText || '',
        active: active === 'on',
        startDate: startDate || Date.now(),
        endDate: endDate || null,
        delay: parseInt(delay) || 3000,
        displayFrequency: parseInt(displayFrequency) || 1
      });

      await newAd.save();

      req.flash('success_msg', 'Ad added successfully');
      res.redirect('/admin/ads');
    } catch (err) {
      console.error('Error adding ad:', err);
      req.flash('error_msg', 'An error occurred while adding the ad');
      res.redirect('/admin/ads/add');
    }
  },

  // Admin: Get edit ad form
  getEditAdForm: async (req, res) => {
    try {
      const ad = await Ad.findById(req.params.id);

      if (!ad) {
        req.flash('error_msg', 'Ad not found');
        return res.redirect('/admin/ads');
      }

      res.render('admin/ads/edit', {
        title: 'Edit Ad - FTRAISE AI',
        ad
      });
    } catch (err) {
      console.error('Error loading edit ad form:', err);
      req.flash('error_msg', 'An error occurred while loading the edit ad form');
      res.redirect('/admin/ads');
    }
  },

  // Admin: Update ad
  updateAd: async (req, res) => {
    try {
      const {
        title,
        description,
        imageUrl,
        link,
        position,
        positions,
        pages,
        overlayText,
        active,
        startDate,
        endDate,
        delay,
        displayFrequency
      } = req.body;

      // Validate required fields
      if (!title || !link) {
        req.flash('error_msg', 'Title and link are required');
        return res.redirect(`/admin/ads/edit/${req.params.id}`);
      }

      // Get existing ad
      const existingAd = await Ad.findById(req.params.id);

      // Validate image URL if provided and changed
      if (imageUrl && imageUrl.trim() !== '' && existingAd.imageUrl !== imageUrl) {
        try {
          const isValid = await validateImage(imageUrl);
          if (!isValid) {
            req.flash('warning_msg', 'The image URL could not be validated. A default image will be used if it doesn\'t load.');
            // Continue with the process instead of redirecting
          }
        } catch (error) {
          req.flash('warning_msg', 'Error validating image URL: ' + error.message + '. A default image will be used if it doesn\'t load.');
          // Continue with the process instead of redirecting
        }
      }

      // Update ad
      const updatedAd = {
        title,
        description: description || '',
        imageUrl,
        link,
        positions: positions ? (Array.isArray(positions) ? positions : [positions]) : ['popup'],
        pages: pages ? (Array.isArray(pages) ? pages : [pages]) : ['home'],
        overlayText: overlayText || '',
        active: active === 'on',
        startDate: startDate || existingAd.startDate,
        endDate: endDate || existingAd.endDate,
        delay: parseInt(delay) || 3000,
        displayFrequency: parseInt(displayFrequency) || 1,
        updatedAt: Date.now()
      };

      await Ad.findByIdAndUpdate(req.params.id, updatedAd);

      req.flash('success_msg', 'Ad updated successfully');
      res.redirect('/admin/ads');
    } catch (err) {
      console.error('Error updating ad:', err);
      req.flash('error_msg', 'An error occurred while updating the ad');
      res.redirect(`/admin/ads/edit/${req.params.id}`);
    }
  },

  // Admin: Toggle ad active status
  toggleAdStatus: async (req, res) => {
    try {
      const ad = await Ad.findById(req.params.id);

      if (!ad) {
        return res.status(404).json({ success: false, message: 'Ad not found' });
      }

      ad.active = !ad.active;
      await ad.save();

      return res.json({ success: true, active: ad.active });
    } catch (err) {
      console.error('Error toggling ad status:', err);
      return res.status(500).json({ success: false, message: 'An error occurred while toggling ad status' });
    }
  },

  // Admin: Delete ad
  deleteAd: async (req, res) => {
    try {
      await Ad.findByIdAndDelete(req.params.id);

      req.flash('success_msg', 'Ad deleted successfully');
      res.redirect('/admin/ads');
    } catch (err) {
      console.error('Error deleting ad:', err);
      req.flash('error_msg', 'An error occurred while deleting the ad');
      res.redirect('/admin/ads');
    }
  },

  // Admin: Validate image URL
  validateImageUrl: async (req, res) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Image URL is required' });
      }

      const isValid = await validateImage(imageUrl);

      if (isValid) {
        return res.json({ success: true, message: 'Valid image URL' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid image URL' });
      }
    } catch (err) {
      console.error('Error validating image URL:', err);
      return res.status(500).json({ success: false, message: 'An error occurred while validating the image URL' });
    }
  },

  // Frontend: Get ads for a specific page and position
  getAdsForPage: async (req, res) => {
    try {
      const { page, position } = req.params;

      // Find active ads for the specified page and position
      const now = new Date();
      const ads = await Ad.find({
        pages: page,
        $or: [
          { position: position },
          { positions: position }
        ],
        active: true,
        $or: [
          { startDate: { $lte: now } },
          { startDate: null }
        ],
        $or: [
          { endDate: { $gte: now } },
          { endDate: null }
        ]
      });

      return res.json({ success: true, ads });
    } catch (err) {
      console.error('Error getting ads for page:', err);
      return res.status(500).json({ success: false, message: 'An error occurred while getting ads' });
    }
  }
};

// Helper function to validate image URL
async function validateImage(url) {
  try {
    // Check if URL is valid
    new URL(url);

    // First try with HEAD request (faster but some servers don't allow it)
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Check if content type is an image
      const contentType = response.headers['content-type'];
      if (contentType && contentType.startsWith('image/')) {
        return true;
      }
    } catch (headError) {
      // If HEAD request fails, try with GET request
      console.log('HEAD request failed, trying GET request:', headError.message);
    }

    // If HEAD request failed or didn't confirm it's an image, try with GET request
    const getResponse = await axios.get(url, {
      timeout: 5000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Only get the first few bytes to check the file signature
      maxContentLength: 4096
    });

    // Check content type from GET response
    const getContentType = getResponse.headers['content-type'];
    if (getContentType && getContentType.startsWith('image/')) {
      return true;
    }

    // If content type doesn't confirm it's an image, check the file signature
    const buffer = Buffer.from(getResponse.data);

    // Check common image file signatures
    // JPEG: starts with FF D8 FF
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
      return true;
    }
    // GIF: starts with GIF87a or GIF89a
    if (buffer.length >= 6 &&
        buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61) {
      return true;
    }
    // WebP: starts with RIFF and contains WEBP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return true;
    }

    // If we got here, it's not a recognized image format
    return false;
  } catch (error) {
    console.error('Image validation error:', error.message);
    return false;
  }
}
