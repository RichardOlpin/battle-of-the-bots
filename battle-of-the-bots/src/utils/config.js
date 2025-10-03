/**
 * Configuration loader and validator
 * Loads environment variables and validates required configuration
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Validates that required environment variables are present
 * @throws {ConfigError} If required variables are missing
 */
function validateConfig() {
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Configuration object with all application settings
 */
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  },
  
  // Security configuration
  security: {
    sessionSecret: process.env.SESSION_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY
  },
  
  // Application defaults
  defaults: {
    minimumFocusDuration: 75, // minutes
    bufferTime: 15, // minutes
    maxEventsPerDay: 50
  },
  
  // Validate configuration on load
  validate() {
    validateConfig();
  }
};

module.exports = config;
