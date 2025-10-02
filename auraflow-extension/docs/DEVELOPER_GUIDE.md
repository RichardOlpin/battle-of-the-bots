# Developer Guide

Comprehensive guide for developers working on the AuraFlow Calendar Extension.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The AuraFlow Calendar Extension follows Chrome Extension Manifest V3 architecture with three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Popup UI   │◄────►│   Service    │◄────►│  Google   │ │
│  │  (popup.js)  │      │   Worker     │      │ Calendar  │ │
│  │              │      │(background.js)│      │    API    │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│         │                      │                             │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  popup.html  │      │   Chrome     │                    │
│  │  popup.css   │      │   Storage    │                    │
│  └──────────────┘      └──────────────┘                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Popup (popup.html, popup.js, popup.css)**
- User interface and interaction
- Display calendar events
- Handle user actions (connect, refresh, logout)
- Manage UI state transitions

**Service Worker (background.js)**
- OAuth authentication flow
- Google Calendar API requests
- Token management and refresh
- Error handling and retry logic

**Chrome Storage**
- Persistent token storage
- User preferences
- Error logs for debugging

## File Structure

```
auraflow-extension/
├── manifest.json              # Extension configuration
├── popup.html                 # Popup UI structure
├── popup.css                  # Popup styling
├── popup.js                   # Popup logic
├── background.js              # Service worker
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/                      # Documentation
│   ├── DEVELOPER_GUIDE.md
│   ├── GOOGLE_CLOUD_SETUP.md
│   └── MANUAL_TESTING_CHECKLIST.md
└── tests/                     # Test files
    ├── unit-tests.html
    └── unit-tests.js
```

## Core Components

### 1. Manifest Configuration (manifest.json)

The manifest defines the extension's metadata, permissions, and entry points.

**Key Sections:**

```json
{
  "manifest_version": 3,           // Manifest V3 required
  "permissions": [
    "identity",                     // OAuth authentication
    "storage"                       // Token storage
  ],
  "host_permissions": [
    "https://www.googleapis.com/*"  // Calendar API access
  ],
  "background": {
    "service_worker": "background.js" // Background script
  },
  "action": {
    "default_popup": "popup.html"   // Popup interface
  },
  "oauth2": {
    "client_id": "...",             // Google OAuth client ID
    "scopes": [
      "https://www.googleapis.com/auth/calendar.readonly"
    ]
  }
}
```

### 2. Service Worker (background.js)

The service worker handles all background operations.

**Main Utilities:**

- **StorageUtils**: Token storage and retrieval
- **AuthUtils**: OAuth authentication flow
- **CalendarAPI**: Google Calendar API integration
- **ErrorUtils**: Error handling and logging

**Key Functions:**

```javascript
// Authentication
AuthUtils.authenticateUser()        // Start OAuth flow
AuthUtils.getValidAccessToken()     // Get/refresh token

// Calendar API
CalendarAPI.fetchTodaysEvents()     // Fetch today's events
CalendarAPI.parseCalendarEvents()   // Parse and validate events

// Storage
StorageUtils.storeTokens()          // Store auth tokens
StorageUtils.getStoredTokens()      // Retrieve tokens
StorageUtils.areTokensValid()       // Check token validity
StorageUtils.clearTokens()          // Clear tokens (logout)
```

**Message Handling:**

The service worker listens for messages from the popup:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'authenticate':      // Start OAuth flow
    case 'checkAuthStatus':   // Check if authenticated
    case 'fetchEvents':       // Fetch calendar events
    case 'logout':            // Clear authentication
  }
});
```

### 3. Popup Interface (popup.js)

The popup manages the user interface and state.

**State Management:**

```javascript
let currentScreen = 'auth';         // Current UI screen
let isLoading = false;              // Loading state
let retryAttempts = 0;              // Retry counter
```

**Screen States:**

- `auth`: Authentication screen (connect button)
- `events`: Events display screen
- `loading`: Loading indicator
- `error`: Error message with retry

**Key Functions:**

```javascript
// Initialization
initializePopup()                   // Initialize on load
setupEventListeners()               // Attach event handlers
setupKeyboardNavigation()           // Keyboard accessibility

