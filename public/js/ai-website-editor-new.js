/**
 * FTRAISE AI - Website Editor AI Automation
 * Adds AI-powered drag-and-drop functionality to the website editor
 */

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize AI Automation
  initAIAutomation();

  // Initialize Live Preview
  initLivePreview();

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float-element {
      0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
      20% { transform: translateY(0) scale(0.8); opacity: 0.9; }
      80% { transform: translateY(0) scale(0.8); opacity: 0.9; }
      100% { transform: translateY(0) scale(0.5); opacity: 0; }
    }

    .animate-float-element {
      animation: float-element 2s ease-in-out;
    }
  `;
  document.head.appendChild(style);
});

// Initialize AI Automation
function initAIAutomation() {
  const aiAutomationBtn = document.getElementById('ai-automation-btn');
  const aiAutomationModal = document.getElementById('ai-automation-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const generateElementsBtn = document.getElementById('generate-elements');
  const aiDescription = document.getElementById('ai-description');
  const aiError = document.getElementById('ai-error');
  const aiLoading = document.getElementById('ai-loading');

  if (!aiAutomationBtn || !aiAutomationModal) return;

  // Open modal
  aiAutomationBtn.addEventListener('click', function() {
    aiAutomationModal.classList.remove('hidden');
  });

  // Close modal
  closeModalBtn.addEventListener('click', function() {
    aiAutomationModal.classList.add('hidden');
  });

  // Close modal when clicking outside
  aiAutomationModal.addEventListener('click', function(e) {
    if (e.target === aiAutomationModal) {
      aiAutomationModal.classList.add('hidden');
    }
  });

  // Generate elements
  generateElementsBtn.addEventListener('click', function() {
    const description = aiDescription.value.trim();

    // Validate description
    if (description.length < 10) {
      aiError.classList.remove('hidden');
      return;
    }

    // Hide error if previously shown
    aiError.classList.add('hidden');

    // Check if this is a removal request
    if (description.toLowerCase().includes('remove') ||
        description.toLowerCase().includes('delete') ||
        description.toLowerCase().includes('clear')) {

      // Handle content removal
      handleContentRemoval(description);
      return;
    }

    // Show loading
    aiLoading.classList.remove('hidden');
    generateElementsBtn.disabled = true;
    generateElementsBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generating...';

    // Show searching the web message
    aiLoading.querySelector('p').innerHTML = 'AI is searching the web for information about <strong>"' + description + '"</strong>...';

    // Simulate web search (in a real implementation, this would call an actual search API)
    setTimeout(() => {
      // Update loading message to show we're generating content
      aiLoading.querySelector('p').innerHTML = 'AI is generating content based on web search results...';

      // Simulate content generation (in a real implementation, this would use the search results)
      setTimeout(() => {
        // Update loading message to show we're preparing elements
        aiLoading.querySelector('p').innerHTML = 'AI is preparing elements for drag and drop...';

        // Generate HTML based on the description and simulated web search
        const generatedHTML = generateHTMLFromDescription(description, true);

        // Close modal to show the live drag and drop animation
        aiAutomationModal.classList.add('hidden');

        // Show the AI automation overlay
        showAIAutomationOverlay(description);

        // Simulate live drag and drop with multiple elements
        const elements = generatedHTML.split('<!-- element-separator -->');
        let elementIndex = 0;

        // Function to add elements one by one with animation
        function addNextElement() {
          if (elementIndex < elements.length) {
            const element = elements[elementIndex];
            if (element.trim()) {
              // Create a floating element that moves to the canvas
              simulateLiveDragAndDrop(element, () => {
                // After animation completes, add the actual element
                if (window.pageBuilderInstance) {
                  window.pageBuilderInstance.addHTMLToCanvas(element);
                } else {
                  // Fallback if pageBuilderInstance is not available
                  const pageBuilder = document.getElementById('page-builder');
                  if (pageBuilder) {
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = element;
                    pageBuilder.appendChild(tempContainer.firstChild);
                  }
                }

                // Move to next element
                elementIndex++;
                setTimeout(addNextElement, 800);
              });
            } else {
              // Skip empty elements
              elementIndex++;
              addNextElement();
            }
          } else {
            // All elements added, hide overlay and show success message
            hideAIAutomationOverlay();

            // Reset button state
            generateElementsBtn.disabled = false;
            generateElementsBtn.innerHTML = '<i class="fas fa-magic mr-2"></i> Generate Elements';

            // Show success message
            showSuccessToast('Elements added successfully!', 'The AI has added your requested elements to the page based on web search results.');
          }
        }

        // Start adding elements
        addNextElement();
      }, 2000);
    }, 2000);
  });
}

// Show AI automation overlay
function showAIAutomationOverlay(description) {
  // Create overlay if it doesn't exist
  let overlay = document.getElementById('ai-automation-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ai-automation-overlay';
    overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-dark-100/90 rounded-xl p-6 max-w-2xl w-full mx-4 border border-purple-500/30 shadow-2xl text-center">
        <h3 class="text-xl font-bold text-white mb-4">AI Automation in Progress</h3>
        <p class="text-gray-300 mb-6">Please don't interact while AI is adding elements to your page...</p>
        <div class="flex items-center justify-center space-x-3 mb-4">
          <div class="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
          <div class="w-4 h-4 bg-indigo-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
          <div class="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
        <div class="text-sm text-gray-400 italic">Adding elements based on: "${description}"</div>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.classList.remove('hidden');
  }
}

// Hide AI automation overlay
function hideAIAutomationOverlay() {
  const overlay = document.getElementById('ai-automation-overlay');
  if (overlay) {
    overlay.classList.add('animate-fade-out');
    setTimeout(() => {
      // Remove the overlay completely instead of just hiding it
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      // Also check for any other AI automation overlays that might exist
      const allOverlays = document.querySelectorAll('[id^="ai-automation"]');
      allOverlays.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }, 500);
  }
}

// Simulate live drag and drop
function simulateLiveDragAndDrop(html, callback) {
  // Create a floating element
  const floatingElement = document.createElement('div');
  floatingElement.className = 'fixed z-[9999] pointer-events-none animate-float-element';
  floatingElement.style.top = '20%';
  floatingElement.style.left = '20%';
  floatingElement.style.transform = 'scale(0.8)';
  floatingElement.style.opacity = '0.9';
  floatingElement.style.maxWidth = '300px';
  floatingElement.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
  floatingElement.style.borderRadius = '8px';
  floatingElement.style.overflow = 'hidden';
  floatingElement.style.transition = 'all 1s cubic-bezier(0.22, 1, 0.36, 1)';

  // Create a preview of the element
  const previewContainer = document.createElement('div');
  previewContainer.className = 'bg-white p-4';
  previewContainer.style.transform = 'scale(0.8)';
  previewContainer.innerHTML = html;

  // Add the preview to the floating element
  floatingElement.appendChild(previewContainer);

  // Add the floating element to the body
  document.body.appendChild(floatingElement);

  // Get the canvas position
  const canvas = document.querySelector('.canvas-area');
  const canvasRect = canvas.getBoundingClientRect();

  // Animate the floating element to the canvas
  setTimeout(() => {
    floatingElement.style.top = `${canvasRect.top + 100}px`;
    floatingElement.style.left = `${canvasRect.left + (canvasRect.width / 2) - 150}px`;

    // After animation completes, remove the floating element and call the callback
    setTimeout(() => {
      floatingElement.style.opacity = '0';
      floatingElement.style.transform = 'scale(0.5)';

      setTimeout(() => {
        document.body.removeChild(floatingElement);
        if (callback) callback();
      }, 500);
    }, 1000);
  }, 100);
}

// Generate HTML from description
function generateHTMLFromDescription(description, useWebSearch = false) {
  // This is a simplified implementation
  // In a real implementation, this would use an AI service to generate HTML

  // Parse the description for common elements
  let html = '';

  // Add blog content if requested
  if (description.toLowerCase().includes('blog')) {
    html += generateBlogContent(description);
    html += '<!-- element-separator -->';
  }

  // Check for hero section
  if (description.toLowerCase().includes('hero') || description.toLowerCase().includes('header')) {
    const title = extractText(description, 'heading', 'Welcome to our Website');
    const subtitle = extractText(description, 'paragraph', 'We provide high-quality services to meet your needs.');

    html += `
      <div class="block-container" draggable="true">
        <div class="editable" data-type="hero" style="background-color: #f8f9fa; padding: 60px 20px; text-align: center;">
          <h1 class="editable" style="font-size: 2.5rem; margin-bottom: 20px;">${title}</h1>
          <p class="editable" style="font-size: 1.2rem; margin-bottom: 30px; color: #6c757d;">${subtitle}</p>
          <button class="editable" style="background-color: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Get Started</button>
        </div>
      </div>
    `;
    html += '<!-- element-separator -->';
  }

  // Check for about section
  if (description.toLowerCase().includes('about')) {
    const aboutText = useWebSearch ?
      generateDetailedAboutText(description) :
      extractText(description, 'about', 'We are a company dedicated to providing excellent service. Our team of experts works tirelessly to ensure customer satisfaction.');

    html += `
      <div class="block-container" draggable="true">
        <div class="editable" data-type="about" style="padding: 40px 20px;">
          <h2 class="editable" style="margin-bottom: 20px;">About Us</h2>
          <p class="editable" style="line-height: 1.6;">${aboutText}</p>
        </div>
      </div>
    `;
    html += '<!-- element-separator -->';
  }

  // Check for services
  if (description.toLowerCase().includes('service')) {
    const services = useWebSearch ? generateDetailedServices(description) : [];

    html += `
      <div class="block-container" draggable="true">
        <div class="editable" data-type="services" style="padding: 40px 20px;">
          <h2 class="editable" style="text-align: center; margin-bottom: 30px;">Our Services</h2>
          <div class="editable" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
    `;

    // Add services
    if (services.length > 0) {
      services.forEach(service => {
        html += `
            <div class="editable" style="flex: 1; min-width: 250px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <h3 class="editable" style="margin-bottom: 15px;">${service.title}</h3>
              <p class="editable">${service.description}</p>
            </div>
        `;
      });
    } else {
      // Default services
      html += `
            <div class="editable" style="flex: 1; min-width: 250px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <h3 class="editable" style="margin-bottom: 15px;">Service 1</h3>
              <p class="editable">Description of service 1 goes here. This is a placeholder text.</p>
            </div>
            <div class="editable" style="flex: 1; min-width: 250px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <h3 class="editable" style="margin-bottom: 15px;">Service 2</h3>
              <p class="editable">Description of service 2 goes here. This is a placeholder text.</p>
            </div>
            <div class="editable" style="flex: 1; min-width: 250px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
              <h3 class="editable" style="margin-bottom: 15px;">Service 3</h3>
              <p class="editable">Description of service 3 goes here. This is a placeholder text.</p>
            </div>
      `;
    }

    html += `
          </div>
        </div>
      </div>
    `;
    html += '<!-- element-separator -->';
  }

  // Check for contact
  if (description.toLowerCase().includes('contact')) {
    html += `
      <div class="block-container" draggable="true">
        <div class="editable" data-type="contact" style="padding: 40px 20px;">
          <h2 class="editable" style="text-align: center; margin-bottom: 30px;">Contact Us</h2>
          <div class="editable" style="max-width: 600px; margin: 0 auto;">
            <div class="editable" style="margin-bottom: 20px;">
              <label class="editable" style="display: block; margin-bottom: 5px;">Name</label>
              <input type="text" class="editable" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px;">
            </div>
            <div class="editable" style="margin-bottom: 20px;">
              <label class="editable" style="display: block; margin-bottom: 5px;">Email</label>
              <input type="email" class="editable" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px;">
            </div>
            <div class="editable" style="margin-bottom: 20px;">
              <label class="editable" style="display: block; margin-bottom: 5px;">Message</label>
              <textarea class="editable" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 5px; min-height: 100px;"></textarea>
            </div>
            <button class="editable" style="background-color: #0d6efd; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Send Message</button>
          </div>
        </div>
      </div>
    `;
    html += '<!-- element-separator -->';
  }

  // If no specific sections were detected, create a generic section
  if (html === '') {
    html = `
      <div class="block-container" draggable="true">
        <div class="editable" data-type="section" style="padding: 40px 20px;">
          <h2 class="editable" style="margin-bottom: 20px;">New Section</h2>
          <p class="editable" style="line-height: 1.6;">This is a new section based on your description: "${description}"</p>
        </div>
      </div>
    `;
  }

  return html;
}

// Generate blog content
function generateBlogContent(description) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract blog topic
  let blogTopic = 'Latest Updates';
  if (description.toLowerCase().includes('blog about')) {
    const match = description.match(/blog about\s+([^,.]+)/i);
    if (match && match[1]) {
      blogTopic = match[1].trim();
    }
  }

  // Generate a detailed blog post based on the topic
  const blogPost = generateDetailedBlogPost(blogTopic);

  return `
    <div class="block-container" draggable="true">
      <div class="editable" data-type="blog" style="padding: 40px 20px;">
        <h2 class="editable" style="text-align: center; margin-bottom: 30px;">Our Blog</h2>
        <div class="editable" style="max-width: 800px; margin: 0 auto;">
          <article class="editable" style="margin-bottom: 40px; border-bottom: 1px solid #e9ecef; padding-bottom: 30px;">
            <h3 class="editable" style="margin-bottom: 10px; font-size: 1.8rem;">${blogPost.title}</h3>
            <div class="editable" style="color: #6c757d; margin-bottom: 15px; font-size: 0.9rem;">
              <span>Posted on ${formattedDate}</span>
              <span style="margin-left: 15px;">by Admin</span>
            </div>
            <p class="editable" style="margin-bottom: 15px; line-height: 1.7;">${blogPost.intro}</p>
            <h4 class="editable" style="margin: 25px 0 15px; font-size: 1.4rem;">${blogPost.subheading1}</h4>
            <p class="editable" style="margin-bottom: 15px; line-height: 1.7;">${blogPost.content1}</p>
            <h4 class="editable" style="margin: 25px 0 15px; font-size: 1.4rem;">${blogPost.subheading2}</h4>
            <p class="editable" style="margin-bottom: 15px; line-height: 1.7;">${blogPost.content2}</p>
            <p class="editable" style="margin-top: 20px; font-style: italic;">${blogPost.conclusion}</p>
          </article>
          <div class="editable" style="text-align: center;">
            <a href="#" class="editable" style="display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">View All Posts</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate detailed blog post
