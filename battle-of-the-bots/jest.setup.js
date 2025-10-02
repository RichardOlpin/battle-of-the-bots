/**
 * Jest setup file - runs before all tests
 * Sets up test environment variables
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
