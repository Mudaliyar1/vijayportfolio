# FTRAISE AI - Futuristic AI Chat Website

A sleek, futuristic, highly interactive, and fully responsive AI chat website using EJS, Node.js, MongoDB, and Cohere AI, featuring advanced UI animations, immersive user experience, robust admin dashboard, comprehensive chat history management, and a user profile page.

## Features

- **Immersive & Responsive UI**: Glassmorphism, neon accents, dark mode styling with smooth animations and transitions
- **AI Chat**: Powered by Cohere AI with real-time conversation processing
- **User Management**: Guest users (5 requests total) and registered users (8 requests per 3 minutes)
- **User Profiles**: View and edit profile information, change password, update profile picture
- **Chat History**: View, continue, and delete previous conversations
- **Admin Dashboard**: User management, chat monitoring, and guest user tracking

## Technologies Used

- **Frontend**: EJS, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Integration**: Cohere AI API

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ftraise-ai.git
   cd ftraise-ai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   AI_API_KEY=your_cohere_api_key
   AI_MODEL=cohere
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   ```

4. Generate default avatar and favicon:
   - Open `http://localhost:3000/generate-avatar.html` in your browser
   - Follow the instructions to save the default avatar as `public/images/default-avatar.png`
   - Open `http://localhost:3000/generate-favicon.html` in your browser
   - Follow the instructions to save the favicon as `public/images/favicon.ico`

5. Run the database migration script (if upgrading from a previous version):
   ```
   npm run migrate
   ```

6. Start the server:
   ```
   npm start
   ```

7. For development with auto-restart:
   ```
   npm run dev
   ```


## Deployment

### Deploying to Render

1. Create a Render account at [render.com](https://render.com)

2. Create a new Web Service:
   - Connect your GitHub repository
   - Select the branch to deploy
   - Use the following settings:
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`

3. Add Environment Variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render will override this with its own port)
   - `MONGODB_URI`: your MongoDB connection string
   - `AI_API_KEY`: your Cohere API key
   - `AI_MODEL`: command
   - `SESSION_SECRET`: a secure random string

4. Run the database migration (if needed):
   - Go to the Render dashboard
   - Open a shell for your service
   - Run `npm run migrate`

5. Deploy the service

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI

2. Login to Heroku and create a new app:
   ```
   heroku login
   heroku create your-app-name
   ```

3. Add environment variables:
   ```
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set AI_API_KEY=your_cohere_api_key
   heroku config:set AI_MODEL=command
   heroku config:set SESSION_SECRET=your_session_secret
   ```

4. Push to Heroku:
   ```
   git push heroku main
   ```

5. Run the database migration (if needed):
   ```
   heroku run npm run migrate
   ```

## Project Structure

- `server.js`: Main application file
- `config/`: Configuration files
- `controllers/`: Route controllers
- `middlewares/`: Custom middleware functions
- `models/`: Database models
- `public/`: Static files (CSS, JS, images)
- `routes/`: Application routes
- `views/`: EJS templates

## Troubleshooting

### Cohere API Issues

If you encounter errors related to the Cohere API, make sure:

1. You're using the correct version of the cohere-ai package (v4.3.1)
2. Your API key is valid and properly set in the .env file
3. You have sufficient credits on your Cohere account

### Missing Images

If you see broken image links:

1. Make sure you've generated and saved the default avatar and favicon
2. Check that the files are in the correct location (public/images/)
3. Verify the file names match exactly: default-avatar.png and favicon.ico

### MongoDB Connection Issues

1. Verify your MongoDB connection string is correct
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Check that your database user has the correct permissions

## License

This project is licensed under the ISC License.

## Created By

ftraise59/vijay