function generateDetailedBlogPost(topic) {
  // This would normally call an AI service or search the web
  // For now, we'll use a template with the topic inserted

  return {
    title: `The Complete Guide to ${topic}`,
    intro: `In today's rapidly evolving landscape, understanding ${topic} has become more important than ever. This comprehensive guide will walk you through everything you need to know about ${topic}, from basic concepts to advanced strategies that can transform your approach.`,
    subheading1: `Why ${topic} Matters in Today's World`,
    content1: `${topic} has seen tremendous growth and evolution in recent years. Experts across industries recognize that mastering ${topic} provides a significant competitive advantage. Research shows that organizations implementing effective ${topic} strategies see up to 35% improvement in key performance metrics. The fundamental principles of ${topic} center around optimization, efficiency, and strategic implementation.`,
    subheading2: `Best Practices for Implementing ${topic}`,
    content2: `When implementing ${topic} in your organization, it's crucial to start with a clear strategy. Begin by assessing your current situation and identifying specific goals. Create a detailed implementation plan with measurable milestones. Invest in proper training and resources to ensure your team has the necessary skills. Regular monitoring and adjustment are essential for long-term success with ${topic}.`,
    conclusion: `As we've explored throughout this article, ${topic} represents a significant opportunity for growth and innovation. By following the guidelines and best practices outlined above, you'll be well-positioned to leverage ${topic} effectively in your specific context. Stay tuned for more insights and updates on this evolving field.`
  };
}

