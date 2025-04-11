require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected');
  initTemplates();
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Default templates
const defaultTemplates = [
  // Restaurant Template
  {
    name: 'Modern Restaurant',
    description: 'A sleek and modern template for restaurants, cafes, and food businesses',
    businessType: 'Restaurant',
    theme: 'modern',
    colorScheme: 'red',
    thumbnail: '/images/templates/placeholder.jpg',
    packageType: 'Free',
    pageCount: 4,
    active: true,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        content: `
          <section class="hero">
            <h1>Modern Restaurant</h1>
            <p>Delicious food in a beautiful atmosphere</p>
            <a href="#contact" class="btn website-internal-link">Make a Reservation</a>
          </section>

          <section class="about">
            <h2>About Us</h2>
            <p>Welcome to Modern Restaurant, where culinary excellence meets elegant ambiance. We provide exceptional dining experiences tailored to your taste.</p>
          </section>

          <section class="services">
            <h2>Our Menu</h2>
            <div class="service-grid">
              <div class="service-card">
                <h3>Appetizers</h3>
                <p>Start your meal with our delicious appetizers.</p>
              </div>
              <div class="service-card">
                <h3>Main Courses</h3>
                <p>Enjoy our chef's special main courses.</p>
              </div>
              <div class="service-card">
                <h3>Desserts</h3>
                <p>Finish your meal with our sweet desserts.</p>
              </div>
            </div>
          </section>

          <section class="contact">
            <h2>Make a Reservation</h2>
            <p>Book your table now for an unforgettable dining experience.</p>
            <form class="contact-form">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your Name">
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Your Email">
              </div>
              <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date" name="date">
              </div>
              <div class="form-group">
                <label for="time">Time</label>
                <input type="time" id="time" name="time">
              </div>
              <div class="form-group">
                <label for="guests">Number of Guests</label>
                <input type="number" id="guests" name="guests" min="1" max="20">
              </div>
              <div class="form-group">
                <label for="message">Special Requests</label>
                <textarea id="message" name="message" placeholder="Any special requests?"></textarea>
              </div>
              <button type="submit" class="btn">Book Now</button>
            </form>
          </section>
        `,
        isHomepage: true,
        order: 0
      },
      {
        title: 'Menu',
        slug: 'menu',
        content: `
          <section class="menu-page">
            <h1>Our Menu</h1>
            <p>Explore our delicious offerings prepared with the finest ingredients.</p>

            <div class="menu-section">
              <h2>Appetizers</h2>
              <div class="menu-items">
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Bruschetta</h3>
                    <span class="price">$8.99</span>
                  </div>
                  <p>Toasted bread topped with fresh tomatoes, basil, and garlic.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Calamari</h3>
                    <span class="price">$12.99</span>
                  </div>
                  <p>Crispy fried calamari served with marinara sauce.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Spinach Artichoke Dip</h3>
                    <span class="price">$10.99</span>
                  </div>
                  <p>Creamy spinach and artichoke dip served with tortilla chips.</p>
                </div>
              </div>
            </div>

            <div class="menu-section">
              <h2>Main Courses</h2>
              <div class="menu-items">
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Grilled Salmon</h3>
                    <span class="price">$24.99</span>
                  </div>
                  <p>Fresh salmon grilled to perfection, served with seasonal vegetables.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Filet Mignon</h3>
                    <span class="price">$32.99</span>
                  </div>
                  <p>8oz filet mignon cooked to your preference, served with mashed potatoes.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Vegetable Pasta</h3>
                    <span class="price">$18.99</span>
                  </div>
                  <p>Fettuccine pasta with fresh seasonal vegetables in a light cream sauce.</p>
                </div>
              </div>
            </div>

            <div class="menu-section">
              <h2>Desserts</h2>
              <div class="menu-items">
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Chocolate Lava Cake</h3>
                    <span class="price">$8.99</span>
                  </div>
                  <p>Warm chocolate cake with a molten center, served with vanilla ice cream.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Cheesecake</h3>
                    <span class="price">$7.99</span>
                  </div>
                  <p>New York style cheesecake with your choice of topping.</p>
                </div>
                <div class="menu-item">
                  <div class="menu-item-header">
                    <h3>Tiramisu</h3>
                    <span class="price">$8.99</span>
                  </div>
                  <p>Classic Italian dessert made with espresso-soaked ladyfingers and mascarpone cream.</p>
                </div>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 1
      },
      {
        title: 'About',
        slug: 'about',
        content: `
          <section class="about-page">
            <h1>About Us</h1>
            <p>Welcome to Modern Restaurant, where culinary excellence meets elegant ambiance.</p>

            <div class="about-content">
              <div class="about-text">
                <h2>Our Story</h2>
                <p>Founded in 2010, Modern Restaurant has been serving the community with delicious food and exceptional service for over a decade. Our passion for culinary excellence drives us to create memorable dining experiences for our guests.</p>

                <h2>Our Philosophy</h2>
                <p>We believe in using only the freshest ingredients sourced from local farmers and suppliers. Our menu changes seasonally to reflect the best produce available, ensuring that every dish is at its peak flavor.</p>

                <h2>Our Values</h2>
                <ul>
                  <li>Quality ingredients</li>
                  <li>Exceptional service</li>
                  <li>Sustainable practices</li>
                  <li>Community involvement</li>
                </ul>
              </div>

              <div class="about-image">
                <img src="/images/placeholder.jpg" alt="About Us">
              </div>
            </div>

            <div class="team-section">
              <h2>Meet Our Team</h2>
              <div class="team-grid">
                <div class="team-member">
                  <img src="/images/placeholder.jpg" alt="Team Member">
                  <h3>John Doe</h3>
                  <p>Executive Chef</p>
                </div>
                <div class="team-member">
                  <img src="/images/placeholder.jpg" alt="Team Member">
                  <h3>Jane Smith</h3>
                  <p>Sous Chef</p>
                </div>
                <div class="team-member">
                  <img src="/images/placeholder.jpg" alt="Team Member">
                  <h3>Mike Johnson</h3>
                  <p>Restaurant Manager</p>
                </div>
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 2
      },
      {
        title: 'Contact',
        slug: 'contact',
        content: `
          <section class="contact-page">
            <h1>Contact Us</h1>
            <p>Get in touch with Modern Restaurant to make a reservation or inquire about our services.</p>

            <div class="contact-container">
              <div class="contact-form-container">
                <h2>Send Us a Message</h2>
                <form class="contact-form">
                  <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" name="name" placeholder="Your Name">
                  </div>
                  <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="Your Email">
                  </div>
                  <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" placeholder="Your Phone">
                  </div>
                  <div class="form-group">
                    <label for="message">Message</label>
                    <textarea id="message" name="message" placeholder="Your Message"></textarea>
                  </div>
                  <button type="submit" class="btn">Send Message</button>
                </form>
              </div>

              <div class="contact-info">
                <h2>Contact Information</h2>
                <div class="info-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <p>123 Main Street, City, Country</p>
                </div>
                <div class="info-item">
                  <i class="fas fa-phone"></i>
                  <p>+1 (123) 456-7890</p>
                </div>
                <div class="info-item">
                  <i class="fas fa-envelope"></i>
                  <p>info@modernrestaurant.com</p>
                </div>
                <div class="info-item">
                  <i class="fas fa-clock"></i>
                  <p>Monday - Friday: 11am - 10pm<br>Saturday - Sunday: 10am - 11pm</p>
                </div>
              </div>
            </div>

            <div class="map-container">
              <h2>Find Us</h2>
              <div class="map-placeholder">
                <img src="/images/map-placeholder.jpg" alt="Map">
              </div>
            </div>
          </section>
        `,
        isHomepage: false,
        order: 3
      }
    ]
  },

  // Technology Template
  {
    name: 'Tech Startup',
    description: 'A modern template for tech startups, software companies, and digital agencies',
    businessType: 'Technology',
    theme: 'modern',
    colorScheme: 'blue',
    thumbnail: '/images/templates/placeholder.jpg',
    packageType: 'Basic',
    pageCount: 5,
    active: true,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        content: `
          <section class="hero">
            <h1>Tech Startup</h1>
            <p>Innovative solutions for the digital age</p>
            <a href="#contact" class="btn website-internal-link">Get Started</a>
          </section>

          <section class="about">
            <h2>About Us</h2>
            <p>We are a cutting-edge tech startup focused on creating innovative solutions that transform businesses and improve lives.</p>
          </section>

          <section class="services">
            <h2>Our Services</h2>
            <div class="service-grid">
              <div class="service-card">
                <h3>Web Development</h3>
                <p>Custom websites and web applications built with the latest technologies.</p>
              </div>
              <div class="service-card">
                <h3>Mobile Apps</h3>
                <p>Native and cross-platform mobile applications for iOS and Android.</p>
              </div>
              <div class="service-card">
                <h3>AI Solutions</h3>
                <p>Artificial intelligence and machine learning solutions for your business.</p>
              </div>
            </div>
          </section>

          <section class="contact">
            <h2>Contact Us</h2>
            <p>Get in touch to discuss how we can help your business grow.</p>
            <form class="contact-form">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your Name">
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Your Email">
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" placeholder="Your Message"></textarea>
              </div>
              <button type="submit" class="btn">Send Message</button>
            </form>
          </section>
        `,
        isHomepage: true,
        order: 0
      },
      // Additional pages for Tech Startup template would be defined here
    ]
  },

  // Professional Services Template
  {
    name: 'Professional Services',
    description: 'An elegant template for law firms, consultants, and professional service providers',
    businessType: 'Professional Services',
    theme: 'elegant',
    colorScheme: 'purple',
    thumbnail: '/images/templates/placeholder.jpg',
    packageType: 'Professional',
    pageCount: 6,
    active: true,
    pages: [
      {
        title: 'Home',
        slug: 'home',
        content: `
          <section class="hero">
            <h1>Professional Services</h1>
            <p>Expert solutions for your business needs</p>
            <a href="#contact" class="btn website-internal-link">Schedule a Consultation</a>
          </section>

          <section class="about">
            <h2>About Us</h2>
            <p>We are a team of experienced professionals dedicated to providing high-quality services to businesses and individuals.</p>
          </section>

          <section class="services">
            <h2>Our Services</h2>
            <div class="service-grid">
              <div class="service-card">
                <h3>Consulting</h3>
                <p>Strategic business consulting to help you achieve your goals.</p>
              </div>
              <div class="service-card">
                <h3>Legal Services</h3>
                <p>Comprehensive legal services for businesses and individuals.</p>
              </div>
              <div class="service-card">
                <h3>Financial Planning</h3>
                <p>Expert financial planning and wealth management services.</p>
              </div>
            </div>
          </section>

          <section class="contact">
            <h2>Contact Us</h2>
            <p>Schedule a consultation to discuss your needs.</p>
            <form class="contact-form">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your Name">
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Your Email">
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" name="message" placeholder="Your Message"></textarea>
              </div>
              <button type="submit" class="btn">Schedule Consultation</button>
            </form>
          </section>
        `,
        isHomepage: true,
        order: 0
      },
      // Additional pages for Professional Services template would be defined here
    ]
  }
];

// Initialize templates
async function initTemplates() {
  try {
    // Check if templates already exist
    const count = await Template.countDocuments();

    if (count === 0) {
      // Insert default templates
      await Template.insertMany(defaultTemplates);
      console.log(`${defaultTemplates.length} templates created successfully`);
    } else {
      console.log(`Templates already exist. Found ${count} templates.`);
    }

    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (err) {
    console.error('Error initializing templates:', err);
    mongoose.disconnect();
    process.exit(1);
  }
}
