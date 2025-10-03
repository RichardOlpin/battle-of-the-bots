# Design Document: Slack Status Control

## Overview

This feature integrates Slack status management into the AuraFlow Chrome extension, allowing users to control their Slack presence and status directly from the extension popup. The implementation follows the existing extension architecture pattern, using OAuth for authentication, Chrome storage for token management, and the Slack Web API for status updates.

The feature will add a new UI section to the extension popup with three status buttons (Available, Focused, Do Not Disturb) that update the user's Slack status when clicked. The integration will be self-contained and non-intrusive to existing functionality.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Extension Popup (popup.js)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Slack Status Control UI                               │ │
│  │  - Connect Slack Button                                │ │
│  │  - Status Toggle Buttons (Available/Focused/DND)       │ │
│  │  - Current Status Display                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│                  sendMessageToServiceWorker()                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Worker (background.js)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SlackAuthUtils                                        │ │
│  │  - authenticateSlack()                                 │ │
│  │  - getValidSlackToken()                                │ │
│  │  - refreshSlackToken()                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SlackAPI                                              │ │
│  │  - setUserStatus()                                     │ │
│  │  - getUserStatus()                                     │ │
│  │  - setDndStatus()                                      │ │
│  │  - endDndStatus()                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SlackStorageUtils                                     │ │
│  │  - storeSlackTokens()                                  │ │
│  │  - getStoredSlackTokens()                              │ │
│  │  - clearSlackTokens()                                  │ │
│  │  - storeLastStatus()                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Slack Web API                             │
│  - OAuth 2.0 Authentication                                  │
│  - users.profile.set (status updates)                        │
│  - users.setPresence (presence updates)                      │
│  - dnd.setSnooze (DND mode)                                  │
│  - dnd.endSnooze (end DND)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User clicks "Connect Slack"
         │
         ▼
popup.js sends 'authenticateSlack' message
         │
         ▼
background.js initiates OAuth flow
         │
         ▼
chrome.identity.launchWebAuthFlow()
         │
         ▼
User authorizes on Slack OAuth page
         │
         ▼
Redirect URL with authorization code
         │
         ▼
Exchange code for access token
         │
         ▼
Store tokens in chrome.storage.local
         │
         ▼
Fetch and display current Slack status
         │
         ▼
Show status toggle buttons in UI
```

## Components and Interfaces

### 1. UI Components (popup.html / popup.css)

#### HTML Structure
```html
<!-- Slack Status Control Section -->
<div id="slack-status-section" class="slack-section">
    <h4>🔔 Slack Status</h4>
    
    <!-- Not Connected State -->
    <div id="slack-not-connected" class="slack-not-connected">
        <p class="slack-description">Control your Slack status from here</p>
        <button id="connect-slack-btn" class="primary-btn">
            <span class="btn-icon">🔗</span>
            Connect Slack
        </button>
    </div>
    
    <!-- Connected State -->
    <div id="slack-connected" class="slack-connected hidden">
        <div class="slack-workspace-info">
            <span id="slack-workspace-name">Workspace Name</span>
            <button id="disconnect-slack-btn" class="text-btn">Disconnect</button>
        </div>
        
        <div class="slack-status-buttons">
            <button id="slack-status-available" class="slack-status-btn" data-status="available">
                <span class="status-icon">🟢</span>
                <span class="status-label">Available</span>
            </button>
            <button id="slack-status-focused" class="slack-status-btn" data-status="focused">
                <span class="status-icon">🎯</span>
                <span class="status-label">Focused</span>
            </button>
            <button id="slack-status-dnd" class="slack-status-btn" data-status="dnd">
                <span class="status-icon">🔕</span>
                <span class="status-label">Do Not Disturb</span>
            </button>
        </div>
        
        <div id="slack-status-error" class="slack-error hidden" role="alert"></div>
    </div>
