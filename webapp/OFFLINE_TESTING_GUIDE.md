# AuraFlow PWA - Offline Functionality Testing Guide

This guide provides comprehensive instructions for testing the offline functionality of the AuraFlow Progressive Web App (PWA).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Automated Verification](#automated-verification)
3. [Desktop Browser Testing](#desktop-browser-testing)
4. [Mobile Device Testing](#mobile-device-testing)
5. [Test Scenarios](#test-scenarios)
6. [Troubleshooting](#troubleshooting)
7. [Expected Behavior](#expected-behavior)

---

## Prerequisites

### Required Setup

1. **Web Server Running**
   - The PWA must be served over HTTPS or localhost
   - Service Workers only work on secure origins
   - Run: `npx serve webapp` or use any local server

2. **Modern Browser**
   - Chrome/Edge 67+ (recommended)
   - Firefox 44+
   - Safari 11.1+

3. **Test Devices**
   - Desktop browser for initial testing
   - iOS device (iPhone/iPad) with Safari
   - Android device with Chrome

---

## Automated Verification

### Using the Verification Script

1. **Open the web app** in your browser
2. **Open DevTools Console** (F12 or Cmd+Option+I)
3. **Load the verification script**:
   ```javascript
   // In the console, load the script
   const script = document.createElement('script');
   script.src = '/verify-offline.js';
   document.head.appendChild(script);
   ```

4. **Run automated checks**:
   ```javascript
   await OfflineVerification.runAllChecks();
   ```

5. **View manual testing steps**:
   ```javascript
   OfflineVerification.getManualTestingSteps();
   ```

### What the Script Checks

- ✅ Service Worker registration and activation
- ✅ Cache storage and essential assets
- ✅ LocalStorage functionality
- ✅ Offline detection mechanisms
- ✅ Core logic module availability
- ✅ Cached resource accessibility

---

## Desktop Browser Testing

### Step 1: Initial Setup

1. Open Chrome/Edge browser
2. Navigate to `http://localhost:3000` (or your server URL)
3. Open DevTools (F12)
4. Go to **Application** tab

### Step 2: Verify Service Worker

1. In Application tab, click **Service Workers**
2. Verify:
   - ✅ Service worker is registered
   - ✅ Status shows "activated and is running"
   - ✅ Source shows `/service-worker.js`

### Step 3: Verify Cache Storage

1. In Application tab, click **Cache Storage**
2. Expand the `auraflow-v2` cache
3. Verify essential files are cached:
   - ✅ `/` or `/index.html`
   - ✅ `/style.css`
   - ✅ `/app.js`
   - ✅ `/core-logic.js`
   - ✅ `/web-platform-services.js`
   - ✅ `/manifest.json`
   - ✅ Icon files

### Step 4: Test Offline Mode

1. In DevTools, go to **Network** tab
2. Check the **Offline** checkbox (top of Network tab)
3. Reload the page (Cmd+R or Ctrl+R)
4. Verify:
   - ✅ Page loads successfully
   - ✅ UI is fully visible
   - ✅ No broken images or styles
   - ✅ Console shows "[Service Worker] Serving from cache" messages

### Step 5: Test Timer Functionality Offline

1. With offline mode still enabled:
2. Click **"Quick Focus"** button
3. Verify:
   - ✅ Session screen appears
   - ✅ Timer starts counting down
   - ✅ Can pause/resume timer
   - ✅ Can stop session
   - ✅ Timer display updates every second

### Step 6: Test Offline Limitations

1. Still in offline mode:
2. Try to click **"Find Focus Time"**
   - ✅ Should show: "This feature requires an internet connection"
3. Try to click **"Generate Ritual"**
   - ✅ Should show: "This feature requires an internet connection"
4. Try to refresh events
   - ✅ Should show cached events or offline message

### Step 7: Test Online Recovery

1. Uncheck the **Offline** checkbox in Network tab
2. Click **Refresh** button in the app
3. Verify:
   - ✅ Events load from server
   - ✅ AI features work again
   - ✅ No errors in console

---

## Mobile Device Testing

### iOS (iPhone/iPad) Testing

#### Step 1: Install PWA

1. Open **Safari** on iOS device
2. Navigate to your web app URL
3. Tap the **Share** button (square with arrow)
4. Scroll and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. Verify:
   - ✅ App icon appears on home screen
   - ✅ Icon looks correct (not generic)

#### Step 2: Launch PWA

1. Tap the app icon on home screen
2. Verify:
   - ✅ App opens in standalone mode (no Safari UI)
   - ✅ Status bar matches app theme color
   - ✅ App loads quickly

#### Step 3: Test Online Functionality

1. Connect to Google Calendar (if needed)
2. Verify events load
3. Start a quick focus session
4. Complete or stop the session
5. Verify everything works normally

#### Step 4: Enable Offline Mode

**Method 1: Airplane Mode**
1. Swipe down from top-right (or up from bottom on older devices)
2. Tap **Airplane Mode** icon
3. Verify airplane icon appears in status bar

**Method 2: WiFi Off**
1. Go to Settings > WiFi
2. Turn WiFi OFF
3. Also disable Cellular Data if needed

#### Step 5: Test Offline Functionality

1. **Close the app completely**:
   - Swipe up from bottom (or double-click home)
   - Swipe up on AuraFlow to close it

2. **Relaunch from home screen**

3. **Verify offline functionality**:
   - ✅ App loads (may take 1-2 seconds)
   - ✅ Main UI appears
   - ✅ Previously loaded events visible
   - ✅ Can start focus session
   - ✅ Timer works correctly
   - ✅ Can pause/resume/stop
   - ✅ Theme switching works
   - ✅ Soundscape selection works (if audio cached)

4. **Test offline limitations**:
   - ❌ AI features show offline message
   - ❌ Cannot refresh events from server
   - ❌ Cannot sync new data

#### Step 6: Test Reconnection

1. Disable Airplane Mode / Re-enable WiFi
2. Wait for connection indicator
3. Open the app (if closed)
4. Tap **Refresh** button
5. Verify:
   - ✅ Events refresh from server
   - ✅ AI features work again
   - ✅ App functions normally

### Android Testing

#### Step 1: Install PWA

1. Open **Chrome** on Android device
2. Navigate to your web app URL
3. Look for **"Add to Home screen"** banner at bottom
   - OR tap menu (⋮) > "Add to Home screen"
4. Tap **"Add"** or **"Install"**
5. Verify:
   - ✅ App icon appears on home screen
   - ✅ Icon looks correct

#### Step 2-6: Same as iOS

Follow the same steps as iOS testing above. The behavior should be identical.

---

## Test Scenarios

### Scenario 1: Fresh Install Offline

**Goal**: Verify app cannot be used without initial online load

1. Clear browser cache completely
2. Enable offline mode
3. Try to access the app
4. **Expected**: App fails to load (this is correct - first visit requires network)

### Scenario 2: Cached App Offline

**Goal**: Verify app works offline after initial load

1. Load app online at least once
2. Use the app normally (load events, start session)
3. Enable offline mode
4. Reload the app
5. **Expected**: App loads and core features work

### Scenario 3: Mid-Session Offline

**Goal**: Verify session continues if connection drops

1. Start a focus session while online
2. Enable offline mode during the session
3. Let timer continue
4. **Expected**: Timer continues counting, session completes normally

### Scenario 4: Complete Session Offline

**Goal**: Verify session can complete without network

1. Enable offline mode
2. Start a focus session
3. Let it run to completion
4. **Expected**: Session completes, data queued for sync (if implemented)

### Scenario 5: Offline to Online Transition

**Goal**: Verify smooth transition when connection restored

1. Use app in offline mode
2. Re-enable network connection
3. Refresh events
4. **Expected**: App syncs with server, new data loads

### Scenario 6: Extended Offline Use

**Goal**: Verify app remains functional over time

1. Enable offline mode
2. Use app for multiple sessions over 30+ minutes
3. Close and reopen app multiple times
4. **Expected**: App continues working, no degradation

### Scenario 7: Offline with No Cached Data

**Goal**: Verify graceful handling of missing cache

1. Load app online
2. Clear cache storage (DevTools > Application > Clear storage)
3. Enable offline mode
4. Try to use app
5. **Expected**: App shows appropriate offline message

---

## Troubleshooting

### Issue: Service Worker Not Registering

**Symptoms**: App doesn't work offline, no service worker in DevTools

**Solutions**:
1. Verify you're using HTTPS or localhost
2. Check console for registration errors
3. Verify `service-worker.js` file exists and is accessible
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
5. Unregister old service workers in DevTools

### Issue: App Doesn't Load Offline

**Symptoms**: Blank page or error when offline

**Solutions**:
1. Verify service worker is activated (DevTools > Application)
2. Check cache storage has all essential files
3. Verify you loaded the app online at least once
4. Check console for fetch errors
5. Try clearing cache and reloading online first

### Issue: Timer Doesn't Work Offline

**Symptoms**: Timer doesn't start or count down

**Solutions**:
1. Verify `core-logic.js` is cached
2. Check console for module loading errors
3. Verify localStorage is accessible
4. Try reloading the app

### Issue: Cached Events Not Showing

**Symptoms**: No events visible when offline

**Solutions**:
1. Verify you loaded events while online
2. Check localStorage for `cachedEvents` key
3. Verify `app.js` has offline event loading logic
4. Check console for errors

### Issue: PWA Won't Install on Mobile

**Symptoms**: No "Add to Home Screen" option

**Solutions**:
1. Verify `manifest.json` is valid and accessible
2. Check manifest is linked in `index.html`
3. Verify all required manifest fields are present
4. Ensure icons are accessible
5. Try using HTTPS (required for iOS)
6. On iOS, must use Safari (not Chrome)

### Issue: App Looks Wrong Offline

**Symptoms**: Missing styles or broken layout

**Solutions**:
1. Verify `style.css` is in cache
2. Check for CSS loading errors in console
3. Verify service worker is serving cached CSS
4. Try clearing cache and reloading online

---

## Expected Behavior

### ✅ Should Work Offline

- App loads from cache
- Main UI displays correctly
- Timer functionality (start, pause, resume, stop)
- Timer countdown and display updates
- Theme switching
- Viewing cached calendar events
- Session controls (volume, soundscape selection)
- LocalStorage read/write operations
- Basic navigation between screens

### ❌ Should NOT Work Offline

- Loading new calendar events from server
- AI features (Find Focus Time, Generate Ritual)
- Syncing session data to backend
- Authentication/login
- Refreshing data from server
- Any feature requiring network requests

### ⚠️ Graceful Degradation

- AI features show clear "offline" message
- Refresh button shows cached data or offline notice
- Network errors handled without crashes
- User informed when features unavailable

---

## Success Criteria

The offline functionality test is successful if:

1. ✅ App loads within 3 seconds when offline
2. ✅ All cached UI elements display correctly
3. ✅ Timer can start and count down accurately
4. ✅ User can complete a full focus session offline
5. ✅ Previously loaded events remain visible
6. ✅ Theme and settings persist offline
7. ✅ App provides clear feedback for unavailable features
8. ✅ No JavaScript errors in console during offline use
9. ✅ Smooth transition when connection restored
10. ✅ App remains stable after multiple offline/online cycles

---

## Testing Checklist

Use this checklist to track your testing progress:

### Desktop Testing
- [ ] Service worker registered and activated
- [ ] Essential files cached
- [ ] App loads offline
- [ ] Timer works offline
- [ ] Cached events visible
- [ ] AI features show offline message
- [ ] Reconnection works smoothly

### iOS Testing
- [ ] PWA installs successfully
- [ ] App opens in standalone mode
- [ ] App loads offline
- [ ] Timer works offline
- [ ] Can complete session offline
- [ ] Reconnection works

### Android Testing
- [ ] PWA installs successfully
- [ ] App opens in standalone mode
- [ ] App loads offline
- [ ] Timer works offline
- [ ] Can complete session offline
- [ ] Reconnection works

### Edge Cases
- [ ] Mid-session offline transition
- [ ] Extended offline use (30+ min)
- [ ] Multiple offline/online cycles
- [ ] App close/reopen while offline
- [ ] Fresh install requires online

---

## Additional Resources

- **Service Worker Debugging**: Chrome DevTools > Application > Service Workers
- **Cache Inspection**: Chrome DevTools > Application > Cache Storage
- **Network Simulation**: Chrome DevTools > Network > Throttling
- **Console Logs**: Look for "[Service Worker]" prefixed messages

---

## Reporting Issues

If you find issues during testing, please document:

1. **Device/Browser**: Exact model and version
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **Console Errors**: Any error messages
6. **Screenshots**: If applicable

---

**Last Updated**: 2025-10-02
**Version**: 1.0
