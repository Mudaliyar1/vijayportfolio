const axios = require('axios');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false });

/**
 * Blog Service
 * Fetches and processes blog content from various tech and AI sources
 */
class BlogService {
  constructor() {
    // List of RSS feeds to fetch from
    this.sources = [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'Tech News',
        logo: 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png?w=32'
      },
      {
        name: 'MIT Technology Review',
        url: 'https://www.technologyreview.com/feed/',
        category: 'AI Research',
        logo: 'https://www.technologyreview.com/favicon.ico'
      },
      {
        name: 'Wired',
        url: 'https://www.wired.com/feed/rss',
        category: 'Tech News',
        logo: 'https://www.wired.com/favicon.ico'
      },
      {
        name: 'VentureBeat',
        url: 'https://venturebeat.com/feed/',
        category: 'AI News',
        logo: 'https://venturebeat.com/wp-content/themes/vb-news/img/favicon.ico'
      },
      {
        name: 'Google AI Blog',
        url: 'https://blog.research.google/atom.xml',
        category: 'AI Research',
        logo: 'https://blog.research.google/favicon.ico'
      },
      {
        name: 'Towards Data Science',
        url: 'https://towardsdatascience.com/feed',
        category: 'AI Research',
        logo: 'https://miro.medium.com/1*emiGsBgJu2KHWyjluhKXQw.png'
      },
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'Tech News',
        logo: 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-64x64.0.ico'
      },
      {
        name: 'Ars Technica',
        url: 'https://feeds.arstechnica.com/arstechnica/index',
        category: 'Tech News',
        logo: 'https://cdn.arstechnica.net/favicon.ico'
      },
      {
        name: 'Artificial Intelligence News',
        url: 'https://artificialintelligence-news.com/feed/',
        category: 'AI News',
        logo: 'https://artificialintelligence-news.com/wp-content/themes/ain/assets/img/favicon.ico'
      },
      {
        name: 'Analytics Vidhya',
        url: 'https://medium.com/feed/analytics-vidhya',
        category: 'AI Research',
        logo: 'https://miro.medium.com/1*UdxHVJTEUmJTWgT3SfErtw.png'
      }
    ];
    
    // Cache for storing fetched articles
    this.cache = {
      articles: [],
      lastUpdated: null,
      // Cache expiration time in milliseconds (15 minutes for development, would be longer in production)
      expirationTime: 15 * 60 * 1000
    };
  }
  
  /**
   * Fetch articles from all sources
   */
  async fetchArticles() {
    // Check if cache is valid
    if (this.isCacheValid()) {
      console.log('Using cached articles, last updated:', this.cache.lastUpdated);
      return this.cache.articles;
    }
    
    console.log('Fetching fresh articles from sources...');
    
    try {
      // Array to store all fetched articles
      let allArticles = [];
      
      // Fetch from each source with Promise.allSettled to handle failures gracefully
      const fetchPromises = this.sources.map(source => this.fetchFromSource(source));
      const results = await Promise.allSettled(fetchPromises);
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const sourceName = this.sources[index].name;
          console.log(`Successfully fetched ${result.value.length} articles from ${sourceName}`);
          allArticles = [...allArticles, ...result.value];
        } else {
          const sourceName = this.sources[index].name;
          console.error(`Error fetching from ${sourceName}:`, result.reason.message);
        }
      });
      
      // Sort articles by date (newest first)
      allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      // Filter out articles older than 7 days to keep content fresh
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      allArticles = allArticles.filter(article => {
        const pubDate = new Date(article.pubDate);
        return !isNaN(pubDate.getTime()) && pubDate > oneWeekAgo;
      });
      
      console.log(`Total articles after filtering: ${allArticles.length}`);
      
      // Update cache
      this.cache.articles = allArticles;
      this.cache.lastUpdated = new Date();
      
      return allArticles;
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Return cached articles if available, otherwise empty array
      return this.cache.articles || [];
    }
  }
  
  /**
   * Fetch articles from a specific source
   */
  async fetchFromSource(source) {
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'FTRAISE AI Blog Reader/1.0'
        },
        timeout: 10000 // 10 seconds timeout
      });
      
      // Parse XML to JSON
      const result = await parser.parseStringPromise(response.data);
      
      // Process the feed based on its format (RSS or Atom)
      let articles = [];
      
      if (result.rss) {
        // RSS format
        if (!result.rss.channel || !result.rss.channel.item) {
          console.warn(`Invalid RSS format from ${source.name}`);
          return [];
        }
        
        const items = Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : [result.rss.channel.item];
        
        articles = items.filter(item => item).map(item => ({
          title: item.title || 'Untitled',
          link: item.link || '',
          description: this.cleanDescription(item.description),
          pubDate: item.pubDate || item.pubdate || new Date().toISOString(),
          source: source.name,
          category: source.category,
          sourceLogo: source.logo,
          // Extract image from content if available
          image: this.extractImageFromContent(item.description || item['content:encoded'] || '')
        }));
      } else if (result.feed) {
        // Atom format
        if (!result.feed.entry) {
          console.warn(`Invalid Atom format from ${source.name}`);
          return [];
        }
        
        const entries = Array.isArray(result.feed.entry) 
          ? result.feed.entry 
          : [result.feed.entry];
        
        articles = entries.filter(entry => entry).map(entry => {
          // Handle different link formats in Atom feeds
          let link = '';
          if (entry.link) {
            if (typeof entry.link === 'string') {
              link = entry.link;
            } else if (Array.isArray(entry.link)) {
              const alternateLink = entry.link.find(l => l.rel === 'alternate');
              link = alternateLink ? alternateLink.href : (entry.link[0] ? entry.link[0].href : '');
            } else if (entry.link.href) {
              link = entry.link.href;
            }
          }
          
          return {
            title: entry.title ? (typeof entry.title === 'string' ? entry.title : entry.title._) : 'Untitled',
            link: link,
            description: this.cleanDescription(entry.summary || entry.content),
            pubDate: entry.updated || entry.published || new Date().toISOString(),
            source: source.name,
            category: source.category,
            sourceLogo: source.logo,
            // Extract image from content if available
            image: this.extractImageFromContent(entry.content || '')
          };
        });
      } else {
        console.warn(`Unknown feed format from ${source.name}`);
        return [];
      }
      
      // Filter out articles without required fields
      return articles.filter(article => article.title && article.link);
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }
  
  /**
   * Clean HTML description
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // Convert to string if it's an object
    if (typeof description === 'object') {
      description = description._ || '';
    }
    
    // Remove HTML tags
    let cleanText = description.replace(/<\/?[^>]+(>|$)/g, ' ');
    
    // Remove extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Limit to 200 characters
    return cleanText.length > 200 
      ? cleanText.substring(0, 200) + '...' 
      : cleanText;
  }
  
  /**
   * Extract image URL from content
   */
  extractImageFromContent(content) {
    if (!content) return null;
    
    // Convert to string if it's an object
    if (typeof content === 'object') {
      content = content._ || '';
    }
    
    // Try to find image tag
    const imgMatch = content.match(/<img[^>]+src=['\"]([^'\"]+)['\"]|<img[^>]+src=([^\\s>]+)/i);
    if (imgMatch && (imgMatch[1] || imgMatch[2])) {
      return imgMatch[1] || imgMatch[2];
    }
    
    // Try to find media:content tag (common in RSS feeds)
    const mediaMatch = content.match(/<media:content[^>]+url=['\"]([^'\"]+)['\"]|<media:content[^>]+url=([^\\s>]+)/i);
    if (mediaMatch && (mediaMatch[1] || mediaMatch[2])) {
      return mediaMatch[1] || mediaMatch[2];
    }
    
    // Try to find enclosure tag (common in RSS feeds)
    const enclosureMatch = content.match(/<enclosure[^>]+url=['\"]([^'\"]+)['\"]|<enclosure[^>]+url=([^\\s>]+)/i);
    if (enclosureMatch && (enclosureMatch[1] || enclosureMatch[2])) {
      return enclosureMatch[1] || enclosureMatch[2];
    }
    
    // Try to find any URL that looks like an image
    const urlMatch = content.match(/https?:\/\/[^\s'"]+\.(jpg|jpeg|png|gif|webp)(\?[^\s'"]*)?/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    return null;
  }
  
  /**
   * Check if cache is valid
   */
  isCacheValid() {
    if (!this.cache.lastUpdated) return false;
    
    const now = new Date();
    const elapsed = now - this.cache.lastUpdated;
    
    return elapsed < this.cache.expirationTime && this.cache.articles.length > 0;
  }
  
  /**
   * Get featured article
   */
  async getFeaturedArticle() {
    const articles = await this.fetchArticles();
    
    // Return the newest article as featured
    return articles[0] || null;
  }
  
  /**
   * Get recent articles
   */
  async getRecentArticles(count = 6) {
    const articles = await this.fetchArticles();
    
    // Skip the first one (featured) and return the next 'count' articles
    return articles.slice(1, count + 1);
  }
  
  /**
   * Get articles by category
   */
  async getArticlesByCategory(category, count = 10) {
    const articles = await this.fetchArticles();
    
    // Filter articles by category and return the specified count
    return articles
      .filter(article => article.category === category)
      .slice(0, count);
  }
  
  /**
   * Format publication date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      // Format as MM/DD/YYYY
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
  }
}

module.exports = new BlogService();
