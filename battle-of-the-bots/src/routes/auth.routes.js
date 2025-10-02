/**
 * Authentication routes for OAuth 2.0 flow
 */

const express = require('express');
const router = express.Router();
const googleCalendar = require('../integrations/google-calendar');
const tokenManager = require('../utils/token-manager');

/**
 * GET /api/auth/google
 * Initiates OAuth 2.0 flow by redirecting to Google consent screen
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'AUTH_INIT_FAILED',
        message: 'Failed to initiate authentication',
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
    return res.status(400).send(`
      <html>
        <body>
          <h1>Authentication Failed</h1>
          <p>Error: ${error}</p>
          <p><a href="/">Return to home</a></p>
        </body>
      </html>
    `);
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
    
    // Generate userId (in production, this would come from session/JWT)
    // For MVP, we'll use a simple identifier
    const userId = req.session?.userId || 'default_user';
    
    // Store tokens securely
    tokenManager.storeTokens(userId, tokens);
    
    // Success response
    res.send(`
      <html>
        <body>
          <h1>Authentication Successful!</h1>
          <p>Your Google Calendar has been connected successfully.</p>
          <p>You can now close this window and return to the application.</p>
          <script>
            // Notify parent window if opened in popup
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Authentication Error</h1>
          <p>Failed to complete authentication: ${error.message}</p>
          <p><a href="/api/auth/google">Try again</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/status
 * Checks authentication status for current user
 */
router.get('/status', (req, res) => {
  const userId = req.session?.userId || 'default_user';
  const tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    return res.json({
      authenticated: false,
      message: 'No authentication found'
    });
  }
  
  const isExpired = tokenManager.isTokenExpired(userId);
  
  res.json({
    authenticated: true,
    tokenExpired: isExpired,
    message: isExpired ? 'Token expired, will refresh on next API call' : 'Authenticated'
  });
});

/**
 * POST /api/auth/logout
 * Clears user tokens
 */
router.post('/logout', (req, res) => {
  const userId = req.session?.userId || 'default_user';
  tokenManager.clearTokens(userId);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
