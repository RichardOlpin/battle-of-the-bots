# Implementation Plan

- [x] 1. Refactor Chrome Extension - Extract Core Logic
  - Create `auraflow-extension/core-logic.js` with all platform-agnostic timer, state management, and data preparation functions
  - Export timer management functions (startTimer, pauseTimer, resumeTimer, stopTimer, getTimerState)
  - Export session state functions (initializeSession, updateSessionState, getSessionState, switchMode)
  - Export data preparation functions (prepareSessionData, prepareFocusTimeRequest, prepareRitualRequest)
  - Export validation and utility functions (validateSessionConfig, formatTime, calculateProgress)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create Chrome Platform Abstraction Layer
  - Create `auraflow-extension/chrome-platform-services.js` with wrapper functions for Chrome APIs
  - Implement saveData, getData, removeData functions using chrome.storage.sync
  - Implement createNotification and requestNotificationPermission using chrome.notifications
  - Implement playSound, stopSound, setSoundVolume for audio operations
  - Implement fetchFromBackend wrapper for network requests
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. Refactor Chrome Extension to Use Abstraction Layer
  - Update `auraflow-extension/popup.js` to import core-logic.js and chrome-platform-services.js
  - Replace all direct Chrome API calls with platform service function calls
  - Replace inline timer logic with core-logic module functions
  - Replace inline state management with core-logic module functions
  - Verify Chrome extension still functions correctly after refactoring
  - _Requirements: 2.3, 2.4, 5.6_

- [x] 4. Create Web Application Structure
  - Create `webapp/` directory at project root
  - Create `webapp/index.html` by adapting `auraflow-extension/popup.html`
  - Add proper HTML5 doctype, meta tags for viewport and PWA
  - Link to style.css, app.js, and manifest.json
  - Create `webapp/style.css` by copying `auraflow-extension/popup.css`
  - Add responsive media queries for tablet (768px+) and desktop (1024px+) breakpoints
  - _Requirements: 3.1, 3.6, 5.1, 5.2, 5.5_

- [x] 5. Implement Web Platform Services
  - Create `webapp/web-platform-services.js` with web API implementations
  - Implement saveData, getData, removeData using localStorage
  - Implement createNotification using Web Notifications API
  - Implement requestNotificationPermission with proper permission handling
  - Implement playSound, stopSound, setSoundVolume using HTML5 Audio API
  - Implement fetchFromBackend using standard fetch API
  - _Requirements: 3.4, 3.7_

- [x] 6. Copy Core Logic to Web Application
  - Copy `auraflow-extension/core-logic.js` to `webapp/core-logic.js`
  - Verify the module exports are compatible with ES6 module syntax
  - _Requirements: 5.3_

