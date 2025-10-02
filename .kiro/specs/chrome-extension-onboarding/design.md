# Design Document

## Overview

The AuraFlow Chrome Extension is a browser popup extension that provides quick access to today's Google Calendar events. The extension uses Chrome's Extension API v3 (Manifest V3) and integrates with Google Calendar API through OAuth 2.0 authentication. The design prioritizes simplicity, security, and user experience with a clean popup interface that displays calendar events in an easy-to-scan format.

The extension follows Chrome's security best practices by using service workers, secure storage, and proper content security policies. The authentication flow leverages Chrome's identity API for seamless OAuth integration with Google services.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Service Worker  │    │  Google Calendar│
│   (popup.html)  │◄──►│  (background.js) │◄──►│      API        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Popup Script  │    │  Chrome Storage  │
│   (popup.js)    │    │   (secure)       │
└─────────────────┘    └──────────────────┘
```

### Component Breakdown

**Manifest (manifest.json)**
- Defines extension metadata, permissions, and entry points
- Specifies required permissions for Google Calendar API and Chrome storage
- Configures service worker and popup interface

**Service Worker (background.js)**
- Handles OAuth authentication flow using Chrome Identity API
- Manages Google Calendar API requests and token refresh
- Stores and retrieves authentication tokens securely

**Popup Interface (popup.html + popup.js)**
- Displays authentication UI or calendar events based on auth state
- Handles user interactions (connect, disconnect, refresh)
- Renders today's events in a clean, readable format

**Chrome Storage**
- Securely stores OAuth tokens and user preferences
- Persists authentication state across browser sessions

## Components and Interfaces

### 1. Manifest Configuration

**File:** `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "AuraFlow Calendar",
  "version": "1.0.0",
  "description": "Quick access to today's Google Calendar events",
  "permissions": [
    "identity",
    "storage"
  ],
  "host_permissions": [
    "https://www.googleapis.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "AuraFlow Calendar"
  },
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
  }
}
```

### 2. Service Worker (Background Script)

**File:** `background.js`

**Key Functions:**
- `authenticateUser()`: Initiates OAuth flow using chrome.identity.launchWebAuthFlow
- `getStoredToken()`: Retrieves cached authentication token from chrome.storage
- `refreshToken()`: Handles token refresh when expired
- `fetchCalendarEvents(date)`: Makes API calls to Google Calendar
- `clearAuthentication()`: Removes stored tokens on logout

**API Integration:**
- Google Calendar API v3 endpoint: `https://www.googleapis.com/calendar/v3/calendars/primary/events`
- OAuth 2.0 scopes: `calendar.readonly`
- Token storage in `chrome.storage.secure` (if available) or `chrome.storage.local`

### 3. Popup Interface

**File:** `popup.html`

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Authentication State -->
    <div id="auth-screen" class="screen">
      <h2>AuraFlow Calendar</h2>
      <p>Connect your Google Calendar to see today's events</p>
      <button id="connect-btn">Connect Google Calendar</button>
    </div>
    
    <!-- Calendar Events State -->
    <div id="events-screen" class="screen hidden">
      <div class="header">
        <h3 id="date-header">Today's Events</h3>
        <button id="refresh-btn">↻</button>
        <button id="logout-btn">Logout</button>
      </div>
      <div id="events-container">
        <!-- Events will be populated here -->
      </div>
      <div id="no-events" class="hidden">
        <p>No events today</p>
      </div>
    </div>
    
    <!-- Loading State -->
    <div id="loading-screen" class="screen hidden">
      <p>Loading events...</p>
    </div>
    
    <!-- Error State -->
    <div id="error-screen" class="screen hidden">
      <p id="error-message">Something went wrong</p>
      <button id="retry-btn">Try Again</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

**File:** `popup.js`

**Key Functions:**
- `checkAuthStatus()`: Determines which screen to show on popup open
- `handleConnect()`: Triggers authentication flow via service worker
- `displayEvents(events)`: Renders calendar events in the UI
- `formatEventTime(startTime, endTime)`: Formats event times for display
- `handleLogout()`: Clears authentication and returns to auth screen

### 4. Styling

**File:** `popup.css`

**Design Principles:**
- Clean, minimal interface with good typography
- Consistent spacing and visual hierarchy
- Responsive design for different popup sizes
- Loading states and smooth transitions
- Accessible color contrast and focus states

## Data Models

### Authentication Token
```javascript
{
  access_token: string,
  refresh_token: string,
  expires_at: number, // Unix timestamp
  token_type: "Bearer"
}
```

### Calendar Event
```javascript
{
  id: string,
  summary: string, // Event title
  start: {
    dateTime: string, // ISO 8601 format
    timeZone: string
  },
  end: {
    dateTime: string,
    timeZone: string
  },
  status: string // "confirmed", "tentative", "cancelled"
}
```

### UI State
```javascript
{
  currentScreen: "auth" | "events" | "loading" | "error",
  isAuthenticated: boolean,
  lastFetch: number, // Unix timestamp
  events: CalendarEvent[]
}
```

