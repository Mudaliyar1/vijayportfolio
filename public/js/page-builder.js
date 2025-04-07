/**
 * FTRAISE AI - Visual Page Builder
 * A no-code drag-and-drop interface for building websites
 * Enhanced WordPress-like experience with user-friendly editing
 */

class PageBuilder {
  constructor(options) {
    this.container = options.container;
    this.saveButton = options.saveButton;
    this.previewButton = options.previewButton;
    this.contentInput = options.contentInput;
    this.initialContent = options.initialContent || '';
    this.sidebarContainer = options.sidebarContainer;
    this.currentPreviewMode = 'desktop';

    // Available blocks - FTRAISE EDITOR widgets organized by category
    this.blocks = [
      {
        type: 'header',
        icon: 'fas fa-window-maximize',
        title: 'Header',
        category: 'layout',
        template: '<header class="site-header editable" data-type="header" style="background-color: #333; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;"><div class="logo editable">Your Logo</div><nav class="navigation editable"><ul style="display: flex; list-style: none; gap: 20px; margin: 0; padding: 0;"><li><a href="#" class="link-editable" style="color: white; text-decoration: none;">Home</a></li><li><a href="#" class="link-editable" style="color: white; text-decoration: none;">About</a></li><li><a href="#" class="link-editable" style="color: white; text-decoration: none;">Services</a></li><li><a href="#" class="link-editable" style="color: white; text-decoration: none;">Contact</a></li></ul></nav></header>'
      },
      {
        type: 'footer',
        icon: 'fas fa-window-minimize',
        title: 'Footer',
        category: 'layout',
        template: '<footer class="site-footer editable" data-type="footer" style="background-color: #333; color: white; padding: 20px; text-align: center;"><div class="footer-content editable"><div class="footer-links" style="margin-bottom: 15px;"><a href="#" class="link-editable" style="color: white; text-decoration: none; margin: 0 10px;">Home</a><a href="#" class="link-editable" style="color: white; text-decoration: none; margin: 0 10px;">About</a><a href="#" class="link-editable" style="color: white; text-decoration: none; margin: 0 10px;">Services</a><a href="#" class="link-editable" style="color: white; text-decoration: none; margin: 0 10px;">Contact</a></div><p class="copyright editable">&copy; 2023 Your Company. All rights reserved.</p></div></footer>'
      },
      {
        type: 'heading',
        icon: 'fas fa-heading',
        title: 'Heading',
        category: 'basic',
        template: '<h2 class="editable" data-type="heading">Your Heading</h2>'
      },
      {
        type: 'paragraph',
        icon: 'fas fa-paragraph',
        title: 'Paragraph',
        category: 'basic',
        template: '<p class="editable" data-type="paragraph">Your text goes here. Click to edit.</p>'
      },
      {
        type: 'image',
        icon: 'fas fa-image',
        title: 'Image',
        category: 'media',
        template: '<div class="image-container" data-type="image"><img src="/images/placeholder.jpg" alt="Image"><div class="image-caption editable">Image Caption</div></div>'
      },
      {
        type: 'button',
        icon: 'fas fa-square',
        title: 'Button',
        category: 'interactive',
        template: '<a href="#" class="btn editable" data-type="button">Click Me</a>'
      },
      {
        type: 'divider',
        icon: 'fas fa-minus',
        title: 'Divider',
        category: 'layout',
        template: '<hr data-type="divider">'
      },
      {
        type: 'columns-2',
        icon: 'fas fa-columns',
        title: '2 Columns',
        category: 'layout',
        template: '<div class="row" data-type="columns-2"><div class="col editable" data-type="column">Column 1 content</div><div class="col editable" data-type="column">Column 2 content</div></div>'
      },
      {
        type: 'video',
        icon: 'fas fa-video',
        title: 'Video',
        category: 'media',
        template: '<div class="video-container" data-type="video"><div class="video-placeholder">Video Embed (Click to edit)</div></div>'
      },
      {
        type: 'list',
        icon: 'fas fa-list',
        title: 'List',
        category: 'basic',
        template: '<ul data-type="list"><li class="editable">List item 1</li><li class="editable">List item 2</li><li class="editable">List item 3</li></ul>'
      },
      {
        type: 'quote',
        icon: 'fas fa-quote-left',
        title: 'Quote',
        category: 'basic',
        template: '<blockquote class="editable" data-type="quote">Your quote text here</blockquote>'
      },
      {
        type: 'contact-form',
        icon: 'fas fa-envelope',
        title: 'Contact Form',
        category: 'interactive',
        template: '<div class="contact-form-container" data-type="contact-form"><h3>Contact Form</h3><form><div class="form-group"><label>Name</label><input type="text" placeholder="Name"></div><div class="form-group"><label>Email</label><input type="email" placeholder="Email"></div><div class="form-group"><label>Message</label><textarea placeholder="Your message"></textarea></div><button type="button">Send Message</button></form></div>'
      },
      {
        type: 'spacer',
        icon: 'fas fa-arrows-alt-v',
        title: 'Spacer',
        category: 'layout',
        template: '<div class="spacer" data-type="spacer" style="height: 40px;"></div>'
      },
      {
        type: 'gallery',
        icon: 'fas fa-images',
        title: 'Gallery',
        category: 'media',
        template: '<div class="gallery-container" data-type="gallery"><div class="gallery-grid"><div class="gallery-item"><img src="/images/placeholder.jpg" alt="Gallery Image 1"></div><div class="gallery-item"><img src="/images/placeholder.jpg" alt="Gallery Image 2"></div><div class="gallery-item"><img src="/images/placeholder.jpg" alt="Gallery Image 3"></div></div></div>'
      },
      {
        type: 'social-icons',
        icon: 'fas fa-share-alt',
        title: 'Social Icons',
        category: 'interactive',
        template: '<div class="social-icons" data-type="social-icons"><a href="#" class="social-icon"><i class="fab fa-facebook"></i></a><a href="#" class="social-icon"><i class="fab fa-twitter"></i></a><a href="#" class="social-icon"><i class="fab fa-instagram"></i></a><a href="#" class="social-icon"><i class="fab fa-linkedin"></i></a></div>'
      },
      {
        type: 'hamburger-menu',
        icon: 'fas fa-bars',
        title: 'Hamburger Menu',
        category: 'interactive',
        template: '<div class="hamburger-menu-container" data-type="hamburger-menu" data-position="left" data-breakpoint="768"><button class="hamburger-btn"><span></span><span></span><span></span></button><div class="mobile-menu"><ul><li><a href="#" class="editable link-editable" data-href="#">Home</a></li><li><a href="#" class="editable link-editable" data-href="#">About</a></li><li><a href="#" class="editable link-editable" data-href="#">Services</a></li><li><a href="#" class="editable link-editable" data-href="#">Contact</a></li></ul></div></div>'
      },
      {
        type: 'custom-video',
        icon: 'fas fa-film',
        title: 'Custom Video',
        category: 'media',
        template: '<div class="custom-video-container" data-type="custom-video"><div class="video-placeholder editable">Click to add your video</div><video controls style="display:none; width:100%;"></video></div>'
      },
      {
        type: 'audio-player',
        icon: 'fas fa-music',
        title: 'Audio Player',
        category: 'media',
        template: '<div class="audio-container" data-type="audio-player"><div class="audio-placeholder editable">Click to add your audio</div><audio controls style="display:none; width:100%;"></audio></div>'
      },
      {
        type: 'dark-mode-toggle',
        icon: 'fas fa-moon',
        title: 'Dark Mode Toggle',
        category: 'interactive',
        template: '<div class="dark-mode-container" data-type="dark-mode-toggle"><button class="dark-mode-toggle"><i class="fas fa-moon"></i><span class="editable">Toggle Dark Mode</span></button></div>'
      },
      {
        type: 'header-footer-adjust',
        icon: 'fas fa-ruler-combined',
        title: 'Header/Footer Adjust',
        category: 'layout',
        template: '<div class="header-footer-controls" data-type="header-footer-adjust"><h4>Adjust Header & Footer</h4><div class="dimension-controls"><div class="dimension-control"><label>Header Height</label><input type="text" class="header-height" placeholder="e.g., 100px"></div><div class="dimension-control"><label>Footer Height</label><input type="text" class="footer-height" placeholder="e.g., 80px"></div></div><div class="color-controls"><h5>Header Background</h5><div class="color-control"><label>Background Color</label><input type="color" class="header-bg-color" value="#333333"></div><div class="color-control"><label>Use Gradient</label><input type="checkbox" class="header-use-gradient"></div><div class="gradient-controls header-gradient-controls" style="display: none;"><div class="color-control"><label>Gradient Start</label><input type="color" class="header-gradient-start" value="#3366ff"></div><div class="color-control"><label>Gradient End</label><input type="color" class="header-gradient-end" value="#6633ff"></div></div><h5>Footer Background</h5><div class="color-control"><label>Background Color</label><input type="color" class="footer-bg-color" value="#333333"></div><div class="color-control"><label>Use Gradient</label><input type="checkbox" class="footer-use-gradient"></div><div class="gradient-controls footer-gradient-controls" style="display: none;"><div class="color-control"><label>Gradient Start</label><input type="color" class="footer-gradient-start" value="#3366ff"></div><div class="color-control"><label>Gradient End</label><input type="color" class="footer-gradient-end" value="#6633ff"></div></div></div><button class="apply-dimensions">Apply Changes</button></div>'
      },
      {
        type: 'gradient-background',
        icon: 'fas fa-fill-drip',
        title: 'Gradient Background',
        category: 'layout',
        template: '<div class="gradient-background-container" data-type="gradient-background"><div class="gradient-preview"></div><div class="gradient-controls"><div class="color-control"><label>Start Color</label><input type="color" class="start-color" value="#0f3460"></div><div class="color-control"><label>End Color</label><input type="color" class="end-color" value="#e94560"></div><div class="direction-control"><label>Direction</label><select class="gradient-direction"><option value="to right">Left to Right</option><option value="to left">Right to Left</option><option value="to bottom">Top to Bottom</option><option value="to top">Bottom to Top</option><option value="to bottom right">Top Left to Bottom Right</option><option value="to bottom left">Top Right to Bottom Left</option><option value="to top right">Bottom Left to Top Right</option><option value="to top left">Bottom Right to Top Left</option></select></div></div><button class="apply-gradient">Apply Gradient</button></div>'
      },
      {
        type: 'login-form',
        icon: 'fas fa-sign-in-alt',
        title: 'Login Form',
        category: 'interactive',
        template: '<div class="login-form-container" data-type="login-form"><h3 class="editable">Login</h3><form class="login-form" action="/login" method="POST" onsubmit="event.preventDefault(); return false;"><div class="form-group"><label for="email" class="editable">Email</label><input type="email" id="email" name="email" placeholder="Enter email"></div><div class="form-group"><label for="password" class="editable">Password</label><input type="password" id="password" name="password" placeholder="Enter password"></div><div class="form-actions"><button type="button" class="login-button editable">Login</button><a href="#" class="forgot-password editable">Forgot Password?</a></div></form></div>'
      },
      {
        type: 'register-form',
        icon: 'fas fa-user-plus',
        title: 'Register Form',
        category: 'interactive',
        template: '<div class="register-form-container" data-type="register-form"><h3 class="editable">Register</h3><form class="register-form" action="/register" method="POST" onsubmit="event.preventDefault(); return false;"><div class="form-group"><label for="name" class="editable">Name</label><input type="text" id="name" name="name" placeholder="Enter name"></div><div class="form-group"><label for="email" class="editable">Email</label><input type="email" id="email" name="email" placeholder="Enter email"></div><div class="form-group"><label for="password" class="editable">Password</label><input type="password" id="password" name="password" placeholder="Enter password"></div><div class="form-group"><label for="confirm-password" class="editable">Confirm Password</label><input type="password" id="confirm-password" name="confirmPassword" placeholder="Confirm password"></div><div class="form-actions"><button type="button" class="register-button editable">Register</button></div></form></div>'
      }
    ];

    this.init();
  }

