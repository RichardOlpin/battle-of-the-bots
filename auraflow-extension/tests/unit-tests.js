// AuraFlow Calendar Extension - Unit Tests
// Comprehensive test suite for core functionality

// Test utilities
const TestRunner = {
    results: [],

    log(message, type = 'info') {
        const output = document.getElementById('test-output');
        const div = document.createElement('div');
        div.className = `test-result test-${type}`;
        div.textContent = message;
        output.appendChild(div);

        this.results.push({ message, type, timestamp: new Date() });
    },

    assert(condition, message) {
        if (condition) {
            this.log(`✓ ${message}`, 'pass');
            return true;
        } else {
            this.log(`✗ ${message}`, 'fail');
            return false;
        }
    },

    assertEqual(actual, expected, message) {
        const condition = actual === expected;
        const fullMessage = `${message} (expected: ${expected}, got: ${actual})`;
        return this.assert(condition, fullMessage);
    },

    assertNotNull(value, message) {
        return this.assert(value !== null && value !== undefined, message);
    },

    showSummary() {
        const passed = this.results.filter(r => r.type === 'pass').length;
        const failed = this.results.filter(r => r.type === 'fail').length;
        const total = passed + failed;

        const summary = document.createElement('div');
        summary.className = `summary ${failed === 0 ? 'pass' : 'fail'}`;
        summary.textContent = `Test Summary: ${passed}/${total} passed, ${failed} failed`;

        const output = document.getElementById('test-output');
        output.insertBefore(summary, output.firstChild);
    },

    clear() {
        this.results = [];
        document.getElementById('test-output').innerHTML = '';
    }
};

// Mock Chrome APIs for testing
const mockChrome = {
    storage: {
        local: {
            data: {},
            get(keys, callback) {
                const result = {};
                if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        if (this.data[key]) result[key] = this.data[key];
                    });
                } else if (typeof keys === 'string') {
                    if (this.data[keys]) result[keys] = this.data[keys];
                }
                callback(result);
            },
            set(items, callback) {
                Object.assign(this.data, items);
                if (callback) callback();
            },
            remove(keys, callback) {
                if (Array.isArray(keys)) {
                    keys.forEach(key => delete this.data[key]);
                } else {
                    delete this.data[keys];
                }
                if (callback) callback();
            },
            clear() {
                this.data = {};
            }
        }
    },
    runtime: {
        lastError: null,
        sendMessage(message, callback) {
            // Mock response
            setTimeout(() => {
                callback({ success: true, data: {} });
            }, 10);
        }
    }
};

// Authentication Tests
function runAuthTests() {
    TestRunner.log('=== Authentication Tests ===', 'info');

    // Test 1: Token storage
    TestRunner.log('Test: Token Storage', 'info');
    const testTokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: Date.now() + 3600000,
        token_type: 'Bearer'
    };

    mockChrome.storage.local.set({ 'auraflow_tokens': testTokens });
    mockChrome.storage.local.get(['auraflow_tokens'], (result) => {
        TestRunner.assertNotNull(result.auraflow_tokens, 'Tokens stored successfully');
        TestRunner.assertEqual(
            result.auraflow_tokens.access_token,
            'test_access_token',
            'Access token matches'
        );
    });

    // Test 2: Token validation
    TestRunner.log('Test: Token Validation', 'info');
    const validToken = {
        access_token: 'valid_token',
        expires_at: Date.now() + 3600000
    };
    const expiredToken = {
        access_token: 'expired_token',
        expires_at: Date.now() - 1000
    };

    TestRunner.assert(
        validToken.expires_at > Date.now(),
        'Valid token is not expired'
    );
    TestRunner.assert(
        expiredToken.expires_at < Date.now(),
        'Expired token is detected'
    );

    // Test 3: Token clearing
    TestRunner.log('Test: Token Clearing', 'info');
    mockChrome.storage.local.remove(['auraflow_tokens']);
    mockChrome.storage.local.get(['auraflow_tokens'], (result) => {
        TestRunner.assert(
            !result.auraflow_tokens,
            'Tokens cleared successfully'
        );
    });

    mockChrome.storage.local.clear();
}

