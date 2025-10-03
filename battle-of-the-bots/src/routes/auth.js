/**
 * Authentication routes
 * Handles OAuth flow and user authentication
 */

const express = require('express');
const router = express.Router();
const googleCalendar = require('../integrations/google-calendar');
const tokenManager = require('../utils/token-manager');

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthorizationUrl();
    
    res.json({
      authUrl,
      message: 'Redirect user to this URL to begin OAuth flow'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'AUTH_INIT_FAILED',
        message: 'Failed to initiate OAuth flow',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google
 */
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    return res.status(400).json({
      error: {
        code: 'OAUTH_ERROR',
        message: `OAuth authentication failed: ${error}`,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Validate authorization code
  if (!code) {
    return res.status(400).json({
      error: {
        code: 'MISSING_AUTH_CODE',
        message: 'Authorization code is required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  try {
    // Exchange code for tokens
    const tokens = await googleCalendar.exchangeCodeForTokens(code);
    
    // Generate a simple userId (in production, this would come from your user system)
    const userId = req.query.state || `user_${Date.now()}`;
    
    // Store tokens
    await tokenManager.storeTokens(userId, tokens, tokens.expiry_date ? 
      Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600);
    
    // Return success response
    res.json({
      success: true,
      userId,
      message: 'Authentication successful',
      expiresIn: tokens.expires_in || 3600
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'TOKEN_EXCHANGE_FAILED',
        message: 'Failed to exchange authorization code for tokens',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logs out user by removing their tokens
 */
router.post('/logout', (req, res) => {
  const userId = req.body.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  const removed = tokenManager.removeTokens(userId);
  
  if (removed) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } else {
    res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'No active session found for user',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /api/auth/status
 * Checks authentication status for a user
 */
router.get('/status', (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_USER_ID',
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  const tokens = tokenManager.getTokens(userId);
  const isExpired = tokenManager.isTokenExpired(userId);
  
  res.json({
    authenticated: !!tokens,
    tokenExpired: isExpired,
    userId
  });
});

module.exports = router;
