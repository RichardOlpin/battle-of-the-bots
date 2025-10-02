// AuraFlow Chrome Extension - Service Worker (Background Script)
// Handles OAuth authentication, Google Calendar API calls, and token management

// Chrome extension service worker for Manifest V3
console.log('AuraFlow service worker loaded');

// ============================================================================
// AFFIRMATIONS & MINDFULNESS BREAKS
// ============================================================================

// Collection of compassionate affirmation messages for break notifications
const AFFIRMATIONS = [
  "A moment of rest is a moment of growth.",
  "You are doing great. Take a deep breath.",
  "Stay hydrated and stretch for a moment.",
  "Your focus is a gift to yourself.",
  "Progress, not perfection. You're on the right path.",
  "This break is part of your productivity.",
  "Mindful rest fuels mindful work.",
  "You've earned this pause. Enjoy it.",
  "Small breaks lead to big breakthroughs.",
  "Be kind to yourself. You're doing enough.",
  "Breathe in calm, breathe out tension.",
  "Your well-being matters more than any task."
];

/**
 * Selects a random affirmation from the collection
 * @returns {string} Random affirmation message
 */
function getRandomAffirmation() {
  const index = Math.floor(Math.random() * AFFIRMATIONS.length);
  return AFFIRMATIONS[index];
}

// ============================================================================
// SESSION STATE MANAGEMENT
// ============================================================================

/**
 * Manages current focus session state
 */
const SessionState = {
  /**
   * Stores current session state for alarm handling
   * @param {Object} sessionData - Session information
   */
  async saveSession(sessionData) {
    try {
      await chrome.storage.local.set({
        'auraflow_active_session': {
          workDuration: sessionData.workDuration,
          breakDuration: sessionData.breakDuration,
          startTime: Date.now(),
          taskGoal: sessionData.taskGoal || 'Focus session'
        }
      });
      console.log('Session state saved:', sessionData);
      return true;
    } catch (error) {
      console.error('Failed to save session state:', error);
      throw new Error('Failed to save session state');
    }
  },
  
  /**
   * Retrieves current session state
   * @returns {Object|null} Session data or null if no active session
   */
  async getSession() {
    try {
      const result = await chrome.storage.local.get(['auraflow_active_session']);
      return result.auraflow_active_session || null;
    } catch (error) {
      console.error('Failed to retrieve session state:', error);
      return null;
    }
  },
  
  /**
   * Clears current session state
   */
  async clearSession() {
    try {
      await chrome.storage.local.remove(['auraflow_active_session']);
      console.log('Session state cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear session state:', error);
      throw new Error('Failed to clear session state');
    }
  }
};

// ============================================================================
// ALARM MANAGEMENT
// ============================================================================

/**
 * Manages chrome.alarms for focus session timing
 */
const AlarmManager = {
  WORK_END_ALARM: 'AURAFLOW_WORK_END',
  BREAK_END_ALARM: 'AURAFLOW_BREAK_END',
  
  /**
   * Clears all existing AuraFlow alarms
   */
  async clearAllAlarms() {
    try {
      await chrome.alarms.clear(this.WORK_END_ALARM);
      await chrome.alarms.clear(this.BREAK_END_ALARM);
      console.log('All AuraFlow alarms cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear alarms:', error);
      throw new Error('Failed to clear alarms');
    }
  },
  
  /**
   * Creates alarms for a focus session
   * @param {number} workDuration - Work duration in minutes
   * @param {number} breakDuration - Break duration in minutes
   */
  async createSessionAlarms(workDuration, breakDuration) {
    try {
      // Clear any existing alarms first
      await this.clearAllAlarms();
      
      // Create work end alarm
      await chrome.alarms.create(this.WORK_END_ALARM, {
        delayInMinutes: workDuration
      });
      
      // Create break end alarm
      await chrome.alarms.create(this.BREAK_END_ALARM, {
        delayInMinutes: workDuration + breakDuration
      });
      
      console.log(`Alarms created: work ends in ${workDuration}min, break ends in ${workDuration + breakDuration}min`);
      return true;
    } catch (error) {
      console.error('Failed to create alarms:', error);
      throw new Error('Failed to create session alarms');
    }
  }
};