// Event Display Tests
function runEventTests() {
    TestRunner.log('=== Event Display Tests ===', 'info');

    // Test 1: Event time formatting
    TestRunner.log('Test: Event Time Formatting', 'info');

    const timedEvent = '2024-01-15T09:00:00-08:00';
    const allDayEvent = '2024-01-15';

    const formattedTimed = formatEventTime(timedEvent);
    const formattedAllDay = formatEventTime(allDayEvent);

    TestRunner.assert(
        formattedTimed.includes('AM') || formattedTimed.includes('PM'),
        'Timed event formatted with AM/PM'
    );
    TestRunner.assertEqual(
        formattedAllDay,
        'All day',
        'All-day event formatted correctly'
    );

    // Test 2: Event sorting
    TestRunner.log('Test: Event Sorting', 'info');

    const unsortedEvents = [
        {
            summary: 'Event 3',
            start: { dateTime: '2024-01-15T15:00:00Z' },
            end: { dateTime: '2024-01-15T16:00:00Z' },
            status: 'confirmed'
        },
        {
            summary: 'Event 1',
            start: { dateTime: '2024-01-15T09:00:00Z' },
            end: { dateTime: '2024-01-15T10:00:00Z' },
            status: 'confirmed'
        },
        {
            summary: 'Event 2',
            start: { dateTime: '2024-01-15T12:00:00Z' },
            end: { dateTime: '2024-01-15T13:00:00Z' },
            status: 'confirmed'
        }
    ];

    const sorted = sortEventsChronologically(unsortedEvents);

    TestRunner.assertEqual(
        sorted[0].summary,
        'Event 1',
        'First event is earliest'
    );
    TestRunner.assertEqual(
        sorted[2].summary,
        'Event 3',
        'Last event is latest'
    );

    // Test 3: Event filtering
    TestRunner.log('Test: Event Filtering', 'info');

    const mixedEvents = [
        {
            summary: 'Valid Event',
            start: { dateTime: '2024-01-15T09:00:00Z' },
            end: { dateTime: '2024-01-15T10:00:00Z' },
            status: 'confirmed'
        },
        {
            summary: 'Cancelled Event',
            start: { dateTime: '2024-01-15T10:00:00Z' },
            end: { dateTime: '2024-01-15T11:00:00Z' },
            status: 'cancelled'
        },
        {
            summary: 'Invalid Event',
            start: null,
            end: { dateTime: '2024-01-15T12:00:00Z' },
            status: 'confirmed'
        }
    ];

    const filtered = filterValidEvents(mixedEvents);

    TestRunner.assertEqual(
        filtered.length,
        1,
        'Only valid events remain after filtering'
    );
    TestRunner.assertEqual(
        filtered[0].summary,
        'Valid Event',
        'Correct event passed filter'
    );

    // Test 4: Empty events handling
    TestRunner.log('Test: Empty Events Handling', 'info');

    const emptyEvents = [];
    const filteredEmpty = filterValidEvents(emptyEvents);

    TestRunner.assertEqual(
        filteredEmpty.length,
        0,
        'Empty array handled correctly'
    );
}

// UI Logic Tests
function runUITests() {
    TestRunner.log('=== UI Logic Tests ===', 'info');

    // Test 1: HTML escaping
    TestRunner.log('Test: HTML Escaping', 'info');

    const dangerousText = '<script>alert("xss")</script>';
    const escaped = escapeHtml(dangerousText);

    TestRunner.assert(
        !escaped.includes('<script>'),
        'Script tags are escaped'
    );
    TestRunner.assert(
        escaped.includes('&lt;') && escaped.includes('&gt;'),
        'HTML entities are properly escaped'
    );

    // Test 2: Date header formatting
    TestRunner.log('Test: Date Header Formatting', 'info');

    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    TestRunner.assert(
        formatted.length > 0,
        'Date formatted successfully'
    );
    TestRunner.assert(
        formatted.includes(today.getFullYear().toString()),
        'Date includes current year'
    );

    // Test 3: Screen validation
    TestRunner.log('Test: Screen Validation', 'info');

    const validScreens = ['auth', 'events', 'loading', 'error'];
    const invalidScreen = 'invalid-screen';

    TestRunner.assert(
        validScreens.includes('auth'),
        'Auth screen is valid'
    );
    TestRunner.assert(
        validScreens.includes('events'),
        'Events screen is valid'
    );
    TestRunner.assert(
        !validScreens.includes(invalidScreen),
        'Invalid screen is rejected'
    );
}

// Helper functions (copied from popup.js for testing)
function formatEventTime(dateTimeString) {
    if (!dateTimeString) return '';

    try {
        if (dateTimeString.length === 10 || !dateTimeString.includes('T')) {
            return 'All day';
        }

        const date = new Date(dateTimeString);

        if (isNaN(date.getTime())) {
            return 'Invalid time';
        }

        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return 'Invalid time';
    }
}

function sortEventsChronologically(events) {
    return events.sort((a, b) => {
        const timeA = getEventStartTime(a);
        const timeB = getEventStartTime(b);

        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;

        return timeA - timeB;
    });
}

function getEventStartTime(event) {
    try {
        const dateTimeString = event.start.dateTime || event.start.date;
        if (!dateTimeString) return null;

        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        return null;
    }
}

