# AuraFlow Web Application - Desktop Testing Guide

This guide provides comprehensive instructions for testing the AuraFlow web application on desktop browsers.

## Prerequisites

- Modern web browser (Chrome, Firefox, or Safari)
- Node.js installed (for local server)
- Backend API running on `http://localhost:3000` (optional for full testing)

## Setup: Running the Web Application Locally

### Option 1: Using Python (Recommended for Quick Testing)

```bash
# Navigate to the webapp directory
cd webapp

# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

The app will be available at: `http://localhost:8080`

### Option 2: Using Node.js http-server

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Navigate to the webapp directory
cd webapp

# Start the server
http-server -p 8080
```

The app will be available at: `http://localhost:8080`

### Option 3: Using npx (No Installation Required)

```bash
# Navigate to the webapp directory
cd webapp

# Start the server
npx serve -p 8080
```

The app will be available at: `http://localhost:8080`

## Test Checklist

### ✅ 1. Application Loading Test

**Objective:** Verify the app loads correctly in different browsers

**Steps:**
1. Open the app in Chrome: `http://localhost:8080`
2. Open the app in Firefox: `http://localhost:8080`
3. Open the app in Safari: `http://localhost:8080`

**Expected Results:**
- [ ] App loads without console errors
- [ ] Authentication screen is displayed
- [ ] Logo and branding are visible
- [ ] "Connect Google Calendar" button is present
- [ ] Background gradient is visible
- [ ] No broken images or missing resources

**How to Check:**
- Open browser DevTools (F12 or Cmd+Option+I)
- Check Console tab for errors
- Check Network tab for failed requests

---

### ✅ 2. Authentication Flow Test

**Objective:** Verify authentication works correctly

**Steps:**
1. Click "Connect Google Calendar" button
2. Observe the redirect behavior

**Expected Results:**
- [ ] Button click triggers loading screen
- [ ] Loading message displays "Connecting to Google Calendar..."
- [ ] App attempts to redirect to OAuth flow
- [ ] No JavaScript errors in console

**Note:** Full OAuth testing requires the backend API to be running. Without the backend:
- You'll see a network error (expected)
- The app should show an error screen with "Try Again" button

**Manual Authentication Simulation (for testing without backend):**
1. Open browser DevTools Console
2. Run: `localStorage.setItem('authToken', JSON.stringify({token: 'test-token'}))`
3. Refresh the page
4. App should show the events screen

---

### ✅ 3. Timer Functionality Test

**Objective:** Verify timer start, pause, resume, and stop functions work correctly

**Setup:**
1. Simulate authentication (see step 2 above)
2. Navigate to events screen

**Test 3.1: Quick Focus Session**

**Steps:**
1. Click "Quick Focus" button
2. Observe timer display
3. Wait 5-10 seconds

**Expected Results:**
- [ ] Session screen is displayed
- [ ] Timer shows "25:00" initially
- [ ] Timer counts down (24:59, 24:58, etc.)
- [ ] Timer updates every second
- [ ] No console errors

**Test 3.2: Pause/Resume**

**Steps:**
1. Start a session (Quick Focus)
2. Click "Pause" button
3. Wait 3 seconds
4. Click "Resume" button (button text should change)

**Expected Results:**
- [ ] Timer stops counting when paused
- [ ] Button text changes to "Resume"
- [ ] Timer resumes counting from paused time
- [ ] Button text changes back to "Pause"
- [ ] No time is lost during pause

**Test 3.3: Stop Session**

**Steps:**
1. Start a session
2. Click "Stop" button

**Expected Results:**
- [ ] Timer stops immediately
- [ ] App returns to events screen
- [ ] No errors in console

**Test 3.4: Session Completion**

**Steps:**
1. Open browser DevTools Console
2. Start a Quick Focus session
3. In console, run: `CoreLogic.startTimer(5, (r) => console.log(r), () => console.log('Complete'))`
4. Wait 5 seconds

**Expected Results:**
- [ ] Timer counts down from 5 to 0
- [ ] Notification appears when complete
- [ ] App returns to events screen
- [ ] "Complete" message appears in console

---

### ✅ 4. LocalStorage Persistence Test

**Objective:** Verify session data persists in localStorage

**Test 4.1: Theme Persistence**

**Steps:**
1. Navigate to events screen
2. Click on "Dark" theme button
3. Refresh the page

**Expected Results:**
- [ ] Dark theme is applied
- [ ] After refresh, dark theme is still active
- [ ] Theme preference is saved

**Test 4.2: Blocked Sites Persistence**

**Steps:**
1. Navigate to events screen
2. Scroll to "Distraction Shield" section
3. Enter some websites (e.g., "youtube.com", "twitter.com")
4. Click "Save List" button
5. Refresh the page