// Storage utilities for token management
const StorageUtils = {
    // Store authentication tokens securely
    async storeTokens(tokens) {
        try {
            await chrome.storage.local.set({
                'auraflow_tokens': {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: tokens.expires_at || (Date.now() + (tokens.expires_in * 1000)),
                    token_type: tokens.token_type || 'Bearer'
                }
            });
            console.log('Tokens stored successfully');
            return true;
        } catch (error) {
            console.error('Failed to store tokens:', error);
            throw new Error('Failed to store authentication tokens');
        }
    },

    // Retrieve stored authentication tokens
    async getStoredTokens() {
        try {
            const result = await chrome.storage.local.get(['auraflow_tokens']);
            return result.auraflow_tokens || null;
        } catch (error) {
            console.error('Failed to retrieve tokens:', error);
            return null;
        }
    },

    // Check if stored tokens are valid (not expired)
    async areTokensValid() {
        try {
            const tokens = await this.getStoredTokens();
            if (!tokens || !tokens.access_token) {
                return false;
            }

            // Check if token is expired (with 5 minute buffer)
            const now = Date.now();
            const expiresAt = tokens.expires_at;
            const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

            return expiresAt && (now + bufferTime) < expiresAt;
        } catch (error) {
            console.error('Failed to validate tokens:', error);
            return false;
        }
    },

    // Clear stored authentication tokens
    async clearTokens() {
        try {
            await chrome.storage.local.remove(['auraflow_tokens']);
            console.log('Tokens cleared successfully');
            return true;
        } catch (error) {
            console.error('Failed to clear tokens:', error);
            throw new Error('Failed to clear authentication tokens');
        }
    }
};

// Authentication utilities
const AuthUtils = {
    // Initiate OAuth authentication flow using Chrome Identity API
    async authenticateUser() {
        try {
            console.log('Starting OAuth authentication flow');

            // Get OAuth configuration from manifest
            const manifest = chrome.runtime.getManifest();
            const clientId = manifest.oauth2?.client_id;
            const scopes = manifest.oauth2?.scopes || ['https://www.googleapis.com/auth/calendar.readonly'];

            if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
                throw new Error('OAuth client ID not configured in manifest. Please set up Google Cloud Console credentials.');
            }

            // Use chrome.identity.getAuthToken for simpler OAuth flow
            // This works better with Manifest V3
            console.log('Attempting to get auth token...');

            const token = await new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({ interactive: true }, (token) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(token);
                    }
                });
            });

            if (!token) {
                throw new Error('No token received from authentication');
            }

            console.log('Token received successfully');

            // Store tokens
            const tokens = {
                access_token: token,
                expires_at: Date.now() + (3600 * 1000), // 1 hour default
                token_type: 'Bearer'
            };

            await StorageUtils.storeTokens(tokens);

            console.log('Authentication successful');
            return tokens;
        } catch (error) {
            console.error('Authentication failed:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    },

    // Parse OAuth tokens from redirect URL
    parseTokensFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const fragment = urlObj.hash.substring(1);
            const params = new URLSearchParams(fragment);

            const accessToken = params.get('access_token');
            const expiresIn = params.get('expires_in');
            const tokenType = params.get('token_type');

            if (!accessToken) {
                throw new Error('No access token received');
            }

            return {
                access_token: accessToken,
                expires_in: parseInt(expiresIn) || 3600,
                token_type: tokenType || 'Bearer',
                expires_at: Date.now() + ((parseInt(expiresIn) || 3600) * 1000)
            };
        } catch (error) {
            console.error('Failed to parse tokens from URL:', error);
            throw new Error('Failed to parse authentication response');
        }
    },

    // Get valid access token (refresh if needed)
    async getValidAccessToken() {
        try {
            const tokens = await StorageUtils.getStoredTokens();

            if (!tokens) {
                throw new Error('No stored tokens found');
            }

            const isValid = await StorageUtils.areTokensValid();
            if (isValid) {
                return tokens.access_token;
            }

            // Token expired - attempt to refresh if refresh token is available
            if (tokens.refresh_token) {
                console.log('Access token expired, attempting refresh');
                const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
                return refreshedTokens.access_token;
            }

            // No refresh token available - require re-authentication
            throw new Error('Token expired, re-authentication required');
        } catch (error) {
            console.error('Failed to get valid access token:', error);
            throw error;
        }
    },

    // Refresh access token using refresh token
    async refreshAccessToken(refreshToken) {
        try {
            console.log('Refreshing access token');

            const manifest = chrome.runtime.getManifest();
            const clientId = manifest.oauth2?.client_id;

            if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
                throw new Error('OAuth client ID not configured');
            }

            // Make refresh token request
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Token refresh failed:', errorData);

                if (response.status === 400 && errorData.error === 'invalid_grant') {
                    // Refresh token is invalid/expired - require re-authentication
                    await StorageUtils.clearTokens();
                    throw new Error('Refresh token expired, re-authentication required');
                }

                throw new Error(`Token refresh failed: ${response.status}`);
            }

            const tokenData = await response.json();

            // Update stored tokens with new access token
            const updatedTokens = {
                access_token: tokenData.access_token,
                refresh_token: refreshToken, // Keep existing refresh token
                expires_at: Date.now() + (tokenData.expires_in * 1000),
                token_type: tokenData.token_type || 'Bearer'
            };

            await StorageUtils.storeTokens(updatedTokens);
            console.log('Access token refreshed successfully');

            return updatedTokens;
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            throw error;
        }
    }
};