## Error Handling

### Authentication Errors
- **OAuth Failure**: Display clear error message with retry option
- **Token Expiry**: Automatically attempt refresh, fallback to re-authentication
- **Network Issues**: Show offline message with manual retry

### API Errors
- **Rate Limiting**: Implement exponential backoff with user notification
- **Calendar Access Denied**: Clear error message about permissions
- **Invalid Response**: Graceful degradation with error logging

### User Experience Errors
- **Empty Calendar**: Friendly "No events today" message
- **Loading Timeout**: Show retry option after 10 seconds
- **Extension Errors**: Fallback UI with basic functionality

## Testing Strategy

### Unit Testing
- **Service Worker Functions**: Mock Chrome APIs and Google Calendar responses
- **Popup Logic**: Test UI state management and event rendering
- **Authentication Flow**: Mock OAuth responses and token handling
- **Error Scenarios**: Test all error conditions and recovery paths

### Integration Testing
- **End-to-End Authentication**: Test complete OAuth flow in Chrome
- **Calendar API Integration**: Test with real Google Calendar data
- **Storage Persistence**: Verify token storage and retrieval across sessions
- **Cross-Browser Compatibility**: Test on different Chrome versions

### Manual Testing Scenarios
1. **First-time Installation**: Install extension and complete authentication
2. **Daily Usage**: Open popup multiple times throughout the day
3. **Token Expiry**: Test behavior when tokens expire
4. **Network Offline**: Test offline behavior and recovery
5. **Calendar Permissions**: Test with different Google account permission levels
6. **Multiple Events**: Test with various event types and times
7. **No Events**: Test empty calendar day scenario

### Performance Testing
- **Popup Load Time**: Measure time from click to display (target: <500ms)
- **API Response Time**: Monitor Google Calendar API response times
- **Memory Usage**: Ensure minimal memory footprint for service worker
- **Battery Impact**: Verify minimal background processing

## Local Development Setup

### Development Environment
Chrome extensions are developed as local files that get loaded directly into Chrome for testing. No build process or server is required for basic development.

**Project Structure:**
```
auraflow-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── popup.html            # Popup interface
├── popup.js              # Popup logic
├── popup.css             # Popup styling
└── icons/                # Extension icons (16x16, 48x48, 128x128)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Development Workflow

**1. Create Extension Files**
- Create a new folder for the extension
- Add all the files listed in the project structure
- Start with basic HTML/CSS/JS - no special build tools needed

**2. Load Extension in Chrome**
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode" (toggle in top right)
- Click "Load unpacked" and select your extension folder
- The extension will appear in your extensions list and toolbar

**3. Development Cycle**
- Make changes to your files
- Go back to `chrome://extensions/`
- Click the refresh icon on your extension to reload changes
- Test the changes by clicking the extension icon

**4. Debugging**
- **Popup Debugging**: Right-click extension icon → "Inspect popup"
- **Service Worker Debugging**: Go to `chrome://extensions/` → Click "service worker" link under your extension
- **Console Logs**: Use `console.log()` in your JavaScript files
- **Network Tab**: Monitor API calls in the popup's developer tools

### Google Calendar API Setup

**Before Development:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials (Web application type)
5. Add `chrome-extension://[your-extension-id]` to authorized origins
6. Copy the client ID to your manifest.json

**Note**: During development, the extension ID changes each time you reload. For stable development, you can:
- Use a key in manifest.json to maintain consistent extension ID
- Or set up a local development server for OAuth redirect

### Testing Approach

**Manual Testing:**
- Install extension in Chrome
- Test authentication flow with your Google account
- Verify calendar events display correctly
- Test error scenarios (network offline, auth failure)

**Automated Testing:**
- Use Chrome's extension testing APIs
- Write unit tests for popup.js functions
- Mock Chrome APIs and Google Calendar responses

**Live Reload Development:**
- Use tools like `web-ext` for automatic reloading
- Or manually refresh extension after each change

### Common Development Gotchas

**Manifest V3 Differences:**
- Use service workers instead of background pages
- Different API patterns for storage and messaging
- Stricter Content Security Policy

**OAuth in Extensions:**
- Extension ID must be registered with Google OAuth
- Use `chrome.identity.launchWebAuthFlow()` for authentication
- Handle popup blockers and user gesture requirements

**Debugging Tips:**
- Service worker logs appear in a separate console
- Popup console closes when popup closes
- Use `chrome.storage` instead of localStorage for persistence

## Security Considerations

### Token Security
- Store tokens in Chrome's secure storage API
- Never expose tokens in console logs or error messages
- Implement proper token refresh flow
- Clear tokens on logout or uninstall

### API Security
- Use minimum required OAuth scopes (calendar.readonly)
- Validate all API responses before processing
- Implement proper HTTPS certificate validation
- Use Content Security Policy to prevent XSS

### Privacy Protection
- Only request calendar event titles, times, and basic metadata
- No storage of calendar content beyond current session
- Clear privacy policy about data usage
- Respect user's Google account privacy settings