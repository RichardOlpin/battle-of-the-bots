/**
 * Logging middleware
 * Provides request/response logging and application logging utilities
 */

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Determines if logging should be enabled based on environment
 */
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Formats log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
  
  return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
}

/**
 * Logger utility object
 */
const logger = {
  /**
   * Logs error messages
   */
  error: (message, metadata = {}) => {
    console.error(formatLogMessage(LOG_LEVELS.ERROR, message, metadata));
  },
  
  /**
   * Logs warning messages
   */
  warn: (message, metadata = {}) => {
    console.warn(formatLogMessage(LOG_LEVELS.WARN, message, metadata));
  },
  
  /**
   * Logs info messages
   */
  info: (message, metadata = {}) => {
    console.log(formatLogMessage(LOG_LEVELS.INFO, message, metadata));
  },
  
  /**
   * Logs debug messages (only in development)
   */
  debug: (message, metadata = {}) => {
    if (isDevelopment) {
      console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, metadata));
    }
  }
};

/**
 * Sanitizes sensitive data from objects
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'access_token',
    'refresh_token',
    'apiKey',
    'api_key',
    'secret',
    'authorization'
  ];
  
  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Request logging middleware
 * Logs incoming requests with method, path, and timing
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: sanitizeSensitiveData(req.query),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    return res.send(data);
  };
  
  next();
}

/**
 * Error logging middleware
 * Logs errors with full context
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    method: req.method,
    path: req.path,
    stack: isDevelopment ? err.stack : undefined
  });
  
  next(err);
}

/**
 * Performance logging middleware
 * Logs slow requests (> 1000ms)
 */
function performanceLogger(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
}

/**
 * Access log middleware (simplified Apache-style logging)
 */
function accessLogger(req, res, next) {
  res.on('finish', () => {
    const logLine = `${req.ip || '-'} - [${new Date().toISOString()}] "${req.method} ${req.path} HTTP/${req.httpVersion}" ${res.statusCode} ${res.get('content-length') || '-'}`;
    console.log(logLine);
  });
  
  next();
}

/**
 * Creates a combined logging middleware
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware
 */
function createLogger(options = {}) {
  const {
    logRequests = true,
    logPerformance = true,
    logAccess = false
  } = options;
  
  return (req, res, next) => {
    if (logAccess) {
      accessLogger(req, res, () => {});
    }
    
    if (logPerformance) {
      performanceLogger(req, res, () => {});
    }
    
    if (logRequests) {
      requestLogger(req, res, next);
    } else {
      next();
    }
  };
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger,
  accessLogger,
  createLogger,
  sanitizeSensitiveData,
  LOG_LEVELS
};
