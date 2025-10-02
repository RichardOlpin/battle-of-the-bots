/**
 * AuraFlow AI & Integration Service
 * Express application setup and configuration
 */

const express = require('express');
const helmet = require('helmet');
const config = require('./utils/config');
const { errorHandler } = require('./middleware/error.middleware');

// Import route modules
const scheduleRoutes = require('./routes/schedule.routes');
const ritualRoutes = require('./routes/ritual.routes');
const sessionRoutes = require('./routes/session.routes');
const authRoutes = require('./routes/auth.routes');

/**
 * Validates environment variables before starting the server
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment() {
  try {
    config.validate();
    console.log('✓ Environment variables validated successfully');
  } catch (error) {
    console.error('✗ Configuration error:', error.message);
    console.error('\nPlease ensure all required environment variables are set in your .env file:');
    console.error('  - GOOGLE_CLIENT_ID');
    console.error('  - GOOGLE_CLIENT_SECRET');
    console.error('  - GOOGLE_REDIRECT_URI');
    console.error('  - SESSION_SECRET');
    console.error('  - ENCRYPTION_KEY');
    console.error('\nRefer to .env.example for the template.');
    process.exit(1);
  }
}

/**
 * Creates and configures the Express application
 * @returns {express.Application} Configured Express app
 */
function createApp() {
  const app = express();
  
  // Security middleware - helmet for HTTP security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS middleware - Allow Chrome extension to access the API
  app.use((req, res, next) => {
    // Allow requests from Chrome extensions
    const origin = req.headers.origin;
    if (origin && origin.startsWith('chrome-extension://')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Allow localhost for development
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging middleware (simple console logging for MVP)
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AuraFlow AI & Integration Service',
      version: '1.0.0',
      environment: config.nodeEnv
    });
  });
  
  // API route registration
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/ritual', ritualRoutes);
  app.use('/api/session', sessionRoutes);
  app.use('/api/auth', authRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'AuraFlow AI & Integration Service',
      version: '1.0.0',
      endpoints: {
        health: 'GET /api/health',
        scheduling: 'POST /api/schedule/suggest',
        ritual: 'POST /api/ritual/generate',
        session: 'POST /api/session/summary',
        auth: {
          google: 'GET /api/auth/google',
          callback: 'GET /api/auth/google/callback',
          status: 'GET /api/auth/status',
          logout: 'POST /api/auth/logout'
        }
      },
      documentation: 'See README.md for detailed API documentation'
    });
  });
  
  // 404 handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
      }
    });
  });
  
  // Error handling middleware (must be last)
  app.use(errorHandler);
  
  return app;
}

/**
 * Starts the Express server
 */
function startServer() {
  // Validate environment variables first
  validateEnvironment();
  
  // Create Express app
  const app = createApp();
  
  // Start listening
  const port = config.port;
  const server = app.listen(port, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AuraFlow AI & Integration Service');
    console.log('='.repeat(60));
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Server running on: http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    console.log('='.repeat(60) + '\n');
    console.log('Available endpoints:');
    console.log(`  POST   /api/schedule/suggest  - Smart scheduling suggestions`);
    console.log(`  POST   /api/ritual/generate   - Personalized ritual generation`);
    console.log(`  POST   /api/session/summary   - Session summary generation`);
    console.log(`  GET    /api/auth/google       - Initiate Google OAuth`);
    console.log(`  GET    /api/auth/status       - Check auth status`);
    console.log(`  POST   /api/auth/logout       - Logout`);
    console.log('\n' + '='.repeat(60) + '\n');
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('\n📡 SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('\n📡 SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
  });
  
  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
module.exports = { createApp, startServer, validateEnvironment };
