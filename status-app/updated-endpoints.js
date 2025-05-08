// Define endpoints to monitor
const endpoints = [
  { name: 'Website Frontend', endpoint: '/', expectedStatus: 200 },
  { name: 'General Health', endpoint: '/health', expectedStatus: 200 },
  { name: 'Database Health', endpoint: '/health/details', expectedStatus: 200 },
  { name: 'Session Health', endpoint: '/health/session', expectedStatus: 200 },
  { name: 'AI Service', endpoint: '/api/ai/health', expectedStatus: 200 },
  { name: 'Admin Service', endpoint: '/admin-status', expectedStatus: 200 }
];

// Once you've implemented the health check endpoints in your main application,
// replace the endpoints array in status-app/monitors/endpoint-monitor.js with this one.
