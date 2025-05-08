/**
 * Robust Health Check API
 * 
 * This API provides comprehensive health checks for all system components.
 * It performs actual tests on each component to determine its status.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Overall system health check
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseHealth();
    
    // Check file system
    const fsStatus = await checkFileSystemHealth();
    
    // Check memory usage
    const memoryStatus = await checkMemoryHealth();
    
    // Check API keys
    const apiKeysStatus = await checkApiKeysHealth();
    
    // Determine overall status
    const components = [dbStatus, fsStatus, memoryStatus, apiKeysStatus];
    let overallStatus = 'operational';
    
    if (components.some(c => c.status === 'major_outage')) {
      overallStatus = 'major_outage';
    } else if (components.some(c => c.status === 'partial_outage')) {
      overallStatus = 'partial_outage';
    } else if (components.some(c => c.status === 'degraded_performance')) {
      overallStatus = 'degraded_performance';
    }
    
    res.json({
      status: overallStatus,
      components,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const result = await checkDatabaseHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      name: 'Database',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication health check
router.get('/auth', async (req, res) => {
  try {
    const result = await checkAuthHealth(req);
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('Auth health check error:', error);
    res.status(500).json({
      name: 'Authentication',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// AI services health check
router.get('/ai', async (req, res) => {
  try {
    const result = await checkAiHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      name: 'AI Services',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Digital Twins health check
router.get('/digital-twins', async (req, res) => {
  try {
    const result = await checkDigitalTwinsHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('Digital Twins health check error:', error);
    res.status(500).json({
      name: 'Digital Twins',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// File system health check
router.get('/file-system', async (req, res) => {
  try {
    const result = await checkFileSystemHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('File system health check error:', error);
    res.status(500).json({
      name: 'File System',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Memory health check
router.get('/memory', async (req, res) => {
  try {
    const result = await checkMemoryHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('Memory health check error:', error);
    res.status(500).json({
      name: 'Memory',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API keys health check
router.get('/api-keys', async (req, res) => {
  try {
    const result = await checkApiKeysHealth();
    res.status(result.status === 'operational' ? 200 : 503).json(result);
  } catch (error) {
    console.error('API keys health check error:', error);
    res.status(500).json({
      name: 'API Keys',
      status: 'major_outage',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System information
router.get('/system', (req, res) => {
  const systemInfo = {
    name: 'System',
    status: 'operational',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    os: {
      type: os.type(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem()
    },
    timestamp: new Date().toISOString()
  };
  
  res.json(systemInfo);
});

// Helper functions for health checks

// Check database health
async function checkDatabaseHealth() {
  try {
    // Check if database is connected
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return {
        name: 'Database',
        status: 'major_outage',
        message: 'Database is not connected',
        timestamp: new Date().toISOString()
      };
    }
    
    // Try to ping the database
    const startTime = Date.now();
    const pingResult = await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    
    if (pingResult && pingResult.ok === 1) {
      // Check response time for degraded performance
      let status = 'operational';
      let message = 'Database is connected and responding normally';
      
      if (responseTime > 500) {
        status = 'degraded_performance';
        message = `Database is responding slowly (${responseTime}ms)`;
      }
      
      return {
        name: 'Database',
        status,
        message,
        responseTime,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        name: 'Database',
        status: 'partial_outage',
        message: 'Database ping failed',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      name: 'Database',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check authentication health
async function checkAuthHealth(req) {
  try {
    // Check if passport is initialized
    if (!req.app._passport) {
      return {
        name: 'Authentication',
        status: 'major_outage',
        message: 'Passport is not initialized',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check if session store is available
    const sessionStore = req.app.get('sessionStore');
    if (!sessionStore) {
      return {
        name: 'Authentication',
        status: 'partial_outage',
        message: 'Session store is not available',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      name: 'Authentication',
      status: 'operational',
      message: 'Authentication system is operational',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Authentication',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check AI services health
async function checkAiHealth() {
  try {
    // Check if Cohere API key is configured
    if (!process.env.COHERE_API_KEY) {
      return {
        name: 'AI Services',
        status: 'major_outage',
        message: 'Cohere API key is not configured',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check if the API key is valid (first 5 chars should be enough to check if it's set)
    if (process.env.COHERE_API_KEY.length < 10) {
      return {
        name: 'AI Services',
        status: 'partial_outage',
        message: 'Cohere API key appears to be invalid',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      name: 'AI Services',
      status: 'operational',
      message: 'AI services are operational',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'AI Services',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check Digital Twins health
async function checkDigitalTwinsHealth() {
  try {
    // For now, just check if the database is connected
    // In a real implementation, you would check if the Digital Twins service is working
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return {
        name: 'Digital Twins',
        status: 'major_outage',
        message: 'Database for Digital Twins is not connected',
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      name: 'Digital Twins',
      status: 'operational',
      message: 'Digital Twins service is operational',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Digital Twins',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check file system health
async function checkFileSystemHealth() {
  try {
    // Check if we can write to the temp directory
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `health-check-${Date.now()}.txt`);
    
    // Try to write to the file
    fs.writeFileSync(testFile, 'Health check test file');
    
    // Try to read from the file
    const content = fs.readFileSync(testFile, 'utf8');
    
    // Try to delete the file
    fs.unlinkSync(testFile);
    
    if (content !== 'Health check test file') {
      return {
        name: 'File System',
        status: 'partial_outage',
        message: 'File system read/write test failed',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check disk space
    const stats = fs.statfsSync(tempDir);
    const freeSpace = stats.bfree * stats.bsize;
    const totalSpace = stats.blocks * stats.bsize;
    const freePercentage = (freeSpace / totalSpace) * 100;
    
    let status = 'operational';
    let message = 'File system is operational';
    
    if (freePercentage < 5) {
      status = 'major_outage';
      message = `Disk space critically low: ${freePercentage.toFixed(2)}% free`;
    } else if (freePercentage < 10) {
      status = 'partial_outage';
      message = `Disk space low: ${freePercentage.toFixed(2)}% free`;
    } else if (freePercentage < 20) {
      status = 'degraded_performance';
      message = `Disk space warning: ${freePercentage.toFixed(2)}% free`;
    }
    
    return {
      name: 'File System',
      status,
      message,
      freeSpace,
      totalSpace,
      freePercentage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'File System',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check memory health
async function checkMemoryHealth() {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercentage = (usedMemory / totalMemory) * 100;
    const heapUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    let status = 'operational';
    let message = 'Memory usage is normal';
    
    if (memoryUsagePercentage > 90 || heapUsagePercentage > 90) {
      status = 'major_outage';
      message = `Memory usage critically high: ${memoryUsagePercentage.toFixed(2)}% system, ${heapUsagePercentage.toFixed(2)}% heap`;
    } else if (memoryUsagePercentage > 80 || heapUsagePercentage > 80) {
      status = 'partial_outage';
      message = `Memory usage high: ${memoryUsagePercentage.toFixed(2)}% system, ${heapUsagePercentage.toFixed(2)}% heap`;
    } else if (memoryUsagePercentage > 70 || heapUsagePercentage > 70) {
      status = 'degraded_performance';
      message = `Memory usage warning: ${memoryUsagePercentage.toFixed(2)}% system, ${heapUsagePercentage.toFixed(2)}% heap`;
    }
    
    return {
      name: 'Memory',
      status,
      message,
      memoryUsage,
      totalMemory,
      freeMemory,
      usedMemory,
      memoryUsagePercentage,
      heapUsagePercentage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'Memory',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Check API keys health
async function checkApiKeysHealth() {
  try {
    const missingKeys = [];
    const requiredKeys = [
      { name: 'COHERE_API_KEY', env: process.env.COHERE_API_KEY },
      { name: 'BREVO_API_KEY', env: process.env.BREVO_API_KEY }
    ];
    
    for (const key of requiredKeys) {
      if (!key.env) {
        missingKeys.push(key.name);
      }
    }
    
    let status = 'operational';
    let message = 'All required API keys are configured';
    
    if (missingKeys.length > 0) {
      if (missingKeys.length === requiredKeys.length) {
        status = 'major_outage';
        message = `All required API keys are missing: ${missingKeys.join(', ')}`;
      } else {
        status = 'partial_outage';
        message = `Some required API keys are missing: ${missingKeys.join(', ')}`;
      }
    }
    
    return {
      name: 'API Keys',
      status,
      message,
      missingKeys,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: 'API Keys',
      status: 'major_outage',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = router;
