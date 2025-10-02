# Testing Guide

Comprehensive testing documentation for the AuraFlow Calendar Extension.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Manual Testing](#manual-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Test Scenarios](#test-scenarios)
7. [Automated Testing](#automated-testing)

## Testing Overview

The AuraFlow Calendar Extension uses a multi-layered testing approach:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Manual Tests**: Verify user workflows and UI/UX
- **End-to-End Tests**: Test complete user scenarios

## Unit Tests

### Running Unit Tests

1. Open `tests/unit-tests.html` in Chrome browser
2. Click "Run All Tests" button
3. Review test results in the output section

### Test Suites

**Authentication Tests**
- Token storage and retrieval
- Token validation
- Token expiration detection
- Token clearing

**Event Display Tests**
- Event time formatting
- Event sorting (chronological)
- Event filtering (cancelled, invalid)
- Empty events handling

**UI Logic Tests**
- HTML escaping (XSS prevention)
- Date formatting
- Screen state validation
- Error message generation

### Writing New Unit Tests

Add tests to `tests/unit-tests.js`:

```javascript
function testNewFeature() {
    TestRunner.log('Test: New Feature', 'info');
    
    // Setup
    const input = 'test input';
    
    // Execute
    const result = yourFunction(input);
    
    // Assert
    TestRunner.assertEqual(result, 'expected output', 'Feature works correctly');
}
```

## Integration Tests

### Service Worker + Popup Communication

Test message passing between components:

```javascript
// In popup console
chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    console.log('Service worker response:', response);
});
```

### Storage Integration

Test data persistence:

```javascript
// Store data
chrome.storage.local.set({ test_key: 'test_value' });

// Retrieve data
chrome.storage.local.get(['test_key'], (result) => {
    console.log('Retrieved:', result.test_key);
});
```

### API Integration

Test Google Calendar API:

1. Authenticate with real Google account
2. Verify API requests in Network tab
3. Check response data structure
4. Validate error handling

## Manual Testing

### Quick Smoke Test

Essential tests to run after any code change:

1. **Extension Loads**
   - [ ] No errors on `chrome://extensions/`
   - [ ] Extension icon appears in toolbar

2. **Authentication Works**
   - [ ] Click "Connect Google Calendar"
   - [ ] OAuth flow completes
   - [ ] Returns to extension

3. **Events Display**
   - [ ] Events load automatically
   - [ ] Events display correctly
   - [ ] Times are formatted properly

4. **Basic Functions**
   - [ ] Refresh button works
   - [ ] Logout button works
   - [ ] Can re-authenticate

### Comprehensive Manual Testing

See [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md) for complete checklist.

## End-to-End Testing

### Scenario 1: First-Time User

**Steps:**
1. Install extension (fresh install)
2. Click extension icon
3. Click "Connect Google Calendar"
4. Complete OAuth flow
5. View calendar events

**Expected Results:**
- Smooth authentication flow
- Events load automatically
- UI is intuitive and clear
- No errors or confusion

### Scenario 2: Returning User

**Steps:**
1. Open extension (already authenticated)
2. View events
3. Close and reopen popup
4. Restart browser
5. Open extension again

**Expected Results:**
- No re-authentication required
- Events load automatically
- Authentication persists across sessions

### Scenario 3: Token Expiration

**Steps:**
1. Authenticate with extension
2. Wait for token to expire (or manually expire)
3. Open extension
4. Attempt to load events

**Expected Results:**
- Clear message about expired session
- Prompt to reconnect
- Can re-authenticate successfully

### Scenario 4: Error Recovery

**Steps:**
1. Disconnect internet
2. Open extension
3. Attempt to load events
4. Reconnect internet
5. Click retry

**Expected Results:**
- Clear error message about network
- Retry button available
- Successfully loads after reconnect

## Test Scenarios

### Authentication Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| First auth | Click connect → Complete OAuth | Events load |
| Re-auth | Logout → Connect again | Can authenticate |
| Cancel auth | Click connect → Cancel OAuth | Error message shown |
| Deny permissions | Click connect → Deny | Clear error message |
| Invalid config | Wrong Client ID | Configuration error |

### Event Display Scenarios

| Scenario | Calendar State | Expected Display |
|----------|---------------|------------------|
| No events | Empty calendar | "No events today" |
| Single event | 1 event today | Event displays |
| Multiple events | 5+ events | All events in order |
| All-day event | All-day event | "All day" shown |
| Mixed events | Timed + all-day | Both display correctly |
| Long title | Event with long name | Text wraps properly |
| Many events | 20+ events | Scrollable list |

### Error Scenarios

| Error Type | Trigger | Expected Behavior |
|------------|---------|-------------------|
| Network error | Disconnect internet | "Network error" message |
| API error | API returns 500 | "Service unavailable" |
| Auth error | Invalid token | Prompt to reconnect |
| Rate limit | Too many requests | "Too many requests" |
| Permission denied | Revoke calendar access | "Access denied" |

### Edge Cases

| Case | Description | Expected Behavior |
|------|-------------|-------------------|
| Midnight event | Event at 00:00 | Displays correctly |
| Multi-hour event | 4-hour meeting | Time range shown |
| Cancelled event | Status: cancelled | Filtered out |
| Invalid event | Missing start time | Filtered out |
| Special characters | Event with emoji | Displays correctly |
| Very long title | 200+ character title | Truncates or wraps |

## Automated Testing

### Setting Up Automated Tests

For future implementation, consider:

**Jest for Unit Tests:**
```javascript
describe('Event Formatting', () => {
  test('formats timed events correctly', () => {
    const result = formatEventTime('2024-01-15T09:00:00Z');
    expect(result).toMatch(/\d+:\d+ (AM|PM)/);
  });
});
```

**Puppeteer for E2E Tests:**
```javascript
test('user can authenticate', async () => {
  await page.goto('chrome-extension://[id]/popup.html');
  await page.click('#connect-btn');
  // ... test OAuth flow
});
```

### Continuous Integration

Recommended CI setup:

1. **Lint Code**
   ```bash
   eslint *.js
   ```

2. **Run Unit Tests**
   ```bash
   npm test
   ```

3. **Build Extension**
   ```bash
   npm run build
   ```

4. **Run E2E Tests**
   ```bash
   npm run test:e2e
   ```

## Test Data

### Sample Events for Testing

Create these events in test calendar:

```javascript
// Morning event
{
  summary: "Team Standup",
  start: "09:00 AM",
  end: "09:30 AM"
}

// Afternoon event
{
  summary: "Project Review",
  start: "02:00 PM",
  end: "03:00 PM"
}

// All-day event
{
  summary: "Company Holiday",
  start: "All day"
}

// Long title event
{
  summary: "Very Long Event Title That Should Wrap or Truncate Properly in the UI",
  start: "04:00 PM",
  end: "05:00 PM"
}
```

### Mock Data for Unit Tests

```javascript
const mockEvents = [
  {
    id: "event1",
    summary: "Test Event",
    start: { dateTime: "2024-01-15T09:00:00Z" },
    end: { dateTime: "2024-01-15T10:00:00Z" },
    status: "confirmed"
  }
];

const mockTokens = {
  access_token: "mock_access_token",
  expires_at: Date.now() + 3600000,
  token_type: "Bearer"
};
```

## Performance Testing

### Metrics to Monitor

- **Popup Load Time**: < 500ms
- **Event Fetch Time**: < 2s
- **Memory Usage**: < 50MB
- **CPU Usage**: Minimal when idle

### Performance Testing Tools

1. **Chrome DevTools Performance Tab**
   - Record popup opening
   - Analyze timeline
   - Identify bottlenecks

2. **Chrome Task Manager**
   - Monitor memory usage
   - Check CPU usage
   - Detect memory leaks

3. **Lighthouse**
   - Run accessibility audit
   - Check performance metrics
   - Review best practices

## Accessibility Testing

### Manual Accessibility Checks

- [ ] Can navigate with Tab key
- [ ] Can activate buttons with Enter/Space
- [ ] Focus indicators visible
- [ ] Screen reader announces changes
- [ ] Color contrast meets WCAG AA
- [ ] No keyboard traps

### Automated Accessibility Testing

Use Chrome DevTools Lighthouse:

1. Open popup in new window
2. Open DevTools
3. Run Lighthouse audit
4. Review accessibility score
5. Fix any issues

### Screen Reader Testing

Test with screen readers:

- **Windows**: NVDA or JAWS
- **macOS**: VoiceOver
- **Linux**: Orca

Verify:
- All interactive elements announced
- State changes announced
- Error messages read aloud
- Navigation is logical

## Security Testing

### Security Checklist

- [ ] No tokens in console logs
- [ ] No sensitive data in error messages
- [ ] HTML properly escaped
- [ ] HTTPS used for all requests
- [ ] Minimum permissions requested
- [ ] OAuth redirect URI validated

### XSS Testing

Test with malicious event titles:

```javascript
const xssTests = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<iframe src="evil.com"></iframe>'
];
```

Verify all are properly escaped in UI.

## Regression Testing

### After Each Change

Run regression test suite:

1. **Core Functionality**
   - [ ] Authentication works
   - [ ] Events display
   - [ ] Refresh works
   - [ ] Logout works

2. **Error Handling**
   - [ ] Network errors handled
   - [ ] API errors handled
   - [ ] Auth errors handled

3. **UI/UX**
   - [ ] Styling correct
   - [ ] Responsive design works
   - [ ] Accessibility maintained

### Regression Test Automation

Consider automating with:

```javascript
// Pseudo-code for regression suite
describe('Regression Tests', () => {
  test('authentication still works', async () => {
    // Test auth flow
  });
  
  test('events still display', async () => {
    // Test event display
  });
  
  // ... more tests
});
```

## Test Reporting

### Test Results Format

Document test results:

```markdown
## Test Run: 2024-01-15

**Environment:**
- Chrome Version: 120.0.6099.109
- Extension Version: 1.0.0
- OS: macOS 14.0

**Results:**
- Unit Tests: 25/25 passed ✓
- Integration Tests: 10/10 passed ✓
- Manual Tests: 45/45 passed ✓
- Issues Found: 0

**Notes:**
All tests passed successfully.
```

### Bug Report Template

When bugs are found:

```markdown
## Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Environment:**
- Chrome Version:
- Extension Version:
- OS:

**Console Errors:**
[Any error messages]
```

## Best Practices

### Testing Best Practices

1. **Test Early and Often**
   - Test during development
   - Don't wait until the end

2. **Test Real Scenarios**
   - Use real Google Calendar data
   - Test with actual user workflows

3. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values

4. **Automate When Possible**
   - Unit tests should be automated
   - Regression tests should be automated

5. **Document Test Results**
   - Keep test logs
   - Track issues found
   - Monitor trends

### Code Coverage

Aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key workflows covered
- **Manual Tests**: All user scenarios tested

## Conclusion

Thorough testing ensures:
- Reliable functionality
- Good user experience
- Fewer bugs in production
- Easier maintenance

Follow this guide to maintain high quality standards for the AuraFlow Calendar Extension.