</div>
```

#### CSS Styling
- Follow existing AuraFlow design system
- Use consistent button styles with existing UI
- Add active state indicator for current status
- Include loading states for button interactions
- Responsive layout that fits within popup width (400px)

### 2. Frontend Logic (popup.js)

#### New Functions

```javascript
// Slack Status Management
async function initializeSlackStatus() {
    // Check if Slack is connected
    // Load and display current status
    // Set up event listeners for status buttons
}

async function handleConnectSlack() {
    // Show loading state
    // Send authenticateSlack message to service worker
    // Handle success/error responses
    // Update UI to show connected state
}

async function handleDisconnectSlack() {
    // Confirm with user
    // Send disconnectSlack message to service worker
    // Update UI to show disconnected state
}

async function handleSlackStatusChange(status) {
    // Show loading indicator on clicked button
    // Send updateSlackStatus message to service worker
    // Update UI to reflect new active status
    // Handle errors gracefully
}

async function loadCurrentSlackStatus() {
    // Fetch current status from service worker
    // Update UI to show active status
    // Handle cases where status was changed outside extension
}

function displaySlackError(message) {
    // Show error message in UI
    // Auto-hide after 5 seconds
}

function updateSlackStatusUI(status) {
    // Remove active class from all buttons
    // Add active class to current status button
    // Update visual indicators
}
```

#### Event Listeners
- Connect Slack button click
- Disconnect Slack button click
- Status button clicks (Available, Focused, DND)
- Popup open event (to refresh current status)

### 3. Service Worker Logic (background.js)

#### SlackStorageUtils Module

```javascript
const SlackStorageUtils = {
    async storeSlackTokens(tokens) {
        // Store access_token, team_id, user_id, expires_at
        // Use key: 'auraflow_slack_tokens'
    },
    
    async getStoredSlackTokens() {
        // Retrieve stored Slack tokens
        // Return null if not found
    },
    
    async areSlackTokensValid() {
        // Check if tokens exist and not expired
        // Return boolean
    },
    
    async clearSlackTokens() {
        // Remove Slack tokens from storage
    },
    
    async storeLastStatus(status) {
        // Store last selected status for UI persistence
        // Use key: 'auraflow_slack_last_status'
    },
    
    async getLastStatus() {
        // Retrieve last selected status
    }
};
```

#### SlackAuthUtils Module

```javascript
const SlackAuthUtils = {
    // Slack OAuth configuration
    CLIENT_ID: 'YOUR_SLACK_CLIENT_ID', // To be configured
    CLIENT_SECRET: 'YOUR_SLACK_CLIENT_SECRET', // To be configured
    REDIRECT_URI: chrome.identity.getRedirectURL('slack'),
    SCOPES: [
        'users.profile:write',  // Update user profile/status
        'users:write',          // Update presence
        'dnd:write',            // Control DND
        'users.profile:read',   // Read current status
        'team:read'             // Get workspace info
    ],
    
    async authenticateSlack() {
        // Build OAuth URL
        // Launch chrome.identity.launchWebAuthFlow
        // Parse authorization code from redirect
        // Exchange code for access token
        // Store tokens
        // Return success with workspace info
    },
    
    async getValidSlackToken() {
        // Get stored tokens
        // Check if valid
        // Return access token
        // Throw error if invalid/expired
    },
    
    async exchangeCodeForToken(code) {
        // POST to https://slack.com/api/oauth.v2.access
        // Include client_id, client_secret, code, redirect_uri
        // Parse response
        // Return token data
    }
};
```

#### SlackAPI Module

```javascript
const SlackAPI = {
    BASE_URL: 'https://slack.com/api',
    
    async setUserStatus(statusEmoji, statusText, statusExpiration = 0) {
        // Call users.profile.set API
        // Set profile.status_emoji and profile.status_text
        // Set profile.status_expiration if provided
        // Return success/error
    },
    
    async setUserPresence(presence) {
        // Call users.setPresence API
        // Set presence to 'auto' or 'away'
        // Return success/error
    },
    
    async getUserProfile() {
        // Call users.profile.get API
        // Return current status and profile info
    },
    
    async setDndSnooze(numMinutes) {
        // Call dnd.setSnooze API
        // Set DND for specified minutes (default: 60)
        // Return success/error
    },
    
    async endDndSnooze() {
        // Call dnd.endSnooze API
        // End DND mode
        // Return success/error
    },
    
    async getTeamInfo() {
        // Call team.info API
        // Return workspace name and info
    },
    
    // Helper method for API calls
    async makeSlackAPICall(endpoint, method, body) {
        // Get valid access token
        // Make fetch request to Slack API
        // Handle rate limiting (429 responses)
        // Handle errors (invalid_auth, etc.)
        // Return parsed response
    }
};
```

#### Message Handler Updates

```javascript
// Add new message handlers in chrome.runtime.onMessage listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Existing handlers...
    
    // Slack authentication
    if (message.action === 'authenticateSlack') {
        handleSlackAuthentication(sendResponse);
        return true;
    }
    
    // Disconnect Slack
    if (message.action === 'disconnectSlack') {
        handleSlackDisconnect(sendResponse);
        return true;
    }
    
    // Check Slack auth status
    if (message.action === 'checkSlackAuthStatus') {
        handleCheckSlackAuthStatus(sendResponse);
        return true;
    }
    
    // Update Slack status
    if (message.action === 'updateSlackStatus') {
        handleUpdateSlackStatus(message.status, sendResponse);
        return true;
    }
    
    // Get current Slack status
    if (message.action === 'getCurrentSlackStatus') {
        handleGetCurrentSlackStatus(sendResponse);
        return true;
    }
});

