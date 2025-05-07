# FTRAISE AI - System Design Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [UML Diagrams](#uml-diagrams)
   - [Use Case Diagram](#use-case-diagram)
   - [Class Diagram](#class-diagram)
   - [Sequence Diagram](#sequence-diagram)
4. [ER Diagram](#er-diagram)
5. [Module Descriptions](#module-descriptions)
   - [User Management Module](#user-management-module)
   - [Authentication & Authorization Module](#authentication--authorization-module)
   - [AI Chat Module](#ai-chat-module)
   - [Image Generation Module](#image-generation-module)
   - [Digital Twin Module](#digital-twin-module)
   - [Neural Dreamscape Module](#neural-dreamscape-module)
   - [Website Builder Module](#website-builder-module)
   - [Admin Dashboard Module](#admin-dashboard-module)
   - [Memory & Learning Module](#memory--learning-module)
   - [Rate Limiting & Security Module](#rate-limiting--security-module)
6. [System Architecture](#system-architecture)
7. [Security Considerations](#security-considerations)
8. [Scalability Considerations](#scalability-considerations)
9. [Conclusion](#conclusion)

## Introduction

FTRAISE AI is a futuristic AI chat website that provides users with an immersive experience through AI-powered chat, image generation, digital twins, neural dreamscapes, and website building capabilities. This document outlines the system design, architecture, and modules that make up the FTRAISE AI platform.

## System Overview

FTRAISE AI is built using the following technologies:
- **Frontend**: EJS, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Integration**: Cohere AI API, Hugging Face API

The system is designed to be modular, secure, and scalable, with a focus on providing a seamless user experience. The platform includes features for both registered users and guests, with different rate limits and capabilities for each.

## UML Diagrams

### Use Case Diagram

```
+-------------------------------------------------------------+
|                      FTRAISE AI System                       |
+-------------------------------------------------------------+
                            ^
                            |
        +-------------------+-------------------+
        |                   |                   |
+---------------+  +----------------+  +----------------+
|    Guest      |  | Registered User |  |     Admin     |
+---------------+  +----------------+  +----------------+
| - View Home   |  | - Login        |  | - Manage Users |
| - Register    |  | - Chat with AI |  | - View Chats   |
| - Limited Chat|  | - Generate     |  | - Manage       |
|   with AI     |  |   Images       |  |   Memories     |
| - Limited     |  | - Create       |  | - View         |
|   Image       |  |   Digital Twin |  |   Password     |
|   Generation  |  | - Create Neural|  |   Resets       |
|               |  |   Dreamscape   |  | - Manage       |
|               |  | - Build Website|  |   Website      |
|               |  | - View Profile |  |   Templates    |
|               |  | - Update       |  | - Manage       |
|               |  |   Profile      |  |   Maintenance  |
|               |  | - Change       |  |   Mode         |
|               |  |   Password     |  | - View         |
|               |  | - Logout       |  |   Analytics    |
+---------------+  +----------------+  +----------------+
```

### Class Diagram

```
+-------------+       +-------------+       +-------------+
|    User     |       |    Chat     |       |   Memory    |
+-------------+       +-------------+       +-------------+
| id          |<----->| id          |       | id          |
| username    |       | userId      |<----->| userId      |
| email       |       | guestId     |       | guestId     |
| password    |       | title       |       | interactions|
| role        |       | messages    |       | learning    |
| profilePic  |       | createdAt   |       | progress    |
| chatRateLimit|      | updatedAt   |       | createdAt   |
| imageRateLimit|     +-------------+       | updatedAt   |
| digitalTwin |                             +-------------+
+-------------+
      ^
      |
      |
+-------------+       +-------------+       +-------------+
| DigitalTwin |       |    Image    |       |NeuralDreamscape|
+-------------+       +-------------+       +-------------+
| id          |       | id          |       | id          |
| userId      |<----->| userId      |       | userId      |
| name        |       | guestId     |       | title       |
| personality |       | type        |       | description |
| interests   |       | prompt      |       | isPublic    |
| expertise   |       | style       |       | canvasData  |
| trainingData|       | imagePath   |       | themes      |
| isPublic    |       | createdAt   |       | aiInsights  |
+-------------+       +-------------+       +-------------+
                                                  ^
                                                  |
                                                  v
+-------------+       +-------------+       +-------------+
|   Website   |       |WebsitePage  |       |NeuralConnection|
+-------------+       +-------------+       +-------------+
| id          |       | id          |       | id          |
| userId      |<----->| websiteId   |       | sourceDreamscapeId|
| packageId   |       | title       |       | targetDreamscapeId|
| templateId  |       | slug        |       | strength    |
| name        |       | content     |       | type        |
| domain      |       | isHomePage  |       | description |
| status      |       | order       |       | isAiSuggested|
| isPublished |       | createdAt   |       +-------------+
+-------------+       +-------------+
```

### Sequence Diagram

**AI Chat Interaction**

```
+--------+          +--------+          +--------+          +--------+
|  User  |          | Server |          |Cohere AI|          |Database|
+--------+          +--------+          +--------+          +--------+
    |                   |                   |                   |
    | Send Message      |                   |                   |
    |------------------>|                   |                   |
    |                   | Check Rate Limit  |                   |
    |                   |------------------>|                   |
    |                   |                   |                   |
    |                   | Enhance Prompt    |                   |
    |                   |-------------------|                   |
    |                   |                   |                   |
    |                   | Generate Response |                   |
    |                   |------------------>|                   |
    |                   |                   |                   |
    |                   | AI Response       |                   |
    |                   |<------------------|                   |
    |                   |                   |                   |
    |                   | Save Chat         |                   |
    |                   |---------------------------------->|   |
    |                   |                   |                   |
    |                   | Update Memory     |                   |
    |                   |---------------------------------->|   |
    |                   |                   |                   |
    | Return Response   |                   |                   |
    |<------------------|                   |                   |
    |                   |                   |                   |
```

## ER Diagram

```
+-------------+       +-------------+       +-------------+
|    User     |       |    Chat     |       |   Memory    |
+-------------+       +-------------+       +-------------+
| _id         |<----->| _id         |       | _id         |
| username    |       | userId      |<----->| userId      |
| email       |       | guestId     |       | guestId     |
| password    |       | title       |       | interactions|
| role        |       | messages    |       | learning    |
| profilePic  |       | createdAt   |       | progress    |
| chatRateLimit|      | updatedAt   |       | createdAt   |
| imageRateLimit|     +-------------+       | updatedAt   |
| digitalTwin |                             +-------------+
+-------------+
      ^
      |
      |
+-------------+       +-------------+       +-------------+
| DigitalTwin |       |    Image    |       |NeuralDreamscape|
+-------------+       +-------------+       +-------------+
| _id         |       | _id         |       | _id         |
| userId      |<----->| userId      |       | userId      |
| name        |       | guestId     |       | title       |
| personality |       | type        |       | description |
| interests   |       | prompt      |       | isPublic    |
| expertise   |       | style       |       | canvasData  |
| trainingData|       | imagePath   |       | themes      |
| isPublic    |       | createdAt   |       | aiInsights  |
+-------------+       +-------------+       +-------------+
                                                  ^
                                                  |
                                                  v
+-------------+       +-------------+       +-------------+
|   Website   |       |WebsitePage  |       |NeuralConnection|
+-------------+       +-------------+       +-------------+
| _id         |       | _id         |       | _id         |
| userId      |<----->| websiteId   |       | sourceDreamscapeId|
| packageId   |       | title       |       | targetDreamscapeId|
| templateId  |       | slug        |       | strength    |
| name        |       | content     |       | type        |
| domain      |       | isHomePage  |       | description |
| status      |       | order       |       | isAiSuggested|
| isPublished |       | createdAt   |       +-------------+
+-------------+       +-------------+

+-------------+       +-------------+       +-------------+
|   Package   |       |WebsiteTemplate|     |WebsiteElement|
+-------------+       +-------------+       +-------------+
| _id         |       | _id         |       | _id         |
| name        |<----->| name        |       | pageId      |
| price       |       | description |       | type        |
| isFree      |       | thumbnail   |       | content     |
| pagesAllowed|       | html        |       | style       |
| features    |       | css         |       | attributes  |
| templates   |       | js          |       | order       |
| description |       | isActive    |       | createdAt   |
+-------------+       +-------------+       +-------------+

+-------------+       +-------------+       +-------------+
|GuestUser    |       |PasswordReset|       |Payment      |
+-------------+       +-------------+       +-------------+
| _id         |       | _id         |       | _id         |
| ipAddress   |       | userId      |       | userId      |
| requestsCount|      | email       |       | websiteId   |
| lastRequestTime|    | otp         |       | packageId   |
| createdAt   |       | isUsed      |       | amount      |
+-------------+       | isBlocked   |       | status      |
                      | createdAt   |       | createdAt   |
                      +-------------+       +-------------+
```

## Module Descriptions

### User Management Module

**Purpose:**
The User Management Module handles all aspects of user accounts, including registration, profile management, and user data storage.

**Components:**
1. **User Registration**: Allows new users to create accounts with username, email, and password.
2. **Profile Management**: Enables users to update their profile information, including username, email, and profile picture.
3. **User Roles**: Manages different user roles (user, admin) and their respective permissions.
4. **Guest User Tracking**: Tracks guest users by IP address for rate limiting purposes.

**Interactions:**
- Interacts with the Authentication Module for login/logout functionality.
- Provides user data to the AI Chat Module for personalized interactions.
- Supplies user information to the Admin Dashboard for user management.

### Authentication & Authorization Module

**Purpose:**
This module handles user authentication, authorization, and security-related functionality.

**Components:**
1. **Login System**: Manages user login using Passport.js with local strategy.
2. **Session Management**: Handles user sessions using express-session and MongoDB session store.
3. **Password Management**: Includes password hashing, reset functionality, and OTP verification.
4. **Role-based Access Control**: Restricts access to certain features based on user roles.

**Interactions:**
- Works closely with the User Management Module for user data.
- Provides authentication status to all protected routes.
- Interacts with the Admin Dashboard for maintenance mode bypass.

### AI Chat Module

**Purpose:**
The AI Chat Module provides the core AI conversation functionality using Cohere AI.

**Components:**
1. **Chat Interface**: Provides a user-friendly interface for interacting with the AI.
2. **Prompt Enhancement**: Uses advanced prompt engineering to improve AI responses.
3. **Chat History**: Stores and manages user conversation history.
4. **Rate Limiting**: Enforces different rate limits for guests (5 total requests) and registered users (8 requests per 3 minutes).

**Interactions:**
- Integrates with Cohere AI API for generating responses.
- Stores chat data in the database through the Chat model.
- Updates the Memory Module with interaction data for learning.
- Subject to rate limiting from the Rate Limiting Module.

### Image Generation Module

**Purpose:**
This module enables AI-powered image generation from text prompts or reference images.

**Components:**
1. **Image Generation Interface**: Provides a user interface for generating images.
2. **Prompt Enhancement**: Improves image prompts for better results.
3. **Image Storage**: Manages the storage and retrieval of generated images.
4. **Style Selection**: Allows users to select different artistic styles for image generation.

**Interactions:**
- Integrates with Hugging Face API for image generation.
- Falls back to other image sources if primary generation fails.
- Subject to rate limiting from the Rate Limiting Module.
- Stores image data in the database through the Image model.

### Digital Twin Module

**Purpose:**
The Digital Twin Module allows users to create AI representations of themselves that others can interact with.

**Components:**
1. **Twin Creation**: Enables users to create and configure their digital twin.
2. **Personality Configuration**: Allows setting personality traits, interests, and expertise.
3. **Training Interface**: Provides a way to train the twin with custom responses.
4. **Twin Browsing**: Lets users browse and interact with other users' public twins.

**Interactions:**
- Uses Cohere AI for generating twin responses.
- Stores twin data in the database through the DigitalTwin model.
- Interacts with the User Management Module for user data.

### Neural Dreamscape Module

**Purpose:**
This module provides a collaborative mind visualization tool where users can create visual representations of thoughts and connect with others.

**Components:**
1. **Dreamscape Creation**: Allows users to create visual representations of thoughts.
2. **Canvas Interface**: Provides a canvas for creating dreamscapes.
3. **AI Insights**: Generates insights about dreamscapes using Cohere AI.
4. **Connection Suggestions**: Suggests connections between dreamscapes.

**Interactions:**
- Uses Cohere AI for generating insights and connection suggestions.
- Stores dreamscape data in the database through the NeuralDreamscape model.
- Manages connections through the NeuralConnection model.

### Website Builder Module

**Purpose:**
The Website Builder Module enables users to create websites through templates or custom designs.

**Components:**
1. **Template Selection**: Allows users to choose from pre-designed templates.
2. **Page Editor**: Provides tools for editing website pages.
3. **Element Management**: Manages different website elements (text, images, etc.).
4. **Domain Management**: Handles website domains and publishing.
5. **Package Management**: Manages different website packages with varying features.

**Interactions:**
- Stores website data in the database through the Website, WebsitePage, and WebsiteElement models.
- Interacts with the Payment Module for package purchases.
- Uses templates from the WebsiteTemplate model.

### Admin Dashboard Module

**Purpose:**
The Admin Dashboard Module provides administrative tools for managing the platform.

**Components:**
1. **User Management**: Allows admins to view, edit, and delete users.
2. **Chat Management**: Provides access to user chats for monitoring.
3. **Memory Management**: Enables viewing and managing AI memory data.
4. **Password Reset Management**: Tracks password reset requests.
5. **Maintenance Mode**: Allows enabling/disabling maintenance mode.
6. **Website Template Management**: Manages website templates.

**Interactions:**
- Accesses data from various models (User, Chat, Memory, etc.).
- Provides administrative functions that affect all modules.
- Restricted to users with admin role.

### Memory & Learning Module

**Purpose:**
This module manages the AI's memory and learning capabilities for personalized interactions.

**Components:**
1. **Interaction Storage**: Stores user-AI interactions.
2. **Language Detection**: Identifies languages used in conversations.
3. **Topic Tracking**: Tracks discussion topics for better context.
4. **Learning Progress**: Monitors the AI's learning progress for each user.

**Interactions:**
- Stores memory data in the database through the Memory model.
- Provides context to the AI Chat Module for better responses.
- Accessible through the Admin Dashboard for management.

### Rate Limiting & Security Module

**Purpose:**
This module handles rate limiting and security features to protect the platform.

**Components:**
1. **Chat Rate Limiting**: Enforces limits on chat requests (8 per 3 minutes for registered users, 5 total for guests).
2. **Image Generation Rate Limiting**: Limits image generation requests (1 per window for registered users).
3. **Request Tracking**: Tracks request counts and window times.
4. **Security Middleware**: Implements various security measures.

**Interactions:**
- Affects the AI Chat and Image Generation modules.
- Uses user data from the User Management Module.
- Tracks guest users through the GuestUser model.

## System Architecture

FTRAISE AI follows a Model-View-Controller (MVC) architecture:

1. **Models**: MongoDB schemas that define the data structure (User, Chat, Memory, etc.).
2. **Views**: EJS templates that render the user interface.
3. **Controllers**: Node.js/Express handlers that process requests and interact with models.

The system also employs middleware for cross-cutting concerns like authentication, rate limiting, and error handling.

### Key Components:

- **Express Server**: Handles HTTP requests and routing.
- **MongoDB Database**: Stores all application data.
- **Passport.js**: Manages authentication.
- **Cohere AI Integration**: Provides AI capabilities for chat and insights.
- **Hugging Face Integration**: Powers image generation.
- **Express Session**: Manages user sessions.

## Security Considerations

1. **Password Security**: Passwords are hashed using bcrypt before storage.
2. **API Key Protection**: All API keys are stored in environment variables, not in code.
3. **Rate Limiting**: Prevents abuse through strict rate limits.
4. **Session Security**: Sessions are secured with HTTP-only cookies.
5. **Input Validation**: All user inputs are validated before processing.
6. **Role-based Access**: Different features are restricted based on user roles.
7. **Error Handling**: Proper error handling prevents information leakage.

## Scalability Considerations

1. **Database Indexing**: Key fields are indexed for faster queries.
2. **Connection Pooling**: MongoDB connections are pooled for efficiency.
3. **Modular Design**: The system is designed with modularity for easier scaling.
4. **Stateless Architecture**: The server is largely stateless, allowing for horizontal scaling.
5. **Caching**: Session data is cached to reduce database load.
6. **Timeout Handling**: API requests have timeouts to prevent hanging connections.
7. **Fallback Mechanisms**: Multiple fallbacks for critical features like image generation.

## Conclusion

FTRAISE AI is a comprehensive platform that combines AI chat, image generation, digital twins, neural dreamscapes, and website building into a cohesive user experience. The modular design allows for easy maintenance and future expansion, while the security and scalability considerations ensure a robust and reliable system.

The platform leverages cutting-edge AI technologies through Cohere AI and Hugging Face integrations, providing users with powerful tools for creativity and communication. The different user roles and rate limiting ensure fair usage and protect the system from abuse.

This system design documentation provides a high-level overview of the platform's architecture, components, and interactions, serving as a reference for understanding and further developing the FTRAISE AI system.
