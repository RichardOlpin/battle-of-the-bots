/**
 * Google Calendar API integration
 * Handles OAuth 2.0 authentication and calendar operations
 */

const { google } = require('googleapis');
const config = require('../utils/config');
const tokenManager = require('../utils/token-manager');

/**
 * Creates OAuth2 client
 * @returns {OAuth2Client} Configured OAuth2 client
 */
function createOAuthClient() {
  const { clientId, clientSecret, redirectUri } = config.google;
  
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Generates authorization URL for OAuth flow
 * @returns {string} Authorization URL for user consent
 */
function getAuthorizationUrl() {
  const oauth2Client = createOAuthClient();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: config.google.scopes,
    prompt: 'consent'
  });
}

/**
 * Exchanges authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Token object with access_token and refresh_token
 */
async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuthClient();
  
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Refreshes expired access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token object
 */
async function refreshAccessToken(refreshToken) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * Fetches calendar events for a user within date range
 * @param {string} userId - User identifier
 * @param {string} startDate - Start date (ISO 8601)
 * @param {string} endDate - End date (ISO 8601)
 * @returns {Promise<Array<Object>>} Array of calendar events
 */
async function fetchCalendarEvents(userId, startDate, endDate) {
  // Get user tokens
  let tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    throw new Error('No tokens found for user. Please authenticate first.');
  }
  
  // Check if token is expired and refresh if needed
  if (tokenManager.isTokenExpired(userId)) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      tokenManager.updateAccessToken(
        userId, 
        newTokens.access_token, 
        newTokens.expires_in || 3600
      );
      tokens = tokenManager.getTokens(userId);
    } catch (error) {
      throw new Error('Failed to refresh access token. Please re-authenticate.');
    }
  }
  
  // Create OAuth client with tokens
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });
  
  // Create calendar API client
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: config.defaults.maxEventsPerDay
    });
    
    // Normalize event data to internal format
    const events = response.data.items.map(event => ({
      id: event.id,
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      location: event.location || ''
    }));
    
    return events;
  } catch (error) {
    if (error.code === 401) {
      throw new Error('Authentication failed. Please re-authenticate.');
    }
    throw new Error(`Failed to fetch calendar events: ${error.message}`);
  }
}

/**
 * Creates a calendar event
 * @param {string} userId - User identifier
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
async function createCalendarEvent(userId, eventData) {
  // Get user tokens
  let tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    throw new Error('No tokens found for user. Please authenticate first.');
  }
  
  // Check if token is expired and refresh if needed
  if (tokenManager.isTokenExpired(userId)) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken);
      tokenManager.updateAccessToken(
        userId, 
        newTokens.access_token, 
        newTokens.expires_in || 3600
      );
      tokens = tokenManager.getTokens(userId);
    } catch (error) {
      throw new Error('Failed to refresh access token. Please re-authenticate.');
    }
  }
  
  // Create OAuth client with tokens
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });
  
  // Create calendar API client
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  try {
    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC'
      },
      location: eventData.location || ''
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    return {
      id: response.data.id,
      startTime: response.data.start.dateTime,
      endTime: response.data.end.dateTime,
      title: response.data.summary,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    if (error.code === 401) {
      throw new Error('Authentication failed. Please re-authenticate.');
    }
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

module.exports = {
  createOAuthClient,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchCalendarEvents,
  createCalendarEvent
};
