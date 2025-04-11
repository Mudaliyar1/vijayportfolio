const Website = require('../models/Website');
const WebsiteAnalytics = require('../models/WebsiteAnalytics');
const User = require('../models/User');

// Helper function to generate random analytics data for demo purposes
function generateRandomAnalytics(websiteId, userId) {
  const now = new Date();
  const dailyStats = [];
  
  // Generate daily stats for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const pageViews = Math.floor(Math.random() * 100) + 20;
    const uniqueVisitors = Math.floor(pageViews * (0.6 + Math.random() * 0.3));
    const bounceRate = Math.random() * 70;
    const avgSessionDuration = Math.floor(Math.random() * 300) + 30;
    
    dailyStats.push({
      date,
      pageViews,
      uniqueVisitors,
      bounceRate,
      avgSessionDuration
    });
  }
  
  // Generate page views
  const pages = [
    { path: '/', views: Math.floor(Math.random() * 500) + 100, uniqueVisitors: Math.floor(Math.random() * 300) + 50 },
    { path: '/about', views: Math.floor(Math.random() * 200) + 50, uniqueVisitors: Math.floor(Math.random() * 150) + 30 },
    { path: '/services', views: Math.floor(Math.random() * 300) + 70, uniqueVisitors: Math.floor(Math.random() * 200) + 40 },
    { path: '/contact', views: Math.floor(Math.random() * 150) + 30, uniqueVisitors: Math.floor(Math.random() * 100) + 20 },
    { path: '/blog', views: Math.floor(Math.random() * 250) + 60, uniqueVisitors: Math.floor(Math.random() * 180) + 35 }
  ];
  
  // Generate referrers
  const referrers = [
    { source: 'Google', visits: Math.floor(Math.random() * 300) + 100 },
    { source: 'Facebook', visits: Math.floor(Math.random() * 200) + 50 },
    { source: 'Twitter', visits: Math.floor(Math.random() * 150) + 30 },
    { source: 'LinkedIn', visits: Math.floor(Math.random() * 100) + 20 },
    { source: 'Direct', visits: Math.floor(Math.random() * 250) + 80 }
  ];
  
  // Generate devices
  const devices = [
    { type: 'desktop', visits: Math.floor(Math.random() * 500) + 200 },
    { type: 'mobile', visits: Math.floor(Math.random() * 400) + 150 },
    { type: 'tablet', visits: Math.floor(Math.random() * 100) + 50 }
  ];
  
  // Generate browsers
  const browsers = [
    { name: 'Chrome', visits: Math.floor(Math.random() * 400) + 150 },
    { name: 'Firefox', visits: Math.floor(Math.random() * 200) + 80 },
    { name: 'Safari', visits: Math.floor(Math.random() * 250) + 100 },
    { name: 'Edge', visits: Math.floor(Math.random() * 150) + 50 },
    { name: 'Other', visits: Math.floor(Math.random() * 100) + 30 }
  ];
  
  // Calculate totals
  const totalPageViews = pages.reduce((sum, page) => sum + page.views, 0);
  const totalUniqueVisitors = pages.reduce((sum, page) => sum + page.uniqueVisitors, 0) / pages.length;
  const bounceRate = Math.random() * 60 + 20;
  const avgSessionDuration = Math.floor(Math.random() * 180) + 60;
  
  return {
    website: websiteId,
    user: userId,
    totalPageViews,
    totalUniqueVisitors,
    bounceRate,
    avgSessionDuration,
    pages,
    dailyStats,
    referrers,
    devices,
    browsers,
    lastUpdated: now,
    createdAt: now
  };
}