  init() {
    this.renderSidebar();
    this.setupCanvas();
    this.setupEventListeners();
    this.loadContent();
    this.addSidebarToggle();
    this.setupResponsivePreview();
  }

  addSidebarToggle() {
    // Create sidebar toggle button with hamburger icon
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-toggle';
    sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
    sidebarToggle.setAttribute('title', 'Toggle Sidebar');

    // Insert after sidebar
    this.sidebarContainer.parentNode.insertBefore(sidebarToggle, this.sidebarContainer.nextSibling);

    // Add event listener
    sidebarToggle.addEventListener('click', () => {
      const sidebar = this.sidebarContainer.querySelector('.builder-sidebar');
      sidebar.classList.toggle('collapsed');

      // Update icon based on state
      const icon = sidebarToggle.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      } else {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      }
    });

    // Initially collapse sidebar on mobile
    if (window.innerWidth <= 768) {
      const sidebar = this.sidebarContainer.querySelector('.builder-sidebar');
      sidebar.classList.add('collapsed');
    }
  }

  setupResponsivePreview() {
    // Get the responsive preview buttons
    const desktopBtn = document.querySelector('.preview-desktop');
    const tabletBtn = document.querySelector('.preview-tablet');
    const mobileBtn = document.querySelector('.preview-mobile');
    const canvas = document.querySelector('.canvas-area');

    if (desktopBtn && tabletBtn && mobileBtn && canvas) {
      // Desktop preview
      desktopBtn.addEventListener('click', () => {
        this.currentPreviewMode = 'desktop';
        canvas.style.width = '100%';
        canvas.style.margin = '0';

        // Update active button
        desktopBtn.classList.add('active');
        tabletBtn.classList.remove('active');
        mobileBtn.classList.remove('active');
      });

      // Tablet preview
      tabletBtn.addEventListener('click', () => {
        this.currentPreviewMode = 'tablet';
        canvas.style.width = '768px';
        canvas.style.margin = '0 auto';

        // Update active button
        desktopBtn.classList.remove('active');
        tabletBtn.classList.add('active');
        mobileBtn.classList.remove('active');
      });

      // Mobile preview
      mobileBtn.addEventListener('click', () => {
        this.currentPreviewMode = 'mobile';
        canvas.style.width = '375px';
        canvas.style.margin = '0 auto';

        // Update active button
        desktopBtn.classList.remove('active');
        tabletBtn.classList.remove('active');
        mobileBtn.classList.add('active');
      });
    }
  }

  renderSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'builder-sidebar';

    // Create sidebar header
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar-header';
    sidebarHeader.innerHTML = '<h3>FTRAISE EDITOR</h3>';
    sidebar.appendChild(sidebarHeader);

    // Create search box
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <input type="text" class="search-input" placeholder="Search elements...">
      <i class="fas fa-search search-icon"></i>
    `;
    sidebar.appendChild(searchContainer);

    // Add search functionality
    const searchInput = searchContainer.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const blockItems = sidebar.querySelectorAll('.block-item');

      blockItems.forEach(item => {
        const title = item.querySelector('span').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });

      // Show/hide category headers based on visible items
      const categories = sidebar.querySelectorAll('.category-header');
      categories.forEach(category => {
        const categoryName = category.getAttribute('data-category');
        const categoryItems = sidebar.querySelectorAll(`.block-item[data-category="${categoryName}"]`);
        let hasVisibleItems = false;

        categoryItems.forEach(item => {
          if (item.style.display !== 'none') {
            hasVisibleItems = true;
          }
        });

        category.style.display = hasVisibleItems ? 'block' : 'none';
      });
    });

    // Group blocks by category
    const categories = {
      'basic': 'Basic Elements',
      'layout': 'Layout',
      'media': 'Media',
      'interactive': 'Interactive'
    };

    // Create blocks container
    const blocksContainer = document.createElement('div');
    blocksContainer.className = 'blocks-container';

    // Add category sections
    Object.entries(categories).forEach(([categoryKey, categoryName]) => {
      // Create category header
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'category-header';
      categoryHeader.setAttribute('data-category', categoryKey);
      categoryHeader.innerHTML = `
        <div class="category-title">
          <span>${categoryName}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
      `;
      blocksContainer.appendChild(categoryHeader);

      // Create category container
      const categoryContainer = document.createElement('div');
      categoryContainer.className = 'category-container';
      categoryContainer.setAttribute('data-category', categoryKey);
      blocksContainer.appendChild(categoryContainer);

      // Add toggle functionality
      categoryHeader.addEventListener('click', () => {
        categoryContainer.classList.toggle('collapsed');
        const icon = categoryHeader.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-right');
      });

      // Add blocks to category
      this.blocks.filter(block => block.category === categoryKey).forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = 'block-item';
        blockElement.setAttribute('data-type', block.type);
        blockElement.setAttribute('data-category', block.category);
        blockElement.setAttribute('draggable', 'true');
        blockElement.innerHTML = `<i class="${block.icon}"></i><span>${block.title}</span>`;

        // Add drag start event
        blockElement.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', block.type);
          blockElement.classList.add('dragging');
        });

        blockElement.addEventListener('dragend', () => {
          blockElement.classList.remove('dragging');
        });

        categoryContainer.appendChild(blockElement);
      });
    });

    sidebar.appendChild(blocksContainer);
    this.sidebarContainer.appendChild(sidebar);
  }

  setupCanvas() {
    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'builder-canvas';

    // Create canvas header
    const canvasHeader = document.createElement('div');
    canvasHeader.className = 'canvas-header';

    // Create header content wrapper for title and subtitle
    const headerContent = document.createElement('div');
    headerContent.className = 'header-content';

    // Add Page Content title
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Page Content';
    headerContent.appendChild(headerTitle);

    // Add subtitle
    const headerSubtitle = document.createElement('p');
    headerSubtitle.className = 'header-subtitle';
    headerSubtitle.textContent = 'Drag and drop elements to build your page';
    headerContent.appendChild(headerSubtitle);

    canvasHeader.appendChild(headerContent);

    // Add controls wrapper for buttons
    const headerControls = document.createElement('div');
    headerControls.className = 'header-controls';

    // Add responsive preview buttons
    const responsiveControls = document.createElement('div');
    responsiveControls.className = 'responsive-controls';
    responsiveControls.innerHTML = `
      <button class="preview-desktop active" title="Desktop Preview"><i class="fas fa-desktop"></i></button>
      <button class="preview-tablet" title="Tablet Preview"><i class="fas fa-tablet-alt"></i></button>
      <button class="preview-mobile" title="Mobile Preview"><i class="fas fa-mobile-alt"></i></button>
    `;
    headerControls.appendChild(responsiveControls);

    // Add toggle full width button in the header
    const toggleFullwidthBtn = document.createElement('button');
    toggleFullwidthBtn.id = 'toggle-fullwidth-inline';
    toggleFullwidthBtn.className = 'toggle-fullwidth';
    toggleFullwidthBtn.innerHTML = '<i class="fas fa-expand"></i><span>Full Width</span>';
    headerControls.appendChild(toggleFullwidthBtn);

    canvasHeader.appendChild(headerControls);

    // Add event listener to toggle button
    toggleFullwidthBtn.addEventListener('click', () => {
      const pageBuilderContainer = document.querySelector('.page-builder-container');
      pageBuilderContainer.classList.toggle('fullwidth-mode');

      // Update icon based on state
      const icon = toggleFullwidthBtn.querySelector('i');
      if (pageBuilderContainer.classList.contains('fullwidth-mode')) {
        icon.classList.remove('fa-expand');
        icon.classList.add('fa-compress');
        toggleFullwidthBtn.querySelector('span').textContent = 'Exit Full Width';
      } else {
        icon.classList.remove('fa-compress');
        icon.classList.add('fa-expand');
        toggleFullwidthBtn.querySelector('span').textContent = 'Full Width';
      }
    });

    canvasContainer.appendChild(canvasHeader);

    // Create canvas area
    const canvas = document.createElement('div');
    canvas.className = 'canvas-area';
    canvas.setAttribute('id', 'canvas');

    // Add drop event listeners
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      canvas.classList.add('drag-over');
    });

    canvas.addEventListener('dragleave', () => {
      canvas.classList.remove('drag-over');
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      canvas.classList.remove('drag-over');

      const blockType = e.dataTransfer.getData('text/plain');
      this.addBlock(blockType, canvas);
    });

    canvasContainer.appendChild(canvas);
    this.container.appendChild(canvasContainer);

    // Store canvas reference
    this.canvas = canvas;
  }

  addBlock(blockType, targetElement) {
    const block = this.blocks.find(b => b.type === blockType);
    if (!block) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = block.template;
    const blockElement = tempDiv.firstChild;

    // Add block controls
    const controls = document.createElement('div');
    controls.className = 'block-controls';
    controls.innerHTML = `
      <button class="move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
      <button class="move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
      <button class="edit" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="style" title="Style"><i class="fas fa-paint-brush"></i></button>
      <button class="duplicate" title="Duplicate"><i class="fas fa-copy"></i></button>
      <button class="delete" title="Delete"><i class="fas fa-trash"></i></button>
    `;

    // Wrap block in container
    const blockContainer = document.createElement('div');
    blockContainer.className = 'block-container';
    blockContainer.setAttribute('data-type', blockType);
    blockContainer.appendChild(blockElement);
    blockContainer.appendChild(controls);

    // Add event listeners to controls
    const moveUpBtn = controls.querySelector('.move-up');
    const moveDownBtn = controls.querySelector('.move-down');
    const editBtn = controls.querySelector('.edit');
    const styleBtn = controls.querySelector('.style');
    const duplicateBtn = controls.querySelector('.duplicate');
    const deleteBtn = controls.querySelector('.delete');

    moveUpBtn.addEventListener('click', () => this.moveBlock(blockContainer, 'up'));
    moveDownBtn.addEventListener('click', () => this.moveBlock(blockContainer, 'down'));
    editBtn.addEventListener('click', () => this.editBlock(blockContainer));
    styleBtn.addEventListener('click', () => this.styleBlock(blockContainer));
    duplicateBtn.addEventListener('click', () => this.duplicateBlock(blockContainer));
    deleteBtn.addEventListener('click', () => this.deleteBlock(blockContainer));

    // Add special functionality for hamburger menu
    if (blockType === 'hamburger-menu') {
      const hamburgerBtn = blockElement.querySelector('.hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          blockElement.classList.toggle('active');
        });
      }
    }

    // Make editable elements clickable
    const editableElements = blockContainer.querySelectorAll('.editable');
    editableElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.makeEditable(el);
      });
    });

    targetElement.appendChild(blockContainer);
    this.updateContentInput();
  }

  moveBlock(blockElement, direction) {
    if (direction === 'up') {
      if (blockElement.previousElementSibling) {
        blockElement.parentNode.insertBefore(blockElement, blockElement.previousElementSibling);
      }
    } else if (direction === 'down') {
      if (blockElement.nextElementSibling) {
        blockElement.parentNode.insertBefore(blockElement.nextElementSibling, blockElement);
      }
    }
    this.updateContentInput();
  }

  deleteBlock(blockElement) {
    if (confirm('Are you sure you want to delete this element?')) {
      // Add a fade-out animation before removing
      blockElement.classList.add('deleting');
      setTimeout(() => {
        blockElement.remove();
        this.updateContentInput();
      }, 300);
    }
  }

  duplicateBlock(blockElement) {
    // Clone the block
    const clone = blockElement.cloneNode(true);

    // Reset any IDs to avoid duplicates
    const elementsWithId = clone.querySelectorAll('[id]');
    elementsWithId.forEach(el => {
      el.id = el.id + '-' + Date.now();
    });

    // Add event listeners to the cloned controls
    const controls = clone.querySelector('.block-controls');
    const moveUpBtn = controls.querySelector('.move-up');
    const moveDownBtn = controls.querySelector('.move-down');
    const editBtn = controls.querySelector('.edit');
    const styleBtn = controls.querySelector('.style');
    const duplicateBtn = controls.querySelector('.duplicate');
    const deleteBtn = controls.querySelector('.delete');

    moveUpBtn.addEventListener('click', () => this.moveBlock(clone, 'up'));
    moveDownBtn.addEventListener('click', () => this.moveBlock(clone, 'down'));
    editBtn.addEventListener('click', () => this.editBlock(clone));
    styleBtn.addEventListener('click', () => this.styleBlock(clone));
    duplicateBtn.addEventListener('click', () => this.duplicateBlock(clone));
    deleteBtn.addEventListener('click', () => this.deleteBlock(clone));

    // Make editable elements clickable
    const editableElements = clone.querySelectorAll('.editable');
    editableElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.makeEditable(el);
      });
    });

    // Insert the clone after the original
    blockElement.parentNode.insertBefore(clone, blockElement.nextSibling);

    // Add a highlight effect to show it's new
    clone.classList.add('duplicated');
    setTimeout(() => {
      clone.classList.remove('duplicated');
    }, 1000);

    this.updateContentInput();
  }

  editBlock(blockElement) {
    const type = blockElement.getAttribute('data-type');
    const content = blockElement.querySelector(`[data-type="${type}"]`);

    if (!content) return;

    // Special handling for different block types
    if (type === 'image') {
      this.editImageBlock(content);
    } else if (type === 'custom-video') {
      this.editVideoBlock(content);
    } else if (type === 'audio-player') {
      this.editAudioBlock(content);
    } else if (type === 'dark-mode-toggle') {
      this.setupDarkModeToggle(content);
    } else if (type === 'header-footer-adjust') {
      this.setupHeaderFooterAdjust(content);
    } else if (type === 'hamburger-menu') {
      this.editHamburgerMenu(content);
    } else if (type === 'gradient-background') {
      this.setupGradientBackground(content);
    } else if (type === 'login-form') {
      this.setupLoginForm(content);
    } else if (type === 'register-form') {
      this.setupRegisterForm(content);
    } else if (type === 'gallery') {
      this.editGalleryBlock(content);
    } else {
      this.makeEditable(content);
    }
  }

  editVideoBlock(videoContainer) {
    // Find the video element and placeholder
    const video = videoContainer.querySelector('video');
    const placeholder = videoContainer.querySelector('.video-placeholder');
    if (!video || !placeholder) return;

    // Create video settings panel
    const videoPanel = document.createElement('div');
    videoPanel.className = 'image-settings-panel'; // Reuse the image panel styles

    // Create video settings form
    videoPanel.innerHTML = `
      <div class="panel-header">
        <h4>Video Settings</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Video URL (MP4, YouTube, or Vimeo)</label>
          <input type="text" class="video-url-input" placeholder="Enter video URL">
        </div>
        <div class="form-group">
          <label>Upload Video</label>
          <div class="upload-container">
            <button class="upload-btn">Choose File</button>
            <span class="upload-filename">No file chosen</span>
            <input type="file" class="file-input" accept="video/*" style="display: none;">
          </div>
        </div>
        <div class="form-actions">
          <button class="apply-video-settings">Apply Changes</button>
          <button class="cancel-video-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the video container
    videoContainer.appendChild(videoPanel);

    // Setup file input
    const fileInput = videoPanel.querySelector('.file-input');
    const uploadBtn = videoPanel.querySelector('.upload-btn');
    const filenameSpan = videoPanel.querySelector('.upload-filename');

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        filenameSpan.textContent = fileInput.files[0].name;

        // Read the file and set as preview
        const reader = new FileReader();
        reader.onload = (e) => {
          video.src = e.target.result;
          video.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        filenameSpan.textContent = 'No file chosen';
      }
    });

    // Add event listeners
    const closeBtn = videoPanel.querySelector('.close-panel');
    const applyBtn = videoPanel.querySelector('.apply-video-settings');
    const cancelBtn = videoPanel.querySelector('.cancel-video-settings');

    closeBtn.addEventListener('click', () => {
      videoPanel.remove();
    });

    applyBtn.addEventListener('click', () => {
      // Get values
      const videoUrl = videoPanel.querySelector('.video-url-input').value;

      // Apply changes
      if (videoUrl && !fileInput.files.length) {
        // Handle YouTube and Vimeo URLs
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          // Extract YouTube ID
          let youtubeId = '';
          if (videoUrl.includes('youtube.com/watch?v=')) {
            youtubeId = videoUrl.split('v=')[1].split('&')[0];
          } else if (videoUrl.includes('youtu.be/')) {
            youtubeId = videoUrl.split('youtu.be/')[1];
          }

          if (youtubeId) {
            // Replace video with iframe
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${youtubeId}`;
            iframe.width = '100%';
            iframe.height = '315';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;

            // Replace video element with iframe
            video.style.display = 'none';
            placeholder.style.display = 'none';
            videoContainer.appendChild(iframe);
          }
        } else if (videoUrl.includes('vimeo.com')) {
          // Extract Vimeo ID
          const vimeoId = videoUrl.split('vimeo.com/')[1];

          if (vimeoId) {
            // Replace video with iframe
            const iframe = document.createElement('iframe');
            iframe.src = `https://player.vimeo.com/video/${vimeoId}`;
            iframe.width = '100%';
            iframe.height = '315';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;

            // Replace video element with iframe
            video.style.display = 'none';
            placeholder.style.display = 'none';
            videoContainer.appendChild(iframe);
          }
        } else {
          // Direct video URL
          video.src = videoUrl;
          video.style.display = 'block';
          placeholder.style.display = 'none';
        }
      }

      // Update content input
      this.updateContentInput();

      // Remove panel
      videoPanel.remove();
    });

    cancelBtn.addEventListener('click', () => {
      videoPanel.remove();
    });
  }

  editAudioBlock(audioContainer) {
    // Find the audio element and placeholder
    const audio = audioContainer.querySelector('audio');
    const placeholder = audioContainer.querySelector('.audio-placeholder');
    if (!audio || !placeholder) return;

    // Create audio settings panel
    const audioPanel = document.createElement('div');
    audioPanel.className = 'image-settings-panel'; // Reuse the image panel styles

    // Create audio settings form
    audioPanel.innerHTML = `
      <div class="panel-header">
        <h4>Audio Settings</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Audio URL (MP3, WAV, etc.)</label>
          <input type="text" class="audio-url-input" placeholder="Enter audio URL">
        </div>
        <div class="form-group">
          <label>Upload Audio</label>
          <div class="upload-container">
            <button class="upload-btn">Choose File</button>
            <span class="upload-filename">No file chosen</span>
            <input type="file" class="file-input" accept="audio/*" style="display: none;">
          </div>
        </div>
        <div class="form-actions">
          <button class="apply-audio-settings">Apply Changes</button>
          <button class="cancel-audio-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the audio container
    audioContainer.appendChild(audioPanel);

    // Setup file input
    const fileInput = audioPanel.querySelector('.file-input');
    const uploadBtn = audioPanel.querySelector('.upload-btn');
    const filenameSpan = audioPanel.querySelector('.upload-filename');

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        filenameSpan.textContent = fileInput.files[0].name;

        // Read the file and set as preview
        const reader = new FileReader();
        reader.onload = (e) => {
          audio.src = e.target.result;
          audio.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        filenameSpan.textContent = 'No file chosen';
      }
    });

    // Add event listeners
    const closeBtn = audioPanel.querySelector('.close-panel');
    const applyBtn = audioPanel.querySelector('.apply-audio-settings');
    const cancelBtn = audioPanel.querySelector('.cancel-audio-settings');

    closeBtn.addEventListener('click', () => {
      audioPanel.remove();
    });

    applyBtn.addEventListener('click', () => {
      // Get values
      const audioUrl = audioPanel.querySelector('.audio-url-input').value;

      // Apply changes
      if (audioUrl && !fileInput.files.length) {
        audio.src = audioUrl;
        audio.style.display = 'block';
        placeholder.style.display = 'none';
      }

      // Update content input
      this.updateContentInput();

      // Remove panel
      audioPanel.remove();
    });

    cancelBtn.addEventListener('click', () => {
      audioPanel.remove();
    });
  }

  setupDarkModeToggle(darkModeContainer) {
    const darkModeBtn = darkModeContainer.querySelector('.dark-mode-toggle');
    if (!darkModeBtn) return;

    // Add event listener to the dark mode toggle button
    darkModeBtn.addEventListener('click', () => {
      // Toggle a class on the body element
      document.body.classList.toggle('dark-mode');

      // Update the icon based on the current mode
      const icon = darkModeBtn.querySelector('i');
      if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    });
  }

  editHamburgerMenu(menuContainer) {
    // Create settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'image-settings-panel'; // Reuse the image panel styles

    // Get current settings
    const position = menuContainer.getAttribute('data-position') || 'left';
    const breakpoint = menuContainer.getAttribute('data-breakpoint') || '768';

    // Create settings form
    settingsPanel.innerHTML = `
      <div class="panel-header">
        <h4>Hamburger Menu Settings</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Menu Position</label>
          <select class="position-select">
            <option value="left" ${position === 'left' ? 'selected' : ''}>Left</option>
            <option value="right" ${position === 'right' ? 'selected' : ''}>Right</option>
          </select>
        </div>
        <div class="form-group">
          <label>Mobile Breakpoint (px)</label>
          <input type="number" class="breakpoint-input" value="${breakpoint}" placeholder="768">
          <p class="form-hint">Menu will appear below this screen width</p>
        </div>
        <div class="form-group">
          <label>Menu Items</label>
          <div class="menu-items-container">
            ${this.generateMenuItemsHTML(menuContainer)}
          </div>
          <button type="button" class="add-menu-item">+ Add Menu Item</button>
        </div>
        <div class="form-actions">
          <button class="apply-menu-settings">Apply Changes</button>
          <button class="cancel-menu-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the menu container
    menuContainer.appendChild(settingsPanel);

    // Setup event listeners
    this.setupHamburgerMenuEvents(menuContainer, settingsPanel);
  }

  generateMenuItemsHTML(menuContainer) {
    const menuItems = menuContainer.querySelectorAll('.mobile-menu ul li');
    let html = '';

    menuItems.forEach((item, index) => {
      const link = item.querySelector('a');
      const text = link ? link.textContent : '';
      const href = link ? link.getAttribute('data-href') || '#' : '#';

      html += `
        <div class="menu-item" data-index="${index}">
          <div class="menu-item-row">
            <input type="text" class="menu-item-text" value="${text}" placeholder="Menu text">
            <input type="text" class="menu-item-link" value="${href}" placeholder="Link URL">
            <button type="button" class="remove-menu-item"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });

    return html;
  }

  setupHamburgerMenuEvents(menuContainer, settingsPanel) {
    const closeBtn = settingsPanel.querySelector('.close-panel');
    const applyBtn = settingsPanel.querySelector('.apply-menu-settings');
    const cancelBtn = settingsPanel.querySelector('.cancel-menu-settings');
    const addItemBtn = settingsPanel.querySelector('.add-menu-item');

    // Close button
    closeBtn.addEventListener('click', () => {
      settingsPanel.remove();
    });

    // Add menu item button
    addItemBtn.addEventListener('click', () => {
      const menuItemsContainer = settingsPanel.querySelector('.menu-items-container');
      const newIndex = settingsPanel.querySelectorAll('.menu-item').length;

      const newItemDiv = document.createElement('div');
      newItemDiv.className = 'menu-item';
      newItemDiv.setAttribute('data-index', newIndex);
      newItemDiv.innerHTML = `
        <div class="menu-item-row">
          <input type="text" class="menu-item-text" placeholder="Menu text">
          <input type="text" class="menu-item-link" value="#" placeholder="Link URL">
          <button type="button" class="remove-menu-item"><i class="fas fa-trash"></i></button>
        </div>
      `;

      menuItemsContainer.appendChild(newItemDiv);

      // Add event listener to the new remove button
      const removeBtn = newItemDiv.querySelector('.remove-menu-item');
      removeBtn.addEventListener('click', () => {
        newItemDiv.remove();
      });
    });

    // Remove menu item buttons
    settingsPanel.querySelectorAll('.remove-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const menuItem = btn.closest('.menu-item');
        menuItem.remove();
      });
    });

    // Apply button
    applyBtn.addEventListener('click', () => {
      // Get values
      const newPosition = settingsPanel.querySelector('.position-select').value;
      const newBreakpoint = settingsPanel.querySelector('.breakpoint-input').value;
      const menuItems = settingsPanel.querySelectorAll('.menu-item');

      // Update menu position and breakpoint
      menuContainer.setAttribute('data-position', newPosition);
      menuContainer.setAttribute('data-breakpoint', newBreakpoint);

      // Update menu items
      const menuList = menuContainer.querySelector('.mobile-menu ul');
      menuList.innerHTML = '';

      menuItems.forEach(item => {
        const text = item.querySelector('.menu-item-text').value;
        const link = item.querySelector('.menu-item-link').value;

        if (text) {
          const li = document.createElement('li');
          li.innerHTML = `<a href="${link}" class="editable link-editable" data-href="${link}">${text}</a>`;
          menuList.appendChild(li);

          // Make the new link editable
          const newLink = li.querySelector('a');
          newLink.addEventListener('click', (e) => {
            e.stopPropagation();
            this.makeEditable(newLink);
          });
        }
      });

      // Update CSS classes based on position
      if (newPosition === 'right') {
        menuContainer.classList.add('position-right');
        menuContainer.classList.remove('position-left');
      } else {
        menuContainer.classList.add('position-left');
        menuContainer.classList.remove('position-right');
      }

      // Update content input
      this.updateContentInput();

      // Remove panel
      settingsPanel.remove();
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      settingsPanel.remove();
    });
  }

  setupHeaderFooterAdjust(controlsContainer) {
    const applyBtn = controlsContainer.querySelector('.apply-dimensions');
    const headerHeightInput = controlsContainer.querySelector('.header-height');
    const footerHeightInput = controlsContainer.querySelector('.footer-height');

    // Background color controls
    const headerBgColorInput = controlsContainer.querySelector('.header-bg-color');
    const footerBgColorInput = controlsContainer.querySelector('.footer-bg-color');

    // Gradient controls
    const headerUseGradient = controlsContainer.querySelector('.header-use-gradient');
    const headerGradientControls = controlsContainer.querySelector('.header-gradient-controls');
    const headerGradientStart = controlsContainer.querySelector('.header-gradient-start');
    const headerGradientEnd = controlsContainer.querySelector('.header-gradient-end');

    const footerUseGradient = controlsContainer.querySelector('.footer-use-gradient');
    const footerGradientControls = controlsContainer.querySelector('.footer-gradient-controls');
    const footerGradientStart = controlsContainer.querySelector('.footer-gradient-start');
    const footerGradientEnd = controlsContainer.querySelector('.footer-gradient-end');

    if (!applyBtn || !headerHeightInput || !footerHeightInput) return;

    // Toggle gradient controls visibility
    if (headerUseGradient) {
      headerUseGradient.addEventListener('change', () => {
        headerGradientControls.style.display = headerUseGradient.checked ? 'block' : 'none';
      });
    }

    if (footerUseGradient) {
      footerUseGradient.addEventListener('change', () => {
        footerGradientControls.style.display = footerUseGradient.checked ? 'block' : 'none';
      });
    }

    // Add event listener to the apply button
    applyBtn.addEventListener('click', () => {
      const headerHeight = headerHeightInput.value;
      const footerHeight = footerHeightInput.value;

      // Apply header height if provided
      if (headerHeight) {
        // Find the header element
        const header = document.querySelector('header');
        if (header) {
          header.style.height = headerHeight;

          // Adjust padding if needed
          if (parseInt(headerHeight) > 100) {
            header.style.paddingTop = '20px';
            header.style.paddingBottom = '20px';
          }
        }
      }

      // Apply footer height if provided
      if (footerHeight) {
        // Find the footer element
        const footer = document.querySelector('footer');
        if (footer) {
          footer.style.height = footerHeight;

          // Adjust padding if needed
          if (parseInt(footerHeight) > 80) {
            footer.style.paddingTop = '20px';
            footer.style.paddingBottom = '20px';
          }
        }
      }

      // Apply header background color or gradient
      const header = document.querySelector('header');
      if (header) {
        if (headerUseGradient && headerUseGradient.checked) {
          // Apply gradient
          header.style.backgroundColor = 'transparent';
          header.style.background = `linear-gradient(to right, ${headerGradientStart.value}, ${headerGradientEnd.value})`;
        } else if (headerBgColorInput) {
          // Apply solid color
          header.style.background = 'none';
          header.style.backgroundColor = headerBgColorInput.value;
        }
      }

      // Apply footer background color or gradient
      const footer = document.querySelector('footer');
      if (footer) {
        if (footerUseGradient && footerUseGradient.checked) {
          // Apply gradient
          footer.style.backgroundColor = 'transparent';
          footer.style.background = `linear-gradient(to right, ${footerGradientStart.value}, ${footerGradientEnd.value})`;
        } else if (footerBgColorInput) {
          // Apply solid color
          footer.style.background = 'none';
          footer.style.backgroundColor = footerBgColorInput.value;
        }
      }

      // Update the content input
      this.updateContentInput();

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'dimension-success';
      successMsg.textContent = 'Changes applied successfully!';
      controlsContainer.appendChild(successMsg);

      // Remove success message after 3 seconds
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    });
  }

  setupGradientBackground(gradientContainer) {
    const startColorInput = gradientContainer.querySelector('.start-color');
    const endColorInput = gradientContainer.querySelector('.end-color');
    const directionSelect = gradientContainer.querySelector('.gradient-direction');
    const applyBtn = gradientContainer.querySelector('.apply-gradient');
    const preview = gradientContainer.querySelector('.gradient-preview');

    if (!startColorInput || !endColorInput || !directionSelect || !applyBtn || !preview) return;

    // Initialize preview
    this.updateGradientPreview(preview, startColorInput.value, endColorInput.value, directionSelect.value);

    // Add event listeners for real-time preview
    startColorInput.addEventListener('input', () => {
      this.updateGradientPreview(preview, startColorInput.value, endColorInput.value, directionSelect.value);
    });

    endColorInput.addEventListener('input', () => {
      this.updateGradientPreview(preview, startColorInput.value, endColorInput.value, directionSelect.value);
    });

    directionSelect.addEventListener('change', () => {
      this.updateGradientPreview(preview, startColorInput.value, endColorInput.value, directionSelect.value);
    });

    // Apply button event listener
    applyBtn.addEventListener('click', () => {
      const startColor = startColorInput.value;
      const endColor = endColorInput.value;
      const direction = directionSelect.value;

      // Apply gradient to the body background
      document.body.style.background = `linear-gradient(${direction}, ${startColor}, ${endColor})`;

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'gradient-success';
      successMsg.textContent = 'Gradient applied successfully!';
      gradientContainer.appendChild(successMsg);

      // Remove success message after 3 seconds
      setTimeout(() => {
        successMsg.remove();
      }, 3000);
    });
  }

  updateGradientPreview(preview, startColor, endColor, direction) {
    preview.style.background = `linear-gradient(${direction}, ${startColor}, ${endColor})`;
  }

  setupLoginForm(loginContainer) {
    // Get the form and editable elements
    const form = loginContainer.querySelector('.login-form');
    const editableElements = loginContainer.querySelectorAll('.editable');

    if (!form) return;

    // Make editable elements clickable
    editableElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.makeEditable(el);
      });
    });

    // Add form submission handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form data
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'login-success';
        successMsg.textContent = `Login successful for ${email}!`;
        loginContainer.appendChild(successMsg);

        // Remove success message after 3 seconds
        setTimeout(() => {
          successMsg.remove();
        }, 3000);

        // Clear form
        form.reset();
      }, 1500);
    });
  }

  setupRegisterForm(registerContainer) {
    // Get the form and editable elements
    const form = registerContainer.querySelector('.register-form');
    const editableElements = registerContainer.querySelectorAll('.editable');

    if (!form) return;

    // Make editable elements clickable
    editableElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.makeEditable(el);
      });
    });

    // Add form submission handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form data
      const name = form.querySelector('#name').value;
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;
      const confirmPassword = form.querySelector('#confirm-password').value;

      // Validate passwords match
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Registering...';
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'register-success';
        successMsg.textContent = `Registration successful for ${name}!`;
        registerContainer.appendChild(successMsg);

        // Remove success message after 3 seconds
        setTimeout(() => {
          successMsg.remove();
        }, 3000);

        // Clear form
        form.reset();
      }, 1500);
    });
  }

  editGalleryBlock(galleryContainer) {
    // Create gallery settings panel
    const galleryPanel = document.createElement('div');
    galleryPanel.className = 'image-settings-panel'; // Reuse the image panel styles

    // Get the gallery grid
    const galleryGrid = galleryContainer.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    // Create gallery settings form
    galleryPanel.innerHTML = `
      <div class="panel-header">
        <h4>Gallery Settings</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="gallery-items-container">
          ${this.generateGalleryItemsHTML(galleryGrid)}
        </div>
        <button type="button" class="add-gallery-item">+ Add Image</button>
        <div class="form-actions">
          <button class="apply-gallery-settings">Apply Changes</button>
          <button class="cancel-gallery-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the gallery container
    galleryContainer.appendChild(galleryPanel);

    // Setup event listeners
    this.setupGalleryEvents(galleryContainer, galleryPanel, galleryGrid);
  }

  generateGalleryItemsHTML(galleryGrid) {
    const galleryItems = galleryGrid.querySelectorAll('.gallery-item');
    let html = '';

    galleryItems.forEach((item, index) => {
      const img = item.querySelector('img');
      const src = img ? img.getAttribute('src') : '/images/placeholder.jpg';
      const alt = img ? img.getAttribute('alt') : 'Gallery Image';

      html += `
        <div class="gallery-item-edit" data-index="${index}">
          <div class="gallery-item-preview">
            <img src="${src}" alt="${alt}" class="preview-img">
          </div>
          <div class="gallery-item-controls">
            <input type="text" class="gallery-item-alt" value="${alt}" placeholder="Image description">
            <div class="upload-container">
              <button class="upload-btn">Choose File</button>
              <span class="upload-filename">No file chosen</span>
              <input type="file" class="file-input" accept="image/*" style="display: none;">
            </div>
            <button type="button" class="remove-gallery-item"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    });

    return html;
  }

  setupGalleryEvents(galleryContainer, galleryPanel, galleryGrid) {
    const closeBtn = galleryPanel.querySelector('.close-panel');
    const applyBtn = galleryPanel.querySelector('.apply-gallery-settings');
    const cancelBtn = galleryPanel.querySelector('.cancel-gallery-settings');
    const addItemBtn = galleryPanel.querySelector('.add-gallery-item');

    // Close button
    closeBtn.addEventListener('click', () => {
      galleryPanel.remove();
    });

    // Setup file inputs for existing items
    galleryPanel.querySelectorAll('.file-input').forEach((fileInput, index) => {
      const uploadBtn = fileInput.parentElement.querySelector('.upload-btn');
      const filenameSpan = fileInput.parentElement.querySelector('.upload-filename');
      const previewImg = galleryPanel.querySelectorAll('.preview-img')[index];

      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          filenameSpan.textContent = fileInput.files[0].name;

          // Read the file and set as preview
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          filenameSpan.textContent = 'No file chosen';
        }
      });
    });

    // Remove gallery item buttons
    galleryPanel.querySelectorAll('.remove-gallery-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const galleryItem = btn.closest('.gallery-item-edit');
        galleryItem.remove();
      });
    });

    // Add gallery item button
    addItemBtn.addEventListener('click', () => {
      const galleryItemsContainer = galleryPanel.querySelector('.gallery-items-container');
      const newIndex = galleryPanel.querySelectorAll('.gallery-item-edit').length;

      const newItemDiv = document.createElement('div');
      newItemDiv.className = 'gallery-item-edit';
      newItemDiv.setAttribute('data-index', newIndex);
      newItemDiv.innerHTML = `
        <div class="gallery-item-preview">
          <img src="/images/placeholder.jpg" alt="Gallery Image" class="preview-img">
        </div>
        <div class="gallery-item-controls">
          <input type="text" class="gallery-item-alt" value="Gallery Image" placeholder="Image description">
          <div class="upload-container">
            <button class="upload-btn">Choose File</button>
            <span class="upload-filename">No file chosen</span>
            <input type="file" class="file-input" accept="image/*" style="display: none;">
          </div>
          <button type="button" class="remove-gallery-item"><i class="fas fa-trash"></i></button>
        </div>
      `;

      galleryItemsContainer.appendChild(newItemDiv);

      // Setup file input for new item
      const fileInput = newItemDiv.querySelector('.file-input');
      const uploadBtn = newItemDiv.querySelector('.upload-btn');
      const filenameSpan = newItemDiv.querySelector('.upload-filename');
      const previewImg = newItemDiv.querySelector('.preview-img');

      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          filenameSpan.textContent = fileInput.files[0].name;

          // Read the file and set as preview
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          filenameSpan.textContent = 'No file chosen';
        }
      });

      // Add event listener to the new remove button
      const removeBtn = newItemDiv.querySelector('.remove-gallery-item');
      removeBtn.addEventListener('click', () => {
        newItemDiv.remove();
      });
    });

    // Apply button
    applyBtn.addEventListener('click', () => {
      // Get all gallery items from the panel
      const galleryItems = galleryPanel.querySelectorAll('.gallery-item-edit');

      // Clear the gallery grid
      galleryGrid.innerHTML = '';

      // Add updated gallery items
      galleryItems.forEach(item => {
        const previewImg = item.querySelector('.preview-img');
        const altText = item.querySelector('.gallery-item-alt').value;

        const newGalleryItem = document.createElement('div');
        newGalleryItem.className = 'gallery-item';
        newGalleryItem.innerHTML = `<img src="${previewImg.src}" alt="${altText}">`;

        galleryGrid.appendChild(newGalleryItem);
      });

      // Update content input
      this.updateContentInput();

      // Remove panel
      galleryPanel.remove();
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      galleryPanel.remove();
    });
  }

  editImageBlock(imageContainer) {
    // Find the image element
    const img = imageContainer.querySelector('img');
    if (!img) return;

    // Create image settings panel
    const imagePanel = document.createElement('div');
    imagePanel.className = 'image-settings-panel';

    // Get current image src
    const currentSrc = img.getAttribute('src');

    // Create image settings form
    imagePanel.innerHTML = `
      <div class="panel-header">
        <h4>Image Settings</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Image URL</label>
          <input type="text" class="image-url-input" value="${currentSrc}" placeholder="Enter image URL">
        </div>
        <div class="form-group">
          <label>Upload Image</label>
          <div class="upload-container">
            <button class="upload-btn">Choose File</button>
            <span class="upload-filename">No file chosen</span>
            <input type="file" class="file-input" accept="image/*" style="display: none;">
          </div>
        </div>
        <div class="form-group">
          <label>Alt Text</label>
          <input type="text" class="alt-text-input" value="${img.getAttribute('alt') || ''}" placeholder="Describe the image">
        </div>
        <div class="form-group">
          <label>Caption</label>
          <input type="text" class="caption-input" value="${imageContainer.querySelector('.image-caption') ? imageContainer.querySelector('.image-caption').textContent : ''}" placeholder="Image caption">
        </div>
        <div class="form-actions">
          <button class="apply-image-settings">Apply Changes</button>
          <button class="cancel-image-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the image container
    imageContainer.appendChild(imagePanel);

    // Setup file input
    const fileInput = imagePanel.querySelector('.file-input');
    const uploadBtn = imagePanel.querySelector('.upload-btn');
    const filenameSpan = imagePanel.querySelector('.upload-filename');

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        filenameSpan.textContent = fileInput.files[0].name;

        // Read the file and set as preview
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        filenameSpan.textContent = 'No file chosen';
      }
    });

    // Add event listeners
    const closeBtn = imagePanel.querySelector('.close-panel');
    const applyBtn = imagePanel.querySelector('.apply-image-settings');
    const cancelBtn = imagePanel.querySelector('.cancel-image-settings');

    closeBtn.addEventListener('click', () => {
      imagePanel.remove();
    });

    applyBtn.addEventListener('click', () => {
      // Get values
      const imageUrl = imagePanel.querySelector('.image-url-input').value;
      const altText = imagePanel.querySelector('.alt-text-input').value;
      const caption = imagePanel.querySelector('.caption-input').value;

      // Apply changes
      if (imageUrl && !fileInput.files.length) {
        img.src = imageUrl;
      }

      img.alt = altText;

      // Update caption
      let captionEl = imageContainer.querySelector('.image-caption');
      if (captionEl) {
        captionEl.textContent = caption;
      } else if (caption) {
        captionEl = document.createElement('div');
        captionEl.className = 'image-caption editable';
        captionEl.textContent = caption;
        imageContainer.appendChild(captionEl);
      }

      // Update content input
      this.updateContentInput();

      // Remove panel
      imagePanel.remove();
    });

    cancelBtn.addEventListener('click', () => {
      imagePanel.remove();
    });
  }

  styleBlock(blockElement) {
    // Create style panel
    const stylePanel = document.createElement('div');
    stylePanel.className = 'style-panel';

    // Get the content element
    const type = blockElement.getAttribute('data-type');
    const content = blockElement.querySelector(`[data-type="${type}"]`);
    if (!content) return;

    // Get current styles
    const computedStyle = window.getComputedStyle(content);
    const currentWidth = content.style.width || computedStyle.width;
    const currentHeight = content.style.height || computedStyle.height;
    const currentPadding = content.style.padding || computedStyle.padding;
    const currentMargin = content.style.margin || computedStyle.margin;
    const currentColor = content.style.color || computedStyle.color;
    const currentBgColor = content.style.backgroundColor || computedStyle.backgroundColor;
    const currentFontSize = content.style.fontSize || computedStyle.fontSize;
    const currentTextAlign = content.style.textAlign || computedStyle.textAlign;

    // Create style controls
    stylePanel.innerHTML = `
      <div class="style-panel-header">
        <h4>Style Settings</h4>
        <button class="close-style-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="style-panel-body">
        <div class="style-group">
          <label>Dimensions</label>
          <div class="style-controls">
            <div class="style-control">
              <span>Width</span>
              <input type="text" class="width-input" value="${currentWidth}" placeholder="auto">
            </div>
            <div class="style-control">
              <span>Height</span>
              <input type="text" class="height-input" value="${currentHeight}" placeholder="auto">
            </div>
          </div>
        </div>

        <div class="style-group">
          <label>Spacing</label>
          <div class="style-controls">
            <div class="style-control">
              <span>Padding</span>
              <input type="text" class="padding-input" value="${currentPadding}" placeholder="0px">
            </div>
            <div class="style-control">
              <span>Margin</span>
              <input type="text" class="margin-input" value="${currentMargin}" placeholder="0px">
            </div>
          </div>
        </div>

        <div class="style-group">
          <label>Typography</label>
          <div class="style-controls">
            <div class="style-control">
              <span>Color</span>
              <input type="color" class="color-input" value="${this.rgbToHex(currentColor)}">
            </div>
            <div class="style-control">
              <span>Font Size</span>
              <input type="text" class="font-size-input" value="${currentFontSize}" placeholder="16px">
            </div>
            <div class="style-control">
              <span>Text Align</span>
              <select class="text-align-select">
                <option value="left" ${currentTextAlign === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${currentTextAlign === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${currentTextAlign === 'right' ? 'selected' : ''}>Right</option>
                <option value="justify" ${currentTextAlign === 'justify' ? 'selected' : ''}>Justify</option>
              </select>
            </div>
          </div>
        </div>

        <div class="style-group">
          <label>Background</label>
          <div class="style-controls">
            <div class="style-control">
              <span>Background Color</span>
              <input type="color" class="bg-color-input" value="${this.rgbToHex(currentBgColor)}">
            </div>
          </div>
        </div>

        <div class="style-actions">
          <button class="apply-styles">Apply Styles</button>
          <button class="reset-styles">Reset</button>
        </div>
      </div>
    `;

    // Add the style panel to the block
    blockElement.appendChild(stylePanel);

    // Add event listeners
    const closeBtn = stylePanel.querySelector('.close-style-panel');
    const applyBtn = stylePanel.querySelector('.apply-styles');
    const resetBtn = stylePanel.querySelector('.reset-styles');

    closeBtn.addEventListener('click', () => {
      stylePanel.remove();
    });

    applyBtn.addEventListener('click', () => {
      // Get values from inputs
      const width = stylePanel.querySelector('.width-input').value;
      const height = stylePanel.querySelector('.height-input').value;
      const padding = stylePanel.querySelector('.padding-input').value;
      const margin = stylePanel.querySelector('.margin-input').value;
      const color = stylePanel.querySelector('.color-input').value;
      const fontSize = stylePanel.querySelector('.font-size-input').value;
      const textAlign = stylePanel.querySelector('.text-align-select').value;
      const bgColor = stylePanel.querySelector('.bg-color-input').value;

      // Apply styles
      if (width) content.style.width = width;
      if (height) content.style.height = height;
      if (padding) content.style.padding = padding;
      if (margin) content.style.margin = margin;
      if (color) content.style.color = color;
      if (fontSize) content.style.fontSize = fontSize;
      if (textAlign) content.style.textAlign = textAlign;
      if (bgColor) content.style.backgroundColor = bgColor;

      // Update content input
      this.updateContentInput();

      // Remove style panel
      stylePanel.remove();
    });

    resetBtn.addEventListener('click', () => {
      // Reset styles
      content.style.width = '';
      content.style.height = '';
      content.style.padding = '';
      content.style.margin = '';
      content.style.color = '';
      content.style.fontSize = '';
      content.style.textAlign = '';
      content.style.backgroundColor = '';

      // Update content input
      this.updateContentInput();

      // Remove style panel
      stylePanel.remove();
    });
  }

  // Helper function to convert RGB to HEX
  rgbToHex(rgb) {
    // Default to black if color is not valid
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
      return '#000000';
    }

    // Check if already a hex color
    if (rgb.startsWith('#')) {
      return rgb;
    }

    // Extract RGB values
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);

      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    return '#000000';
  }

  makeEditable(element) {
    // Check if this is a link that needs special handling
    const isLinkEditable = element.classList.contains('link-editable');

    // Prevent form submission when editing
    const form = document.getElementById('page-edit-form');
    if (form) {
      // Store the original onsubmit handler
      this.originalOnSubmit = form.onsubmit;

      // Replace with a function that always prevents submission during editing
      form.onsubmit = (e) => {
        e.preventDefault();
        return false;
      };
    }

    // Add editing-active class to the container
    document.querySelector('.page-builder-container').classList.add('editing-active');

    // If it's a link, show the link editor instead of making it contenteditable
    if (isLinkEditable) {
      this.showLinkEditor(element);
      return;
    }

    element.setAttribute('contenteditable', 'true');
    element.focus();

    // Save changes when focus is lost
    element.addEventListener('blur', () => {
      element.removeAttribute('contenteditable');
      this.updateContentInput();

      // Remove editing-active class
      document.querySelector('.page-builder-container').classList.remove('editing-active');

      // Restore the original onsubmit handler
      if (form && this.originalOnSubmit) {
        form.onsubmit = this.originalOnSubmit;
      }
    });

    // Save changes on enter key (except for paragraphs and lists)
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && element.tagName !== 'P' && element.tagName !== 'LI') {
        e.preventDefault();
        element.blur();
      }
    });
  }

  showLinkEditor(linkElement) {
    // Get current link text and URL
    const linkText = linkElement.textContent;
    const linkUrl = linkElement.getAttribute('data-href') || linkElement.getAttribute('href') || '#';

    // Create link editor panel
    const linkEditor = document.createElement('div');
    linkEditor.className = 'link-editor-panel';

    // Create link editor form
    linkEditor.innerHTML = `
      <div class="panel-header">
        <h4>Edit Link</h4>
        <button class="close-panel"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Link Text</label>
          <input type="text" class="link-text-input" value="${linkText}" placeholder="Link text">
        </div>
        <div class="form-group">
          <label>Link URL</label>
          <input type="text" class="link-url-input" value="${linkUrl}" placeholder="https://example.com">
        </div>
        <div class="form-group">
          <label>Open in new tab</label>
          <input type="checkbox" class="link-target-checkbox" ${linkElement.getAttribute('target') === '_blank' ? 'checked' : ''}>
        </div>
        <div class="form-actions">
          <button class="apply-link-settings">Apply Changes</button>
          <button class="cancel-link-settings">Cancel</button>
        </div>
      </div>
    `;

    // Add the panel to the document body
    document.body.appendChild(linkEditor);

    // Position the panel near the link
    const linkRect = linkElement.getBoundingClientRect();
    linkEditor.style.position = 'absolute';
    linkEditor.style.top = `${linkRect.bottom + window.scrollY + 10}px`;
    linkEditor.style.left = `${linkRect.left + window.scrollX}px`;
    linkEditor.style.zIndex = '10000';

    // Add event listeners
    const closeBtn = linkEditor.querySelector('.close-panel');
    const applyBtn = linkEditor.querySelector('.apply-link-settings');
    const cancelBtn = linkEditor.querySelector('.cancel-link-settings');

    closeBtn.addEventListener('click', () => {
      linkEditor.remove();
      document.querySelector('.page-builder-container').classList.remove('editing-active');
    });

    applyBtn.addEventListener('click', () => {
      // Get values
      const newText = linkEditor.querySelector('.link-text-input').value;
      const newUrl = linkEditor.querySelector('.link-url-input').value;
      const newTarget = linkEditor.querySelector('.link-target-checkbox').checked ? '_blank' : '';

      // Apply changes
      linkElement.textContent = newText;
      linkElement.setAttribute('href', newUrl);
      linkElement.setAttribute('data-href', newUrl);

      if (newTarget) {
        linkElement.setAttribute('target', newTarget);
      } else {
        linkElement.removeAttribute('target');
      }

      // Update content input
      this.updateContentInput();

      // Remove panel
      linkEditor.remove();
      document.querySelector('.page-builder-container').classList.remove('editing-active');
    });

    cancelBtn.addEventListener('click', () => {
      linkEditor.remove();
      document.querySelector('.page-builder-container').classList.remove('editing-active');
    });
  }

  updateContentInput() {
    // Clone the canvas to remove controls
    const canvasClone = this.canvas.cloneNode(true);

    // Remove all control elements
    const controls = canvasClone.querySelectorAll('.block-controls');
    controls.forEach(control => control.remove());

    // Remove block containers but keep their contents
    const containers = canvasClone.querySelectorAll('.block-container');
    containers.forEach(container => {
      const content = container.firstChild;
      container.parentNode.insertBefore(content, container);
      container.remove();
    });

    // Set the HTML content to the hidden input
    this.contentInput.value = canvasClone.innerHTML;
  }

  loadContent() {
    if (this.initialContent) {
      this.canvas.innerHTML = this.initialContent;

      // Wrap existing elements in block containers
      const directChildren = Array.from(this.canvas.children);
      directChildren.forEach(child => {
        const type = child.getAttribute('data-type') || this.guessElementType(child);

        // Create block container
        const blockContainer = document.createElement('div');
        blockContainer.className = 'block-container';
        blockContainer.setAttribute('data-type', type);

        // Add special functionality for hamburger menu
        if (type === 'hamburger-menu') {
          const hamburgerBtn = child.querySelector('.hamburger-btn');
          if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              child.classList.toggle('active');
            });
          }
        }

        // Add controls
        const controls = document.createElement('div');
        controls.className = 'block-controls';
        controls.innerHTML = `
          <button class="move-up" title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button class="move-down" title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button class="edit" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="duplicate" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="delete" title="Delete"><i class="fas fa-trash"></i></button>
        `;

        // Add event listeners to controls
        const moveUpBtn = controls.querySelector('.move-up');
        const moveDownBtn = controls.querySelector('.move-down');
        const editBtn = controls.querySelector('.edit');
        const duplicateBtn = controls.querySelector('.duplicate');
        const deleteBtn = controls.querySelector('.delete');

        moveUpBtn.addEventListener('click', () => this.moveBlock(blockContainer, 'up'));
        moveDownBtn.addEventListener('click', () => this.moveBlock(blockContainer, 'down'));
        editBtn.addEventListener('click', () => this.editBlock(blockContainer));
        duplicateBtn.addEventListener('click', () => this.duplicateBlock(blockContainer));
        deleteBtn.addEventListener('click', () => this.deleteBlock(blockContainer));

        // Replace the child with the container
        this.canvas.insertBefore(blockContainer, child);
        blockContainer.appendChild(child);
        blockContainer.appendChild(controls);

        // Make editable elements clickable
        const editableElements = blockContainer.querySelectorAll('.editable');
        editableElements.forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.makeEditable(el);
          });
        });
      });

      // Add welcome message if canvas is empty
      if (directChildren.length === 0) {
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
          <div class="welcome-icon"><i class="fas fa-arrow-left"></i></div>
          <h3>Start Building Your Page</h3>
          <p>Drag and drop elements from the sidebar to create your page.</p>
          <p>No coding required!</p>
        `;
        this.canvas.appendChild(welcomeMessage);
      }
    }
  }

  guessElementType(element) {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return 'heading';
      case 'p':
        return 'paragraph';
      case 'img':
        return 'image';
      case 'a':
        return 'button';
      case 'hr':
        return 'divider';
      case 'ul':
      case 'ol':
        return 'list';
      case 'blockquote':
        return 'quote';
      case 'div':
        if (element.classList.contains('row')) return 'columns-2';
        if (element.classList.contains('video-container')) return 'video';
        if (element.classList.contains('contact-form-container')) return 'contact-form';
        return 'container';
      default:
        return 'paragraph';
    }
  }

  setupEventListeners() {
    // Save button
    if (this.saveButton) {
      this.saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.updateContentInput();

        // Get the form
        const form = this.saveButton.closest('form');

        // Add or update the stay_on_page hidden input
        let stayOnPageInput = form.querySelector('input[name="stay_on_page"]');
        if (!stayOnPageInput) {
          stayOnPageInput = document.createElement('input');
          stayOnPageInput.type = 'hidden';
          stayOnPageInput.name = 'stay_on_page';
          form.appendChild(stayOnPageInput);
        }

        // Set the value to true to stay on the page after saving
        stayOnPageInput.value = 'true';

        // Show saving indicator
        this.saveButtonText = this.saveButton.innerHTML;
        this.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        this.saveButton.disabled = true;

        // Store the button reference in localStorage to restore it after page reload
        localStorage.setItem('pageBuilderSaving', 'true');

        // Set the deliberate submission flag to allow the form to submit
        window.isDeliberateSubmission = true;

        // Submit the form
        form.submit();

        // Reset the flag after submission
        setTimeout(() => {
          window.isDeliberateSubmission = false;
        }, 100);

        // Create a temporary success message if there isn't one already
        if (!document.querySelector('.temp-success-message')) {
          const successMessage = document.createElement('div');
          successMessage.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded temp-success-message';
          successMessage.style.display = 'none';
          successMessage.innerHTML = `
            <div class="flex">
              <div class="py-1"><i class="fas fa-check-circle text-green-500 mr-3"></i></div>
              <div>
                <p>Changes saved successfully!</p>
              </div>
            </div>
          `;

          // Insert before the form
          const formElement = this.saveButton.closest('form');
          formElement.parentNode.insertBefore(successMessage, formElement);
        }
      });
    }

    // Preview button
    if (this.previewButton) {
      this.previewButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.updateContentInput();

        // Open preview in new tab
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/preview-page';
        form.target = '_blank';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'content';
        input.value = this.contentInput.value;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      });
    }
  }
}

// Initialize the page builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const builderContainer = document.getElementById('page-builder');
  const sidebarContainer = document.getElementById('sidebar-container');
  const contentInput = document.getElementById('content');
  const saveButton = document.getElementById('save-button');
  const previewButton = document.getElementById('preview-button');

  // Check if we need to restore the save button state
  if (localStorage.getItem('pageBuilderSaving') === 'true') {
    localStorage.removeItem('pageBuilderSaving');
    if (saveButton) {
      saveButton.innerHTML = '<i class="fas fa-save mr-1"></i> Save & Continue';
      saveButton.disabled = false;
    }
  }

  if (builderContainer && contentInput) {
    const initialContent = contentInput.value;

    // Initialize the page builder
    new PageBuilder({
      container: builderContainer,
      sidebarContainer: sidebarContainer,
      contentInput: contentInput,
      saveButton: saveButton,
      previewButton: previewButton,
      initialContent: initialContent
    });

    console.log('WordPress-like page builder initialized successfully!');
  }
});