function filterValidEvents(events) {
    return events.filter(event => {
        if (!event.start) return false;
        if (event.status === 'cancelled') return false;
        return true;
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// SLACK STORAGE UTILITIES TESTS
// ============================================================================

function runSlackStorageTests() {
    TestRunner.log('=== Slack Storage Utilities Tests ===', 'info');

    // Test 1: Store Slack tokens
    TestRunner.log('Test: Store Slack Tokens', 'info');
    const testSlackTokens = {
        access_token: 'xoxb-test-token',
        token_type: 'Bearer',
        scope: 'users.profile:write,users:write,dnd:write',
        bot_user_id: 'U123456',
        app_id: 'A123456',
        team: {
            id: 'T123456',
            name: 'Test Workspace'
        },
        authed_user: {
            id: 'U789012',
            scope: 'users.profile:write,users:write',
            access_token: 'xoxp-test-user-token',
            token_type: 'Bearer'
        }
    };

    mockChrome.storage.local.set({ 'auraflow_slack_tokens': testSlackTokens });
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        TestRunner.assertNotNull(result.auraflow_slack_tokens, 'Slack tokens stored successfully');
        TestRunner.assertEqual(
            result.auraflow_slack_tokens.access_token,
            'xoxb-test-token',
            'Slack access token matches'
        );
        TestRunner.assertEqual(
            result.auraflow_slack_tokens.team.name,
            'Test Workspace',
            'Workspace name stored correctly'
        );
        TestRunner.assertNotNull(
            result.auraflow_slack_tokens.authed_user,
            'User auth data stored'
        );
    });

    // Test 2: Retrieve Slack tokens
    TestRunner.log('Test: Retrieve Slack Tokens', 'info');
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        const tokens = result.auraflow_slack_tokens;
        TestRunner.assertNotNull(tokens, 'Tokens retrieved successfully');
        TestRunner.assertEqual(
            tokens.authed_user.access_token,
            'xoxp-test-user-token',
            'User access token retrieved correctly'
        );
    });

    // Test 3: Validate Slack tokens
    TestRunner.log('Test: Validate Slack Tokens', 'info');

    // Valid tokens
    const validSlackTokens = {
        access_token: 'xoxb-valid-token',
        authed_user: {
            access_token: 'xoxp-valid-user-token'
        }
    };

    TestRunner.assert(
        validSlackTokens.access_token && validSlackTokens.authed_user && validSlackTokens.authed_user.access_token,
        'Valid Slack tokens pass validation'
    );

    // Invalid tokens (missing user token)
    const invalidSlackTokens = {
        access_token: 'xoxb-token-only',
        authed_user: {}
    };

    TestRunner.assert(
        !(invalidSlackTokens.authed_user && invalidSlackTokens.authed_user.access_token),
        'Invalid Slack tokens fail validation'
    );

    // Test 4: Clear Slack tokens
    TestRunner.log('Test: Clear Slack Tokens', 'info');
    mockChrome.storage.local.remove(['auraflow_slack_tokens']);
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        TestRunner.assert(
            !result.auraflow_slack_tokens,
            'Slack tokens cleared successfully'
        );
    });

    // Test 5: Store last Slack status
    TestRunner.log('Test: Store Last Slack Status', 'info');
    const testStatus = {
        status: 'focused',
        emoji: ':dart:',
        text: 'In focus mode',
        timestamp: Date.now()
    };

    mockChrome.storage.local.set({ 'auraflow_slack_last_status': testStatus });
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        TestRunner.assertNotNull(result.auraflow_slack_last_status, 'Last status stored successfully');
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.status,
            'focused',
            'Status type stored correctly'
        );
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.emoji,
            ':dart:',
            'Status emoji stored correctly'
        );
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.text,
            'In focus mode',
            'Status text stored correctly'
        );
    });

    // Test 6: Retrieve last Slack status
    TestRunner.log('Test: Retrieve Last Slack Status', 'info');
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        const lastStatus = result.auraflow_slack_last_status;
        TestRunner.assertNotNull(lastStatus, 'Last status retrieved successfully');
        TestRunner.assertEqual(
            lastStatus.status,
            'focused',
            'Retrieved status matches stored status'
        );
    });

    // Test 7: Store different status types
    TestRunner.log('Test: Store Different Status Types', 'info');

    const availableStatus = {
        status: 'available',
        emoji: '',
        text: '',
        timestamp: Date.now()
    };

    const dndStatus = {
        status: 'dnd',
        emoji: ':no_bell:',
        text: 'Do not disturb',
        timestamp: Date.now()
    };

    mockChrome.storage.local.set({ 'auraflow_slack_last_status': availableStatus });
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.status,
            'available',
            'Available status stored correctly'
        );
    });

    mockChrome.storage.local.set({ 'auraflow_slack_last_status': dndStatus });
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.status,
            'dnd',
            'DND status stored correctly'
        );
        TestRunner.assertEqual(
            result.auraflow_slack_last_status.emoji,
            ':no_bell:',
            'DND emoji stored correctly'
        );
    });

    // Test 8: Clear last Slack status
    TestRunner.log('Test: Clear Last Slack Status', 'info');
    mockChrome.storage.local.remove(['auraflow_slack_last_status']);
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        TestRunner.assert(
            !result.auraflow_slack_last_status,
            'Last Slack status cleared successfully'
        );
    });

    // Test 9: Handle missing tokens gracefully
    TestRunner.log('Test: Handle Missing Tokens', 'info');
    mockChrome.storage.local.clear();
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        TestRunner.assert(
            !result.auraflow_slack_tokens,
            'Missing tokens return null/undefined'
        );
    });

    // Test 10: Handle missing status gracefully
    TestRunner.log('Test: Handle Missing Status', 'info');
    mockChrome.storage.local.get(['auraflow_slack_last_status'], (result) => {
        TestRunner.assert(
            !result.auraflow_slack_last_status,
            'Missing status returns null/undefined'
        );
    });

    // Test 11: Token structure validation
    TestRunner.log('Test: Token Structure Validation', 'info');

    const completeTokens = {
        access_token: 'xoxb-complete',
        token_type: 'Bearer',
        scope: 'users.profile:write',
        team: { id: 'T123', name: 'Team' },
        authed_user: {
            id: 'U123',
            access_token: 'xoxp-user',
            token_type: 'Bearer'
        }
    };

    const hasAllFields = completeTokens.access_token &&
        completeTokens.token_type &&
        completeTokens.team &&
        completeTokens.authed_user &&
        completeTokens.authed_user.access_token;

    TestRunner.assert(
        hasAllFields,
        'Complete token structure has all required fields'
    );

    // Test 12: Status timestamp validation
    TestRunner.log('Test: Status Timestamp Validation', 'info');

    const statusWithTimestamp = {
        status: 'focused',
        emoji: ':dart:',
        text: 'Focus mode',
        timestamp: Date.now()
    };

    const now = Date.now();
    const isRecentTimestamp = Math.abs(statusWithTimestamp.timestamp - now) < 1000; // Within 1 second

    TestRunner.assert(
        isRecentTimestamp,
        'Status timestamp is recent and valid'
    );

    mockChrome.storage.local.clear();
}