// Google Calendar API utilities
const CalendarAPI = {
    // Base URL for Google Calendar API v3
    BASE_URL: 'https://www.googleapis.com/calendar/v3',

    // Fetch today's calendar events with retry logic
    async fetchTodaysEvents(retryCount = 0) {
        const maxRetries = 3;

        try {
            console.log('Fetching today\'s calendar events');

            const accessToken = await AuthUtils.getValidAccessToken();

            // Get today's date range in user's local timezone
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            const timeMin = startOfDay.toISOString();
            const timeMax = endOfDay.toISOString();

            // Build API request URL with enhanced parameters
            const url = `${this.BASE_URL}/calendars/primary/events?` +
                `timeMin=${encodeURIComponent(timeMin)}&` +
                `timeMax=${encodeURIComponent(timeMax)}&` +
                `singleEvents=true&` +
                `orderBy=startTime&` +
                `maxResults=50&` +
                `showDeleted=false&` +
                `showHiddenInvitations=false`;

            // Make API request with timeout and enhanced error handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'AuraFlow-Calendar-Extension/1.0.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Handle specific HTTP status codes with detailed error information
                const errorText = await response.text().catch(() => '');

                if (response.status === 401) {
                    // Try to refresh token automatically
                    if (retryCount === 0) {
                        console.log('401 error, attempting token refresh');
                        try {
                            await AuthUtils.getValidAccessToken(); // This will attempt refresh
                            return this.fetchTodaysEvents(retryCount + 1);
                        } catch (refreshError) {
                            throw new Error('Token expired, re-authentication required');
                        }
                    }
                    throw new Error('Token expired, re-authentication required');
                } else if (response.status === 403) {
                    const errorData = JSON.parse(errorText || '{}');
                    if (errorData.error?.message?.includes('Daily Limit Exceeded')) {
                        throw new Error('Daily API limit exceeded. Please try again tomorrow.');
                    }
                    throw new Error('Calendar access denied. Please check permissions.');
                } else if (response.status === 429) {
                    // Rate limited - retry with exponential backoff
                    if (retryCount < maxRetries) {
                        const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000); // Cap at 30 seconds
                        console.log(`Rate limited, retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.fetchTodaysEvents(retryCount + 1);
                    }
                    throw new Error('Too many requests. Please try again later.');
                } else if (response.status === 404) {
                    throw new Error('Calendar not found. Please check your Google Calendar access.');
                } else if (response.status >= 500) {
                    // Server error - retry
                    if (retryCount < maxRetries) {
                        const delay = Math.pow(2, retryCount) * 1000;
                        console.log(`Server error (${response.status}), retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.fetchTodaysEvents(retryCount + 1);
                    }
                    throw new Error('Google Calendar service is temporarily unavailable.');
                } else {
                    throw new Error(`Calendar API request failed: ${response.status} ${response.statusText}`);
                }
            }

            const data = await response.json();

            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from Calendar API');
            }

            const events = data.items || [];
            console.log(`Fetched ${events.length} events for today`);

            // Parse and validate events
            const parsedEvents = this.parseCalendarEvents(events);
            console.log(`Parsed ${parsedEvents.length} valid events`);

            return parsedEvents;
        } catch (error) {
            // Handle network errors with retry
            if ((error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network')) && retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Network error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchTodaysEvents(retryCount + 1);
            }

            console.error('Failed to fetch calendar events:', error);
            throw error;
        }
    },

    // Parse and validate calendar events
    parseCalendarEvents(events) {
        if (!Array.isArray(events)) {
            console.warn('Events is not an array:', events);
            return [];
        }

        return events
            .filter(event => this.isValidEvent(event))
            .map(event => this.normalizeEvent(event))
            .sort((a, b) => {
                // Sort by start time
                const aTime = new Date(a.start.dateTime || a.start.date);
                const bTime = new Date(b.start.dateTime || b.start.date);
                return aTime - bTime;
            });
    },

    // Validate if an event is valid and should be displayed
    isValidEvent(event) {
        // Skip events without basic required fields
        if (!event || typeof event !== 'object') {
            return false;
        }

        // Skip cancelled events
        if (event.status === 'cancelled') {
            return false;
        }

        // Skip events without start time
        if (!event.start || (!event.start.dateTime && !event.start.date)) {
            return false;
        }

        // Skip events without end time
        if (!event.end || (!event.end.dateTime && !event.end.date)) {
            return false;
        }

        // Skip declined events (if attendee status is available)
        if (event.attendees) {
            const userAttendee = event.attendees.find(attendee => attendee.self);
            if (userAttendee && userAttendee.responseStatus === 'declined') {
                return false;
            }
        }

        return true;
    },

    // Normalize event data for consistent structure
    normalizeEvent(event) {
        return {
            id: event.id,
            summary: event.summary || 'Untitled Event',
            description: event.description || '',
            start: {
                dateTime: event.start.dateTime,
                date: event.start.date,
                timeZone: event.start.timeZone
            },
            end: {
                dateTime: event.end.dateTime,
                date: event.end.date,
                timeZone: event.end.timeZone
            },
            status: event.status || 'confirmed',
            location: event.location || '',
            htmlLink: event.htmlLink || '',
            isAllDay: !event.start.dateTime, // All-day events only have date, not dateTime
            attendees: event.attendees || [],
            creator: event.creator || {},
            organizer: event.organizer || {}
        };
    },

    // Fetch events from multiple calendars (for future enhancement)
    async fetchEventsFromAllCalendars(retryCount = 0) {
        try {
            const accessToken = await AuthUtils.getValidAccessToken();

            // First, get list of calendars
            const calendarsResponse = await fetch(`${this.BASE_URL}/users/me/calendarList`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!calendarsResponse.ok) {
                throw new Error('Failed to fetch calendar list');
            }

            const calendarsData = await calendarsResponse.json();
            const calendars = calendarsData.items || [];

            // Fetch events from each calendar
            const allEvents = [];
            for (const calendar of calendars) {
                if (calendar.selected !== false) { // Include selected calendars
                    try {
                        const events = await this.fetchEventsFromCalendar(calendar.id);
                        allEvents.push(...events);
                    } catch (error) {
                        console.warn(`Failed to fetch events from calendar ${calendar.id}:`, error);
                        // Continue with other calendars
                    }
                }
            }

            return this.parseCalendarEvents(allEvents);
        } catch (error) {
            console.error('Failed to fetch events from all calendars:', error);
            // Fallback to primary calendar
            return this.fetchTodaysEvents(retryCount);
        }
    },

    // Fetch events from a specific calendar
    async fetchEventsFromCalendar(calendarId) {
        const accessToken = await AuthUtils.getValidAccessToken();

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const timeMin = startOfDay.toISOString();
        const timeMax = endOfDay.toISOString();

        const url = `${this.BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?` +
            `timeMin=${encodeURIComponent(timeMin)}&` +
            `timeMax=${encodeURIComponent(timeMax)}&` +
            `singleEvents=true&` +
            `orderBy=startTime&` +
            `maxResults=50&` +
            `showDeleted=false`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch events from calendar ${calendarId}: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
    }
};

