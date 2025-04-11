const mongoose = require('mongoose');

const PageViewSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  }
});

const DailyStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  pageViews: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  },
  avgSessionDuration: {
    type: Number,
    default: 0
  }
});

const ReferrerSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  visits: {
    type: Number,
    default: 0
  }
});

const DeviceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    required: true
  },
  visits: {
    type: Number,
    default: 0
  }
});

const BrowserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  visits: {
    type: Number,
    default: 0
  }
});

const WebsiteAnalyticsSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPageViews: {
    type: Number,
    default: 0
  },
  totalUniqueVisitors: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  },
  avgSessionDuration: {
    type: Number,
    default: 0
  },
  pages: [PageViewSchema],
  dailyStats: [DailyStatsSchema],
  referrers: [ReferrerSchema],
  devices: [DeviceSchema],
  browsers: [BrowserSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WebsiteAnalytics', WebsiteAnalyticsSchema);
