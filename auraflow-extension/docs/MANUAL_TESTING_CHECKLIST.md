# Manual Testing Checklist

This document provides a comprehensive checklist for manually testing all features of the AuraFlow Calendar Extension.

## Pre-Testing Setup

- [ ] Extension loaded in Chrome (`chrome://extensions/`)
- [ ] Developer mode enabled
- [ ] Google Cloud Console OAuth credentials configured
- [ ] Test Google account with calendar events available
- [ ] Browser console open for debugging

## Requirement 1: Extension Installation and Authentication

### 1.1 Extension Installation
- [ ] Extension appears in Chrome toolbar
- [ ] Extension icon is visible
- [ ] No errors on extensions page
- [ ] Service worker loads successfully

### 1.2 Initial Popup Display
- [ ] Click extension icon opens popup
- [ ] Popup displays "AuraFlow Calendar" heading
- [ ] "Connect Google Calendar" button is visible
- [ ] Popup styling renders correctly (320px width)
- [ ] No console errors when opening popup

### 1.3 OAuth Authentication Flow
- [ ] Click "Connect Google Calendar" button
- [ ] Google OAuth consent screen opens
- [ ] Can select Google account
- [ ] Can grant calendar permissions
- [ ] Redirects back to extension after approval
- [ ] Loading screen shows during authentication

### 1.4 Token Storage
- [ ] Authentication tokens stored after successful login
- [ ] Check `chrome.storage.local` contains `auraflow_tokens`
- [ ] Tokens include `access_token` and `expires_at`
- [ ] No tokens visible in console logs (security check)

### 1.5 Authentication Error Handling
- [ ] Canceling OAuth shows appropriate error message
- [ ] Denying permissions shows clear error
- [ ] Network error during auth shows retry option
- [ ] Invalid OAuth config shows helpful error message

## Requirement 2: Calendar Events Display

### 2.1 Fetch and Display Events
- [ ] After authentication, events load automatically
- [ ] Loading screen shows while fetching events
- [ ] Events appear in popup after loading
- [ ] Multiple events display correctly
- [ ] Events container scrolls if many events

### 2.2 Event Details Display
- [ ] Event title is displayed prominently
- [ ] Start time is shown
- [ ] End time is shown
- [ ] Time format is 12-hour with AM/PM
- [ ] All-day events show "All day"

### 2.3 No Events State
- [ ] Empty calendar shows "No events today" message
- [ ] Message is centered and clear
- [ ] No error messages for empty calendar
- [ ] Events container is hidden when empty

### 2.4 API Error Handling
- [ ] Network offline shows appropriate error
- [ ] API rate limit shows clear message
- [ ] Calendar access denied shows helpful error
- [ ] Retry button appears for recoverable errors
- [ ] Non-recoverable errors show appropriate guidance

### 2.5 Chronological Ordering
- [ ] Events sorted from earliest to latest
- [ ] Morning events appear first
- [ ] Evening events appear last
- [ ] All-day events handled correctly in sort order
- [ ] Events with same start time maintain stable order

## Requirement 3: Authentication Persistence

### 3.1 Token Persistence
- [ ] Close and reopen popup - still authenticated
- [ ] Restart Chrome - authentication persists
- [ ] Events load automatically on popup open
- [ ] No re-authentication required for valid tokens

### 3.2 Token Expiration Handling
- [ ] Expired tokens trigger re-authentication prompt
- [ ] Clear error message when token expires
- [ ] Can re-authenticate after expiration
- [ ] New tokens stored after re-authentication

### 3.3 Automatic Event Loading
- [ ] Open popup shows loading screen
- [ ] Events load without user interaction
- [ ] Smooth transition from loading to events
- [ ] No flashing or UI jumps

### 3.4 Refresh Functionality
- [ ] Refresh button visible in events screen
- [ ] Click refresh reloads events
- [ ] Loading indicator shows during refresh
- [ ] Updated events display after refresh
- [ ] Refresh works multiple times