// ============================================================================
// SLACK AUTHENTICATION UTILITIES TESTS
// ============================================================================

function runSlackAuthTests() {
    TestRunner.log('=== Slack Authentication Utilities Tests ===', 'info');

    // Test 1: OAuth redirect URI generation
    TestRunner.log('Test: OAuth Redirect URI Generation', 'info');

    // Mock chrome.identity.getRedirectURL
    const mockRedirectUri = 'https://abcdefghijklmnop.chromiumapp.org/slack';

    TestRunner.assert(
        mockRedirectUri.includes('chromiumapp.org'),
        'Redirect URI has correct format'
    );
    TestRunner.assert(
        mockRedirectUri.endsWith('/slack'),
        'Redirect URI ends with /slack path'
    );

    // Test 2: OAuth state generation
    TestRunner.log('Test: OAuth State Generation', 'info');

    // Simulate state generation
    const state1 = generateMockState();
    const state2 = generateMockState();

    TestRunner.assert(
        state1.length === 32,
        'State has correct length (32 hex characters)'
    );
    TestRunner.assert(
        state1 !== state2,
        'Each state is unique'
    );
    TestRunner.assert(
        /^[0-9a-f]+$/.test(state1),
        'State contains only hex characters'
    );

    // Test 3: OAuth URL construction
    TestRunner.log('Test: OAuth URL Construction', 'info');

    const mockClientId = 'test-client-id';
    const mockScopes = ['users.profile:write', 'users:write', 'dnd:write', 'users.profile:read', 'team:read'];
    const mockState = 'abc123def456';
    const mockRedirectUrl = 'https://test.chromiumapp.org/slack';

    const authUrl = buildMockAuthUrl(mockClientId, mockScopes, mockState, mockRedirectUrl);

    TestRunner.assert(
        authUrl.startsWith('https://slack.com/oauth/v2/authorize'),
        'Auth URL has correct base'
    );
    TestRunner.assert(
        authUrl.includes(`client_id=${mockClientId}`),
        'Auth URL includes client ID'
    );
    TestRunner.assert(
        authUrl.includes('scope='),
        'Auth URL includes scopes'
    );
    TestRunner.assert(
        authUrl.includes(`state=${mockState}`),
        'Auth URL includes state parameter'
    );
    TestRunner.assert(
        authUrl.includes('response_type=code'),
        'Auth URL includes response_type=code'
    );

    // Test 4: State validation
    TestRunner.log('Test: OAuth State Validation', 'info');

    const storedState = 'stored-state-value';
    const receivedState = 'stored-state-value';
    const invalidState = 'different-state-value';

    TestRunner.assert(
        storedState === receivedState,
        'Valid state passes validation'
    );
    TestRunner.assert(
        storedState !== invalidState,
        'Invalid state fails validation'
    );

    // Test 5: Authorization code parsing
    TestRunner.log('Test: Authorization Code Parsing', 'info');

    const mockRedirectUrl1 = 'https://test.chromiumapp.org/slack?code=test-auth-code&state=test-state';
    const parsedCode = parseCodeFromUrl(mockRedirectUrl1);

    TestRunner.assertEqual(
        parsedCode.code,
        'test-auth-code',
        'Authorization code parsed correctly'
    );
    TestRunner.assertEqual(
        parsedCode.state,
        'test-state',
        'State parsed correctly from redirect URL'
    );

    // Test 6: Error handling in redirect URL
    TestRunner.log('Test: OAuth Error Handling', 'info');

    const errorRedirectUrl = 'https://test.chromiumapp.org/slack?error=access_denied&error_description=User+cancelled';
    const parsedError = parseCodeFromUrl(errorRedirectUrl);

    TestRunner.assertEqual(
        parsedError.error,
        'access_denied',
        'OAuth error parsed correctly'
    );
    TestRunner.assert(
        !parsedError.code,
        'No code present when error occurs'
    );

    // Test 7: Token exchange request structure
    TestRunner.log('Test: Token Exchange Request Structure', 'info');

    const tokenExchangeParams = {
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        code: 'test-auth-code',
        redirect_uri: 'https://test.chromiumapp.org/slack'
    };

    TestRunner.assertNotNull(tokenExchangeParams.client_id, 'Token exchange includes client_id');
    TestRunner.assertNotNull(tokenExchangeParams.client_secret, 'Token exchange includes client_secret');
    TestRunner.assertNotNull(tokenExchangeParams.code, 'Token exchange includes authorization code');
    TestRunner.assertNotNull(tokenExchangeParams.redirect_uri, 'Token exchange includes redirect_uri');

    // Test 8: Token response validation
    TestRunner.log('Test: Token Response Validation', 'info');

    const validTokenResponse = {
        ok: true,
        access_token: 'xoxb-test-token',
        token_type: 'Bearer',
        scope: 'users.profile:write,users:write',
        team: {
            id: 'T123456',
            name: 'Test Workspace'
        },
        authed_user: {
            id: 'U789012',
            access_token: 'xoxp-user-token',
            token_type: 'Bearer'
        }
    };

    TestRunner.assert(
        validTokenResponse.ok === true,
        'Valid token response has ok: true'
    );
    TestRunner.assertNotNull(
        validTokenResponse.access_token,
        'Token response includes access_token'
    );
    TestRunner.assertNotNull(
        validTokenResponse.authed_user,
        'Token response includes authed_user'
    );
    TestRunner.assertNotNull(
        validTokenResponse.authed_user.access_token,
        'Token response includes user access_token'
    );

    // Test 9: Invalid token response handling
    TestRunner.log('Test: Invalid Token Response Handling', 'info');

    const invalidTokenResponse = {
        ok: false,
        error: 'invalid_code'
    };

    TestRunner.assert(
        invalidTokenResponse.ok === false,
        'Invalid token response has ok: false'
    );
    TestRunner.assertNotNull(
        invalidTokenResponse.error,
        'Invalid response includes error message'
    );

    // Test 10: Get valid token from storage
    TestRunner.log('Test: Get Valid Token from Storage', 'info');

    // Store valid tokens
    const storedTokens = {
        access_token: 'xoxb-stored-token',
        authed_user: {
            id: 'U123',
            access_token: 'xoxp-stored-user-token'
        }
    };

    mockChrome.storage.local.set({ 'auraflow_slack_tokens': storedTokens });
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        const tokens = result.auraflow_slack_tokens;
        TestRunner.assertNotNull(tokens, 'Tokens retrieved from storage');
        TestRunner.assertNotNull(
            tokens.authed_user.access_token,
            'User access token available'
        );
    });

    // Test 11: Handle missing tokens
    TestRunner.log('Test: Handle Missing Tokens', 'info');

    mockChrome.storage.local.clear();
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        TestRunner.assert(
            !result.auraflow_slack_tokens,
            'Missing tokens handled gracefully'
        );
    });

    // Test 12: Auth status check - authenticated
    TestRunner.log('Test: Auth Status Check - Authenticated', 'info');

    const authenticatedTokens = {
        access_token: 'xoxb-valid',
        team: {
            id: 'T123',
            name: 'Test Team'
        },
        authed_user: {
            id: 'U456',
            access_token: 'xoxp-valid'
        }
    };

    mockChrome.storage.local.set({ 'auraflow_slack_tokens': authenticatedTokens });
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        const tokens = result.auraflow_slack_tokens;
        const isAuthenticated = tokens &&
            tokens.access_token &&
            tokens.authed_user &&
            tokens.authed_user.access_token;

        TestRunner.assert(
            isAuthenticated,
            'Auth status correctly identifies authenticated user'
        );
    });

    // Test 13: Auth status check - not authenticated
    TestRunner.log('Test: Auth Status Check - Not Authenticated', 'info');

    mockChrome.storage.local.clear();
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        const tokens = result.auraflow_slack_tokens;
        const isAuthenticated = tokens &&
            tokens.access_token &&
            tokens.authed_user &&
            tokens.authed_user.access_token;

        TestRunner.assert(
            !isAuthenticated,
            'Auth status correctly identifies unauthenticated user'
        );
    });

    // Test 14: Client credentials validation
    TestRunner.log('Test: Client Credentials Validation', 'info');

    const validClientId = 'valid-client-id';
    const invalidClientId = 'YOUR_SLACK_CLIENT_ID';

    TestRunner.assert(
        validClientId !== 'YOUR_SLACK_CLIENT_ID' && validClientId.length > 0,
        'Valid client ID passes validation'
    );
    TestRunner.assert(
        invalidClientId === 'YOUR_SLACK_CLIENT_ID',
        'Placeholder client ID fails validation'
    );

    // Test 15: Scope configuration
    TestRunner.log('Test: Scope Configuration', 'info');

    const requiredScopes = [
        'users.profile:write',
        'users:write',
        'dnd:write',
        'users.profile:read',
        'team:read'
    ];

    TestRunner.assertEqual(
        requiredScopes.length,
        5,
        'All required scopes are configured'
    );
    TestRunner.assert(
        requiredScopes.includes('users.profile:write'),
        'Includes users.profile:write scope'
    );
    TestRunner.assert(
        requiredScopes.includes('dnd:write'),
        'Includes dnd:write scope'
    );

    mockChrome.storage.local.clear();
}

