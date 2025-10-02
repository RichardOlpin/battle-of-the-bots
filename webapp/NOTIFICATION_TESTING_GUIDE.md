# AuraFlow Notification Testing Guide

This guide explains how to test the notification permission handling and fallback mechanisms in the AuraFlow web application.

## Overview

The AuraFlow web app implements a robust notification system that:
- Requests notification permission on app initialization
- Handles all permission states (granted, denied, default, unsupported)
- Shows in-app fallback notifications when browser notifications are unavailable
- Stores permission state for future reference
- Provides visual feedback to users about notification status

## Testing Setup

### Prerequisites
1. A modern web browser (Chrome, Firefox, Safari, or Edge)
2. A local web server to serve the webapp files
3. Access to browser developer tools

### Starting the Test Server

```bash
# Option 1: Using Python
cd webapp
python3 -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server webapp -p 8000

# Option 3: Using PHP
cd webapp
php -S localhost:8000
```

Then open: `http://localhost:8000`

## Test Scenarios

### 1. Test Initial Permission Request

**Objective:** Verify that the app requests notification permission on first load.

**Steps:**
1. Clear browser data (cookies, localStorage, site permissions)
2. Open the web app in a fresh browser session
3. Observe the browser's permission prompt

**Expected Results:**
- Browser shows a permission prompt asking to allow notifications
- If granted: Console logs "Notification permission granted"
- If denied: Console logs "Notification permission denied" and shows status message
- Permission state is saved to localStorage

**Verification:**
```javascript
// Check in browser console
localStorage.getItem('notificationPermission')
// Should return: "granted", "denied", or "default"
```

---

### 2. Test Granted Permission State

**Objective:** Verify browser notifications work when permission is granted.

**Steps:**
1. Open the web app
2. Grant notification permission when prompted
3. Start a focus session
4. Wait for session to complete (or use test page)

**Expected Results:**
- Browser notification appears with title and message
- Notification shows AuraFlow icon
- Notification auto-dismisses after a few seconds
- Console logs show successful notification creation

**Test Using Test Page:**
```
Open: http://localhost:8000/test-notifications.html
Click: "Request Permission" → Grant
Click: "Test Browser Notification"
```

---

### 3. Test Denied Permission State

**Objective:** Verify in-app fallback notifications work when permission is denied.

**Steps:**
1. Open the web app
2. Deny notification permission when prompted (or block in browser settings)
3. Observe the status message
4. Start a focus session and complete it

**Expected Results:**
- Status message appears: "Browser notifications disabled. You'll see in-app alerts instead."
- When session completes, an in-app notification slides in from the right
- In-app notification shows:
  - Bell icon (🔔)
  - Title and message
  - Close button (×)
  - Auto-dismisses after 5 seconds
- Notification is styled according to current theme

**Test Using Test Page:**
```
Open: http://localhost:8000/test-notifications.html
Click: "Request Permission" → Deny
Click: "Test In-App Notification"
```

---

### 4. Test Default Permission State

**Objective:** Verify behavior when user hasn't responded to permission prompt.