// Generate detailed about text
function generateDetailedAboutText(description) {
  // This would normally call an AI service or search the web
  // For now, we'll use a template with some customization

  let companyType = 'company';
  if (description.toLowerCase().includes('restaurant')) companyType = 'restaurant';
  if (description.toLowerCase().includes('tech')) companyType = 'technology company';
  if (description.toLowerCase().includes('shop') || description.toLowerCase().includes('store')) companyType = 'retail business';
  if (description.toLowerCase().includes('health')) companyType = 'healthcare provider';

  return `Welcome to our ${companyType}. We are dedicated to delivering exceptional experiences and superior quality in everything we do. Founded with a vision to transform the industry, we've grown through our commitment to innovation, integrity, and customer satisfaction.

Our team consists of passionate professionals with extensive expertise in their respective fields. We believe in continuous improvement and staying ahead of industry trends to provide you with the best possible solutions.

What sets us apart is our unwavering focus on quality and attention to detail. We take pride in our work and strive to exceed expectations with every interaction. Our customer-centric approach ensures that your needs are always our top priority.

We're not just a business; we're a community partner committed to making a positive impact. Through sustainable practices and community involvement, we aim to contribute to a better future for all.

Thank you for considering us. We look forward to the opportunity to serve you and demonstrate our commitment to excellence.`;
}