// Error handling and logging utilities
const ErrorUtils = {
    // Log error with context and structured information
    logError(context, error, additionalInfo = {}) {
        const errorInfo = {
            context,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            extensionVersion: chrome.runtime.getManifest().version,
            ...additionalInfo
        };

        console.error('AuraFlow Error:', errorInfo);

        // Store recent errors for debugging (keep last 10)
        this.storeRecentError(errorInfo);

        // In a production environment, you might want to send errors to a logging service
        // For now, we'll just log to console and store locally
    },

    // Store recent errors for debugging
    async storeRecentError(errorInfo) {
        try {
            const result = await chrome.storage.local.get(['auraflow_recent_errors']);
            const recentErrors = result.auraflow_recent_errors || [];

            // Add new error and keep only last 10
            recentErrors.unshift(errorInfo);
            const trimmedErrors = recentErrors.slice(0, 10);

            await chrome.storage.local.set({ 'auraflow_recent_errors': trimmedErrors });
        } catch (storageError) {
            console.warn('Failed to store error info:', storageError);
        }
    },

    // Get recent errors for debugging
    async getRecentErrors() {
        try {
            const result = await chrome.storage.local.get(['auraflow_recent_errors']);
            return result.auraflow_recent_errors || [];
        } catch (error) {
            console.warn('Failed to retrieve recent errors:', error);
            return [];
        }
    },

    // Create user-friendly error messages with enhanced categorization
    getUserFriendlyMessage(error) {
        const message = error.message.toLowerCase();

        // Configuration errors
        if (message.includes('oauth client id not configured')) {
            return 'Extension not properly configured. Please contact support.';
        }

        // Authentication errors
        if (message.includes('authentication failed') || message.includes('oauth')) {
            return 'Failed to connect to Google Calendar. Please try again.';
        }

        if (message.includes('token expired') || message.includes('re-authentication required')) {
            return 'Your Google Calendar connection has expired. Please reconnect.';
        }

        if (message.includes('refresh token expired')) {
            return 'Your session has expired. Please reconnect to Google Calendar.';
        }

        // Permission errors
        if (message.includes('calendar access denied') || message.includes('permissions')) {
            return 'Calendar access denied. Please grant permission to access your Google Calendar.';
        }

        if (message.includes('daily api limit exceeded')) {
            return 'Daily usage limit reached. Please try again tomorrow.';
        }

        // Rate limiting errors
        if (message.includes('too many requests') || message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        }

        // Network errors
        if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
            return 'Network error. Please check your internet connection and try again.';
        }

        if (message.includes('google calendar service is temporarily unavailable')) {
            return 'Google Calendar is temporarily unavailable. Please try again later.';
        }

        // API errors
        if (message.includes('calendar api request failed')) {
            return 'Unable to fetch calendar events. Please try again.';
        }

        if (message.includes('calendar not found')) {
            return 'Calendar not found. Please check your Google Calendar access.';
        }

        if (message.includes('invalid response format')) {
            return 'Received invalid data from Google Calendar. Please try again.';
        }

        // Storage errors
        if (message.includes('no stored tokens')) {
            return 'Please connect your Google Calendar first.';
        }

        if (message.includes('failed to store') || message.includes('failed to retrieve')) {
            return 'Storage error. Please try refreshing the extension.';
        }

        // Generic fallback message
        return 'Something went wrong. Please try again.';
    },

    // Determine if error is recoverable
    isRecoverableError(error) {
        const message = error.message.toLowerCase();

        // Non-recoverable errors that require user action
        const nonRecoverablePatterns = [
            'oauth client id not configured',
            'token expired, re-authentication required',
            'refresh token expired',
            'calendar access denied',
            'daily api limit exceeded'
        ];

        return !nonRecoverablePatterns.some(pattern => message.includes(pattern));
    },

    // Get retry delay based on error type
    getRetryDelay(error, retryCount) {
        const message = error.message.toLowerCase();

        if (message.includes('rate limit') || message.includes('too many requests')) {
            // Longer delay for rate limiting
            return Math.min(Math.pow(2, retryCount) * 2000, 60000); // Cap at 1 minute
        }

        if (message.includes('server') || message.includes('temporarily unavailable')) {
            // Medium delay for server errors
            return Math.min(Math.pow(2, retryCount) * 1000, 30000); // Cap at 30 seconds
        }

        // Standard exponential backoff for other errors
        return Math.min(Math.pow(2, retryCount) * 500, 15000); // Cap at 15 seconds
    }
};