module.exports = {
  // User routes
  getDashboard: async (req, res) => {
    try {
      // Get user's websites
      const websites = await Website.find({ user: req.user._id });
      
      // Get analytics for each website
      const websiteAnalytics = [];
      
      for (const website of websites) {
        // Check if analytics exist for this website
        let analytics = await WebsiteAnalytics.findOne({ website: website._id });
        
        // If no analytics exist, generate random data for demo purposes
        if (!analytics) {
          const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
          analytics = new WebsiteAnalytics(randomAnalytics);
          await analytics.save();
        }
        
        websiteAnalytics.push({
          website,
          analytics
        });
      }
      
      res.render('website-analytics/dashboard', {
        title: 'Website Analytics Dashboard - FTRAISE AI',
        user: req.user,
        websiteAnalytics
      });
    } catch (err) {
      console.error('Error loading analytics dashboard:', err);
      req.flash('error_msg', 'Failed to load analytics dashboard');
      res.redirect('/dashboard');
    }
  },
  
  getWebsiteAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      res.render('website-analytics/website', {
        title: `${website.title} Analytics - FTRAISE AI`,
        user: req.user,
        website,
        analytics
      });
    } catch (err) {
      console.error('Error loading website analytics:', err);
      req.flash('error_msg', 'Failed to load website analytics');
      res.redirect('/website-analytics');
    }
  },
  
  getPageAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      res.render('website-analytics/pages', {
        title: `${website.title} Page Analytics - FTRAISE AI`,
        user: req.user,
        website,
        analytics
      });
    } catch (err) {
      console.error('Error loading page analytics:', err);
      req.flash('error_msg', 'Failed to load page analytics');
      res.redirect(`/website-analytics/website/${req.params.id}`);
    }
  },
  
  getVisitorAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      res.render('website-analytics/visitors', {
        title: `${website.title} Visitor Analytics - FTRAISE AI`,
        user: req.user,
        website,
        analytics
      });
    } catch (err) {
      console.error('Error loading visitor analytics:', err);
      req.flash('error_msg', 'Failed to load visitor analytics');
      res.redirect(`/website-analytics/website/${req.params.id}`);
    }
  },
  
  getReferrerAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      res.render('website-analytics/referrers', {
        title: `${website.title} Referrer Analytics - FTRAISE AI`,
        user: req.user,
        website,
        analytics
      });
    } catch (err) {
      console.error('Error loading referrer analytics:', err);
      req.flash('error_msg', 'Failed to load referrer analytics');
      res.redirect(`/website-analytics/website/${req.params.id}`);
    }
  },
  
  getDeviceAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      res.render('website-analytics/devices', {
        title: `${website.title} Device Analytics - FTRAISE AI`,
        user: req.user,
        website,
        analytics
      });
    } catch (err) {
      console.error('Error loading device analytics:', err);
      req.flash('error_msg', 'Failed to load device analytics');
      res.redirect(`/website-analytics/website/${req.params.id}`);
    }
  },
  
  exportAnalytics: async (req, res) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      
      // Get website
      const website = await Website.findOne({ _id: id, user: req.user._id });
      
      if (!website) {
        req.flash('error_msg', 'Website not found');
        return res.redirect('/website-analytics');
      }
      
      // Get analytics for this website
      let analytics = await WebsiteAnalytics.findOne({ website: website._id });
      
      // If no analytics exist, generate random data for demo purposes
      if (!analytics) {
        const randomAnalytics = generateRandomAnalytics(website._id, req.user._id);
        analytics = new WebsiteAnalytics(randomAnalytics);
        await analytics.save();
      }
      
      // Format the data based on the requested format
      if (format === 'csv') {
        // Generate CSV
        let csv = 'Date,Page Views,Unique Visitors,Bounce Rate,Avg Session Duration\n';
        
        analytics.dailyStats.forEach(stat => {
          const date = new Date(stat.date).toISOString().split('T')[0];
          csv += `${date},${stat.pageViews},${stat.uniqueVisitors},${stat.bounceRate.toFixed(2)},${stat.avgSessionDuration}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${website.title.replace(/\s+/g, '_')}_analytics.csv`);
        return res.send(csv);
      } else if (format === 'json') {
        // Generate JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${website.title.replace(/\s+/g, '_')}_analytics.json`);
        return res.json(analytics);
      } else {
        // Default to PDF (in a real implementation, you would generate a PDF)
        req.flash('error_msg', 'PDF export is not implemented yet');
        return res.redirect(`/website-analytics/website/${id}`);
      }
    } catch (err) {
      console.error('Error exporting analytics:', err);
      req.flash('error_msg', 'Failed to export analytics');
      res.redirect(`/website-analytics/website/${req.params.id}`);
    }
  },
  
  // API routes for tracking
  trackPageView: async (req, res) => {
    try {
      const { websiteId, path, referrer, device, browser } = req.body;
      
      // In a real implementation, you would validate the request and update the analytics
      // For now, we'll just return a success response
      
      res.json({ success: true });
    } catch (err) {
      console.error('Error tracking page view:', err);
      res.status(500).json({ success: false, message: 'Failed to track page view' });
    }
  },
  
  trackEvent: async (req, res) => {
    try {
      const { websiteId, eventName, eventCategory, eventValue } = req.body;
      
      // In a real implementation, you would validate the request and update the analytics
      // For now, we'll just return a success response
      
      res.json({ success: true });
    } catch (err) {
      console.error('Error tracking event:', err);
      res.status(500).json({ success: false, message: 'Failed to track event' });
    }
  },
  
  // Admin routes
  getAdminDashboard: async (req, res) => {
    try {
      // Get analytics statistics
      const totalWebsites = await Website.countDocuments();
      const totalAnalytics = await WebsiteAnalytics.countDocuments();
      
      // Get total page views and unique visitors
      const analyticsStats = await WebsiteAnalytics.aggregate([
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: '$totalPageViews' },
            totalUniqueVisitors: { $sum: '$totalUniqueVisitors' }
          }
        }
      ]);
      
      const totalPageViews = analyticsStats.length > 0 ? analyticsStats[0].totalPageViews : 0;
      const totalUniqueVisitors = analyticsStats.length > 0 ? analyticsStats[0].totalUniqueVisitors : 0;
      
      // Get recent analytics
      const recentAnalytics = await WebsiteAnalytics.find()
        .sort({ lastUpdated: -1 })
        .limit(10)
        .populate('website', 'title')
        .populate('user', 'username email');
      
      res.render('admin/website-analytics/dashboard', {
        title: 'Website Analytics Admin - FTRAISE AI',
        user: req.user,
        totalWebsites,
        totalAnalytics,
        totalPageViews,
        totalUniqueVisitors,
        recentAnalytics,
        path: '/admin/website-analytics'
      });
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      req.flash('error_msg', 'Failed to load admin dashboard');
      res.redirect('/admin');
    }
  },
  
  getAdminWebsites: async (req, res) => {
    try {
      // Get all websites with analytics
      const websites = await Website.find()
        .sort({ createdAt: -1 })
        .populate('user', 'username email');
      
      // Get analytics for each website
      const websiteAnalytics = [];
      
      for (const website of websites) {
        const analytics = await WebsiteAnalytics.findOne({ website: website._id });
        
        if (analytics) {
          websiteAnalytics.push({
            website,
            analytics
          });
        } else {
          websiteAnalytics.push({
            website,
            analytics: null
          });
        }
      }
      
      res.render('admin/website-analytics/websites', {
        title: 'Website Analytics - Websites - FTRAISE AI',
        user: req.user,
        websiteAnalytics,
        path: '/admin/website-analytics/websites'
      });
    } catch (err) {
      console.error('Error loading admin websites:', err);
      req.flash('error_msg', 'Failed to load admin websites');
      res.redirect('/admin/website-analytics');
    }
  },
  
  getAdminUsers: async (req, res) => {
    try {
      // Get all users with websites
      const users = await User.find()
        .sort({ createdAt: -1 });
      
      // Get website and analytics counts for each user
      const userStats = [];
      
      for (const user of users) {
        const websiteCount = await Website.countDocuments({ user: user._id });
        const analyticsCount = await WebsiteAnalytics.countDocuments({ user: user._id });
        
        if (websiteCount > 0) {
          userStats.push({
            user,
            websiteCount,
            analyticsCount
          });
        }
      }
      
      res.render('admin/website-analytics/users', {
        title: 'Website Analytics - Users - FTRAISE AI',
        user: req.user,
        userStats,
        path: '/admin/website-analytics/users'
      });
    } catch (err) {
      console.error('Error loading admin users:', err);
      req.flash('error_msg', 'Failed to load admin users');
      res.redirect('/admin/website-analytics');
    }
  }
};
