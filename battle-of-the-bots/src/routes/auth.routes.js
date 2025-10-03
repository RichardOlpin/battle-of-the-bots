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
    
    // Generate or get userId from session
    if (!req.session.userId) {
      req.session.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    const userId = req.session.userId;
    
    // Mark session as authenticated
    req.session.authenticated = true;
    req.session.authTime = Date.now();
    
    // Store tokens securely
    tokenManager.storeTokens(userId, tokens);
    
    // Return tokens to the webapp
    // For webapp, redirect back with success
    const webappUrl = process.env.WEBAPP_URL || 'http://localhost:5000';
    
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Authentication Successful!</h1>
            <p>Your Google Calendar has been connected.</p>
            <div class="spinner"></div>
            <p>Redirecting you back to AuraFlow...</p>
          </div>
          <script>
            // Notify parent window if opened in popup
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'AUTH_SUCCESS',
                timestamp: Date.now()
              }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              // Redirect back to webapp with success flag
              // Session cookie is automatically included
              setTimeout(() => {
                window.location.href = '${webappUrl}?auth_success=true';
              }, 2000);
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
  // Check if session exists and is authenticated
  if (!req.session || !req.session.authenticated || !req.session.userId) {
    return res.json({
      authenticated: false,
      message: 'No authentication found'
    });
  }
  
  const userId = req.session.userId;
  const tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    return res.json({
      authenticated: false,
      message: 'No tokens found'
    });
  }
  
  const isExpired = tokenManager.isTokenExpired(userId);
  
  res.json({
    authenticated: true,
    userId: userId,
    tokenExpired: isExpired,
    message: isExpired ? 'Token expired, will refresh on next API call' : 'Authenticated'
  });
});

/**
 * POST /api/auth/logout
 * Clears user tokens and destroys session
 */
router.post('/logout', (req, res) => {
  const userId = req.session?.userId;
  
  if (userId) {
    tokenManager.clearTokens(userId);
  }
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
    
    // Clear cookie
    res.clearCookie('connect.sid');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

module.exports = router;