// Message handling for communication with popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Service worker received message:', message);

    // Handle async operations properly
    (async () => {
        try {
            switch (message.action) {
                case 'ping':
                    console.log('Ping received');
                    sendResponse({ success: true, data: { message: 'Service worker is responsive' } });
                    break;

                case 'authenticate':
                    console.log('Handling authentication request');
                    const tokens = await AuthUtils.authenticateUser();
                    sendResponse({ success: true, data: tokens });
                    break;

                case 'checkAuthStatus':
                    console.log('Checking authentication status');
                    const isValid = await StorageUtils.areTokensValid();
                    sendResponse({ success: true, data: { isAuthenticated: isValid } });
                    break;

                case 'fetchEvents':
                    console.log('Fetching calendar events');
                    const events = await CalendarAPI.fetchTodaysEvents();
                    sendResponse({ success: true, data: events });
                    break;

                case 'testApiConnection':
                    console.log('Testing API connection');
                    const testResult = await TestUtils.testCalendarApiConnection();
                    sendResponse({ success: true, data: testResult });
                    break;

                case 'getDebugInfo':
                    console.log('Getting debug information');
                    const debugInfo = await TestUtils.getDebugInfo();
                    sendResponse({ success: true, data: debugInfo });
                    break;

                case 'startSession':
                    console.log('Starting focus session');
                    const { workDuration, breakDuration, taskGoal } = message.data || {};
                    
                    // Validate input
                    if (!workDuration || !breakDuration) {
                        sendResponse({ 
                            success: false, 
                            error: 'Missing session duration parameters' 
                        });
                        break;
                    }
                    
                    // Save session state
                    await SessionState.saveSession({
                        workDuration,
                        breakDuration,
                        taskGoal
                    });
                    
                    // Create alarms
                    await AlarmManager.createSessionAlarms(workDuration, breakDuration);
                    
                    sendResponse({ 
                        success: true, 
                        data: { message: 'Session started successfully' } 
                    });
                    break;

                case 'endSession':
                    console.log('Ending focus session early');
                    
                    // Clear all alarms
                    await AlarmManager.clearAllAlarms();
                    
                    // Clear session state
                    await SessionState.clearSession();
                    
                    sendResponse({ 
                        success: true, 
                        data: { message: 'Session ended successfully' } 
                    });
                    break;

                case 'logout':
                    console.log('Handling logout request');

                    // Get stored tokens before clearing (to clear from cache)
                    const storedTokens = await StorageUtils.getStoredTokens();

                    // Clear Chrome's identity cache first
                    if (storedTokens && storedTokens.access_token) {
                        await new Promise((resolve) => {
                            chrome.identity.removeCachedAuthToken({ token: storedTokens.access_token }, () => {
                                resolve();
                            });
                        });
                    }

                    // Clear all cached tokens
                    await new Promise((resolve) => {
                        chrome.identity.clearAllCachedAuthTokens(() => {
                            resolve();
                        });
                    });

                    // Clear stored tokens
                    await StorageUtils.clearTokens();

                    console.log('Logout complete - tokens and cache cleared');
                    sendResponse({ success: true, data: { message: 'Logged out successfully' } });
                    break;

                default:
                    console.warn('Unknown message action:', message.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ErrorUtils.logError('message_handler', error, { action: message.action });

            sendResponse({
                success: false,
                error: ErrorUtils.getUserFriendlyMessage(error),
                details: error.message
            });
        }
    })();

    // Return true to indicate we'll send response asynchronously
    return true;
});