**Steps:**
1. Open the web app
2. Dismiss/ignore the permission prompt (don't click Allow or Block)
3. Try to trigger a notification

**Expected Results:**
- Permission remains in "default" state
- In-app fallback notification is shown
- No error messages in console

---

### 5. Test Unsupported Browser

**Objective:** Verify graceful degradation in browsers without notification support.

**Steps:**
1. Test in an older browser or disable notifications via browser flags
2. Open the web app

**Expected Results:**
- No permission prompt appears
- Console logs: "Notifications not supported in this browser"
- In-app notifications work as fallback
- Permission state saved as "unsupported"

---

### 6. Test In-App Notification Features

**Objective:** Verify all in-app notification functionality.

**Steps:**
1. Deny notification permission
2. Trigger multiple notifications
3. Test close button
4. Test auto-dismiss
5. Test on mobile viewport

**Expected Results:**
- Notifications slide in from right with smooth animation
- Multiple notifications stack vertically
- Close button (×) works immediately
- Notifications auto-dismiss after 5 seconds
- Notifications are responsive on mobile (full width)
- Proper ARIA attributes for accessibility

**Test Using Test Page:**
```
Open: http://localhost:8000/test-notifications.html
Click: "Test In-App Notification" multiple times
```

---

### 7. Test Permission State Persistence

**Objective:** Verify permission state is remembered across sessions.

**Steps:**
1. Grant or deny permission
2. Close the browser tab
3. Reopen the web app
4. Check if permission is remembered

**Expected Results:**
- No permission prompt on subsequent visits
- Stored permission state is used
- Appropriate notification method is used (browser or in-app)

**Verification:**
```javascript
// Check in browser console
localStorage.getItem('notificationPermission')
```

---

### 8. Test Session Complete Notification

**Objective:** Verify notifications work in real session flow.

**Steps:**
1. Start a focus session (Quick Focus or custom)
2. Wait for session to complete (or modify timer for faster testing)
3. Observe notification

**Expected Results:**
- Notification appears with "Session Complete!" title
- Message: "Great work! Time for a break."
- Uses appropriate method based on permission state
- Notification is timely (appears immediately on completion)

---

### 9. Test Theme Compatibility

**Objective:** Verify in-app notifications work with all themes.

**Steps:**
1. Deny notification permission
2. Switch between themes (Light, Dark, Calm, Beach, Rain)
3. Trigger in-app notification in each theme

**Expected Results:**
- Notifications are visible in all themes
- Colors adapt to theme (background, text, borders)
- Animations work smoothly
- No visual glitches

---

### 10. Test Mobile Responsiveness

**Objective:** Verify notifications work on mobile devices.

**Steps:**
1. Open web app on mobile device or use browser dev tools mobile emulation
2. Test both browser and in-app notifications
3. Test in portrait and landscape orientations

**Expected Results:**
- In-app notifications are full-width on mobile
- Notifications don't overflow screen
- Touch targets are large enough (close button)
- Animations are smooth on mobile
- Status message appears at bottom on mobile

---

## Browser-Specific Testing

### Chrome/Edge (Chromium)
- Permission prompt appears at top of browser
- Notifications appear in system notification center
- Can manage permissions via: Settings → Privacy → Site Settings → Notifications

### Firefox
- Permission prompt appears as a dropdown from address bar
- Notifications appear in system notification center
- Can manage permissions via: Page Info → Permissions → Receive Notifications

### Safari (macOS)
- Permission prompt appears as a modal dialog
- Notifications appear in Notification Center
- Can manage permissions via: Safari → Settings → Websites → Notifications

### Safari (iOS)
- Browser notifications not supported in web apps
- In-app notifications should always be used
- PWA installed to home screen may support notifications

---

## Common Issues and Troubleshooting

### Issue: Permission prompt doesn't appear
**Solution:**
- Check if permission was previously denied
- Clear site data and reload
- Check browser settings for blocked notifications

### Issue: Browser notifications don't appear
**Solution:**
- Verify permission is granted: `Notification.permission`
- Check system notification settings (Do Not Disturb mode)
- Verify browser has notification permissions at OS level

### Issue: In-app notifications don't appear
**Solution:**
- Check browser console for errors
- Verify CSS is loaded correctly
- Check if notifications are being created but hidden (z-index issues)

### Issue: Notifications appear but are not styled
**Solution:**
- Verify style.css is loaded
- Check for CSS conflicts
- Inspect element to see applied styles

---

## Automated Testing Checklist

Use this checklist when testing the notification feature:

- [ ] Permission request appears on first load
- [ ] Granting permission enables browser notifications
- [ ] Denying permission shows status message
- [ ] Denying permission enables in-app fallback
- [ ] In-app notifications slide in smoothly
- [ ] In-app notifications have close button
- [ ] In-app notifications auto-dismiss after 5 seconds
- [ ] Multiple in-app notifications stack properly
- [ ] Notifications work in all themes
- [ ] Notifications are responsive on mobile
- [ ] Permission state persists across sessions
- [ ] Session complete triggers notification
- [ ] Notifications have proper ARIA attributes
- [ ] Console shows no errors
- [ ] localStorage stores permission state

---

## Test Page Usage

The `test-notifications.html` page provides a dedicated testing interface:

### Features:
1. **Permission Status Display** - Shows current permission state
2. **Request Permission** - Manually trigger permission request
3. **Test Browser Notification** - Test native browser notification
4. **Test In-App Notification** - Force in-app notification display
5. **Test Session Complete** - Simulate session completion notification
6. **Simulate States** - Test granted/denied scenarios

### Usage:
```bash
# Open test page
open http://localhost:8000/test-notifications.html

# Or navigate to it in your browser
```

---

## Accessibility Testing

### Screen Reader Testing:
1. Enable screen reader (VoiceOver, NVDA, JAWS)
2. Trigger notifications
3. Verify announcements are made

**Expected:**
- In-app notifications have `role="alert"` and `aria-live="assertive"`
- Screen reader announces notification content
- Close button has proper `aria-label`

### Keyboard Navigation:
1. Use Tab key to navigate
2. Test closing notification with keyboard

**Expected:**
- Close button is keyboard accessible
- Focus visible on close button
- Enter/Space closes notification

---

## Performance Testing

### Metrics to Check:
- Notification creation time: < 100ms
- Animation smoothness: 60fps
- Memory usage: No leaks after multiple notifications
- localStorage operations: < 10ms

### Tools:
- Chrome DevTools Performance tab
- Firefox Performance tools
- Lighthouse audit

---

## Security Considerations

### Verify:
- [ ] No XSS vulnerabilities in notification content
- [ ] HTML is properly escaped in messages
- [ ] No sensitive data in notifications
- [ ] Permission state stored securely
- [ ] No notification spam (rate limiting if needed)

---

## Conclusion

This comprehensive testing ensures that AuraFlow's notification system works reliably across all permission states and provides a seamless user experience whether using browser notifications or in-app fallbacks.

For issues or questions, check the browser console for detailed logs and error messages.
