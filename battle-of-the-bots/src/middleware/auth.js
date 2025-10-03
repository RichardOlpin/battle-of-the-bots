/**
 * Authentication middleware
 * Handles user authentication and authorization
 */

const tokenManager = require('../utils/token-manager');

/**
 * Middleware to verify user has valid authentication tokens
 * Expects userId in request headers or query params
 */
function requireAuth(req, res, next) {
  // Get userId from header or query parameter
  const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
  
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID is required for authentication',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Check if user has tokens
  const tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    return res.status(401).json({
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'User is not authenticated. Please complete OAuth flow.',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Attach userId to request for downstream use
  req.userId = userId;
  req.userTokens = tokens;
  
  next();
}

/**
 * Optional authentication middleware
 * Attaches user info if available but doesn't require it
 */
function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.query.userId || req.body.userId;
  
  if (userId) {
    const tokens = tokenManager.getTokens(userId);
    if (tokens) {
      req.userId = userId;
      req.userTokens = tokens;
    }
  }
  
  next();
}

/**
 * Middleware to check if user has valid (non-expired) tokens
 */
function requireValidTokens(req, res, next) {
  const userId = req.userId || req.headers['x-user-id'] || req.query.userId;
  
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Check if tokens exist and are not expired
  if (tokenManager.isTokenExpired(userId)) {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Token refresh will be attempted automatically.',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  req.userId = userId;
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireValidTokens
};