// ============================================================================
// ALARM EVENT LISTENER FOR GENTLE NUDGE NOTIFICATIONS
// ============================================================================

/**
 * Handles alarm events and triggers notifications
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm fired:', alarm.name);
  
  try {
    const session = await SessionState.getSession();
    
    if (!session) {
      console.warn('No active session found for alarm');
      return;
    }
    
    if (alarm.name === AlarmManager.WORK_END_ALARM) {
      // Work period ended - time for break
      const affirmation = getRandomAffirmation();
      
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Time for a mindful break!',
        message: affirmation,
        priority: 2,
        requireInteraction: false
      });
      
      console.log('Work end notification sent with affirmation:', affirmation);
      
    } else if (alarm.name === AlarmManager.BREAK_END_ALARM) {
      // Break period ended - time to resume or finish
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Break complete!',
        message: 'Ready to continue your focused work?',
        priority: 1,
        requireInteraction: false
      });
      
      console.log('Break end notification sent');
      
      // Clear session state
      await SessionState.clearSession();
    }
    
  } catch (error) {
    console.error('Error handling alarm:', error);
    ErrorUtils.logError('alarm_handler', error, { alarmName: alarm.name });
  }
});

// Service worker installation and activation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('AuraFlow extension installed/updated:', details.reason);

    if (details.reason === 'install') {
        console.log('First time installation - extension ready');
    } else if (details.reason === 'update') {
        console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
    console.log('AuraFlow service worker started');
});

// Testing and debugging utilities
const TestUtils = {
    // Test Calendar API connection
    async testCalendarApiConnection() {
        try {
            console.log('Testing Calendar API connection...');

            // Check if we have valid tokens
            const tokens = await StorageUtils.getStoredTokens();
            if (!tokens) {
                return {
                    status: 'error',
                    message: 'No authentication tokens found',
                    authenticated: false
                };
            }

            // Check token validity
            const isValid = await StorageUtils.areTokensValid();
            if (!isValid) {
                return {
                    status: 'warning',
                    message: 'Tokens expired, refresh needed',
                    authenticated: false
                };
            }

            // Test API call
            const accessToken = await AuthUtils.getValidAccessToken();

            // Make a simple API call to test connectivity
            const response = await fetch(`${CalendarAPI.BASE_URL}/users/me/calendarList?maxResults=1`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    status: 'success',
                    message: 'API connection successful',
                    authenticated: true,
                    calendarsFound: data.items?.length || 0
                };
            } else {
                return {
                    status: 'error',
                    message: `API test failed: ${response.status}`,
                    authenticated: true,
                    httpStatus: response.status
                };
            }
        } catch (error) {
            console.error('API connection test failed:', error);
            return {
                status: 'error',
                message: error.message,
                authenticated: false
            };
        }
    },

    // Get debug information
    async getDebugInfo() {
        try {
            const tokens = await StorageUtils.getStoredTokens();
            const recentErrors = await ErrorUtils.getRecentErrors();
            const manifest = chrome.runtime.getManifest();

            return {
                extensionVersion: manifest.version,
                hasTokens: !!tokens,
                tokenExpiry: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : null,
                tokensValid: await StorageUtils.areTokensValid(),
                recentErrorsCount: recentErrors.length,
                lastError: recentErrors[0] || null,
                oauthClientConfigured: manifest.oauth2?.client_id !== 'YOUR_GOOGLE_CLIENT_ID_HERE',
                permissions: manifest.permissions,
                hostPermissions: manifest.host_permissions
            };
        } catch (error) {
            console.error('Failed to get debug info:', error);
            return {
                error: error.message
            };
        }
    }
};

// Export utilities for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StorageUtils,
        AuthUtils,
        CalendarAPI,
        ErrorUtils,
        TestUtils
    };
}

// ============================================================================
// WEBSITE BLOCKING (DISTRACTION SHIELD)
// ============================================================================

/**
 * Updates the declarativeNetRequest blocking rules
 * @param {boolean} enableBlocking - Whether to enable or disable blocking
 */
