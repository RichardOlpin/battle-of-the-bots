# Slack Integration Tests

Comprehensive integration tests for the Slack Status Control feature in AuraFlow Chrome Extension.

## Overview

These tests verify the complete end-to-end flows for Slack integration, covering:

1. **Authentication Flow** - OAuth flow from button click to token storage
2. **Status Update Flows** - Complete flows for Available, Focused, and DND statuses
3. **Disconnect Flow** - Token and status cleanup
4. **Status Persistence** - Storage and synchronization across popup reopens
5. **Error Scenarios** - Handling of expired tokens, network errors, and rate limiting
6. **Edge Cases** - Rapid changes, multi-client sync, and complex scenarios

## Test Files

- `slack-integration.test.js` - Jest-based integration tests (for CI/CD)
- `slack-integration-tests.html` - Browser-based test runner UI
- `slack-integration-tests.js` - Browser test implementation

## Running Tests

### Option 1: Browser-Based Tests (Recommended for Manual Testing)

1. Open `slack-integration-tests.html` in your browser
2. Click "Run All Tests" or run individual test suites
3. View results in real-time with color-coded pass/fail indicators

### Option 2: Jest Tests (For CI/CD)

```bash
# Install dependencies
npm install --save-dev jest

# Run tests
npm test slack-integration.test.js
```

## Test Coverage

### 1. Authentication Flow Tests (3 tests)

✓ Complete OAuth flow from button click to token storage
- Verifies OAuth redirect URL parsing
- Tests authorization code extraction
- Validates token exchange
- Confirms token storage in chrome.storage.local

✓ Handle OAuth cancellation gracefully
- Tests user cancellation scenario
- Verifies error parameter detection

✓ Handle invalid authorization code
- Tests invalid code scenarios
- Verifies error handling

### 2. Status Update Flow Tests (3 tests)

✓ Complete Available status update flow
- Tests clearing status emoji and text
- Verifies presence set to 'auto'
- Confirms DND mode disabled
- Validates status storage

✓ Complete Focused status update flow
- Tests setting :dart: emoji
- Verifies "In focus mode" text
- Confirms presence set to 'auto'
- Validates status storage

✓ Complete DND status update flow
- Tests setting :no_bell: emoji
- Verifies "Do not disturb" text
- Confirms DND mode enabled for 60 minutes
- Validates status storage

### 3. Disconnect Flow Tests (2 tests)

✓ Complete full disconnect flow
- Verifies tokens exist before disconnect
- Tests token removal
- Confirms status removal
- Validates complete cleanup

✓ Handle disconnect when not authenticated
- Tests disconnect with no stored tokens
- Verifies graceful handling

### 4. Status Persistence Tests (3 tests)

✓ Persist status across popup close and reopen
- Tests status storage
- Simulates popup close/reopen
- Verifies status persists

✓ Handle multiple status changes and persist latest
- Tests rapid status changes
- Verifies latest status is stored
- Confirms overwrite behavior

✓ Sync with Slack API on popup reopen
- Tests loading last known status
- Simulates API returning different status
- Verifies status synchronization
- Confirms UI update

### 5. Error Scenario Tests (5 tests)

✓ Handle expired token error
- Tests invalid_auth error detection
- Verifies automatic token clearing
- Confirms re-authentication prompt

✓ Handle network error with fallback
- Tests network failure scenario
- Verifies fallback to cached status
- Confirms graceful degradation

✓ Handle rate limiting error
- Tests rate_limited error detection
- Verifies user-friendly error message
- Confirms retry suggestion

✓ Calculate exponential backoff correctly
- Tests backoff calculation
- Verifies 1s, 2s, 4s delays
- Confirms maximum delay cap

✓ Handle missing scopes error
- Tests missing_scope error detection
- Verifies scope identification
- Confirms re-authentication prompt

### 6. Edge Case Tests (4 tests)

✓ Handle rapid status changes
- Tests multiple rapid status updates
- Verifies final status is correct
- Confirms no race conditions

✓ Handle clicking already active status
- Tests clicking current status
- Verifies no unnecessary API calls
- Confirms UI remains unchanged

✓ Handle status changed in multiple Slack clients
- Tests status change outside extension
- Verifies mismatch detection
- Confirms synchronization

✓ Handle authentication during active session
- Tests Slack auth with active focus session
- Verifies both features coexist
- Confirms no interference

## Test Results Format

### Browser Tests
- **Green** - Test passed ✓
- **Red** - Test failed ✗
- **Blue** - Informational message
- **Yellow** - Test running

### Jest Tests
- Standard Jest output with pass/fail counts
- Detailed error messages for failures
- Coverage reports (if configured)

## Requirements Coverage

All tests map to specific requirements from the requirements document:

- **Requirement 1** (Slack Authentication) - Covered by Authentication Flow Tests
- **Requirement 2** (Status Toggle UI) - Covered by Status Update Tests
- **Requirement 3** (Status Update Functionality) - Covered by Status Update Tests
- **Requirement 4** (Error Handling) - Covered by Error Scenario Tests
- **Requirement 5** (Status Persistence) - Covered by Persistence Tests

## Mock Implementation

Tests use mock Chrome APIs to simulate:
- `chrome.storage.local` - Token and status storage
- `chrome.identity` - OAuth flow
- `chrome.runtime` - Extension metadata
- `fetch` - Slack API calls

## Continuous Integration

To integrate with CI/CD:

1. Add to `package.json`:
```json
{
  "scripts": {
    "test:slack": "jest slack-integration.test.js",
    "test:slack:watch": "jest slack-integration.test.js --watch"
  }
}
```

2. Add to CI pipeline:
```yaml
- name: Run Slack Integration Tests
  run: npm run test:slack
```

## Troubleshooting

### Tests Failing in Browser
- Check browser console for errors
- Verify mock Chrome API is loaded
- Ensure no real Chrome extension APIs are being called

### Tests Failing in Jest
- Verify Jest configuration includes test file
- Check that all mocks are properly set up
- Ensure async/await is handled correctly

## Future Enhancements

Potential additions to test suite:
- Performance tests (API call timing)
- Load tests (multiple rapid operations)
- Integration with real Slack API (sandbox)
- Visual regression tests for UI
- Accessibility tests for screen readers

## Contributing

When adding new Slack features:
1. Add corresponding integration tests
2. Update this README with new test descriptions
3. Ensure all tests pass before merging
4. Maintain test coverage above 80%

## Related Documentation

- [Requirements Document](../.kiro/specs/slack-status-control/requirements.md)
- [Design Document](../.kiro/specs/slack-status-control/design.md)
- [Implementation Tasks](../.kiro/specs/slack-status-control/tasks.md)
- [Unit Tests](./unit-tests.js)
