const Blog = require('../models/Blog');
const User = require('../models/User');
const blogService = require('../services/blogService');
const { formatDate } = require('../utils/dateFormatter');

/**
 * Blog Controller
 * Handles user-created blogs and external blog content
 */
const blogController = {
  // Get all blogs (both user-created and external)
  getAllBlogs: async (req, res) => {
    try {
      // Get category filter from query params
      const { category } = req.query;
      console.log('Category filter:', category);

      // Build query for user blogs
      let query = { status: 'published' };

      // Apply category filter if provided
      if (category && category !== 'All') {
        // Map UI categories to database categories
        if (category === 'Tutorials') {
          query.category = 'Tutorial';
        } else if (category === 'AI News') {
          query.category = { $in: ['AI News', 'AI Research'] };
        } else if (category === 'Case Studies') {
          query.category = 'Case Study';
        } else if (category === 'Product Updates') {
          query.category = 'Product Update';
        } else {
          query.category = category;
        }
      }

      console.log('User blogs query:', JSON.stringify(query));

      // Get user-created blogs
      const userBlogs = await Blog.find(query)
        .sort({ createdAt: -1 })
        .populate('author', 'name email')
        .limit(20); // Increased limit to show more user blogs

      // Format user blogs
      const formattedUserBlogs = userBlogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        description: blog.summary,
        link: `/blog/${blog._id}`,
        pubDate: blog.createdAt,
        formattedDate: formatDate(blog.createdAt),
        source: 'FTRAISE Community',
        category: blog.category,
        image: blog.featuredImage || null,
        author: blog.author.name,
        isUserBlog: true
      }));

      // Get external blogs
      let featuredArticle, recentArticles, aiResearchArticles, techNewsArticles;

      // Filter external articles by category
      if (category && category !== 'All') {
        // Map our UI categories to the blog service categories
        let serviceCategory;

        if (category === 'Tutorials') {
          serviceCategory = 'Tutorial';
        } else if (category === 'AI News') {
          serviceCategory = 'AI Research';
        } else if (category === 'Case Studies') {
          serviceCategory = 'Case Study';
        } else if (category === 'Product Updates') {
          serviceCategory = 'Tech News';
        } else {
          serviceCategory = category;
        }

        console.log('Mapped category:', serviceCategory);

        // Get articles by the mapped category
        const categoryArticles = await blogService.getArticlesByCategory(serviceCategory, 10);

        // Use these articles for all sections
        featuredArticle = categoryArticles.length > 0 ? categoryArticles[0] : null;
        recentArticles = categoryArticles.slice(1, 7);
        aiResearchArticles = [];
        techNewsArticles = [];
      } else {
        // Get all categories if no filter
        featuredArticle = await blogService.getFeaturedArticle();
        recentArticles = await blogService.getRecentArticles(6);
        aiResearchArticles = await blogService.getArticlesByCategory('AI Research', 3);
        techNewsArticles = await blogService.getArticlesByCategory('Tech News', 3);
      }

      // Format dates for external articles
      if (featuredArticle) {
        featuredArticle.formattedDate = blogService.formatDate(featuredArticle.pubDate);
      }

      recentArticles.forEach(article => {
        article.formattedDate = blogService.formatDate(article.pubDate);
        article.isUserBlog = false;
      });

      aiResearchArticles.forEach(article => {
        article.formattedDate = blogService.formatDate(article.pubDate);
        article.isUserBlog = false;
      });

      techNewsArticles.forEach(article => {
        article.formattedDate = blogService.formatDate(article.pubDate);
        article.isUserBlog = false;
      });

      // Combine user blogs with external blogs
      const combinedRecentArticles = [...formattedUserBlogs, ...recentArticles].sort((a, b) =>
        new Date(b.pubDate) - new Date(a.pubDate)
      ).slice(0, 6);

      res.render('blog', {
        title: 'AI Resources & Blog - FTRAISE AI',
        featuredArticle: featuredArticle || (formattedUserBlogs.length > 0 ? formattedUserBlogs[0] : null),
        recentArticles: combinedRecentArticles,
        aiResearchArticles,
        techNewsArticles,
        userBlogs: formattedUserBlogs,
        selectedCategory: category || 'All'
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      res.render('blog', {
        title: 'AI Resources & Blog - FTRAISE AI',
        error: 'Unable to fetch blog content. Please try again later.'
      });
    }
  },

  // Get a single blog by ID
  getBlogById: async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id)
        .populate('author', 'name email')
        .populate('comments.user', 'name email');

      if (!blog) {
        return res.status(404).render('error', {
          title: 'Blog Not Found - FTRAISE AI',
          message: 'The blog post you are looking for does not exist.'
        });
      }

      // Increment view count
      blog.views += 1;
      await blog.save();

      // Get related blogs
      const relatedBlogs = await Blog.find({
        _id: { $ne: blog._id },
        category: blog.category,
        status: 'published'
      })
        .sort({ createdAt: -1 })
        .limit(3);

      res.render('blogDetail', {
        title: `${blog.title} - FTRAISE AI`,
        blog,
        relatedBlogs,
        formattedDate: formatDate(blog.createdAt)
      });
    } catch (error) {
      console.error('Error fetching blog:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching the blog post.'
      });
    }
  },

  // Render create blog form
  getCreateBlogForm: (req, res) => {
    // Check if user is logged in
    if (!req.user) {
      return res.redirect('/login');
    }

    res.render('createBlog', {
      title: 'Create Blog - FTRAISE AI'
    });
  },

  // Create a new blog
  createBlog: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const { title, content, summary, category, tags } = req.body;

      // Validate required fields
      if (!title || !content || !summary) {
        return res.render('createBlog', {
          title: 'Create Blog - FTRAISE AI',
          error: 'Title, content, and summary are required.',
          formData: req.body
        });
      }

      // Process tags
      const processedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

      // Create new blog
      const newBlog = new Blog({
        title,
        content,
        summary,
        author: req.user._id,
        category: category || 'Other',
        tags: processedTags,
        featuredImage: req.body.featuredImage || ''
      });

      await newBlog.save();

      res.redirect(`/blog/${newBlog._id}`);
    } catch (error) {
      console.error('Error creating blog:', error);
      res.render('createBlog', {
        title: 'Create Blog - FTRAISE AI',
        error: 'An error occurred while creating the blog post.',
        formData: req.body
      });
    }
  },

  // Render edit blog form
  getEditBlogForm: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).render('error', {
          title: 'Blog Not Found - FTRAISE AI',
          message: 'The blog post you are looking for does not exist.'
        });
      }

      // Check if user is the author
      if (blog.author.toString() !== req.user._id.toString()) {
        return res.status(403).render('error', {
          title: 'Access Denied - FTRAISE AI',
          message: 'You do not have permission to edit this blog post.'
        });
      }

      res.render('editBlog', {
        title: 'Edit Blog - FTRAISE AI',
        blog
      });
    } catch (error) {
      console.error('Error fetching blog for edit:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching the blog post.'
      });
    }
  },

  // Update a blog
  updateBlog: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const { title, content, summary, category, tags, status } = req.body;

      // Validate required fields
      if (!title || !content || !summary) {
        return res.render('editBlog', {
          title: 'Edit Blog - FTRAISE AI',
          error: 'Title, content, and summary are required.',
          blog: { ...req.body, _id: req.params.id }
        });
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).render('error', {
          title: 'Blog Not Found - FTRAISE AI',
          message: 'The blog post you are looking for does not exist.'
        });
      }

      // Check if user is the author
      if (blog.author.toString() !== req.user._id.toString()) {
        return res.status(403).render('error', {
          title: 'Access Denied - FTRAISE AI',
          message: 'You do not have permission to edit this blog post.'
        });
      }

      // Process tags
      const processedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

      // Update blog
      blog.title = title;
      blog.content = content;
      blog.summary = summary;
      blog.category = category || 'Other';
      blog.tags = processedTags;
      blog.featuredImage = req.body.featuredImage || blog.featuredImage;
      blog.status = status || blog.status;

      await blog.save();

      res.redirect(`/blog/${blog._id}`);
    } catch (error) {
      console.error('Error updating blog:', error);
      res.render('editBlog', {
        title: 'Edit Blog - FTRAISE AI',
        error: 'An error occurred while updating the blog post.',
        blog: { ...req.body, _id: req.params.id }
      });
    }
  },

  // Delete a blog
  deleteBlog: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      console.log('Deleting blog with ID:', req.params.id);
      console.log('User ID:', req.user._id);
      console.log('User role:', req.user.role);

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        console.log('Blog not found');
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }

      console.log('Blog author:', blog.author);

      // Check if user is the author or an admin
      if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        console.log('Permission denied');
        return res.status(403).json({ success: false, message: 'You do not have permission to delete this blog post' });
      }

      // Delete the blog
      const result = await Blog.findByIdAndDelete(req.params.id);
      console.log('Delete result:', result ? 'Success' : 'Failed');

      // If request is AJAX or fetch API, return JSON
      if (req.xhr || req.headers['content-type'] === 'application/json' ||
          (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.json({ success: true, message: 'Blog deleted successfully' });
      }

      // Otherwise redirect
      res.redirect('/blog');
    } catch (error) {
      console.error('Error deleting blog:', error);

      // If request is AJAX or fetch API, return JSON
      if (req.xhr || req.headers['content-type'] === 'application/json' ||
          (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the blog post' });
      }

      // Otherwise render error page or redirect with flash message
      req.flash('error_msg', 'An error occurred while deleting the blog post');
      return res.redirect('/blog');
    }
  },

  // Like a blog
  likeBlog: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to like a blog post' });
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }

      // Increment like count
      blog.likes += 1;
      await blog.save();

      res.json({ success: true, likes: blog.likes });
    } catch (error) {
      console.error('Error liking blog:', error);
      res.status(500).json({ success: false, message: 'An error occurred while liking the blog post' });
    }
  },

  // Update blog status (admin only)
  updateBlogStatus: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can update blog status' });
      }

      const { status } = req.body;

      if (!status || !['published', 'draft', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      console.log(`Updating blog ${req.params.id} status to ${status}`);

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }

      // Update status
      blog.status = status;
      await blog.save();

      return res.json({
        success: true,
        message: 'Blog status updated successfully',
        status: status
      });
    } catch (error) {
      console.error('Error updating blog status:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while updating the blog status' });
    }
  },

  // Add a comment to a blog
  addComment: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to comment' });
      }

      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, message: 'Comment text is required' });
      }

      const blog = await Blog.findById(req.params.id);

      if (!blog) {
        return res.status(404).json({ success: false, message: 'Blog not found' });
      }

      // Add comment
      blog.comments.push({
        user: req.user._id,
        text
      });

      await blog.save();

      // Get the newly added comment with user details
      const newComment = await Blog.findById(req.params.id)
        .populate('comments.user', 'name email')
        .then(blog => blog.comments[blog.comments.length - 1]);

      res.json({
        success: true,
        comment: {
          user: newComment.user,
          text: newComment.text,
          date: newComment.date,
          formattedDate: formatDate(newComment.date)
        }
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, message: 'An error occurred while adding the comment' });
    }
  },

  // Search blogs
  searchBlogs: async (req, res) => {
    try {
      const { query, category, sort } = req.query;

      // Build search criteria
      const searchCriteria = { status: 'published' };

      if (query) {
        searchCriteria.$text = { $search: query };
      }

      if (category && category !== 'all') {
        searchCriteria.category = category;
      }

      // Build sort options
      let sortOptions = {};

      if (sort === 'newest') {
        sortOptions = { createdAt: -1 };
      } else if (sort === 'oldest') {
        sortOptions = { createdAt: 1 };
      } else if (sort === 'popular') {
        sortOptions = { views: -1 };
      } else if (sort === 'likes') {
        sortOptions = { likes: -1 };
      } else {
        // Default sort by newest
        sortOptions = { createdAt: -1 };
      }

      // Search user-created blogs
      const userBlogs = await Blog.find(searchCriteria)
        .sort(sortOptions)
        .populate('author', 'name email')
        .limit(20);

      // Format user blogs
      const formattedUserBlogs = userBlogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        description: blog.summary,
        link: `/blog/${blog._id}`,
        pubDate: blog.createdAt,
        formattedDate: formatDate(blog.createdAt),
        source: 'FTRAISE Community',
        category: blog.category,
        image: blog.featuredImage || null,
        author: blog.author.name,
        isUserBlog: true,
        views: blog.views,
        likes: blog.likes
      }));

      // If it's an AJAX request, return JSON
      if (req.xhr) {
        return res.json({
          success: true,
          blogs: formattedUserBlogs
        });
      }

      // Otherwise render search results page
      res.render('blogSearch', {
        title: 'Blog Search Results - FTRAISE AI',
        blogs: formattedUserBlogs,
        query,
        category,
        sort
      });
    } catch (error) {
      console.error('Error searching blogs:', error);

      // If it's an AJAX request, return JSON
      if (req.xhr) {
        return res.status(500).json({ success: false, message: 'An error occurred while searching blogs' });
      }

      // Otherwise render error page
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while searching blogs.'
      });
    }
  },

  // Admin: Get all blogs for management
  adminGetAllBlogs: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/login');
      }

      const blogs = await Blog.find()
        .sort({ createdAt: -1 })
        .populate('author', 'name email');

      res.render('admin/blogs', {
        title: 'Manage Blogs - Admin Dashboard',
        blogs
      });
    } catch (error) {
      console.error('Error fetching blogs for admin:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching blogs.'
      });
    }
  }
};

module.exports = blogController;