**Expected Results:**
- [ ] Success message appears after saving
- [ ] After refresh, blocked sites list is still populated
- [ ] Data persists in localStorage

**Test 4.3: Volume Persistence**

**Steps:**
1. Start a session
2. Adjust volume slider to 75
3. Stop session
4. Start another session

**Expected Results:**
- [ ] Volume setting is remembered
- [ ] Slider shows 75 on new session

**How to Verify localStorage:**
1. Open DevTools → Application tab (Chrome) or Storage tab (Firefox)
2. Expand "Local Storage" → `http://localhost:8080`
3. Check for keys: `theme`, `blockedSites`, `volume`, etc.

---

### ✅ 5. Theme Switching Test

**Objective:** Verify all themes work correctly

**Steps:**
1. Navigate to events screen
2. Click each theme button in sequence:
   - Light theme
   - Dark theme
   - Calm theme
   - Beach theme
   - Rain theme

**Expected Results for Each Theme:**
- [ ] Background color changes immediately
- [ ] Text color adjusts for readability
- [ ] Button colors update
- [ ] Theme button shows active state (visual indicator)
- [ ] No layout breaks or visual glitches
- [ ] Smooth transition between themes

**Visual Checks:**
- Light: White/light gray background, dark text
- Dark: Dark background, light text
- Calm: Purple/lavender tones
- Beach: Blue/teal tones
- Rain: Blue-gray tones

---

### ✅ 6. AI Features Integration Test

**Objective:** Verify AI features UI and error handling

**Note:** These features require backend API. Testing focuses on UI behavior and error handling.

**Test 6.1: Find Focus Time (Without Backend)**

**Steps:**
1. Navigate to events screen
2. Click "Find Focus Time" button

**Expected Results:**
- [ ] Loading spinner appears
- [ ] "Finding optimal focus time..." message displays
- [ ] After timeout, error message appears
- [ ] Error is handled gracefully (no crash)
- [ ] User can dismiss or retry

**Test 6.2: Generate Ritual (Without Backend)**

**Steps:**
1. Navigate to events screen
2. Click "Generate Ritual" button

**Expected Results:**
- [ ] Loading spinner appears
- [ ] "Generating personalized ritual..." message displays
- [ ] After timeout, error message appears
- [ ] Error is handled gracefully
- [ ] App remains functional

**Test 6.3: Offline Detection**

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Click "Find Focus Time" button

**Expected Results:**
- [ ] Error message: "This feature requires an internet connection"
- [ ] No attempt to make network request
- [ ] User-friendly error message

---

### ✅ 7. Responsive Layout Test

**Objective:** Verify layout adapts to different screen sizes

**Test 7.1: Desktop Sizes**

**Steps:**
1. Open app in browser
2. Resize window to different widths:
   - 1920px (large desktop)
   - 1440px (standard desktop)
   - 1024px (small desktop/large tablet)

**Expected Results:**
- [ ] Content is centered
- [ ] Maximum width constraint is applied
- [ ] No horizontal scrolling
- [ ] All elements are visible and accessible
- [ ] Proper spacing and padding

**Test 7.2: Tablet Size**

**Steps:**
1. Resize browser window to 768px width
2. Navigate through all screens

**Expected Results:**
- [ ] Layout adjusts for tablet
- [ ] Touch targets are appropriately sized
- [ ] Text remains readable
- [ ] No overlapping elements

**Test 7.3: Mobile Size**

**Steps:**
1. Open DevTools (F12)
2. Click device toolbar icon (Cmd+Shift+M or Ctrl+Shift+M)
3. Select different devices:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

**Expected Results:**
- [ ] Layout is mobile-friendly
- [ ] All buttons are tappable
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling
- [ ] Navigation works smoothly

**Test 7.4: Window Resizing**

**Steps:**
1. Start with full-screen browser
2. Slowly resize window from wide to narrow
3. Observe layout changes

**Expected Results:**
- [ ] Smooth transitions between breakpoints
- [ ] No layout breaks or jumps
- [ ] Content reflows appropriately
- [ ] No elements disappear or overlap

---

### ✅ 8. Service Worker Test

**Objective:** Verify service worker registers correctly

**Steps:**
1. Open app in Chrome
2. Open DevTools → Application tab
3. Click "Service Workers" in left sidebar

**Expected Results:**
- [ ] Service worker is registered
- [ ] Status shows "activated and is running"
- [ ] Source shows `/service-worker.js`
- [ ] No registration errors

**Test Cache:**
1. In Application tab, click "Cache Storage"
2. Expand cache (e.g., `auraflow-v1`)

