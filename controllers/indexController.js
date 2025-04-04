module.exports = {
  // Render home page
  getHomePage: (req, res) => {
    res.render('index', {
      title: 'FTRAISE AI - Futuristic AI Chat Experience'
    });
  },
  
  // Render about page
  getAboutPage: (req, res) => {
    res.render('about', {
      title: 'About - FTRAISE AI'
    });
  }
};