### 3.5 Logout Functionality
- [ ] Logout button visible in events screen
- [ ] Click logout clears authentication
- [ ] Returns to authentication screen
- [ ] Tokens removed from storage
- [ ] Can re-authenticate after logout

## UI/UX Testing

### Visual Design
- [ ] Consistent spacing and padding
- [ ] Readable font sizes
- [ ] Good color contrast
- [ ] Professional appearance
- [ ] No visual glitches or overlaps

### Responsive Design
- [ ] Popup maintains 320px width
- [ ] Content fits within popup bounds
- [ ] Scrolling works for long event lists
- [ ] No horizontal scrolling
- [ ] Text wraps appropriately

### Loading States
- [ ] Loading spinner or message visible
- [ ] Loading message is clear
- [ ] Smooth transitions between states
- [ ] No blank screens during loading

### Error States
- [ ] Error messages are user-friendly
- [ ] Error messages are specific and helpful
- [ ] Retry button available when appropriate
- [ ] Can recover from errors
- [ ] Error styling is clear but not alarming

### Accessibility
- [ ] Can navigate with keyboard (Tab key)
- [ ] Buttons respond to Enter and Space keys
- [ ] Focus indicators visible
- [ ] Screen reader announcements work
- [ ] ARIA labels present on interactive elements
- [ ] Color contrast meets WCAG standards

## Edge Cases and Stress Testing

### Calendar Scenarios
- [ ] Empty calendar (no events)
- [ ] Single event
- [ ] Multiple events (5-10)
- [ ] Many events (20+)
- [ ] All-day events only
- [ ] Mix of timed and all-day events
- [ ] Events with very long titles
- [ ] Events at midnight
- [ ] Events spanning multiple hours
- [ ] Cancelled events (should be filtered)

### Network Scenarios
- [ ] Slow network connection
- [ ] Network disconnects during fetch
- [ ] Network reconnects after error
- [ ] API timeout handling
- [ ] Concurrent API requests

### Authentication Scenarios
- [ ] First-time authentication
- [ ] Re-authentication after logout
- [ ] Re-authentication after token expiry
- [ ] Multiple Google accounts
- [ ] Switching Google accounts
- [ ] Revoking calendar permissions

### Browser Scenarios
- [ ] Extension reload (refresh on extensions page)
- [ ] Browser restart
- [ ] Multiple popup windows
- [ ] Popup closed during loading
- [ ] Rapid clicking of buttons

## Performance Testing

- [ ] Popup opens quickly (<500ms)
- [ ] Events load in reasonable time (<2s)
- [ ] No memory leaks (check Task Manager)
- [ ] Service worker doesn't consume excessive CPU
- [ ] Smooth animations and transitions
- [ ] No lag when scrolling events

## Security Testing

- [ ] Tokens not visible in console
- [ ] No sensitive data in error messages
- [ ] XSS protection (test with malicious event titles)
- [ ] HTTPS used for all API calls
- [ ] OAuth redirect URI matches extension ID
- [ ] Minimum required permissions only

## Cross-Browser Compatibility

- [ ] Works in Chrome (latest version)
- [ ] Works in Chrome (previous version)
- [ ] Works in Edge (Chromium-based)
- [ ] Works in Brave
- [ ] Works in other Chromium-based browsers

## Regression Testing

After any code changes, verify:
- [ ] Authentication still works
- [ ] Events still display correctly
- [ ] Logout still works
- [ ] Refresh still works
- [ ] Error handling still works
- [ ] No new console errors
- [ ] No broken functionality

## Final Verification

- [ ] All requirements from requirements.md are met
- [ ] All acceptance criteria are satisfied
- [ ] No critical bugs remain
- [ ] User experience is smooth and intuitive
- [ ] Extension is ready for use

## Notes

Use this space to document any issues found during testing:

---

**Testing Date:** _______________

**Tester:** _______________

**Chrome Version:** _______________

**Extension Version:** _______________

**Issues Found:** _______________
