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

// ============================================================================
// SLACK STORAGE UTILITIES
// ============================================================================

/**
 * Storage utilities for Slack token and status management
 */
const SlackStorageUtils = {
    // Storage keys
    TOKENS_KEY: 'auraflow_slack_tokens',
    LAST_STATUS_KEY: 'auraflow_slack_last_status',

    /**
     * Store Slack authentication tokens securely
     * @param {Object} tokens - Token data from Slack OAuth
     * @returns {Promise<boolean>} Success status
     */
    async storeSlackTokens(tokens) {
        try {
            await chrome.storage.local.set({
                [this.TOKENS_KEY]: {
                    access_token: tokens.access_token,
                    token_type: tokens.token_type || 'Bearer',
                    scope: tokens.scope,
                    bot_user_id: tokens.bot_user_id,
                    app_id: tokens.app_id,
                    team: tokens.team || {},
                    authed_user: tokens.authed_user || {},
                    expires_at: tokens.expires_at || null, // Slack tokens don't expire by default
                    stored_at: Date.now()
                }
            });
            console.log('Slack tokens stored successfully');
            return true;
        } catch (error) {
            console.error('Failed to store Slack tokens:', error);
            throw new Error('Failed to store Slack authentication tokens');
        }
    },

    /**
     * Retrieve stored Slack authentication tokens
     * @returns {Promise<Object|null>} Stored tokens or null if not found
     */
    async getStoredSlackTokens() {
        try {
            const result = await chrome.storage.local.get([this.TOKENS_KEY]);
            return result[this.TOKENS_KEY] || null;
        } catch (error) {
            console.error('Failed to retrieve Slack tokens:', error);
            return null;
        }
    },

    /**
     * Check if stored Slack tokens are valid
     * @returns {Promise<boolean>} True if tokens exist and are valid
     */
    async areSlackTokensValid() {
        try {
            const tokens = await this.getStoredSlackTokens();
            if (!tokens || !tokens.access_token) {
                return false;
            }

            // Slack tokens don't expire by default, but check if they exist
            // and have the required structure
            const hasRequiredFields = tokens.access_token &&
                tokens.authed_user &&
                tokens.authed_user.access_token;

            return hasRequiredFields;
        } catch (error) {
            console.error('Failed to validate Slack tokens:', error);
            return false;
        }
    },

    /**
     * Clear stored Slack authentication tokens
     * @returns {Promise<boolean>} Success status
     */
    async clearSlackTokens() {
        try {
            await chrome.storage.local.remove([this.TOKENS_KEY]);
            console.log('Slack tokens cleared successfully');
            return true;
        } catch (error) {
            console.error('Failed to clear Slack tokens:', error);
            throw new Error('Failed to clear Slack authentication tokens');
        }
    },

    /**
     * Store last selected Slack status for UI persistence
     * @param {string} status - Status identifier ('available', 'focused', 'dnd')
     * @param {Object} details - Additional status details (emoji, text)
     * @returns {Promise<boolean>} Success status
     */
    async storeLastStatus(status, details = {}) {
        try {
            await chrome.storage.local.set({
                [this.LAST_STATUS_KEY]: {
                    status: status,
                    emoji: details.emoji || '',
                    text: details.text || '',
                    timestamp: Date.now()
                }
            });
            console.log('Last Slack status stored:', status);
            return true;
        } catch (error) {
            console.error('Failed to store last Slack status:', error);
            throw new Error('Failed to store last Slack status');
        }
    },

    /**
     * Retrieve last selected Slack status
     * @returns {Promise<Object|null>} Last status data or null if not found
     */
    async getLastStatus() {
        try {
            const result = await chrome.storage.local.get([this.LAST_STATUS_KEY]);
            return result[this.LAST_STATUS_KEY] || null;
        } catch (error) {
            console.error('Failed to retrieve last Slack status:', error);
            return null;
        }
    },

    /**
     * Clear last selected Slack status
     * @returns {Promise<boolean>} Success status
     */
    async clearLastStatus() {
        try {
            await chrome.storage.local.remove([this.LAST_STATUS_KEY]);
            console.log('Last Slack status cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear last Slack status:', error);
            throw new Error('Failed to clear last Slack status');
        }
    }
};

// ============================================================================
// SLACK AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Authentication utilities for Slack OAuth flow
 */
