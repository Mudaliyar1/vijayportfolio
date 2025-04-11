const User = require('../models/User');
const GeneratedContent = require('../models/GeneratedContent');
const SEOAnalysis = require('../models/SEOAnalysis');
const Website = require('../models/Website');

module.exports = {
  // Main dashboard with overall user statistics
  getDashboard: async (req, res) => {
    try {
      // Get user counts
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
      
      // Get content generation statistics
      const totalContentGenerations = await GeneratedContent.countDocuments();
      const contentGenerationUsers = await GeneratedContent.distinct('user').length;
      
      // Get SEO analysis statistics
      const totalSEOAnalyses = await SEOAnalysis.countDocuments();
      const seoAnalysisUsers = await SEOAnalysis.distinct('user').length;
      
      // Get recent user activity (combined from both features)
      const recentContentActivity = await GeneratedContent.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .populate('template', 'name');
      
      const recentSEOActivity = await SEOAnalysis.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'username email')
        .populate('website', 'title');
      
      // Combine and sort by date
      const recentActivity = [...recentContentActivity, ...recentSEOActivity]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);
      
      // Get most active users
      const userContentCounts = await GeneratedContent.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      const userSEOCounts = await SEOAnalysis.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      // Get user details for the most active users
      const userIds = [...new Set([
        ...userContentCounts.map(item => item._id),
        ...userSEOCounts.map(item => item._id)
      ])];
      
      const users = await User.find({ _id: { $in: userIds } }, 'username email');
      
      // Combine content and SEO counts for each user
      const userActivityMap = {};
      userIds.forEach(userId => {
        const userIdStr = userId.toString();
        userActivityMap[userIdStr] = {
          user: users.find(u => u._id.toString() === userIdStr),
          contentCount: 0,
          seoCount: 0,
          totalCount: 0
        };
      });
      
      userContentCounts.forEach(item => {
        const userIdStr = item._id.toString();
        if (userActivityMap[userIdStr]) {
          userActivityMap[userIdStr].contentCount = item.count;
          userActivityMap[userIdStr].totalCount += item.count;
        }
      });
      
      userSEOCounts.forEach(item => {
        const userIdStr = item._id.toString();
        if (userActivityMap[userIdStr]) {
          userActivityMap[userIdStr].seoCount = item.count;
          userActivityMap[userIdStr].totalCount += item.count;
        }
      });
      
      // Convert to array and sort by total count
      const topUsers = Object.values(userActivityMap)
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 5);
      
      // Get daily activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const contentDailyStats = await GeneratedContent.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      const seoDailyStats = await SEOAnalysis.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const dailyStats = {};
      
      // Initialize all dates in the range
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStats[dateStr] = { content: 0, seo: 0, total: 0 };
      }
      
      // Add content stats
      contentDailyStats.forEach(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].content = stat.count;
          dailyStats[dateStr].total += stat.count;
        }
      });
      
      // Add SEO stats
      seoDailyStats.forEach(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].seo = stat.count;
          dailyStats[dateStr].total += stat.count;
        }
      });
      
      // Convert to array for chart.js
      const formattedDailyStats = Object.entries(dailyStats)
        .map(([date, counts]) => ({
          date,
          content: counts.content,
          seo: counts.seo,
          total: counts.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      res.render('admin/user-statistics/dashboard', {
        title: 'User Statistics Dashboard - FTRAISE AI',
        user: req.user,
        totalUsers,
        activeUsers,
        totalContentGenerations,
        contentGenerationUsers,
        totalSEOAnalyses,
        seoAnalysisUsers,
        recentActivity,
        topUsers,
        dailyStats: formattedDailyStats,
        path: '/admin/user-statistics'
      });
    } catch (err) {
      console.error('Error loading user statistics dashboard:', err);
      req.flash('error_msg', 'Failed to load user statistics dashboard');
      res.redirect('/admin');
    }
  },

  // Content Generator statistics
  getContentGeneratorStats: async (req, res) => {
    try {
      // Get overall statistics
      const totalGenerations = await GeneratedContent.countDocuments();
      const uniqueUsers = await GeneratedContent.distinct('user').length;
      
      // Get content type distribution
      const contentTypeStats = await GeneratedContent.aggregate([
        { $group: { _id: '$contentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Get tone distribution
      const toneStats = await GeneratedContent.aggregate([
        { $group: { _id: '$tone', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Get length distribution
      const lengthStats = await GeneratedContent.aggregate([
        { $group: { _id: '$length', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Get top users
      const topUsers = await GeneratedContent.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Get user details
      const userIds = topUsers.map(item => item._id);
      const users = await User.find({ _id: { $in: userIds } }, 'username email');
      
      // Add user details to top users
      const topUsersWithDetails = topUsers.map(item => {
        const user = users.find(u => u._id.toString() === item._id.toString());
        return {
          ...item,
          username: user ? user.username : 'Unknown',
          email: user ? user.email : 'Unknown'
        };
      });
      
      // Get recent generations
      const recentGenerations = await GeneratedContent.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'username email')
        .populate('template', 'name');
      
      // Get daily stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyStats = await GeneratedContent.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const formattedDailyStats = dailyStats.map(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        return {
          date: date.toISOString().split('T')[0],
          count: stat.count
        };
      });
      
      res.render('admin/user-statistics/content-generator', {
        title: 'Content Generator Statistics - FTRAISE AI',
        user: req.user,
        totalGenerations,
        uniqueUsers,
        contentTypeStats,
        toneStats,
        lengthStats,
        topUsers: topUsersWithDetails,
        recentGenerations,
        dailyStats: formattedDailyStats,
        path: '/admin/user-statistics/content-generator'
      });
    } catch (err) {
      console.error('Error loading content generator statistics:', err);
      req.flash('error_msg', 'Failed to load content generator statistics');
      res.redirect('/admin/user-statistics');
    }
  },

  // SEO Analyzer statistics
  getSEOAnalyzerStats: async (req, res) => {
    try {
      // Get overall statistics
      const totalAnalyses = await SEOAnalysis.countDocuments();
      const uniqueUsers = await SEOAnalysis.distinct('user').length;
      const uniqueWebsites = await SEOAnalysis.distinct('url').length;
      
      // Get score distribution
      const scoreDistribution = await SEOAnalysis.aggregate([
        {
          $project: {
            scoreRange: {
              $switch: {
                branches: [
                  { case: { $gte: ["$analysis.score", 80] }, then: "high" },
                  { case: { $gte: ["$analysis.score", 60] }, then: "medium" },
                  { case: { $lt: ["$analysis.score", 60] }, then: "low" }
                ],
                default: "unknown"
              }
            }
          }
        },
        { $group: { _id: "$scoreRange", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      // Get top users
      const topUsers = await SEOAnalysis.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Get user details
      const userIds = topUsers.map(item => item._id);
      const users = await User.find({ _id: { $in: userIds } }, 'username email');
      
      // Add user details to top users
      const topUsersWithDetails = topUsers.map(item => {
        const user = users.find(u => u._id.toString() === item._id.toString());
        return {
          ...item,
          username: user ? user.username : 'Unknown',
          email: user ? user.email : 'Unknown'
        };
      });
      
      // Get recent analyses
      const recentAnalyses = await SEOAnalysis.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'username email')
        .populate('website', 'title');
      
      // Get daily stats for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyStats = await SEOAnalysis.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const formattedDailyStats = dailyStats.map(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        return {
          date: date.toISOString().split('T')[0],
          count: stat.count
        };
      });
      
      res.render('admin/user-statistics/seo-analyzer', {
        title: 'SEO Analyzer Statistics - FTRAISE AI',
        user: req.user,
        totalAnalyses,
        uniqueUsers,
        uniqueWebsites,
        scoreDistribution,
        topUsers: topUsersWithDetails,
        recentAnalyses,
        dailyStats: formattedDailyStats,
        path: '/admin/user-statistics/seo-analyzer'
      });
    } catch (err) {
      console.error('Error loading SEO analyzer statistics:', err);
      req.flash('error_msg', 'Failed to load SEO analyzer statistics');
      res.redirect('/admin/user-statistics');
    }
  },

  // User history
  getUserHistory: async (req, res) => {
    try {
      // Get all users with activity counts
      const contentCounts = await GeneratedContent.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]);
      
      const seoCounts = await SEOAnalysis.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]);
      
      // Get all user IDs with activity
      const userIds = [...new Set([
        ...contentCounts.map(item => item._id),
        ...seoCounts.map(item => item._id)
      ])];
      
      // Get user details
      const users = await User.find({ _id: { $in: userIds } }, 'username email lastLogin createdAt');
      
      // Combine activity counts for each user
      const userActivityMap = {};
      userIds.forEach(userId => {
        const userIdStr = userId.toString();
        const user = users.find(u => u._id.toString() === userIdStr);
        
        if (user) {
          userActivityMap[userIdStr] = {
            _id: userId,
            username: user.username,
            email: user.email,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            contentCount: 0,
            seoCount: 0,
            totalCount: 0
          };
        }
      });
      
      contentCounts.forEach(item => {
        const userIdStr = item._id.toString();
        if (userActivityMap[userIdStr]) {
          userActivityMap[userIdStr].contentCount = item.count;
          userActivityMap[userIdStr].totalCount += item.count;
        }
      });
      
      seoCounts.forEach(item => {
        const userIdStr = item._id.toString();
        if (userActivityMap[userIdStr]) {
          userActivityMap[userIdStr].seoCount = item.count;
          userActivityMap[userIdStr].totalCount += item.count;
        }
      });
      
      // Convert to array and sort by total count
      const userActivity = Object.values(userActivityMap)
        .sort((a, b) => b.totalCount - a.totalCount);
      
      res.render('admin/user-statistics/history', {
        title: 'User Activity History - FTRAISE AI',
        user: req.user,
        userActivity,
        path: '/admin/user-statistics/history'
      });
    } catch (err) {
      console.error('Error loading user history:', err);
      req.flash('error_msg', 'Failed to load user history');
      res.redirect('/admin/user-statistics');
    }
  },

  // User detail
  getUserDetail: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user details
      const user = await User.findById(userId);
      
      if (!user) {
        req.flash('error_msg', 'User not found');
        return res.redirect('/admin/user-statistics/history');
      }
      
      // Get content generations
      const contentGenerations = await GeneratedContent.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('template', 'name');
      
      // Get SEO analyses
      const seoAnalyses = await SEOAnalysis.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('website', 'title');
      
      // Get daily activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const contentDailyStats = await GeneratedContent.aggregate([
        { $match: { user: user._id, createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      const seoDailyStats = await SEOAnalysis.aggregate([
        { $match: { user: user._id, createdAt: { $gte: thirtyDaysAgo } } },
        { 
          $group: { 
            _id: { 
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
      
      // Format for chart display
      const dailyStats = {};
      
      // Initialize all dates in the range
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStats[dateStr] = { content: 0, seo: 0, total: 0 };
      }
      
      // Add content stats
      contentDailyStats.forEach(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].content = stat.count;
          dailyStats[dateStr].total += stat.count;
        }
      });
      
      // Add SEO stats
      seoDailyStats.forEach(stat => {
        const date = new Date(stat._id.year, stat._id.month - 1, stat._id.day);
        const dateStr = date.toISOString().split('T')[0];
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].seo = stat.count;
          dailyStats[dateStr].total += stat.count;
        }
      });
      
      // Convert to array for chart.js
      const formattedDailyStats = Object.entries(dailyStats)
        .map(([date, counts]) => ({
          date,
          content: counts.content,
          seo: counts.seo,
          total: counts.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      res.render('admin/user-statistics/user-detail', {
        title: `User Detail: ${user.username} - FTRAISE AI`,
        user: req.user,
        userData: user,
        contentGenerations,
        seoAnalyses,
        dailyStats: formattedDailyStats,
        path: '/admin/user-statistics/history'
      });
    } catch (err) {
      console.error('Error loading user detail:', err);
      req.flash('error_msg', 'Failed to load user detail');
      res.redirect('/admin/user-statistics/history');
    }
  }
};