async function handleSlackAuthentication(sendResponse) {
    try {
        const result = await SlackAuthUtils.authenticateSlack();
        const teamInfo = await SlackAPI.getTeamInfo();
        sendResponse({ 
            success: true, 
            data: { 
                workspaceName: teamInfo.name 
            } 
        });
    } catch (error) {
        sendResponse({ 
            success: false, 
            error: ErrorUtils.getUserFriendlyMessage(error) 
        });
    }
}

async function handleUpdateSlackStatus(status, sendResponse) {
    try {
        // Map status to Slack API calls
        switch (status) {
            case 'available':
                await SlackAPI.setUserStatus('', '', 0); // Clear status
                await SlackAPI.setUserPresence('auto');
                await SlackAPI.endDndSnooze();
                break;
            
            case 'focused':
                await SlackAPI.setUserStatus(':dart:', 'In focus mode', 0);
                await SlackAPI.setUserPresence('auto');
                break;
            
            case 'dnd':
                await SlackAPI.setUserStatus(':no_bell:', 'Do not disturb', 0);
                await SlackAPI.setDndSnooze(60); // 60 minutes default
                break;
        }
        
        // Store last status
        await SlackStorageUtils.storeLastStatus(status);
        
        sendResponse({ success: true, data: { status } });
    } catch (error) {
        sendResponse({ 
            success: false, 
            error: ErrorUtils.getUserFriendlyMessage(error) 
        });
    }
}
```

### 4. Manifest Updates (manifest.json)

```json
{
  "permissions": [
    "identity",
    "storage",
    "alarms",
    "notifications",
    "declarativeNetRequest"
  ],
  "host_permissions": [
    "https://www.googleapis.com/*",
    "https://slack.com/*",
    "https://slack.com/api/*",
    "*://*/*"
  ],
  "oauth2": {
    "client_id": "369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  }
}
```

Note: Slack OAuth uses a different flow than Google OAuth. We'll use `chrome.identity.launchWebAuthFlow` with a custom OAuth URL rather than the `oauth2` manifest key.

## Data Models

### Slack Token Storage

```javascript
{
  auraflow_slack_tokens: {
    access_token: string,      // Slack access token
    token_type: string,         // "Bearer"
    scope: string,              // Granted scopes
    bot_user_id: string,        // Bot user ID (if applicable)
    app_id: string,             // App ID
    team: {
      id: string,               // Workspace ID
      name: string              // Workspace name
    },
    authed_user: {
      id: string,               // User ID
      scope: string,            // User scopes
      access_token: string,     // User access token
      token_type: string        // "Bearer"
    },
    expires_at: number          // Timestamp (Slack tokens don't expire by default, but we track for consistency)
  }
}
```

### Last Status Storage

```javascript
{
  auraflow_slack_last_status: {
    status: string,             // 'available' | 'focused' | 'dnd'
    timestamp: number,          // When status was set
    emoji: string,              // Status emoji
    text: string                // Status text
  }
}
```

### Status Configuration

```javascript
const STATUS_CONFIGS = {
  available: {
    emoji: '',
    text: '',
    expiration: 0,
    presence: 'auto',
    dnd: false
  },
  focused: {
    emoji: ':dart:',
    text: 'In focus mode',
    expiration: 0,
    presence: 'auto',
    dnd: false
  },
  dnd: {
    emoji: ':no_bell:',
    text: 'Do not disturb',
    expiration: 0,
    presence: 'auto',
    dnd: true,
    dndMinutes: 60
  }
};
```

## Error Handling

### Error Categories

1. **Authentication Errors**
   - OAuth flow cancelled by user
   - Invalid client credentials
   - Insufficient permissions
   - Token expired/invalid

2. **API Errors**
   - Rate limiting (429)
   - Invalid authentication (401)
   - Missing scopes (403)
   - Network errors
   - Slack API unavailable (5xx)

3. **Storage Errors**
   - Failed to save tokens
   - Failed to retrieve tokens
   - Storage quota exceeded

### Error Handling Strategy

```javascript
// Error handling in SlackAPI
async makeSlackAPICall(endpoint, method, body) {
    try {
        const token = await SlackAuthUtils.getValidSlackToken();
        
        const response = await fetch(`${this.BASE_URL}/${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        
        const data = await response.json();
        
        // Slack API returns ok: false for errors
        if (!data.ok) {
            throw new Error(this.parseSlackError(data.error));
        }
        
        return data;
    } catch (error) {
        // Log error
        ErrorUtils.logError('SlackAPI', error);
        
        // Handle specific errors
        if (error.message.includes('invalid_auth')) {
            await SlackStorageUtils.clearSlackTokens();
            throw new Error('Slack authentication expired. Please reconnect.');
        }
        
        if (error.message.includes('rate_limited')) {
            throw new Error('Too many requests. Please wait a moment.');
        }
        
        throw error;
    }
}

parseSlackError(errorCode) {
    const errorMessages = {
        'invalid_auth': 'Invalid authentication token',
        'not_authed': 'Not authenticated',
        'account_inactive': 'Account is inactive',
        'token_revoked': 'Token has been revoked',
        'no_permission': 'Missing required permissions',
        'rate_limited': 'Rate limit exceeded',
        'missing_scope': 'Missing required OAuth scope'
    };
    
    return errorMessages[errorCode] || `Slack API error: ${errorCode}`;
}
```

### User-Facing Error Messages

- **Connection Failed**: "Failed to connect to Slack. Please try again."
- **Token Expired**: "Your Slack connection has expired. Please reconnect."
- **Rate Limited**: "Too many requests. Please wait a moment and try again."
- **Missing Permissions**: "Missing required permissions. Please reconnect and grant access."
- **Network Error**: "Network error. Please check your connection and try again."
- **Generic Error**: "Failed to update Slack status. Please try again."

### Error Recovery

1. **Automatic Token Refresh**: Not applicable (Slack tokens don't expire)
2. **Retry Logic**: Implement exponential backoff for rate limiting
3. **Graceful Degradation**: Show last known status if API call fails
4. **Clear Error States**: Auto-dismiss error messages after 5 seconds
5. **Re-authentication Prompt**: Clear tokens and show connect button on auth errors

## Testing Strategy

### Unit Tests

1. **SlackStorageUtils Tests**
   - Test token storage and retrieval
   - Test token validation
   - Test token clearing
   - Test last status storage

2. **SlackAuthUtils Tests**
   - Test OAuth URL generation
   - Test code exchange (mocked)
   - Test token validation

3. **SlackAPI Tests**
   - Test API call construction
   - Test error parsing
   - Test status update logic
   - Test DND mode toggling

### Integration Tests

1. **Authentication Flow**
   - Test complete OAuth flow
   - Test token storage after auth
   - Test workspace info retrieval

2. **Status Update Flow**
   - Test each status button
   - Test status persistence
   - Test UI updates after status change

3. **Error Scenarios**
   - Test expired token handling
   - Test network error handling
   - Test rate limiting handling

### Manual Testing Checklist

1. **Initial Connection**
   - [ ] Click "Connect Slack" button
   - [ ] Complete OAuth flow
   - [ ] Verify workspace name displayed
   - [ ] Verify status buttons appear

2. **Status Updates**
   - [ ] Click "Available" - verify Slack status cleared
   - [ ] Click "Focused" - verify status shows 🎯 "In focus mode"
   - [ ] Click "DND" - verify status shows 🔕 and DND enabled
   - [ ] Verify active status highlighted in UI

3. **Persistence**
   - [ ] Set status, close popup, reopen - verify status persists
   - [ ] Change status in Slack app - verify extension reflects change

4. **Error Handling**
   - [ ] Disconnect internet - verify error message
   - [ ] Revoke token in Slack - verify re-auth prompt
   - [ ] Click status rapidly - verify no duplicate requests

5. **Disconnection**
   - [ ] Click "Disconnect" button
   - [ ] Verify tokens cleared
   - [ ] Verify UI shows "Connect Slack" button

### Browser Testing

- Test in Chrome (primary target)
- Test in Edge (Chromium-based, should work)
- Verify popup dimensions and layout
- Test keyboard navigation
- Test screen reader compatibility

## Security Considerations

1. **Token Storage**
   - Store tokens in chrome.storage.local (encrypted by Chrome)
   - Never log tokens to console in production
   - Clear tokens on disconnect

2. **OAuth Flow**
   - Use chrome.identity.launchWebAuthFlow for secure OAuth
   - Validate redirect URL
   - Use state parameter to prevent CSRF

3. **API Calls**
   - Always use HTTPS
   - Validate API responses
   - Sanitize user input (though minimal in this feature)

4. **Permissions**
   - Request minimal required Slack scopes
   - Clearly explain why each permission is needed
   - Allow users to disconnect at any time

## Performance Considerations

1. **API Call Optimization**
   - Cache current status locally
   - Debounce rapid button clicks
   - Use single API call per status change when possible

2. **UI Responsiveness**
   - Show loading states immediately
   - Update UI optimistically where safe
   - Handle slow network gracefully

3. **Storage Efficiency**
   - Store only necessary token data
   - Clean up old error logs periodically
   - Limit stored status history

## Future Enhancements

1. **Custom Status Messages**
   - Allow users to customize status text
   - Save favorite status presets

2. **Automatic Status Updates**
   - Auto-set "Focused" when starting focus session
   - Auto-restore previous status when session ends

3. **Multiple Workspaces**
   - Support connecting multiple Slack workspaces
   - Toggle status across all workspaces simultaneously

4. **Status Scheduling**
   - Schedule status changes based on calendar events
   - Set DND during specific hours

5. **Integration with Focus Sessions**
   - Link Slack status to AuraFlow focus sessions
   - Sync DND duration with session timer