// Generate detailed services
function generateDetailedServices(description) {
  // This would normally call an AI service or search the web
  // For now, we'll generate some services based on the description

  const services = [];

  if (description.toLowerCase().includes('restaurant') || description.toLowerCase().includes('food')) {
    services.push({
      title: 'Fine Dining Experience',
      description: 'Enjoy an exceptional culinary journey with our carefully crafted menu featuring seasonal ingredients and expert preparation techniques.'
    });
    services.push({
      title: 'Catering Services',
      description: 'Let us bring our culinary expertise to your special events. Our catering service offers customized menus tailored to your specific preferences and requirements.'
    });
    services.push({
      title: 'Private Events',
      description: 'Host your special occasions in our elegant private dining spaces. Perfect for corporate events, celebrations, or intimate gatherings.'
    });
  } else if (description.toLowerCase().includes('tech') || description.toLowerCase().includes('software')) {
    services.push({
      title: 'Custom Software Development',
      description: 'We create tailored software solutions designed to address your specific business challenges and optimize your operations.'
    });
    services.push({
      title: 'Cloud Migration & Management',
      description: 'Seamlessly transition your infrastructure to the cloud with our comprehensive migration services and ongoing management support.'
    });
    services.push({
      title: 'Cybersecurity Solutions',
      description: 'Protect your digital assets with our advanced security protocols, vulnerability assessments, and proactive monitoring systems.'
    });
  } else if (description.toLowerCase().includes('health') || description.toLowerCase().includes('medical')) {
    services.push({
      title: 'Preventive Care',
      description: 'Our comprehensive preventive care programs focus on maintaining your health and detecting potential issues before they become serious.'
    });
    services.push({
      title: 'Specialized Treatments',
      description: 'Access advanced, specialized medical treatments delivered by our team of experienced healthcare professionals.'
    });
    services.push({
      title: 'Wellness Programs',
      description: 'Holistic wellness programs designed to improve your overall health through nutrition, exercise, and lifestyle modifications.'
    });
  } else {
    services.push({
      title: 'Professional Consultation',
      description: 'Expert guidance tailored to your specific needs, helping you navigate challenges and identify opportunities for growth.'
    });
    services.push({
      title: 'Customized Solutions',
      description: 'Bespoke solutions designed specifically for your unique requirements, ensuring optimal results and satisfaction.'
    });
    services.push({
      title: 'Ongoing Support',
      description: 'Comprehensive support services to ensure long-term success and address any issues that may arise along the way.'
    });
  }

  return services;
}

