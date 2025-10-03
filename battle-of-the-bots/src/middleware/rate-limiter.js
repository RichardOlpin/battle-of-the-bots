/**
 * Rate limiting middleware
 * Prevents abuse by limiting request rates per IP/user
 */

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Cleans up old entries from the request counts map
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldEntries, 60000);

/**
 * Creates a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Function to generate rate limit key
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create request count for this key
    let requestData = requestCounts.get(key);
    
    if (!requestData || now > requestData.resetTime) {
      // Create new window
      requestData = {
        count: 0,
        resetTime: now + windowMs
      };
      requestCounts.set(key, requestData);
    }
    
    // Increment request count
    requestData.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
    
    // Check if limit exceeded
    if (requestData.count > maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: new Date(requestData.resetTime).toISOString(),
          timestamp: new Date().toISOString()
        }
      });
    }
    
    next();
  };
}

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes per IP
 */
const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  message: 'Too many requests from this IP, please try again later'
});

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP
 */
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again later'
});

/**
 * Lenient rate limiter for read-only endpoints
 * 200 requests per 15 minutes per IP
 */
const readOnlyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 200,
  message: 'Too many requests, please try again later'
});

/**
 * Per-user rate limiter
 * Uses userId instead of IP address
 */
const perUserRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 50,
  message: 'Too many requests for this user, please try again later',
  keyGenerator: (req) => {
    return req.userId || req.headers['x-user-id'] || req.query.userId || req.ip;
  }
});

/**
 * Clears rate limit data for a specific key (for testing)
 * @param {string} key - Rate limit key to clear
 */
function clearRateLimit(key) {
  requestCounts.delete(key);
}

/**
 * Clears all rate limit data (for testing)
 */
function clearAllRateLimits() {
  requestCounts.clear();
}

/**
 * Gets current rate limit status for a key
 * @param {string} key - Rate limit key
 * @returns {Object|null} Rate limit status or null if not found
 */
function getRateLimitStatus(key) {
  const data = requestCounts.get(key);
  if (!data) return null;
  
  return {
    count: data.count,
    resetTime: new Date(data.resetTime).toISOString(),
    isExpired: Date.now() > data.resetTime
  };
}

module.exports = {
  createRateLimiter,
  standardRateLimiter,
  authRateLimiter,
  readOnlyRateLimiter,
  perUserRateLimiter,
  clearRateLimit,
  clearAllRateLimits,
  getRateLimitStatus
};