// User Actions
handleConnect()                     // Connect to Google Calendar
handleRefresh()                     // Refresh events
handleLogout()                      // Logout and clear tokens
handleRetry()                       // Retry failed operation

// UI Updates
showScreen(screenName)              // Switch between screens
displayEvents(events)               // Render calendar events
showError(message)                  // Display error message

// Event Processing
filterValidEvents(events)           // Filter out invalid events
sortEventsChronologically(events)   // Sort by start time
formatEventTime(dateTime)           // Format time display
```

## API Reference

### Chrome Extension APIs Used

**chrome.identity**
```javascript
// Launch OAuth flow
chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
}, callback);

// Get redirect URL
chrome.identity.getRedirectURL();
```

**chrome.storage.local**
```javascript
// Store data
chrome.storage.local.set({ key: value });

// Retrieve data
chrome.storage.local.get(['key'], callback);

// Remove data
chrome.storage.local.remove(['key']);
```

**chrome.runtime**
```javascript
// Send message to service worker
chrome.runtime.sendMessage({ action: 'authenticate' }, callback);

// Listen for messages (in service worker)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message
});
```

### Google Calendar API

**Endpoint:**
```
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
```

**Parameters:**
- `timeMin`: Start of time range (ISO 8601)
- `timeMax`: End of time range (ISO 8601)
- `singleEvents`: true (expand recurring events)
- `orderBy`: startTime (chronological order)
- `maxResults`: 50 (limit results)

**Authentication:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "items": [
    {
      "id": "event_id",
      "summary": "Event Title",
      "start": {
        "dateTime": "2024-01-15T09:00:00-08:00",
        "timeZone": "America/Los_Angeles"
      },
      "end": {
        "dateTime": "2024-01-15T10:00:00-08:00",
        "timeZone": "America/Los_Angeles"
      },
      "status": "confirmed"
    }
  ]
}
```

## Development Workflow

### Initial Setup

1. **Clone/Download the extension**
   ```bash
   cd auraflow-extension
   ```