// Extract text from description
function extractText(description, type, defaultText) {
  const regex = new RegExp(`${type}\\s*['"](.*)['"]`, 'i');
  const match = description.match(regex);
  return match ? match[1] : defaultText;
}

// Show success toast
function showSuccessToast(title, message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in max-w-md';
  toast.innerHTML = `
    <div class="flex items-start">
      <i class="fas fa-check-circle mr-2 mt-1"></i>
      <div>
        <p class="font-bold">${title}</p>
        <p class="text-sm mt-1">${message}</p>
      </div>
    </div>
  `;
  document.body.appendChild(toast);

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);
}

// Handle content removal based on AI instructions
function handleContentRemoval(description) {
  // Show loading
  const aiLoading = document.getElementById('ai-loading');
  const generateElementsBtn = document.getElementById('generate-elements');
  const aiAutomationModal = document.getElementById('ai-automation-modal');

  if (aiLoading && generateElementsBtn) {
    aiLoading.classList.remove('hidden');
    generateElementsBtn.disabled = true;
    generateElementsBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    // Update loading message
    if (aiLoading.querySelector('p')) {
      aiLoading.querySelector('p').innerHTML = 'AI is analyzing your request to remove content...';
    }

    // Check if it's a request to remove all content
    const removeAll = description.toLowerCase().includes('all content') ||
                     description.toLowerCase().includes('everything') ||
                     description.toLowerCase().includes('all elements');

    // Parse the description to identify what to remove
    setTimeout(() => {
      if (removeAll) {
        // Remove all content from the canvas
        if (window.pageBuilderInstance && window.pageBuilderInstance.canvas) {
          window.pageBuilderInstance.canvas.innerHTML = '';
          window.pageBuilderInstance.updateContentInput();
        } else {
          const canvas = document.querySelector('.canvas-area');
          if (canvas) {
            canvas.innerHTML = '';
          }
        }

        // Close modal and show success message
        if (aiAutomationModal) {
          aiAutomationModal.classList.add('hidden');
        }

        showSuccessToast('Content Removed', 'All content has been removed from the page.');
      } else {
        // Try to identify specific elements to remove
        const keywords = extractRemovalKeywords(description);
        let removedCount = 0;

        if (keywords.length > 0) {
          // Find and remove elements that match the keywords
          const elements = document.querySelectorAll('.block-container');

          elements.forEach(element => {
            const elementText = element.textContent.toLowerCase();
            const elementType = element.getAttribute('data-type') || '';

            // Check if this element matches any of the keywords
            const shouldRemove = keywords.some(keyword =>
              elementText.includes(keyword) || elementType.includes(keyword)
            );

            if (shouldRemove) {
              element.remove();
              removedCount++;

              // Update content input if pageBuilderInstance is available
              if (window.pageBuilderInstance) {
                window.pageBuilderInstance.updateContentInput();
              }
            }
          });
        }

        // Close modal and show success message
        if (aiAutomationModal) {
          aiAutomationModal.classList.add('hidden');
        }

        if (removedCount > 0) {
          showSuccessToast('Content Removed', `Removed ${removedCount} element(s) from the page.`);
        } else {
          showSuccessToast('No Content Removed', 'Could not find elements matching your description. Please try again with more specific terms.');
        }
      }

      // Reset button state
      if (generateElementsBtn) {
        generateElementsBtn.disabled = false;
        generateElementsBtn.innerHTML = '<i class="fas fa-magic mr-2"></i> Generate Elements';
      }

      // Hide loading
      if (aiLoading) {
        aiLoading.classList.add('hidden');
      }
    }, 1500);
  }
}