- [x] 7. Implement Web Application Main Script
  - Create `webapp/app.js` as the main application orchestrator
  - Import core-logic.js and web-platform-services.js modules
  - Implement initialization function (checkAuth, setupEventListeners, registerServiceWorker)
  - Implement UI event handlers for all buttons and controls
  - Implement screen navigation logic (auth, events, session, loading, error)
  - Implement timer display updates using core-logic callbacks
  - Implement session start/stop/pause handlers
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 8. Create PWA Manifest
  - Create `webapp/manifest.json` with PWA metadata
  - Define name, short_name, description, start_url
  - Set display mode to "standalone"
  - Define background_color (#ffffff) and theme_color (#6366f1)
  - Create icon definitions for 192x192 and 512x512 sizes
  - Set orientation to "portrait-primary"
  - Add categories: ["productivity", "utilities"]
  - Link manifest in webapp/index.html
  - _Requirements: 4.1, 4.6_

- [x] 9. Create PWA Icons
  - Copy existing icons from `auraflow-extension/icons/` to `webapp/icons/`
  - Create or resize icon-192.png (192x192) for PWA
  - Create or resize icon-512.png (512x512) for PWA
  - Ensure icons meet PWA maskable icon requirements
  - _Requirements: 5.4_

- [x] 10. Implement Service Worker
  - Create `webapp/service-worker.js` for offline functionality
  - Define CACHE_NAME and ASSETS_TO_CACHE array
  - Implement install event handler to cache essential files (index.html, style.css, app.js, core-logic.js, icons)
  - Implement fetch event handler with cache-first strategy
  - Implement activate event handler to clean up old caches
  - _Requirements: 4.4, 4.7, 4.8_

- [x] 11. Register Service Worker in Web App
  - Add service worker registration code to webapp/app.js
  - Check for service worker support in browser
  - Register service-worker.js with proper error handling
  - Log registration success/failure for debugging
  - _Requirements: 4.7_

- [x] 12. Implement Offline Functionality
  - Ensure core timer functionality works without network
  - Cache all essential UI assets in service worker
  - Implement offline detection and user feedback
  - Queue backend API calls when offline (optional enhancement)
  - Test app loads and timer works in airplane mode
  - _Requirements: 4.5_

- [x] 13. Implement Responsive Design
  - Add CSS media queries for mobile (< 768px), tablet (768-1023px), desktop (≥ 1024px)
  - Adjust container widths and padding for different screen sizes
  - Ensure touch targets are at least 44x44px on mobile
  - Test layout at 320px, 375px, 768px, and 1024px+ widths
  - Verify all interactive elements are accessible on touch devices
  - _Requirements: 3.6_

- [x] 14. Implement Notification Permissions
  - Request notification permission on app initialization
  - Handle permission granted, denied, and default states
  - Show in-app fallback notifications if permission denied
  - Test notifications work in both granted and denied states
  - _Requirements: 3.7_

- [x] 15. Test Web Application on Desktop
  - Test app loads correctly in Chrome, Firefox, and Safari
  - Verify authentication flow works
  - Verify timer functionality (start, pause, resume, stop)
  - Verify session data persists in localStorage
  - Verify theme switching works
  - Verify AI features integration works
  - Test responsive layout by resizing browser window
  - _Requirements: 6.2, 6.3_

- [x] 16. Test PWA Installation on Mobile
  - Open web app on mobile device (iOS and Android)
  - Verify "Add to Home Screen" prompt appears
  - Install app to home screen
  - Verify app icon appears correctly
  - Launch app from home screen
  - Verify app opens in standalone mode (no browser UI)
  - _Requirements: 4.1, 4.2, 4.3, 6.4_

- [x] 17. Test Offline Functionality
  - Install PWA on mobile device
  - Enable airplane mode or disconnect from network
  - Launch app from home screen
  - Verify main UI loads from cache
  - Verify timer functionality works offline
  - Test session can be started and completed offline
  - Reconnect to network and verify sync (if implemented)
  - _Requirements: 4.5, 6.5, 6.6_

- [ ] 18. Create Testing Documentation
  - Create `WEB_APP_TESTING_GUIDE.txt` in project root
  - Document how to run web app locally (e.g., npx serve webapp)
  - Document desktop browser testing steps
  - Document responsive design testing steps
  - Document mobile PWA installation steps (iOS and Android)
  - Document offline functionality testing steps
  - Include troubleshooting section for common issues
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 19. Optimize Performance
  - Minimize CSS and JavaScript bundle sizes
  - Implement lazy loading for non-critical resources
  - Use requestAnimationFrame for timer display updates
  - Debounce user input handlers
  - Verify app loads in under 3 seconds on 3G network
  - _Requirements: 3.2, 3.3_

- [ ] 20. Implement Security Best Practices
  - Add Content Security Policy meta tag to index.html
  - Sanitize user input for blocked sites list
  - Validate all data before storing in localStorage
  - Ensure all backend API calls use HTTPS
  - Verify service worker only caches public assets
  - _Requirements: 3.4, 3.5_
