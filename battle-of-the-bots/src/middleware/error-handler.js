/**
 * Error handling middleware
 * Centralized error handling for the application
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Determines if an error is retryable (for external API calls)
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error) {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }
  
  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }
  
  return false;
}

/**
 * Retry logic for external API calls with exponential backoff
 * @param {Function} apiCall - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of successful API call
 */
async function retryWithBackoff(apiCall, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const shouldRetry = isRetryableError(error);
      
      if (isLastAttempt || !shouldRetry) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Categorizes errors for better handling
 * @param {Error} error - Error object
 * @returns {Object} Categorized error info
 */
function categorizeError(error) {
  // Validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      category: 'validation'
    };
  }
  
  // Authentication errors
  if (error.code === 401 || error.message.includes('authentication') || error.message.includes('token')) {
    return {
      statusCode: 401,
      code: 'AUTHENTICATION_ERROR',
      category: 'authentication'
    };
  }
  
  // Authorization errors
  if (error.code === 403 || error.message.includes('permission') || error.message.includes('forbidden')) {
    return {
      statusCode: 403,
      code: 'AUTHORIZATION_ERROR',
      category: 'authorization'
    };
  }
  
  // Not found errors
  if (error.code === 404 || error.message.includes('not found')) {
    return {
      statusCode: 404,
      code: 'NOT_FOUND',
      category: 'not_found'
    };
  }
  
  // External API errors
  if (error.response || error.message.includes('API') || error.message.includes('fetch')) {
    return {
      statusCode: 502,
      code: 'EXTERNAL_API_ERROR',
      category: 'external_api'
    };
  }
  
  // Configuration errors
  if (error.name === 'ConfigError') {
    return {
      statusCode: 500,
      code: 'CONFIGURATION_ERROR',
      category: 'configuration'
    };
  }
  
  // Default server error
  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    category: 'server'
  };
}

/**
 * Sanitizes error for client response (removes sensitive info)
 * @param {Error} error - Error object
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {Object} Sanitized error object
 */
function sanitizeError(error, isDevelopment = false) {
  const category = categorizeError(error);
  
  const sanitized = {
    code: error.code || category.code,
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };
  
  // Include stack trace only in development
  if (isDevelopment && error.stack) {
    sanitized.stack = error.stack;
  }
  
  // Include additional details if available and safe
  if (error.details && typeof error.details === 'object') {
    sanitized.details = error.details;
  }
  
  return sanitized;
}

/**
 * Main error handling middleware
 * Should be registered last in middleware chain
 */
function errorHandler(err, req, res, next) {
  // Log error (in production, use proper logging service)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  console.error('Error occurred:', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
  
  // Categorize and sanitize error
  const category = categorizeError(err);
  const statusCode = err.statusCode || category.statusCode;
  const sanitized = sanitizeError(err, isDevelopment);
  
  // Send error response
  res.status(statusCode).json({
    error: sanitized
  });
}

/**
 * 404 Not Found handler
 * Handles requests to undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  isRetryableError,
  retryWithBackoff,
  categorizeError,
  sanitizeError
};