// Extract keywords for removal from description
function extractRemovalKeywords(description) {
  const words = description.toLowerCase().split(/\s+/);
  const keywords = [];

  // Common elements that might be removed
  const elementTypes = ['header', 'footer', 'image', 'video', 'audio', 'text', 'paragraph', 'button',
                       'form', 'contact', 'gallery', 'slider', 'carousel', 'testimonial', 'pricing',
                       'accordion', 'tabs', 'hero', 'section', 'about', 'services', 'blog'];

  // Find element types mentioned in the description
  elementTypes.forEach(type => {
    if (description.toLowerCase().includes(type)) {
      keywords.push(type);
    }
  });

  // Look for specific text content to remove
  const removeIndex = words.findIndex(word =>
    word === 'remove' || word === 'delete' || word === 'clear'
  );

  if (removeIndex !== -1 && removeIndex < words.length - 1) {
    // Get the words after 'remove'/'delete'/'clear' but before the next command word
    let i = removeIndex + 1;
    let phrase = [];

    while (i < words.length &&
           !['and', 'then', 'also', 'remove', 'delete', 'clear'].includes(words[i])) {
      phrase.push(words[i]);
      i++;
    }

    if (phrase.length > 0) {
      keywords.push(phrase.join(' '));
    }
  }

  return keywords;
}

// Initialize Live Preview
function initLivePreview() {
  const previewOverlay = document.getElementById('live-preview-overlay');
  const previewContainer = document.getElementById('preview-container');
  const closePreview = document.getElementById('close-preview');

  if (!previewOverlay || !previewContainer || !closePreview) return;

  // Add preview button if it doesn't exist
  let previewButton = document.getElementById('preview-button');
  if (!previewButton) {
    const headerControls = document.querySelector('.header-controls');
    if (headerControls) {
      previewButton = document.createElement('button');
      previewButton.id = 'preview-button';
      previewButton.className = 'preview-button';
      previewButton.innerHTML = '<i class="fas fa-eye mr-1"></i> Preview';
      headerControls.appendChild(previewButton);
    }
  }

  // If we still don't have a preview button, try to add it to the form actions
  if (!previewButton) {
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
      previewButton = document.createElement('button');
      previewButton.id = 'preview-button';
      previewButton.className = 'preview-button';
      previewButton.type = 'button'; // Ensure it doesn't submit the form
      previewButton.innerHTML = '<i class="fas fa-eye mr-1"></i> Preview';
      formActions.appendChild(previewButton);
    }
  }

  // Get the preview button again (it might have been created)
  previewButton = document.getElementById('preview-button');

  if (!previewButton) return;

  // Show preview
  previewButton.addEventListener('click', function() {
    // Get the current content
    const contentInput = document.getElementById('content');
    if (!contentInput) return;

    const content = contentInput.value;

    // Display the content in the preview container
    previewContainer.innerHTML = content;

    // Show the preview overlay
    previewOverlay.classList.remove('hidden');
  });

  // Close preview
  closePreview.addEventListener('click', function() {
    previewOverlay.classList.add('hidden');
  });

  // Close preview when clicking outside
  previewOverlay.addEventListener('click', function(e) {
    if (e.target === previewOverlay) {
      previewOverlay.classList.add('hidden');
    }
  });
}