**Expected Results:**
- [ ] Cache contains essential files:
  - `/` or `/index.html`
  - `/style.css`
  - `/app.js`
  - `/core-logic.js`
  - `/web-platform-services.js`
  - Icon files

---

### ✅ 9. Notification Permission Test

**Objective:** Verify notification permission handling

**Test 9.1: Grant Permission**

**Steps:**
1. Open app in fresh browser profile (or clear site data)
2. App loads and requests notification permission
3. Click "Allow" in browser prompt

**Expected Results:**
- [ ] Permission prompt appears
- [ ] After allowing, no error messages
- [ ] Status message may appear confirming notifications enabled

**Test 9.2: Deny Permission**

**Steps:**
1. Open app in fresh browser profile
2. Click "Block" in permission prompt

**Expected Results:**
- [ ] App continues to function
- [ ] Message appears: "Browser notifications disabled. You'll see in-app alerts instead."
- [ ] In-app notifications are used as fallback

**Test 9.3: Test Notification**

**Steps:**
1. Grant notification permission
2. Start a Quick Focus session
3. In DevTools Console, run: `CoreLogic.startTimer(3, ()=>{}, ()=>{})`
4. Wait 3 seconds

**Expected Results:**
- [ ] Browser notification appears
- [ ] Notification shows title and message
- [ ] Notification includes app icon

---

### ✅ 10. Console Error Check

**Objective:** Verify no unexpected errors in console

**Steps:**
1. Open DevTools Console
2. Navigate through all screens:
   - Auth screen
   - Events screen (with simulated auth)
   - Session screen
   - Error screen
3. Perform various actions

**Expected Results:**
- [ ] No red error messages (except expected network errors without backend)
- [ ] No warnings about missing resources
- [ ] No CORS errors (when using local server)
- [ ] Informational logs are present (optional)

---

## Cross-Browser Testing Matrix

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| App loads | ✓ | ✓ | ✓ |
| Timer works | ✓ | ✓ | ✓ |
| LocalStorage | ✓ | ✓ | ✓ |
| Themes | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ |
| Service Worker | ✓ | ✓ | ✓ |
| Responsive | ✓ | ✓ | ✓ |

## Common Issues and Solutions

### Issue: App shows blank screen
**Solution:** 
- Check browser console for errors
- Verify you're using a local server (not file:// protocol)
- Clear browser cache and reload

### Issue: Service worker not registering
**Solution:**
- Ensure you're using HTTPS or localhost
- Check service-worker.js file exists
- Clear service workers in DevTools and reload

### Issue: LocalStorage not persisting
**Solution:**
- Check browser privacy settings
- Ensure cookies/storage are not blocked
- Try incognito/private mode

### Issue: Notifications not working
**Solution:**
- Check notification permission in browser settings
- Verify permission was granted
- Check for in-app fallback notifications

### Issue: Timer not counting down
**Solution:**
- Check console for JavaScript errors
- Verify core-logic.js is loaded
- Check timer state in console: `CoreLogic.getTimerState()`

## Testing with Backend API

If you have the backend API running on `http://localhost:3000`:

1. **Authentication:** Full OAuth flow will work
2. **Calendar Events:** Real events will be fetched and displayed
3. **AI Features:** Find Focus Time and Generate Ritual will work
4. **Session Sync:** Completed sessions will be saved to backend

## Performance Testing

### Load Time
- App should load in under 2 seconds on fast connection
- Check Network tab for resource load times

### Memory Usage
1. Open DevTools → Performance Monitor
2. Use app for 5 minutes
3. Check for memory leaks (memory should stabilize)

### Timer Accuracy
- Timer should update every second (±50ms tolerance)
- Use `console.time()` and `console.timeEnd()` to verify

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Focus indicators are visible

### Screen Reader
- [ ] ARIA labels are present
- [ ] Screen reader announces state changes
- [ ] All images have alt text

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________ Version: ___________

✅ App Loading: PASS / FAIL
✅ Authentication: PASS / FAIL
✅ Timer Functionality: PASS / FAIL
✅ LocalStorage Persistence: PASS / FAIL
✅ Theme Switching: PASS / FAIL
✅ AI Features UI: PASS / FAIL
✅ Responsive Layout: PASS / FAIL
✅ Service Worker: PASS / FAIL
✅ Notifications: PASS / FAIL
✅ Console Errors: PASS / FAIL

Notes:
_________________________________
_________________________________
```

## Next Steps

After completing desktop testing:
1. Proceed to mobile PWA installation testing (Task 16)
2. Test offline functionality (Task 17)
3. Document any bugs or issues found
4. Create bug reports with reproduction steps

## Support

For issues or questions:
- Check browser console for error messages
- Review the implementation files in `webapp/` directory
- Refer to the design document: `.kiro/specs/auraflow-web-pwa/design.md`