const SlackAuthUtils = {
    // Slack OAuth configuration
    // Load from config.js (not committed to version control)
    // See config.example.js for setup instructions
    CLIENT_ID: null,  // Will be loaded from config
    CLIENT_SECRET: null,  // Will be loaded from config

    // OAuth scopes required for status management
    // Using Slack's granular bot scopes format
    SCOPES: [
        'users:write',          // Set user status and presence
        'users:read'            // Read user information
    ],

    /**
     * Load configuration from config.js
     * This should be called on extension startup
     */
    async loadConfig() {
        try {
            // Try to load config.js dynamically
            const response = await fetch(chrome.runtime.getURL('config.js'));
            const configText = await response.text();

            // Execute config script in isolated context
            const configScript = new Function(configText + '; return CONFIG;');
            const config = configScript();

            if (config && config.slack) {
                this.CLIENT_ID = config.slack.CLIENT_ID;
                this.CLIENT_SECRET = config.slack.CLIENT_SECRET;
                console.log('Slack configuration loaded successfully');
                return true;
            } else {
                console.error('Invalid config.js structure');
                return false;
            }
        } catch (error) {
            console.error('Failed to load config.js:', error);
            console.error('Please copy config.example.js to config.js and add your credentials');
            return false;
        }
    },

    /**
     * Get the OAuth redirect URI for this extension
     * @returns {string} Redirect URI
     */
    getRedirectUri() {
        return chrome.identity.getRedirectURL('slack');
    },

    /**
     * Build the Slack OAuth authorization URL
     * @returns {string} OAuth URL
     */
    buildAuthUrl() {
        const redirectUri = this.getRedirectUri();
        const scopes = this.SCOPES.join(' ');  // Space-separated for Slack OAuth v2
        const state = this.generateState();

        // Store state for validation
        chrome.storage.local.set({ 'auraflow_slack_oauth_state': state });

        const params = new URLSearchParams({
            client_id: this.CLIENT_ID,
            user_scope: scopes,  // Use user_scope for user tokens, not scope
            redirect_uri: redirectUri,
            state: state
        });

        return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    },

    /**
     * Generate a random state parameter for OAuth security
     * @returns {string} Random state string
     */
    generateState() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate OAuth state parameter
     * @param {string} state - State from OAuth callback
     * @returns {Promise<boolean>} True if state is valid
     */
    async validateState(state) {
        try {
            const result = await chrome.storage.local.get(['auraflow_slack_oauth_state']);
            const storedState = result.auraflow_slack_oauth_state;

            // Clear stored state after validation
            await chrome.storage.local.remove(['auraflow_slack_oauth_state']);

            return storedState === state;
        } catch (error) {
            console.error('Failed to validate OAuth state:', error);
            return false;
        }
    },

    /**
     * Initiate Slack OAuth authentication flow
     * @returns {Promise<Object>} Authentication result with tokens
     */
    async authenticateSlack() {
        try {
            console.log('Starting Slack OAuth authentication flow');

            // Load config if not already loaded
            if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
                await this.loadConfig();
            }

            // Check if client credentials are configured
            if (!this.CLIENT_ID || this.CLIENT_ID === 'YOUR_SLACK_CLIENT_ID') {
                const error = new Error('Slack OAuth client ID not configured. Please copy config.example.js to config.js and add your credentials.');
                ErrorUtils.logError('slack_auth', error, { step: 'configuration_check' });
                throw error;
            }

            if (!this.CLIENT_SECRET || this.CLIENT_SECRET === 'YOUR_SLACK_CLIENT_SECRET') {
                const error = new Error('Slack OAuth client secret not configured. Please copy config.example.js to config.js and add your credentials.');
                ErrorUtils.logError('slack_auth', error, { step: 'configuration_check' });
                throw error;
            }

            // Build OAuth URL
            const authUrl = this.buildAuthUrl();
            console.log('Launching OAuth flow with redirect URI:', this.getRedirectUri());
            console.log('OAuth URL:', authUrl);
            console.log('Requested scopes:', this.SCOPES.join(' '));

            // Launch OAuth flow
            const redirectUrl = await new Promise((resolve, reject) => {
                chrome.identity.launchWebAuthFlow(
                    {
                        url: authUrl,
                        interactive: true
                    },
                    (responseUrl) => {
                        if (chrome.runtime.lastError) {
                            const error = new Error(chrome.runtime.lastError.message);
                            ErrorUtils.logError('slack_auth', error, {
                                step: 'oauth_flow',
                                lastError: chrome.runtime.lastError
                            });
                            reject(error);
                        } else if (!responseUrl) {
                            const error = new Error('No response URL received from OAuth flow');
                            ErrorUtils.logError('slack_auth', error, { step: 'oauth_flow' });
                            reject(error);
                        } else {
                            resolve(responseUrl);
                        }
                    }
                );
            });

            console.log('OAuth flow completed, parsing response');
            console.log('Redirect URL:', redirectUrl);

            // Parse authorization code from redirect URL
            const urlObj = new URL(redirectUrl);
            const code = urlObj.searchParams.get('code');
            const state = urlObj.searchParams.get('state');
            const error = urlObj.searchParams.get('error');

            console.log('OAuth callback params:', { code: code ? 'present' : 'missing', state, error });

            // Check for OAuth errors
            if (error) {
                const authError = new Error(`OAuth error: ${error}`);
                ErrorUtils.logError('slack_auth', authError, {
                    step: 'oauth_callback',
                    oauthError: error,
                    redirectUrl: redirectUrl
                });
                throw authError;
            }

            if (!code) {
                const authError = new Error('No authorization code received from Slack');
                ErrorUtils.logError('slack_auth', authError, { step: 'oauth_callback' });
                throw authError;
            }

            // Validate state parameter
            const isValidState = await this.validateState(state);
            if (!isValidState) {
                const authError = new Error('Invalid OAuth state parameter - possible CSRF attack');
                ErrorUtils.logError('slack_auth', authError, {
                    step: 'state_validation',
                    receivedState: state
                });
                throw authError;
            }

            console.log('Authorization code received, exchanging for access token');

            // Exchange code for access token
            const tokens = await this.exchangeCodeForToken(code);

            // Store tokens
            await SlackStorageUtils.storeSlackTokens(tokens);

            console.log('Slack authentication successful');

            return {
                success: true,
                team: tokens.team,
                authed_user: tokens.authed_user
            };
        } catch (error) {
            console.error('Slack authentication failed:', error);
            ErrorUtils.logError('slack_auth', error, { step: 'authentication_flow' });
            throw new Error(`Slack authentication failed: ${error.message}`);
        }
    },

    /**
     * Exchange authorization code for access token
     * @param {string} code - Authorization code from OAuth callback
     * @returns {Promise<Object>} Token data from Slack
     */
    async exchangeCodeForToken(code) {
        try {
            const redirectUri = this.getRedirectUri();

            // Make token exchange request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('https://slack.com/api/oauth.v2.access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.CLIENT_ID,
                    client_secret: this.CLIENT_SECRET,
                    code: code,
                    redirect_uri: redirectUri
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
                ErrorUtils.logError('slack_token_exchange', error, {
                    status: response.status,
                    statusText: response.statusText
                });
                throw error;
            }

            const data = await response.json();

            console.log('Token exchange response:', JSON.stringify(data, null, 2));

            // Check if Slack returned an error
            if (!data.ok) {
                const error = new Error(`Slack API error: ${data.error || 'Unknown error'}`);
                ErrorUtils.logError('slack_token_exchange', error, {
                    slackError: data.error,
                    errorDetails: data
                });
                throw error;
            }

            // For user-only OAuth (no bot), the structure is different
            // We might only have authed_user, not a separate access_token
            const hasUserToken = data.authed_user && data.authed_user.access_token;
            const hasBotToken = data.access_token;

            if (!hasUserToken && !hasBotToken) {
                const error = new Error('Invalid token response from Slack - missing required fields');
                ErrorUtils.logError('slack_token_exchange', error, {
                    hasAccessToken: !!data.access_token,
                    hasAuthedUser: !!data.authed_user,
                    hasUserAccessToken: hasUserToken,
                    responseKeys: Object.keys(data)
                });
                throw error;
            }

            console.log('Token exchange successful');

            // For user-only OAuth, there's no top-level access_token
            // The token is in authed_user.access_token
            return {
                access_token: data.authed_user?.access_token || data.access_token, // User token or bot token
                token_type: data.authed_user?.token_type || data.token_type || 'Bearer',
                scope: data.authed_user?.scope || data.scope,
                bot_user_id: data.bot_user_id,
                app_id: data.app_id,
                team: data.team || {},
                authed_user: data.authed_user || {},
                expires_at: null // Slack tokens don't expire by default
            };
        } catch (error) {
            // Handle timeout errors
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Token exchange request timed out');
                ErrorUtils.logError('slack_token_exchange', timeoutError);
                throw timeoutError;
            }

            // Handle network errors
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                const networkError = new Error('Network error during token exchange');
                ErrorUtils.logError('slack_token_exchange', networkError, { originalError: error.message });
                throw networkError;
            }

            console.error('Failed to exchange code for token:', error);
            ErrorUtils.logError('slack_token_exchange', error);
            throw error;
        }
    },

    /**
     * Get a valid Slack access token from storage
     * @returns {Promise<string>} Valid access token
     * @throws {Error} If no valid token is found
     */
    async getValidSlackToken() {
        try {
            const tokens = await SlackStorageUtils.getStoredSlackTokens();

            if (!tokens) {
                const error = new Error('No Slack tokens found - authentication required');
                ErrorUtils.logError('slack_get_token', error);
                throw error;
            }

            // Validate token structure
            const isValid = await SlackStorageUtils.areSlackTokensValid();
            if (!isValid) {
                const error = new Error('Invalid Slack tokens - re-authentication required');
                ErrorUtils.logError('slack_get_token', error, {
                    hasTokens: !!tokens,
                    hasAccessToken: !!(tokens && tokens.access_token),
                    hasAuthedUser: !!(tokens && tokens.authed_user)
                });
                // Clear invalid tokens
                await SlackStorageUtils.clearSlackTokens();
                throw error;
            }

            // Return the user access token (not the bot token)
            return tokens.authed_user.access_token;
        } catch (error) {
            console.error('Failed to get valid Slack token:', error);
            ErrorUtils.logError('slack_get_token', error);
            throw error;
        }
    },

    /**
     * Check if user is authenticated with Slack
     * @returns {Promise<Object>} Authentication status and details
     */
    async checkAuthStatus() {
        try {
            const tokens = await SlackStorageUtils.getStoredSlackTokens();

            if (!tokens) {
                return {
                    isAuthenticated: false,
                    message: 'Not connected to Slack'
                };
            }

            const isValid = await SlackStorageUtils.areSlackTokensValid();

            if (!isValid) {
                return {
                    isAuthenticated: false,
                    message: 'Slack tokens invalid - re-authentication required'
                };
            }

            const authStatus = {
                isAuthenticated: true,
                team: tokens.team,
                user: tokens.authed_user,
                workspaceName: tokens.team?.name || 'Unknown Workspace',
                message: 'Connected to Slack'
            };
            console.log('Slack auth status:', authStatus);
            return authStatus;
        } catch (error) {
            console.error('Failed to check Slack auth status:', error);
            return {
                isAuthenticated: false,
                message: 'Error checking authentication status',
                error: error.message
            };
        }
    }
};