async function updateBlockingRules(enableBlocking = false) {
  try {
    console.log('Updating blocking rules, enableBlocking:', enableBlocking);
    
    // Step 1: Get all existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);
    
    // Step 2: Remove all existing rules to prevent duplication
    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds
      });
      console.log('Removed existing rules:', existingRuleIds);
    }
    
    // Step 3: If blocking should be enabled, create new rules
    if (enableBlocking) {
      // Get the list of blocked sites from storage
      const result = await chrome.storage.sync.get(['auraFlowBlockedSites']);
      const blockedSites = result.auraFlowBlockedSites || [];
      
      if (blockedSites.length === 0) {
        console.log('No sites to block');
        return;
      }
      
      console.log('Blocking sites:', blockedSites);
      
      // Step 4: Create the blocking rule
      const blockingRule = {
        id: 1,
        priority: 1,
        action: {
          type: 'block'
        },
        condition: {
          urlFilter: '*',
          resourceTypes: ['main_frame'],
          requestDomains: blockedSites
        }
      };
      
      // Step 5: Add the new rule
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [blockingRule]
      });
      
      console.log('Blocking rule added successfully');
    } else {
      console.log('Blocking disabled - all rules removed');
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
    ErrorUtils.logError('update_blocking_rules', error, { enableBlocking });
  }
}

/**
 * Handles focus session start/end messages for blocking control
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle blocking control messages
  if (message.action === 'startFocus') {
    console.log('Starting focus mode - enabling website blocking');
    updateBlockingRules(true)
      .then(() => {
        sendResponse({ success: true, message: 'Blocking enabled' });
      })
      .catch(error => {
        console.error('Failed to enable blocking:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'endFocus') {
    console.log('Ending focus mode - disabling website blocking');
    updateBlockingRules(false)
      .then(() => {
        sendResponse({ success: true, message: 'Blocking disabled' });
      })
      .catch(error => {
        console.error('Failed to disable blocking:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});
