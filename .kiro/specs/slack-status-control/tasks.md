# Implementation Plan

- [x] 1. Set up Slack OAuth configuration and storage utilities
  - Add Slack API host permissions to manifest.json
  - Implement SlackStorageUtils module in background.js with functions to store, retrieve, validate, and clear Slack tokens
  - Implement functions to store and retrieve last selected status
  - Write unit tests for storage utilities
  - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [x] 2. Implement Slack authentication flow in service worker
  - Create SlackAuthUtils module in background.js
  - Implement authenticateSlack() function using chrome.identity.launchWebAuthFlow
  - Implement OAuth code exchange for access token
  - Implement getValidSlackToken() function to retrieve stored tokens
  - Add message handlers for 'authenticateSlack' and 'checkSlackAuthStatus' actions
  - Write unit tests for authentication utilities
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement Slack API integration module
  - Create SlackAPI module in background.js
  - Implement makeSlackAPICall() helper function with error handling
  - Implement setUserStatus() function to update Slack status emoji and text
  - Implement setUserPresence() function to update presence
  - Implement setDndSnooze() and endDndSnooze() functions for DND mode
  - Implement getUserProfile() function to fetch current status
  - Implement getTeamInfo() function to fetch workspace information
  - Implement parseSlackError() function for user-friendly error messages
  - Write unit tests for API module
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 4. Add Slack status UI components to popup
  - Add Slack status section HTML to popup.html with connect button and status toggle buttons
  - Add CSS styles for Slack status section following existing design system
  - Add loading states and active status indicators
  - Add error message display area
  - Ensure responsive layout within 400px popup width
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Implement frontend status control logic
  - Add initializeSlackStatus() function to popup.js to check connection status on load
  - Implement handleConnectSlack() function to initiate OAuth flow
  - Implement handleDisconnectSlack() function to clear tokens and update UI
  - Implement handleSlackStatusChange() function to send status update requests
  - Implement loadCurrentSlackStatus() function to fetch and display current status
  - Implement updateSlackStatusUI() function to update button active states
  - Implement displaySlackError() function to show error messages
  - Add event listeners for all Slack status buttons
  - _Requirements: 2.1, 2.2, 2.5, 3.5, 3.6, 3.7, 4.4, 5.3, 5.4_

- [x] 6. Implement status update message handlers in service worker
  - Add message handler for 'updateSlackStatus' action
  - Implement handleUpdateSlackStatus() function to map status to API calls
  - Implement status configurations for Available, Focused, and DND modes
  - Add message handler for 'getCurrentSlackStatus' action
  - Add message handler for 'disconnectSlack' action
  - Ensure proper error handling and user-friendly error messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.1_

- [x] 7. Implement error handling and recovery mechanisms
  - Add error handling for authentication failures in SlackAuthUtils
  - Add error handling for API errors (rate limiting, invalid auth, network errors)
  - Implement automatic token clearing on invalid_auth errors
  - Add retry logic with exponential backoff for rate limiting
  - Implement user-friendly error message mapping
  - Add error logging to ErrorUtils
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Add status persistence and synchronization
  - Store selected status in chrome.storage.local after each update
  - Load and display last known status immediately on popup open
  - Fetch current status from Slack API to sync with actual state
  - Update UI if current Slack status differs from last known status
  - Handle cases where status was changed outside the extension
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Write integration tests for complete flows
  - Write test for complete authentication flow from button click to token storage
  - Write test for status update flow for each status type (Available, Focused, DND)
  - Write test for disconnect flow
  - Write test for status persistence across popup reopens
  - Write test for error scenarios (expired token, network error, rate limiting)
  - _Requirements: All requirements_

- [x] 10. Perform manual testing and bug fixes
  - Test initial connection flow with real Slack workspace
  - Test all three status updates and verify in Slack app
  - Test status persistence by closing and reopening popup
  - Test error handling by simulating network failures
  - Test disconnect flow
  - Test UI responsiveness and loading states
  - Fix any bugs discovered during testing
  - _Requirements: All requirements_
