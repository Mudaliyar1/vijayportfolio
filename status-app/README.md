# FTRAISE AI Status Page

An independent status page application for FTRAISE AI that works even when the main application is down.

## Features

- Real-time monitoring of key endpoints
- Automatic detection and classification of outages
- Live status updates via Socket.IO
- Uptime analytics and visualization
- Email notifications for status changes
- Mobile-friendly responsive design

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (same database as the main application)

### Setup

1. Clone the repository
2. Navigate to the status-app directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example` and update the values:

```bash
cp .env.example .env
```

5. Update the MongoDB URI and other configuration values in the `.env` file

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

### Docker Deployment

Build the Docker image:

```bash
docker build -t ftraise-status-app .
```

Run the container:

```bash
docker run -p 3001:3001 --env-file .env ftraise-status-app
```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Select the `status-app` directory as the root directory
4. Set the build command: `npm install`
5. Set the start command: `node server.js`
6. Add environment variables from your `.env` file
7. Deploy the service

## Configuration

The status page can be configured through environment variables:

- `MONGODB_URI`: MongoDB connection string (same as main app)
- `STATUS_PORT`: Port for the status app (default: 3001)
- `MAIN_APP_URL`: URL of the main application to monitor
- `MONITOR_INTERVAL`: Interval in milliseconds between monitoring checks (default: 60000)
- `EMAIL_*`: Email configuration for notifications
- `SOCKET_CORS_ORIGIN`: CORS origin for Socket.IO (default: *)

## Monitoring Configuration

The endpoints to monitor are defined in `monitors/endpoint-monitor.js`. You can customize the endpoints, expected status codes, and other monitoring parameters in this file.

## License

ISC
