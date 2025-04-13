const Website = require('../models/Website');
const WebsitePage = require('../models/WebsitePage');
const TemplatePage = require('../models/TemplatePage');

/**
 * Synchronizes a newly created template page to all websites using that template
 * @param {Object} templatePage - The newly created template page
 * @returns {Promise<number>} - Number of websites updated
 */
const syncNewTemplatePageToWebsites = async (templatePage) => {
  try {
    // Find all websites using this template
    const websites = await Website.find({ templateId: templatePage.templateId });
    
    if (!websites || websites.length === 0) {
      console.log(`No websites found using template ${templatePage.templateId}`);
      return 0;
    }
    
    console.log(`Found ${websites.length} websites using template ${templatePage.templateId}`);
    let updatedCount = 0;
    
    // For each website, create a new page based on the template page
    for (const website of websites) {
      // Check if a page with this slug already exists
      const existingPage = await WebsitePage.findOne({ 
        websiteId: website._id, 
        slug: templatePage.slug 
      });
      
      if (existingPage) {
        console.log(`Page with slug ${templatePage.slug} already exists for website ${website._id}`);
        continue;
      }
      
      // Get page count for order
      const pagesCount = await WebsitePage.countDocuments({ websiteId: website._id });
      
      // If setting as homepage, update existing homepage
      if (templatePage.isHomePage) {
        await WebsitePage.updateMany(
          { websiteId: website._id, isHomePage: true }, 
          { isHomePage: false }
        );
      }
      
      // Create new page
      const newPage = new WebsitePage({
        websiteId: website._id,
        title: templatePage.title,
        slug: templatePage.slug,
        isHomePage: templatePage.isHomePage,
        htmlContent: templatePage.htmlContent,
        cssContent: templatePage.cssContent,
        jsContent: templatePage.jsContent,
        order: pagesCount
      });
      
      await newPage.save();
      updatedCount++;
      
      console.log(`Created page ${newPage._id} for website ${website._id}`);
    }
    
    return updatedCount;
  } catch (error) {
    console.error('Error syncing template page to websites:', error);
    throw error;
  }
};

module.exports = {
  syncNewTemplatePageToWebsites
};
