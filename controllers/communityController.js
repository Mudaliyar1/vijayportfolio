const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { formatDate } = require('../utils/dateFormatter');

/**
 * Community Controller
 * Handles community posts and interactions
 */
const communityController = {
  // Get all community posts
  getAllPosts: async (req, res) => {
    try {
      const { category, sort, filter } = req.query;

      console.log('Community posts request:', { category, sort, filter });

      // Build query
      const query = { status: 'active' };

      if (category && category !== 'all') {
        query.category = category;
      }

      // Build sort options
      let sortOptions = {};

      if (sort === 'popular') {
        sortOptions = { views: -1 };
        console.log('Sorting by popularity (views)');
      } else if (sort === 'oldest') {
        sortOptions = { createdAt: 1 };
        console.log('Sorting by oldest');
      } else if (sort === 'mostLiked') {
        // Use aggregation for accurate sorting by array length
        console.log('Sorting by most liked');
      } else if (sort === 'mostCommented') {
        // Use aggregation for accurate sorting by array length
        console.log('Sorting by most commented');
      } else {
        // Default sort by newest
        sortOptions = { createdAt: -1 };
        console.log('Sorting by newest (default)');
      }

      console.log('Query:', JSON.stringify(query));
      console.log('Sort options:', JSON.stringify(sortOptions));

      try {
        // Get posts
        let posts;

        if (sort === 'mostLiked') {
          // Use aggregation for likes count sorting
          posts = await CommunityPost.aggregate([
            { $match: query },
            { $addFields: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
            { $sort: { likesCount: -1 } },
            { $limit: 30 }
          ]);

          // Manually populate author
          const authorIds = posts.map(post => post.author);
          const authors = await User.find({ _id: { $in: authorIds } }, 'name email');
          const authorsMap = authors.reduce((map, author) => {
            map[author._id.toString()] = author;
            return map;
          }, {});

          posts = posts.map(post => {
            post.author = authorsMap[post.author.toString()] || { name: 'Unknown User', email: '' };
            return post;
          });
        } else if (sort === 'mostCommented') {
          // Use aggregation for comments count sorting
          posts = await CommunityPost.aggregate([
            { $match: query },
            { $addFields: { commentsCount: { $size: { $ifNull: ['$comments', []] } } } },
            { $sort: { commentsCount: -1 } },
            { $limit: 30 }
          ]);

          // Manually populate author
          const authorIds = posts.map(post => post.author);
          const authors = await User.find({ _id: { $in: authorIds } }, 'name email');
          const authorsMap = authors.reduce((map, author) => {
            map[author._id.toString()] = author;
            return map;
          }, {});

          posts = posts.map(post => {
            post.author = authorsMap[post.author.toString()] || { name: 'Unknown User', email: '' };
            return post;
          });
        } else {
          // Regular query with sort
          posts = await CommunityPost.find(query)
            .sort(sortOptions)
            .populate('author', 'name email')
            .limit(30);
        }

        console.log(`Found ${posts.length} community posts`);

        // Ensure posts is always an array
        if (!Array.isArray(posts)) {
          posts = [];
        }
      } catch (innerError) {
        console.error('Error fetching community posts:', innerError);
        posts = [];
      }

      // Get trending tags
      let trendingTags = [];
      try {
        trendingTags = await CommunityPost.aggregate([
          { $match: { status: 'active' } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
      } catch (tagsError) {
        console.error('Error fetching trending tags:', tagsError);
      }

      const postsToRender = posts || [];
      res.render('community', {
        title: 'Community - FTRAISE AI',
        posts: postsToRender,
        trendingTags: trendingTags || [],
        category: category || 'all',
        sort: sort || 'newest',
        filter: filter || 'all'
      });
    } catch (error) {
      console.error('Error fetching community posts:', error);
      res.render('community', {
        title: 'Community - FTRAISE AI',
        posts: [],
        trendingTags: [],
        category: 'all',
        sort: 'newest',
        filter: 'all',
        error: 'Unable to fetch community posts. Please try again later.'
      });
    }
  },

  // Get a single post by ID
  getPostById: async (req, res) => {
    try {
      const post = await CommunityPost.findById(req.params.id)
        .populate('author', 'name email')
        .populate('comments.user', 'name email');

      if (!post) {
        return res.status(404).render('error', {
          title: 'Post Not Found - FTRAISE AI',
          message: 'The community post you are looking for does not exist.'
        });
      }

      // Increment view count
      post.views += 1;
      await post.save();

      // Get related posts
      const relatedPosts = await CommunityPost.find({
        _id: { $ne: post._id },
        category: post.category,
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .populate('author', 'name email')
        .limit(3);

      res.render('communityPostDetail', {
        title: `${post.title} - FTRAISE AI Community`,
        post,
        relatedPosts,
        formattedDate: formatDate(post.createdAt)
      });
    } catch (error) {
      console.error('Error fetching community post:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching the community post.'
      });
    }
  },

  // Render create post form
  getCreatePostForm: (req, res) => {
    // Check if user is logged in
    if (!req.user) {
      return res.redirect('/login');
    }

    res.render('createCommunityPost', {
      title: 'Create Community Post - FTRAISE AI'
    });
  },

  // Create a new post
  createPost: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const { title, content, category, tags } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.render('createCommunityPost', {
          title: 'Create Community Post - FTRAISE AI',
          error: 'Title and content are required.',
          formData: req.body
        });
      }

      // Process tags
      const processedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

      // Process media (if any)
      const media = req.body.media ? req.body.media.split(',').map(url => url.trim()) : [];

      // Create new post
      const newPost = new CommunityPost({
        title,
        content,
        author: req.user._id,
        category: category || 'Discussion',
        tags: processedTags,
        media
      });

      await newPost.save();

      res.redirect(`/community/post/${newPost._id}`);
    } catch (error) {
      console.error('Error creating community post:', error);
      res.render('createCommunityPost', {
        title: 'Create Community Post - FTRAISE AI',
        error: 'An error occurred while creating the community post.',
        formData: req.body
      });
    }
  },

  // Render edit post form
  getEditPostForm: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).render('error', {
          title: 'Post Not Found - FTRAISE AI',
          message: 'The community post you are looking for does not exist.'
        });
      }

      // Check if user is the author
      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).render('error', {
          title: 'Access Denied - FTRAISE AI',
          message: 'You do not have permission to edit this community post.'
        });
      }

      res.render('editCommunityPost', {
        title: 'Edit Community Post - FTRAISE AI',
        post
      });
    } catch (error) {
      console.error('Error fetching community post for edit:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching the community post.'
      });
    }
  },

  // Update a post
  updatePost: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.redirect('/login');
      }

      const { title, content, category, tags, status } = req.body;

      // Validate required fields
      if (!title || !content) {
        return res.render('editCommunityPost', {
          title: 'Edit Community Post - FTRAISE AI',
          error: 'Title and content are required.',
          post: { ...req.body, _id: req.params.id }
        });
      }

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).render('error', {
          title: 'Post Not Found - FTRAISE AI',
          message: 'The community post you are looking for does not exist.'
        });
      }

      // Check if user is the author or an admin
      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).render('error', {
          title: 'Access Denied - FTRAISE AI',
          message: 'You do not have permission to edit this community post.'
        });
      }

      // Process tags
      const processedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

      // Process media (if any)
      const media = req.body.media ? req.body.media.split(',').map(url => url.trim()) : post.media;

      // Update post
      post.title = title;
      post.content = content;
      post.category = category || post.category;
      post.tags = processedTags;
      post.media = media;

      // Only allow status changes if user is the author or an admin
      if (status && (post.author.toString() === req.user._id.toString() || req.user.role === 'admin')) {
        post.status = status;
      }

      await post.save();

      res.redirect(`/community/post/${post._id}`);
    } catch (error) {
      console.error('Error updating community post:', error);
      res.render('editCommunityPost', {
        title: 'Edit Community Post - FTRAISE AI',
        error: 'An error occurred while updating the community post.',
        post: { ...req.body, _id: req.params.id }
      });
    }
  },

  // Delete a post
  deletePost: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to delete a post' });
      }

      console.log('Deleting post with ID:', req.params.id);
      console.log('User ID:', req.user._id);
      console.log('User role:', req.user.role);

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        console.log('Post not found');
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      console.log('Post author:', post.author);

      // Check if user is the author or an admin
      if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        console.log('Permission denied');
        return res.status(403).json({ success: false, message: 'You do not have permission to delete this post' });
      }

      // If admin, permanently delete; if author, mark as deleted
      let result;
      if (req.user.role === 'admin') {
        result = await CommunityPost.findByIdAndDelete(req.params.id);
        console.log('Admin deleted post permanently');
      } else {
        post.status = 'deleted';
        result = await post.save();
        console.log('User marked post as deleted');
      }

      console.log('Delete result:', result ? 'Success' : 'Failed');

      // If request is AJAX or fetch API, return JSON
      if (req.xhr || req.headers['content-type'] === 'application/json' ||
          (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.json({ success: true, message: 'Post deleted successfully' });
      }

      // Otherwise redirect
      res.redirect('/community');
    } catch (error) {
      console.error('Error deleting community post:', error);

      // If request is AJAX or fetch API, return JSON
      if (req.xhr || req.headers['content-type'] === 'application/json' ||
          (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(500).json({ success: false, message: 'An error occurred while deleting the post' });
      }

      // Otherwise redirect with flash message
      req.flash('error_msg', 'An error occurred while deleting the community post');
      return res.redirect('/community');
    }
  },

  // Like a post
  likePost: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to like a post' });
      }

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check if user already liked the post
      const alreadyLiked = post.likes.includes(req.user._id);

      if (alreadyLiked) {
        // Unlike the post
        post.likes = post.likes.filter(userId => userId.toString() !== req.user._id.toString());
      } else {
        // Like the post
        post.likes.push(req.user._id);
      }

      await post.save();

      res.json({
        success: true,
        likes: post.likes.length,
        liked: !alreadyLiked
      });
    } catch (error) {
      console.error('Error liking community post:', error);
      res.status(500).json({ success: false, message: 'An error occurred while liking the post' });
    }
  },

  // Add a comment to a post
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

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Add comment
      post.comments.push({
        user: req.user._id,
        text
      });

      await post.save();

      // Get the newly added comment with user details
      const newComment = await CommunityPost.findById(req.params.id)
        .populate('comments.user', 'name email')
        .then(post => post.comments[post.comments.length - 1]);

      res.json({
        success: true,
        comment: {
          user: newComment.user,
          text: newComment.text,
          date: newComment.date,
          formattedDate: formatDate(newComment.date),
          likes: []
        }
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, message: 'An error occurred while adding the comment' });
    }
  },

  // Update post status (admin only)
  updatePostStatus: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can update post status' });
      }

      const { status } = req.body;

      if (!status || !['active', 'hidden', 'deleted'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      console.log(`Updating post ${req.params.id} status to ${status}`);

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Update status
      post.status = status;
      await post.save();

      return res.json({
        success: true,
        message: 'Post status updated successfully',
        status: status
      });
    } catch (error) {
      console.error('Error updating post status:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while updating the post status' });
    }
  },

  // Like a comment
  likeComment: async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to like a comment' });
      }

      const { commentId } = req.params;

      const post = await CommunityPost.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Find the comment
      const comment = post.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }

      // Check if user already liked the comment
      const alreadyLiked = comment.likes.includes(req.user._id);

      if (alreadyLiked) {
        // Unlike the comment
        comment.likes = comment.likes.filter(userId => userId.toString() !== req.user._id.toString());
      } else {
        // Like the comment
        comment.likes.push(req.user._id);
      }

      await post.save();

      res.json({
        success: true,
        likes: comment.likes.length,
        liked: !alreadyLiked
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ success: false, message: 'An error occurred while liking the comment' });
    }
  },

  // Search community posts
  searchPosts: async (req, res) => {
    try {
      const { query, category, sort, author } = req.query;

      // Build search criteria
      const searchCriteria = { status: 'active' };

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
      } else if (sort === 'mostLiked') {
        sortOptions = { 'likes.length': -1 };
      } else if (sort === 'mostCommented') {
        sortOptions = { 'comments.length': -1 };
      } else {
        // Default sort by newest
        sortOptions = { createdAt: -1 };
      }

      // Search posts
      const posts = await CommunityPost.find(searchCriteria)
        .sort(sortOptions)
        .populate('author', 'name email')
        .limit(20);

      // If it's an AJAX request, return JSON
      if (req.xhr) {
        return res.json({
          success: true,
          posts: posts.map(post => ({
            id: post._id,
            title: post.title,
            content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
            author: post.author.name,
            category: post.category,
            createdAt: post.createdAt,
            formattedDate: formatDate(post.createdAt),
            views: post.views,
            likes: post.likes.length,
            comments: post.comments.length
          }))
        });
      }

      // Get trending tags
      const trendingTags = await CommunityPost.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Otherwise render search results page
      res.render('communitySearch', {
        title: 'Community Search Results - FTRAISE AI',
        posts,
        trendingTags,
        query,
        category: category || 'all',
        sort: sort || 'newest',
        author: author || ''
      });
    } catch (error) {
      console.error('Error searching community posts:', error);

      // If it's an AJAX request, return JSON
      if (req.xhr) {
        return res.status(500).json({ success: false, message: 'An error occurred while searching posts' });
      }

      // Otherwise render error page
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while searching community posts.'
      });
    }
  },

  // Admin: Get all community posts for management
  adminGetAllPosts: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/login');
      }

      const posts = await CommunityPost.find()
        .sort({ createdAt: -1 })
        .populate('author', 'name email');

      res.render('admin/communityPosts', {
        title: 'Manage Community Posts - Admin Dashboard',
        posts
      });
    } catch (error) {
      console.error('Error fetching community posts for admin:', error);
      res.status(500).render('error', {
        title: 'Error - FTRAISE AI',
        message: 'An error occurred while fetching community posts.'
      });
    }
  }
};

module.exports = communityController;
