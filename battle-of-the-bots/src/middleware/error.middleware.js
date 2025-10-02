/**
 * Error Handling Middleware
 * Centralized error handler with categorization and consistent response format
 */

/**
 * Error categories for classification
 */
const ERROR_CATEGORIES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  SERVER: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND'
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Categorizes error based on type and properties
 * @param {Error} error - Error object
 * @returns {Object} Error category information
 */
function categorizeError(error) {
  // Validation errors
  if (error.code === 'VALIDATION_ERROR' || error.name === 'ValidationError') {
    return {
      statusCode: 400,
      code: ERROR_CATEGORIES.VALIDATION,
      message: error.message || 'Validation failed'
    };
  }
  
  // Authentication errors
  if (error.code === 'AUTHENTICATION_ERROR' || error.statusCode === 401) {
    return {
      statusCode: 401,
      code: ERROR_CATEGORIES.AUTHENTICATION,
      message: error.message || 'Authentication failed'
    };
  }
  
  // External API errors (axios errors, Google API errors, etc.)
  if (error.isAxiosError || error.code === 'EXTERNAL_API_ERROR') {
    return {
      statusCode: error.response?.status || 502,
      code: ERROR_CATEGORIES.EXTERNAL_API,
      message: 'External service error'
    };
  }
  
  // Not found errors
  if (error.statusCode === 404 || error.code === 'NOT_FOUND') {
    return {
      statusCode: 404,
      code: ERROR_CATEGORIES.NOT_FOUND,
      message: error.message || 'Resource not found'
    };
  }
  
  // Custom app errors
  if (error.isOperational) {
    return {
      statusCode: error.statusCode || 500,
      code: error.code || ERROR_CATEGORIES.SERVER,
      message: error.message
    };
  }
  
  // Default server error
  return {
    statusCode: 500,
    code: ERROR_CATEGORIES.SERVER,
    message: 'An unexpected error occurred'
  };
}

/**
 * Sanitizes error message to avoid exposing sensitive information
 * @param {string} message - Original error message
 * @param {boolean} isProduction - Whether running in production
 * @returns {string} Sanitized message
 */
function sanitizeErrorMessage(message, isProduction) {
  if (!isProduction) {
    return message;
  }
  
  // In production, avoid exposing internal details
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
    /api[_-]?key/i
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An error occurred while processing your request';
    }
  }
  
  return message;
}

/**
 * Logs error without exposing sensitive information
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
function logError(error, req) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    logData.stack = error.stack;
  }
  
  // Log to console (in production, this would go to a logging service)
  console.error('Error:', JSON.stringify(logData, null, 2));
}

/**
 * Centralized error handling middleware
 * Must be registered after all routes
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logError(err, req);
  
  // Categorize the error
  const { statusCode, code, message } = categorizeError(err);
  
  // Sanitize message for production
  const isProduction = process.env.NODE_ENV === 'production';
  const sanitizedMessage = sanitizeErrorMessage(message, isProduction);
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message: sanitizedMessage,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Utility function for retrying external API calls with exponential backoff
 * @param {Function} apiCall - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the API call
 */
async function retryWithExponentialBackoff(apiCall, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or authentication errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(totalDelay)}ms`);
      
      // Wait before retrying
      await sleep(totalDelay);
    }
  }
  
  throw lastError;
}

/**
 * Sleep utility for retry logic
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Async error wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  AppError,
  ERROR_CATEGORIES,
  retryWithExponentialBackoff,
  asyncHandler,
  // Export for testing
  categorizeError,
  sanitizeErrorMessage
};