2. **Configure Google Cloud Console**
   - Follow [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
   - Get OAuth Client ID
   - Update `manifest.json`

3. **Load extension in Chrome**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select extension folder

### Making Changes

1. **Edit files**
   - Make your code changes
   - Save files

2. **Reload extension**
   - Go to `chrome://extensions/`
   - Click refresh icon on extension
   - Or use keyboard shortcut: Ctrl+R (on extensions page)

3. **Test changes**
   - Click extension icon
   - Test functionality
   - Check console for errors

### Debugging

**Popup Console:**
```
Right-click extension icon → Inspect popup
```

**Service Worker Console:**
```
chrome://extensions/ → Click "service worker" link
```

**View Storage:**
```javascript
// In console
chrome.storage.local.get(null, (data) => console.log(data));
```

## Testing

### Unit Tests

Run unit tests in browser:

1. Open `tests/unit-tests.html` in Chrome
2. Click "Run All Tests"
3. Review results

**Test Coverage:**
- Authentication token management
- Event filtering and sorting
- Time formatting
- HTML escaping
- UI state management

### Manual Testing

Follow the comprehensive checklist:
- See [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

### Integration Testing

Test with real Google Calendar:

1. Create test events in Google Calendar
2. Load extension and authenticate
3. Verify events display correctly
4. Test edge cases (empty calendar, many events, etc.)

## Debugging

### Common Issues

**Extension won't load:**
```
Check manifest.json syntax
Verify all files exist
Check console for errors
```

**OAuth fails:**
```
Verify Client ID in manifest.json
Check redirect URI in Google Cloud Console
Ensure extension ID matches
```

**Events don't load:**
```
Check service worker console
Verify API is enabled
Check token validity
Review network requests
```

### Debug Logging

Enable verbose logging:

```javascript
// In background.js or popup.js
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', data);
}
```

### Inspect Storage

```javascript
// View all stored data
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});

// View specific key
chrome.storage.local.get(['auraflow_tokens'], (result) => {
  console.log('Tokens:', result.auraflow_tokens);
});

// Clear storage
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

### Network Debugging

Monitor API requests:

1. Open popup console
2. Go to Network tab
3. Filter by "googleapis.com"
4. Inspect requests and responses

## Common Tasks

### Adding a New Feature

1. **Update requirements** (if needed)
2. **Modify code**
   - Add functions to appropriate file
   - Follow existing code style
   - Add error handling
3. **Update UI** (if needed)
   - Modify popup.html
   - Update popup.css
   - Add event handlers in popup.js
4. **Test thoroughly**
   - Unit tests
   - Manual testing
   - Edge cases
5. **Document changes**
   - Update relevant docs
   - Add code comments

### Changing OAuth Scopes

1. **Update manifest.json**
   ```json
   "oauth2": {
     "scopes": [
       "https://www.googleapis.com/auth/calendar.readonly",
       "https://www.googleapis.com/auth/calendar.events"
     ]
   }
   ```

2. **Update Google Cloud Console**
   - Add new scope in OAuth consent screen
   - Users will need to re-authenticate

3. **Clear existing tokens**
   ```javascript
   chrome.storage.local.remove(['auraflow_tokens']);
   ```

### Updating Styling

1. **Edit popup.css**
   - Maintain consistent design
   - Test different screen sizes
   - Check accessibility (contrast, focus states)

2. **Reload extension**
   - Changes apply immediately on popup reopen

### Adding Error Handling

```javascript
try {
  // Your code
  const result = await someAsyncOperation();
  
  // Validate result
  if (!result) {
    throw new Error('Operation failed');
  }
  
  return result;
} catch (error) {
  // Log error
  console.error('Error context:', error);
  
  // User-friendly message
  const message = ErrorUtils.getUserFriendlyMessage(error);
  
  // Show error to user
  showError(message);
  
  // Determine if recoverable
  if (ErrorUtils.isRecoverableError(error)) {
    // Show retry option
  }
}
```

## Best Practices

### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await for asynchronous code
- Handle all error cases

### Security

- Never log sensitive data (tokens, user info)
- Validate all user input
- Escape HTML to prevent XSS
- Use HTTPS for all API calls
- Request minimum required permissions

### Performance

- Cache data when appropriate
- Avoid unnecessary API calls
- Use efficient DOM manipulation
- Minimize service worker activity
- Implement proper loading states

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Ensure color contrast
- Test with screen readers

### Error Handling

- Catch all errors
- Provide user-friendly messages
- Log errors for debugging
- Implement retry logic
- Handle edge cases

## Troubleshooting

### Extension ID Changes

**Problem:** Extension ID changes on reload

**Solution:**
- Add a `key` field to manifest.json
- Or update redirect URI each time
- Use same folder location

### Token Refresh Fails

**Problem:** Token refresh returns 400 error

**Solution:**
- Refresh tokens may not be issued for extensions
- Implement re-authentication flow
- Clear tokens and prompt user to reconnect

### API Rate Limiting

**Problem:** Too many API requests

**Solution:**
- Implement caching
- Add exponential backoff
- Reduce polling frequency
- Monitor quota usage

### Memory Leaks

**Problem:** Extension uses too much memory

**Solution:**
- Remove event listeners when not needed
- Clear intervals/timeouts
- Avoid global variables
- Profile with Chrome DevTools

## Additional Resources

### Documentation

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/)
- [JSON Formatter](https://chrome.google.com/webstore/detail/json-formatter/)

### Community

- [Stack Overflow - Chrome Extensions](https://stackoverflow.com/questions/tagged/google-chrome-extension)
- [Chrome Extension Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)

## Contributing

When contributing to this project:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test thoroughly before submitting
5. Write clear commit messages

## Version History

- **v1.0.0** - Initial release
  - OAuth authentication
  - Calendar event display
  - Basic error handling

## License

[Add your license information here]

## Support

For issues or questions:
- Check this developer guide
- Review troubleshooting section
- Check browser console for errors
- Review Google Cloud Console logs