// ============================================================================
// SLACK API INTEGRATION
// ============================================================================

/**
 * Slack API integration module for status and presence management
 */
const SlackAPI = {
    // Slack API base URL
    BASE_URL: 'https://slack.com/api',

    /**
     * Parse Slack API error codes into user-friendly messages
     * @param {string} errorCode - Slack API error code
     * @returns {string} User-friendly error message
     */
    parseSlackError(errorCode) {
        const errorMessages = {
            'invalid_auth': 'Invalid authentication token',
            'not_authed': 'Not authenticated with Slack',
            'account_inactive': 'Slack account is inactive',
            'token_revoked': 'Slack token has been revoked',
            'token_expired': 'Slack token has expired',
            'no_permission': 'Missing required permissions',
            'rate_limited': 'Rate limit exceeded',
            'missing_scope': 'Missing required OAuth scope',
            'user_not_found': 'User not found',
            'cannot_set_status': 'Cannot set status at this time',
            'not_allowed_token_type': 'Invalid token type for this operation',
            'snooze_failed': 'Failed to enable Do Not Disturb mode',
            'snooze_end_failed': 'Failed to disable Do Not Disturb mode',
            'presence_error': 'Failed to update presence status',
            'profile_set_failed': 'Failed to update profile status'
        };

        return errorMessages[errorCode] || `Slack API error: ${errorCode}`;
    },

    /**
     * Make a Slack API call with error handling and retry logic
     * @param {string} endpoint - API endpoint (e.g., 'users.profile.set')
     * @param {string} method - HTTP method (GET or POST)
     * @param {Object} body - Request body parameters
     * @param {number} retryCount - Current retry attempt (for internal use)
     * @returns {Promise<Object>} API response data
     */
    async makeSlackAPICall(endpoint, method = 'POST', body = {}, retryCount = 0) {
        const maxRetries = 3;

        try {
            // Get valid access token
            const token = await SlackAuthUtils.getValidSlackToken();

            // Build request URL
            const url = `${this.BASE_URL}/${endpoint}`;

            // Prepare request options
            const options = {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=utf-8'
                }
            };

            // Add body for POST requests
            if (method === 'POST' && Object.keys(body).length > 0) {
                options.body = JSON.stringify(body);
            }

            // Add query parameters for GET requests
            let requestUrl = url;
            if (method === 'GET' && Object.keys(body).length > 0) {
                const params = new URLSearchParams(body);
                requestUrl = `${url}?${params.toString()}`;
            }

            console.log(`Making Slack API call: ${method} ${endpoint}`);

            // Make API request with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(requestUrl, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Parse response
            const data = await response.json();

            // Check if Slack API returned an error
            if (!data.ok) {
                const errorCode = data.error || 'unknown_error';
                console.error(`Slack API error: ${errorCode}`, data);

                // Log error with context
                ErrorUtils.logError('slack_api', new Error(this.parseSlackError(errorCode)), {
                    endpoint,
                    method,
                    errorCode,
                    retryCount,
                    errorDetails: data
                });

                // Handle specific error cases
                if (errorCode === 'invalid_auth' || errorCode === 'token_revoked' || errorCode === 'token_expired' || errorCode === 'not_authed') {
                    // Clear invalid tokens automatically
                    console.log('Clearing invalid Slack tokens');
                    await SlackStorageUtils.clearSlackTokens();
                    throw new Error('Slack authentication expired. Please reconnect.');
                }

                if (errorCode === 'rate_limited' || errorCode === 'ratelimited') {
                    // Retry with exponential backoff
                    if (retryCount < maxRetries) {
                        const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000); // Cap at 10 seconds
                        console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return this.makeSlackAPICall(endpoint, method, body, retryCount + 1);
                    }
                    // Max retries exceeded
                    ErrorUtils.logError('slack_api_rate_limit', new Error('Rate limit max retries exceeded'), {
                        endpoint,
                        method,
                        maxRetries
                    });
                    throw new Error('Too many requests. Please wait a moment and try again.');
                }

                // Throw user-friendly error message
                throw new Error(this.parseSlackError(errorCode));
            }

            console.log(`Slack API call successful: ${endpoint}`);
            return data;

        } catch (error) {
            // Handle timeout errors
            if (error.name === 'AbortError') {
                console.error('Slack API request timed out');
                ErrorUtils.logError('slack_api_timeout', error, {
                    endpoint,
                    method,
                    retryCount
                });
                throw new Error('Request timed out. Please check your connection and try again.');
            }

            // Handle network errors
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.error('Network error calling Slack API:', error);
                ErrorUtils.logError('slack_api_network', error, {
                    endpoint,
                    method,
                    retryCount
                });
                throw new Error('Network error. Please check your connection and try again.');
            }

            // Log and re-throw other errors
            console.error('Slack API call failed:', error);
            ErrorUtils.logError('slack_api_call', error, {
                endpoint,
                method,
                retryCount
            });
            throw error;
        }
    },

    /**
     * Update user's Slack status (emoji and text)
     * @param {string} statusEmoji - Status emoji (e.g., ':dart:', ':no_bell:', or empty string to clear)
     * @param {string} statusText - Status text message (or empty string to clear)
     * @param {number} statusExpiration - Unix timestamp when status expires (0 for no expiration)
     * @returns {Promise<Object>} API response
     */
    async setUserStatus(statusEmoji = '', statusText = '', statusExpiration = 0) {
        try {
            console.log(`Setting Slack status: ${statusEmoji} ${statusText}`);

            const profile = {
                status_text: statusText,
                status_emoji: statusEmoji,
                status_expiration: statusExpiration
            };

            const response = await this.makeSlackAPICall('users.profile.set', 'POST', { profile });

            console.log('Slack status updated successfully');
            return response;

        } catch (error) {
            console.error('Failed to set Slack status:', error);
            ErrorUtils.logError('slack_set_status', error, {
                statusEmoji,
                statusText,
                statusExpiration
            });
            throw new Error(`Failed to update Slack status: ${error.message}`);
        }
    },

    /**
     * Update user's Slack presence (active/away)
     * @param {string} presence - Presence status ('auto' or 'away')
     * @returns {Promise<Object>} API response
     */
    async setUserPresence(presence = 'auto') {
        try {
            console.log(`Setting Slack presence: ${presence}`);

            // Validate presence value
            if (presence !== 'auto' && presence !== 'away') {
                const error = new Error('Invalid presence value. Must be "auto" or "away"');
                ErrorUtils.logError('slack_set_presence', error, { presence });
                throw error;
            }

            const response = await this.makeSlackAPICall('users.setPresence', 'POST', { presence });

            console.log('Slack presence updated successfully');
            return response;

        } catch (error) {
            console.error('Failed to set Slack presence:', error);
            ErrorUtils.logError('slack_set_presence', error, { presence });
            throw new Error(`Failed to update Slack presence: ${error.message}`);
        }
    },

    /**
     * Enable Do Not Disturb mode for specified duration
     * @param {number} numMinutes - Number of minutes to enable DND (default: 60)
     * @returns {Promise<Object>} API response with snooze end time
     */
    async setDndSnooze(numMinutes = 60) {
        try {
            console.log(`Enabling Slack DND for ${numMinutes} minutes`);

            // Validate duration
            if (numMinutes < 1 || numMinutes > 1440) { // Max 24 hours
                const error = new Error('DND duration must be between 1 and 1440 minutes');
                ErrorUtils.logError('slack_set_dnd', error, { numMinutes });
                throw error;
            }

            const response = await this.makeSlackAPICall('dnd.setSnooze', 'POST', { num_minutes: numMinutes });

            console.log('Slack DND enabled successfully');
            return response;

        } catch (error) {
            console.error('Failed to enable Slack DND:', error);
            ErrorUtils.logError('slack_set_dnd', error, { numMinutes });
            throw new Error(`Failed to enable Do Not Disturb: ${error.message}`);
        }
    },

    /**
     * Disable Do Not Disturb mode
     * @returns {Promise<Object>} API response
     */
    async endDndSnooze() {
        try {
            console.log('Disabling Slack DND');

            const response = await this.makeSlackAPICall('dnd.endSnooze', 'POST', {});

            console.log('Slack DND disabled successfully');
            return response;

        } catch (error) {
            console.error('Failed to disable Slack DND:', error);
            ErrorUtils.logError('slack_end_dnd', error);
            throw new Error(`Failed to disable Do Not Disturb: ${error.message}`);
        }
    },

    /**
     * Get user's current profile information including status
     * @returns {Promise<Object>} User profile data
     */
    async getUserProfile() {
        try {
            console.log('Fetching Slack user profile');

            const response = await this.makeSlackAPICall('users.profile.get', 'GET', {});

            if (!response.profile) {
                const error = new Error('Invalid profile response from Slack');
                ErrorUtils.logError('slack_get_profile', error, {
                    hasResponse: !!response,
                    responseKeys: response ? Object.keys(response) : []
                });
                throw error;
            }

            console.log('Slack user profile fetched successfully');
            return response.profile;

        } catch (error) {
            console.error('Failed to fetch Slack user profile:', error);
            ErrorUtils.logError('slack_get_profile', error);
            throw new Error(`Failed to fetch current status: ${error.message}`);
        }
    },

    /**
     * Get workspace (team) information
     * @returns {Promise<Object>} Team information
     */
    async getTeamInfo() {
        try {
            console.log('Fetching Slack team info');

            const response = await this.makeSlackAPICall('team.info', 'GET', {});

            if (!response.team) {
                const error = new Error('Invalid team response from Slack');
                ErrorUtils.logError('slack_get_team', error, {
                    hasResponse: !!response,
                    responseKeys: response ? Object.keys(response) : []
                });
                throw error;
            }

            console.log('Slack team info fetched successfully');
            return response.team;

        } catch (error) {
            console.error('Failed to fetch Slack team info:', error);
            ErrorUtils.logError('slack_get_team', error);
            throw new Error(`Failed to fetch workspace information: ${error.message}`);
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

        // Slack-specific configuration errors
        if (message.includes('slack oauth client id not configured') ||
            message.includes('slack oauth client secret not configured')) {
            return 'Slack integration not configured. Please contact support.';
        }

        // Slack authentication errors
        if (message.includes('slack authentication failed')) {
            return 'Failed to connect to Slack. Please try again.';
        }

        if (message.includes('slack authentication expired') ||
            message.includes('slack tokens invalid')) {
            return 'Your Slack connection has expired. Please reconnect.';
        }

        if (message.includes('no slack tokens found')) {
            return 'Please connect your Slack workspace first.';
        }

        if (message.includes('oauth error') || message.includes('oauth flow')) {
            return 'Authentication failed. Please try again.';
        }

        if (message.includes('no authorization code received')) {
            return 'Authentication was cancelled or failed. Please try again.';
        }

        if (message.includes('invalid oauth state parameter')) {
            return 'Authentication security check failed. Please try again.';
        }

        // Slack API-specific errors
        if (message.includes('invalid authentication token') ||
            message.includes('not authenticated with slack') ||
            message.includes('token has been revoked') ||
            message.includes('token has expired')) {
            return 'Your Slack connection has expired. Please reconnect.';
        }

        if (message.includes('slack account is inactive')) {
            return 'Your Slack account is inactive. Please contact your workspace admin.';
        }

        if (message.includes('missing required permissions') ||
            message.includes('missing required oauth scope')) {
            return 'Missing required permissions. Please reconnect and grant all permissions.';
        }

        if (message.includes('failed to update slack status') ||
            message.includes('failed to update slack presence') ||
            message.includes('cannot set status at this time')) {
            return 'Failed to update Slack status. Please try again.';
        }

        if (message.includes('failed to enable do not disturb') ||
            message.includes('failed to disable do not disturb')) {
            return 'Failed to update Do Not Disturb mode. Please try again.';
        }

        if (message.includes('failed to fetch current status') ||
            message.includes('failed to fetch workspace information')) {
            return 'Failed to fetch Slack information. Please try again.';
        }

        if (message.includes('user not found')) {
            return 'Slack user not found. Please reconnect.';
        }

        // Google Calendar authentication errors
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

        // Rate limiting errors (both Slack and Google)
        if (message.includes('too many requests') || message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        }

        // Network errors
        if (message.includes('network') || message.includes('fetch') ||
            message.includes('request timed out') || message.includes('timeout')) {
            return 'Network error. Please check your internet connection and try again.';
        }

        if (message.includes('google calendar service is temporarily unavailable')) {
            return 'Google Calendar is temporarily unavailable. Please try again later.';
        }

        if (message.includes('slack api is unavailable')) {
            return 'Slack is temporarily unavailable. Please try again later.';
        }

        // API errors
        if (message.includes('calendar api request failed')) {
            return 'Unable to fetch calendar events. Please try again.';
        }

        if (message.includes('calendar not found')) {
            return 'Calendar not found. Please check your Google Calendar access.';
        }

        if (message.includes('invalid response format')) {
            return 'Received invalid data. Please try again.';
        }

        // Storage errors
        if (message.includes('no stored tokens')) {
            return 'Please connect your account first.';
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
            'slack oauth client id not configured',
            'slack oauth client secret not configured',
            'token expired, re-authentication required',
            'refresh token expired',
            'slack authentication expired',
            'slack tokens invalid',
            'invalid oauth state parameter',
            'calendar access denied',
            'daily api limit exceeded',
            'slack account is inactive',
            'missing required permissions',
            'missing required oauth scope',
            'token has been revoked',
            'not authenticated with slack',
            'no slack tokens found',
            'no stored tokens'
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

// ============================================================================
// SLACK STATUS CONFIGURATIONS
// ============================================================================

/**
 * Status configurations for different Slack status modes
 * Maps status identifiers to their corresponding Slack API parameters
 */
const STATUS_CONFIGS = {
    available: {
        emoji: '',
        text: '',
        expiration: 0,
        presence: 'auto',
        dnd: false,
        description: 'Available'
    },
    focused: {
        emoji: ':dart:',
        text: 'In focus mode',
        expiration: 0,
        presence: 'auto',
        dnd: false,
        description: 'Focused'
    },
    dnd: {
        emoji: ':no_bell:',
        text: 'Do not disturb',
        expiration: 0,
        presence: 'auto',
        dnd: true,
        dndMinutes: 60,
        description: 'Do Not Disturb'
    }
};

// ============================================================================
// SLACK STATUS UPDATE HANDLERS
// ============================================================================

/**
 * Handle Slack status update request
 * Maps status identifier to appropriate Slack API calls
 * @param {string} status - Status identifier ('available', 'focused', 'dnd')
 * @returns {Promise<Object>} Response object with success status and data
 */
async function handleUpdateSlackStatus(status) {
    try {
        // Validate status parameter
        if (!status || typeof status !== 'string') {
            return {
                success: false,
                error: 'Invalid status parameter'
            };
        }

        // Get status configuration
        const config = STATUS_CONFIGS[status];
        if (!config) {
            return {
                success: false,
                error: `Unknown status: ${status}. Valid options are: available, focused, dnd`
            };
        }

        console.log(`Updating Slack status to: ${status}`, config);

        // Apply status based on configuration
        switch (status) {
            case 'available':
                // Clear status, set presence to auto, end DND
                await SlackAPI.setUserStatus(config.emoji, config.text, config.expiration);
                await SlackAPI.setUserPresence(config.presence);
                // Try to end DND, but don't fail if it's not active
                try {
                    await SlackAPI.endDndSnooze();
                } catch (error) {
                    // DND might not be active, which is fine
                    console.log('DND was not active or could not be ended:', error.message);
                }
                break;

            case 'focused':
                // Set focus status with dart emoji, set presence to auto
                await SlackAPI.setUserStatus(config.emoji, config.text, config.expiration);
                await SlackAPI.setUserPresence(config.presence);
                // Don't enable DND for focused mode
                break;

            case 'dnd':
                // Set DND status with no_bell emoji, enable DND mode
                await SlackAPI.setUserStatus(config.emoji, config.text, config.expiration);
                await SlackAPI.setDndSnooze(config.dndMinutes);
                // Presence is automatically set to away when DND is enabled
                break;

            default:
                return {
                    success: false,
                    error: `Unhandled status: ${status}`
                };
        }

        // Store last status for persistence
        await SlackStorageUtils.storeLastStatus(status, {
            emoji: config.emoji,
            text: config.text
        });

        console.log(`Slack status updated successfully to: ${status}`);

        return {
            success: true,
            data: {
                status: status,
                emoji: config.emoji,
                text: config.text,
                description: config.description,
                message: `Status updated to ${config.description}`
            }
        };

    } catch (error) {
        console.error('Failed to update Slack status:', error);

        // Log error with context
        ErrorUtils.logError('handle_slack_status_update', error, {
            status,
            config: STATUS_CONFIGS[status]
        });

        // Check if error is authentication-related
        if (error.message.includes('authentication') || error.message.includes('reconnect')) {
            return {
                success: false,
                error: ErrorUtils.getUserFriendlyMessage(error),
                requiresReauth: true
            };
        }

        // Check if error is rate limiting
        if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
            return {
                success: false,
                error: ErrorUtils.getUserFriendlyMessage(error)
            };
        }

        // Return user-friendly error message
        return {
            success: false,
            error: ErrorUtils.getUserFriendlyMessage(error)
        };
    }
}

/**
 * Handle get current Slack status request
 * Fetches current status from Slack API and returns it
 * @returns {Promise<Object>} Response object with current status data
 */
async function handleGetCurrentSlackStatus() {
    try {
        console.log('Fetching current Slack status');

        // Check if user is authenticated
        const authStatus = await SlackAuthUtils.checkAuthStatus();
        if (!authStatus.isAuthenticated) {
            return {
                success: false,
                error: 'Not authenticated with Slack',
                requiresAuth: true
            };
        }

        // Fetch current user profile to get status
        const profile = await SlackAPI.getUserProfile();

        // Extract status information
        const currentEmoji = profile.profile?.status_emoji || '';
        const currentText = profile.profile?.status_text || '';

        // Try to match current status to one of our configured statuses
        let matchedStatus = null;
        for (const [statusKey, config] of Object.entries(STATUS_CONFIGS)) {
            if (config.emoji === currentEmoji && config.text === currentText) {
                matchedStatus = statusKey;
                break;
            }
        }

        // If no match, check last stored status as fallback
        if (!matchedStatus) {
            const lastStatus = await SlackStorageUtils.getLastStatus();
            if (lastStatus) {
                matchedStatus = lastStatus.status;
            }
        }

        console.log('Current Slack status fetched:', {
            emoji: currentEmoji,
            text: currentText,
            matched: matchedStatus
        });

        return {
            success: true,
            data: {
                status: matchedStatus,
                emoji: currentEmoji,
                text: currentText,
                profile: {
                    real_name: profile.profile?.real_name,
                    display_name: profile.profile?.display_name
                }
            }
        };

    } catch (error) {
        console.error('Failed to get current Slack status:', error);

        // Log error with context
        ErrorUtils.logError('handle_get_slack_status', error);

        // Check if error is authentication-related
        if (error.message.includes('authentication') || error.message.includes('reconnect')) {
            return {
                success: false,
                error: ErrorUtils.getUserFriendlyMessage(error),
                requiresReauth: true
            };
        }

        // Try to return last known status from storage as fallback
        try {
            const lastStatus = await SlackStorageUtils.getLastStatus();
            if (lastStatus) {
                console.log('Returning last known status from storage');
                return {
                    success: true,
                    data: {
                        status: lastStatus.status,
                        emoji: lastStatus.emoji,
                        text: lastStatus.text,
                        fromCache: true
                    },
                    warning: 'Showing cached status - could not fetch from Slack'
                };
            }
        } catch (storageError) {
            console.error('Failed to retrieve last status from storage:', storageError);
            ErrorUtils.logError('handle_get_slack_status_fallback', storageError);
        }

        // Return error if we can't get status from API or storage
        return {
            success: false,
            error: ErrorUtils.getUserFriendlyMessage(error)
        };
    }
}

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

                case 'startFocus':
                    console.log('Starting focus mode - enabling website blocking');
                    await updateBlockingRules(true);
                    sendResponse({ success: true, data: { message: 'Blocking enabled' } });
                    break;

                case 'endFocus':
                    console.log('Ending focus mode - disabling website blocking');
                    await updateBlockingRules(false);
                    sendResponse({ success: true, data: { message: 'Blocking disabled' } });
                    break;

                case 'authenticateSlack':
                    console.log('Handling Slack authentication request');
                    const slackAuthResult = await SlackAuthUtils.authenticateSlack();
                    sendResponse({
                        success: true,
                        data: {
                            workspaceName: slackAuthResult.team?.name || 'Unknown Workspace',
                            teamId: slackAuthResult.team?.id,
                            userId: slackAuthResult.authed_user?.id
                        }
                    });
                    break;

                case 'checkSlackAuthStatus':
                    console.log('Checking Slack authentication status');
                    const slackAuthStatus = await SlackAuthUtils.checkAuthStatus();
                    console.log('Slack auth status result:', slackAuthStatus);
                    sendResponse({ success: true, data: slackAuthStatus });
                    break;

                case 'disconnectSlack':
                    console.log('Handling Slack disconnect request');
                    await SlackStorageUtils.clearSlackTokens();
                    await SlackStorageUtils.clearLastStatus();
                    sendResponse({
                        success: true,
                        data: { message: 'Disconnected from Slack successfully' }
                    });
                    break;

                case 'updateSlackStatus':
                    console.log('Handling Slack status update request:', message.status);
                    const updateResult = await handleUpdateSlackStatus(message.status);
                    sendResponse(updateResult);
                    break;

                case 'getCurrentSlackStatus':
                    console.log('Handling get current Slack status request');
                    const currentStatus = await handleGetCurrentSlackStatus();
                    sendResponse(currentStatus);
                    break;

                case 'getLastSlackStatus':
                    console.log('Handling get last Slack status request');
                    const lastStatus = await SlackStorageUtils.getLastStatus();
                    if (lastStatus) {
                        sendResponse({
                            success: true,
                            data: lastStatus
                        });
                    } else {
                        sendResponse({
                            success: false,
                            error: 'No last status found'
                        });
                    }
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
 * This is integrated into the main message listener above
 */