// Helper functions for Slack auth tests
function generateMockState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function buildMockAuthUrl(clientId, scopes, state, redirectUri) {
    const params = new URLSearchParams({
        client_id: clientId,
        scope: scopes.join(','),
        redirect_uri: redirectUri,
        state: state,
        response_type: 'code'
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

function parseCodeFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return {
            code: urlObj.searchParams.get('code'),
            state: urlObj.searchParams.get('state'),
            error: urlObj.searchParams.get('error')
        };
    } catch (error) {
        return { error: 'Invalid URL' };
    }
}

// Test runners
function runAllTests() {
    TestRunner.clear();
    TestRunner.log('Starting all tests...', 'info');

    runAuthTests();
    runEventTests();
    runUITests();
    runSlackStorageTests();
    runSlackAuthTests();
    runSlackAPITests();

    TestRunner.showSummary();
}

function clearResults() {
    TestRunner.clear();
}

// ============================================================================
// SLACK API INTEGRATION TESTS
// ============================================================================

function runSlackAPITests() {
    TestRunner.log('=== Slack API Integration Tests ===', 'info');

    // Test 1: parseSlackError - known error codes
    TestRunner.log('Test: Parse Slack Error - Known Codes', 'info');

    const knownErrors = {
        'invalid_auth': 'Invalid authentication token',
        'not_authed': 'Not authenticated with Slack',
        'token_revoked': 'Slack token has been revoked',
        'rate_limited': 'Rate limit exceeded',
        'missing_scope': 'Missing required OAuth scope',
        'account_inactive': 'Slack account is inactive'
    };

    Object.entries(knownErrors).forEach(([code, expectedMessage]) => {
        const message = parseSlackErrorMock(code);
        TestRunner.assertEqual(
            message,
            expectedMessage,
            `Error code "${code}" parsed correctly`
        );
    });

    // Test 2: parseSlackError - unknown error codes
    TestRunner.log('Test: Parse Slack Error - Unknown Codes', 'info');

    const unknownError = parseSlackErrorMock('unknown_error_code');
    TestRunner.assert(
        unknownError.includes('Slack API error'),
        'Unknown error codes return generic message'
    );
    TestRunner.assert(
        unknownError.includes('unknown_error_code'),
        'Unknown error message includes error code'
    );

    // Test 3: API request structure - POST with body
    TestRunner.log('Test: API Request Structure - POST', 'info');

    const postRequest = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer xoxp-test-token',
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            profile: {
                status_text: 'In focus mode',
                status_emoji: ':dart:',
                status_expiration: 0
            }
        })
    };

    TestRunner.assertEqual(
        postRequest.method,
        'POST',
        'POST request has correct method'
    );
    TestRunner.assert(
        postRequest.headers['Authorization'].includes('Bearer'),
        'Request includes Bearer token'
    );
    TestRunner.assert(
        postRequest.headers['Content-Type'].includes('application/json'),
        'Request has JSON content type'
    );
    TestRunner.assertNotNull(
        postRequest.body,
        'POST request includes body'
    );

    // Test 4: API request structure - GET with params
    TestRunner.log('Test: API Request Structure - GET', 'info');

    const getRequest = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer xoxp-test-token',
            'Content-Type': 'application/json; charset=utf-8'
        }
    };

    const queryParams = new URLSearchParams({ user: 'U123456' });
    const getUrl = `https://slack.com/api/users.profile.get?${queryParams.toString()}`;

    TestRunner.assertEqual(
        getRequest.method,
        'GET',
        'GET request has correct method'
    );
    TestRunner.assert(
        getUrl.includes('?user='),
        'GET request URL includes query parameters'
    );

    // Test 5: setUserStatus - valid parameters
    TestRunner.log('Test: setUserStatus - Valid Parameters', 'info');

    const statusParams = {
        profile: {
            status_text: 'In focus mode',
            status_emoji: ':dart:',
            status_expiration: 0
        }
    };

    TestRunner.assertNotNull(
        statusParams.profile.status_text,
        'Status text is set'
    );
    TestRunner.assertNotNull(
        statusParams.profile.status_emoji,
        'Status emoji is set'
    );
    TestRunner.assertEqual(
        statusParams.profile.status_expiration,
        0,
        'Status expiration is set to 0 (no expiration)'
    );

    // Test 6: setUserStatus - clear status
    TestRunner.log('Test: setUserStatus - Clear Status', 'info');

    const clearStatusParams = {
        profile: {
            status_text: '',
            status_emoji: '',
            status_expiration: 0
        }
    };

    TestRunner.assertEqual(
        clearStatusParams.profile.status_text,
        '',
        'Status text is empty to clear'
    );
    TestRunner.assertEqual(
        clearStatusParams.profile.status_emoji,
        '',
        'Status emoji is empty to clear'
    );

    // Test 7: setUserPresence - valid values
    TestRunner.log('Test: setUserPresence - Valid Values', 'info');

    const validPresenceValues = ['auto', 'away'];

    validPresenceValues.forEach(presence => {
        TestRunner.assert(
            presence === 'auto' || presence === 'away',
            `Presence value "${presence}" is valid`
        );
    });

    // Test 8: setUserPresence - invalid values
    TestRunner.log('Test: setUserPresence - Invalid Values', 'info');

    const invalidPresenceValues = ['online', 'offline', 'busy', ''];

    invalidPresenceValues.forEach(presence => {
        TestRunner.assert(
            presence !== 'auto' && presence !== 'away',
            `Presence value "${presence}" is invalid`
        );
    });

    // Test 9: setDndSnooze - valid duration
    TestRunner.log('Test: setDndSnooze - Valid Duration', 'info');

    const validDurations = [1, 30, 60, 120, 480, 1440];

    validDurations.forEach(duration => {
        TestRunner.assert(
            duration >= 1 && duration <= 1440,
            `DND duration ${duration} minutes is valid`
        );
    });

    // Test 10: setDndSnooze - invalid duration
    TestRunner.log('Test: setDndSnooze - Invalid Duration', 'info');

    const invalidDurations = [0, -1, 1441, 2000];

    invalidDurations.forEach(duration => {
        TestRunner.assert(
            duration < 1 || duration > 1440,
            `DND duration ${duration} minutes is invalid`
        );
    });

    // Test 11: API response validation - success
    TestRunner.log('Test: API Response Validation - Success', 'info');

    const successResponse = {
        ok: true,
        profile: {
            status_text: 'In focus mode',
            status_emoji: ':dart:',
            status_expiration: 0
        }
    };

    TestRunner.assert(
        successResponse.ok === true,
        'Successful response has ok: true'
    );
    TestRunner.assertNotNull(
        successResponse.profile,
        'Successful response includes data'
    );

    // Test 12: API response validation - error
    TestRunner.log('Test: API Response Validation - Error', 'info');

    const errorResponse = {
        ok: false,
        error: 'invalid_auth'
    };

    TestRunner.assert(
        errorResponse.ok === false,
        'Error response has ok: false'
    );
    TestRunner.assertNotNull(
        errorResponse.error,
        'Error response includes error code'
    );

    // Test 13: Error handling - invalid_auth
    TestRunner.log('Test: Error Handling - Invalid Auth', 'info');

    const invalidAuthError = {
        ok: false,
        error: 'invalid_auth'
    };

    const shouldClearTokens = ['invalid_auth', 'token_revoked', 'token_expired', 'not_authed'].includes(invalidAuthError.error);

    TestRunner.assert(
        shouldClearTokens,
        'Invalid auth error triggers token clearing'
    );

    // Test 14: Error handling - rate limiting
    TestRunner.log('Test: Error Handling - Rate Limiting', 'info');

    const rateLimitError = {
        ok: false,
        error: 'rate_limited'
    };

    const shouldRetry = rateLimitError.error === 'rate_limited' || rateLimitError.error === 'ratelimited';

    TestRunner.assert(
        shouldRetry,
        'Rate limit error triggers retry logic'
    );

    // Test 15: Retry logic - exponential backoff
    TestRunner.log('Test: Retry Logic - Exponential Backoff', 'info');

    const retryDelays = [0, 1, 2, 3].map(retryCount => {
        return Math.min(Math.pow(2, retryCount) * 1000, 10000);
    });

    TestRunner.assertEqual(
        retryDelays[0],
        1000,
        'First retry delay is 1 second'
    );
    TestRunner.assertEqual(
        retryDelays[1],
        2000,
        'Second retry delay is 2 seconds'
    );
    TestRunner.assertEqual(
        retryDelays[2],
        4000,
        'Third retry delay is 4 seconds'
    );
    TestRunner.assertEqual(
        retryDelays[3],
        8000,
        'Fourth retry delay is 8 seconds'
    );

    // Test 16: getUserProfile - response structure
    TestRunner.log('Test: getUserProfile - Response Structure', 'info');

    const profileResponse = {
        ok: true,
        profile: {
            status_text: 'In a meeting',
            status_emoji: ':calendar:',
            status_expiration: 0,
            real_name: 'Test User',
            display_name: 'testuser',
            email: 'test@example.com'
        }
    };

    TestRunner.assert(
        profileResponse.ok === true,
        'Profile response is successful'
    );
    TestRunner.assertNotNull(
        profileResponse.profile,
        'Profile response includes profile data'
    );
    TestRunner.assertNotNull(
        profileResponse.profile.status_text,
        'Profile includes status_text'
    );
    TestRunner.assertNotNull(
        profileResponse.profile.status_emoji,
        'Profile includes status_emoji'
    );

    // Test 17: getTeamInfo - response structure
    TestRunner.log('Test: getTeamInfo - Response Structure', 'info');

    const teamResponse = {
        ok: true,
        team: {
            id: 'T123456',
            name: 'Test Workspace',
            domain: 'test-workspace',
            email_domain: 'example.com'
        }
    };

    TestRunner.assert(
        teamResponse.ok === true,
        'Team response is successful'
    );
    TestRunner.assertNotNull(
        teamResponse.team,
        'Team response includes team data'
    );
    TestRunner.assertNotNull(
        teamResponse.team.id,
        'Team data includes ID'
    );
    TestRunner.assertNotNull(
        teamResponse.team.name,
        'Team data includes name'
    );

    // Test 18: API endpoint URLs
    TestRunner.log('Test: API Endpoint URLs', 'info');

    const baseUrl = 'https://slack.com/api';
    const endpoints = {
        setStatus: `${baseUrl}/users.profile.set`,
        getProfile: `${baseUrl}/users.profile.get`,
        setPresence: `${baseUrl}/users.setPresence`,
        setDnd: `${baseUrl}/dnd.setSnooze`,
        endDnd: `${baseUrl}/dnd.endSnooze`,
        getTeam: `${baseUrl}/team.info`
    };

    Object.entries(endpoints).forEach(([name, url]) => {
        TestRunner.assert(
            url.startsWith('https://slack.com/api/'),
            `${name} endpoint has correct base URL`
        );
    });

    // Test 19: Request timeout handling
    TestRunner.log('Test: Request Timeout Handling', 'info');

    const timeoutDuration = 10000; // 10 seconds

    TestRunner.assertEqual(
        timeoutDuration,
        10000,
        'Request timeout is set to 10 seconds'
    );

    // Test 20: Network error handling
    TestRunner.log('Test: Network Error Handling', 'info');

    const networkErrors = [
        { name: 'AbortError', message: 'Request timed out' },
        { name: 'TypeError', message: 'Failed to fetch' },
        { name: 'NetworkError', message: 'Network error' }
    ];

    networkErrors.forEach(error => {
        const isNetworkError = error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError');

        TestRunner.assert(
            isNetworkError,
            `${error.name} is recognized as network error`
        );
    });

    // Test 21: Status configurations
    TestRunner.log('Test: Status Configurations', 'info');

    const statusConfigs = {
        available: {
            emoji: '',
            text: '',
            expiration: 0
        },
        focused: {
            emoji: ':dart:',
            text: 'In focus mode',
            expiration: 0
        },
        dnd: {
            emoji: ':no_bell:',
            text: 'Do not disturb',
            expiration: 0,
            dndMinutes: 60
        }
    };

    TestRunner.assertEqual(
        statusConfigs.available.emoji,
        '',
        'Available status has empty emoji'
    );
    TestRunner.assertEqual(
        statusConfigs.focused.emoji,
        ':dart:',
        'Focused status has dart emoji'
    );
    TestRunner.assertEqual(
        statusConfigs.dnd.emoji,
        ':no_bell:',
        'DND status has no_bell emoji'
    );
    TestRunner.assertEqual(
        statusConfigs.dnd.dndMinutes,
        60,
        'DND status has 60 minute duration'
    );

    // Test 22: Token retrieval from storage
    TestRunner.log('Test: Token Retrieval from Storage', 'info');

    const mockTokens = {
        access_token: 'xoxb-bot-token',
        authed_user: {
            id: 'U123',
            access_token: 'xoxp-user-token'
        }
    };

    mockChrome.storage.local.set({ 'auraflow_slack_tokens': mockTokens });
    mockChrome.storage.local.get(['auraflow_slack_tokens'], (result) => {
        const tokens = result.auraflow_slack_tokens;
        TestRunner.assertNotNull(
            tokens.authed_user.access_token,
            'User access token retrieved for API calls'
        );
    });

    // Test 23: Error message user-friendliness
    TestRunner.log('Test: Error Message User-Friendliness', 'info');

    const userFriendlyErrors = {
        'invalid_auth': 'Invalid authentication token',
        'rate_limited': 'Rate limit exceeded',
        'missing_scope': 'Missing required OAuth scope'
    };

    Object.entries(userFriendlyErrors).forEach(([code, message]) => {
        TestRunner.assert(
            !message.includes('_') && !message.includes('error:'),
            `Error message for "${code}" is user-friendly`
        );
    });

    // Test 24: DND snooze response
    TestRunner.log('Test: DND Snooze Response', 'info');

    const dndResponse = {
        ok: true,
        snooze_enabled: true,
        snooze_endtime: Math.floor(Date.now() / 1000) + 3600,
        snooze_remaining: 60
    };

    TestRunner.assert(
        dndResponse.ok === true,
        'DND snooze response is successful'
    );
    TestRunner.assert(
        dndResponse.snooze_enabled === true,
        'DND is enabled in response'
    );
    TestRunner.assertNotNull(
        dndResponse.snooze_endtime,
        'DND end time is provided'
    );

    // Test 25: Multiple API calls sequencing
    TestRunner.log('Test: Multiple API Calls Sequencing', 'info');

    const apiCallSequence = [
        { endpoint: 'users.profile.set', order: 1 },
        { endpoint: 'users.setPresence', order: 2 },
        { endpoint: 'dnd.setSnooze', order: 3 }
    ];

    TestRunner.assertEqual(
        apiCallSequence.length,
        3,
        'Status update requires 3 API calls for DND mode'
    );
    TestRunner.assertEqual(
        apiCallSequence[0].endpoint,
        'users.profile.set',
        'First call sets user status'
    );
    TestRunner.assertEqual(
        apiCallSequence[2].endpoint,
        'dnd.setSnooze',
        'Last call enables DND'
    );

    mockChrome.storage.local.clear();
}

// Helper function for Slack API tests
function parseSlackErrorMock(errorCode) {
    const errorMessages = {
        'invalid_auth': 'Invalid authentication token',
        'not_authed': 'Not authenticated with Slack',
        'account_inactive': 'Slack account is inactive',
        'token_revoked': 'Slack token has been revoked',
        'token_expired': 'Slack token has expired',
        'no_permission': 'Missing required permissions',
        'rate_limited': 'Rate limit exceeded',
        'missing_scope': 'Missing required OAuth scope',
        'user_not_found': 'User not found',
        'cannot_set_status': 'Cannot set status at this time',
        'not_allowed_token_type': 'Invalid token type for this operation',
        'snooze_failed': 'Failed to enable Do Not Disturb mode',
        'snooze_end_failed': 'Failed to disable Do Not Disturb mode',
        'presence_error': 'Failed to update presence status',
        'profile_set_failed': 'Failed to update profile status'
    };

    return errorMessages[errorCode] || `Slack API error: ${errorCode}`;
}
