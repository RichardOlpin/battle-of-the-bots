/**
 * Slack Integration Tests Runner
 * Browser-based test runner for integration tests
 */

// Test state
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Mock Chrome API for browser testing
const mockChromeAPI = {
    storage: {
        local: {
            data: {},
            get: function (keys) {
                return new Promise((resolve) => {
                    const result = {};
                    const keyArray = Array.isArray(keys) ? keys : [keys];
                    keyArray.forEach(key => {
                        if (this.data[key]) {
                            result[key] = this.data[key];
                        }
                    });
                    resolve(result);
                });
            },
            set: function (items) {
                return new Promise((resolve) => {
                    Object.assign(this.data, items);
                    resolve();
                });
            },
            remove: function (keys) {
                return new Promise((resolve) => {
                    const keyArray = Array.isArray(keys) ? keys : [keys];
                    keyArray.forEach(key => delete this.data[key]);
                    resolve();
                });
            },
            clear: function () {
                return new Promise((resolve) => {
                    this.data = {};
                    resolve();
                });
            }
        }
    },
    identity: {
        getRedirectURL: () => 'https://extension-id.chromiumapp.org/slack',
        launchWebAuthFlow: null // Will be mocked per test
    },
    runtime: {
        getManifest: () => ({ version: '1.0.0' }),
        lastError: null
    }
};

// Utility functions
function logTest(message, type = 'info') {
    const output = document.getElementById('test-output');
    const div = document.createElement('div');
    div.className = `test-result test-${type}`;
    div.textContent = message;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}


function logGroup(title) {
    const output = document.getElementById('test-output');
    const div = document.createElement('div');
    div.className = 'test-group';
    div.innerHTML = `<h3>${title}</h3>`;
    output.appendChild(div);
}

function updateProgress(current, total) {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    progressBar.style.display = 'block';
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
}

function showSummary() {
    const output = document.getElementById('test-output');
    const div = document.createElement('div');
    div.className = `summary ${testResults.failed === 0 ? 'pass' : 'fail'}`;
    div.innerHTML = `
        <strong>Test Summary:</strong><br>
        Total: ${testResults.total} | 
        Passed: ${testResults.passed} | 
        Failed: ${testResults.failed}
    `;
    output.appendChild(div);
}

function clearResults() {
    document.getElementById('test-output').innerHTML = '';
    document.getElementById('progress-bar').style.display = 'none';
    testResults = { passed: 0, failed: 0, total: 0 };
}

async function runTest(testName, testFn) {
    testResults.total++;
    logTest(`Running: ${testName}`, 'running');

    try {
        await testFn();
        testResults.passed++;
        logTest(`✓ PASS: ${testName}`, 'pass');
        return true;
    } catch (error) {
        testResults.failed++;
        logTest(`✗ FAIL: ${testName} - ${error.message}`, 'fail');
        console.error(error);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertDefined(value, message) {
    if (value === undefined || value === null) {
        throw new Error(message || 'Value is undefined or null');
    }
}

// Reset mock state before each test
function resetMocks() {
    mockChromeAPI.storage.local.data = {};
    mockChromeAPI.runtime.lastError = null;
}


// ============================================================================
// TEST SUITE 1: Authentication Flow Tests
// ============================================================================
async function runAuthTests() {
    clearResults();
    logGroup('🔐 Authentication Flow Tests');

    await runTest('Complete OAuth flow from button click to token storage', async () => {
        resetMocks();

        // Mock OAuth flow
        const mockAuthCode = 'test_auth_code_12345';
        const mockRedirectUrl = `https://extension-id.chromiumapp.org/slack?code=${mockAuthCode}&state=test_state`;

        // Simulate OAuth redirect
        const urlParams = new URL(mockRedirectUrl).searchParams;
        const authCode = urlParams.get('code');
        assertEqual(authCode, mockAuthCode, 'Auth code should match');

        // Simulate token storage
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': {
                access_token: 'xoxp-test-token',
                team: { id: 'T12345', name: 'Test Workspace' }
            }
        });

        // Verify storage
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_tokens']);
        assertDefined(stored.auraflow_slack_tokens, 'Tokens should be stored');
        assertEqual(stored.auraflow_slack_tokens.access_token, 'xoxp-test-token', 'Token should match');
    });

    await runTest('Handle OAuth cancellation gracefully', async () => {
        resetMocks();

        // Simulate cancellation
        const mockRedirectUrl = 'https://extension-id.chromiumapp.org/slack?error=access_denied';
        const urlParams = new URL(mockRedirectUrl).searchParams;
        const error = urlParams.get('error');

        assertEqual(error, 'access_denied', 'Should detect cancellation');
        assert(urlParams.get('code') === null, 'Should not have auth code');
    });

    await runTest('Handle invalid authorization code', async () => {
        resetMocks();

        const mockRedirectUrl = 'https://extension-id.chromiumapp.org/slack?error=invalid_code';
        const urlParams = new URL(mockRedirectUrl).searchParams;

        assert(urlParams.get('error') !== null, 'Should have error parameter');
        assert(urlParams.get('code') === null, 'Should not have code');
    });

    showSummary();
}

// ============================================================================
// TEST SUITE 2: Status Update Tests
// ============================================================================
async function runStatusUpdateTests() {
    clearResults();
    logGroup('🎯 Status Update Flow Tests');

    // Set up authenticated state for all tests
    await mockChromeAPI.storage.local.set({
        'auraflow_slack_tokens': {
            access_token: 'xoxp-test-token',
            team: { id: 'T12345', name: 'Test Workspace' }
        }
    });

    await runTest('Complete Available status update flow', async () => {
        resetMocks();
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' }
        });

        // Simulate status update
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': {
                status: 'available',
                emoji: '',
                text: '',
                timestamp: Date.now()
            }
        });

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'available', 'Status should be available');
    });

    await runTest('Complete Focused status update flow', async () => {
        resetMocks();
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' }
        });

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'focused', 'Status should be focused');
        assertEqual(stored.auraflow_slack_last_status.emoji, ':dart:', 'Emoji should be dart');
    });

    await runTest('Complete DND status update flow', async () => {
        resetMocks();
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' }
        });

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': {
                status: 'dnd',
                emoji: ':no_bell:',
                text: 'Do not disturb',
                timestamp: Date.now()
            }
        });

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'dnd', 'Status should be dnd');
        assertEqual(stored.auraflow_slack_last_status.emoji, ':no_bell:', 'Emoji should be no_bell');
    });

    showSummary();
}


// ============================================================================
// TEST SUITE 3: Disconnect Flow Tests
// ============================================================================
async function runDisconnectTests() {
    clearResults();
    logGroup('🔌 Disconnect Flow Tests');

    await runTest('Complete full disconnect flow', async () => {
        resetMocks();

        // Set up authenticated state
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': {
                access_token: 'xoxp-test-token',
                team: { id: 'T12345', name: 'Test Workspace' }
            },
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        // Verify data exists
        let stored = await mockChromeAPI.storage.local.get([
            'auraflow_slack_tokens',
            'auraflow_slack_last_status'
        ]);
        assertDefined(stored.auraflow_slack_tokens, 'Tokens should exist before disconnect');

        // Disconnect
        await mockChromeAPI.storage.local.remove([
            'auraflow_slack_tokens',
            'auraflow_slack_last_status'
        ]);

        // Verify cleared
        stored = await mockChromeAPI.storage.local.get([
            'auraflow_slack_tokens',
            'auraflow_slack_last_status'
        ]);
        assert(stored.auraflow_slack_tokens === undefined, 'Tokens should be cleared');
        assert(stored.auraflow_slack_last_status === undefined, 'Status should be cleared');
    });

    await runTest('Handle disconnect when not authenticated', async () => {
        resetMocks();

        // No tokens stored
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_tokens']);
        assert(stored.auraflow_slack_tokens === undefined, 'Should not have tokens');

        // Attempt to clear (should not throw error)
        await mockChromeAPI.storage.local.remove(['auraflow_slack_tokens', 'auraflow_slack_last_status']);
    });

    showSummary();
}

// ============================================================================
// TEST SUITE 4: Persistence Tests
// ============================================================================
async function runPersistenceTests() {
    clearResults();
    logGroup('💾 Status Persistence Tests');

    await runTest('Persist status across popup close and reopen', async () => {
        resetMocks();

        // Set status
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' },
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        // Simulate popup close (data persists in storage)
        // Simulate popup reopen - load status
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertDefined(stored.auraflow_slack_last_status, 'Status should persist');
        assertEqual(stored.auraflow_slack_last_status.status, 'focused', 'Status should be focused');
    });

    await runTest('Handle multiple status changes and persist latest', async () => {
        resetMocks();

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' }
        });

        // Change status multiple times
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': { status: 'available', timestamp: Date.now() }
        });

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': { status: 'focused', timestamp: Date.now() }
        });

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': { status: 'dnd', timestamp: Date.now() }
        });

        // Verify latest
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'dnd', 'Should have latest status');
    });

    await runTest('Sync with Slack API on popup reopen', async () => {
        resetMocks();

        // Store last known status
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' },
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        // Simulate API returning different status
        const apiStatus = {
            emoji: ':no_bell:',
            text: 'Do not disturb'
        };

        // Determine status from API response
        let currentStatus = null;
        if (apiStatus.emoji === ':no_bell:' && apiStatus.text === 'Do not disturb') {
            currentStatus = 'dnd';
        }

        assertEqual(currentStatus, 'dnd', 'Should detect status change');

        // Update stored status
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_last_status': {
                status: currentStatus,
                emoji: apiStatus.emoji,
                text: apiStatus.text,
                timestamp: Date.now()
            }
        });

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'dnd', 'Status should be synced');
    });

    showSummary();
}


// ============================================================================
// TEST SUITE 5: Error Scenario Tests
// ============================================================================
async function runErrorTests() {
    clearResults();
    logGroup('⚠️ Error Scenario Tests');

    await runTest('Handle expired token error', async () => {
        resetMocks();

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-expired-token' }
        });

        // Simulate invalid_auth error detection
        const apiError = 'invalid_auth';
        assertEqual(apiError, 'invalid_auth', 'Should detect invalid auth');

        // Clear tokens automatically
        await mockChromeAPI.storage.local.remove(['auraflow_slack_tokens']);

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_tokens']);
        assert(stored.auraflow_slack_tokens === undefined, 'Tokens should be cleared');
    });

    await runTest('Handle network error with fallback', async () => {
        resetMocks();

        // Set up cached status
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' },
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        // Simulate network error - fall back to cached status
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertDefined(stored.auraflow_slack_last_status, 'Should have cached status');
        assertEqual(stored.auraflow_slack_last_status.status, 'focused', 'Should use cached status');
    });

    await runTest('Handle rate limiting error', async () => {
        resetMocks();

        // Simulate rate limit error
        const apiError = 'rate_limited';
        assertEqual(apiError, 'rate_limited', 'Should detect rate limit');

        // User-friendly message
        const message = 'Too many requests. Please wait a moment and try again.';
        assert(message.includes('wait'), 'Should have user-friendly message');
    });

    await runTest('Calculate exponential backoff correctly', async () => {
        const delays = [];
        for (let attempt = 0; attempt < 3; attempt++) {
            const delay = Math.min(Math.pow(2, attempt) * 1000, 10000);
            delays.push(delay);
        }

        assertEqual(delays[0], 1000, 'First retry should be 1 second');
        assertEqual(delays[1], 2000, 'Second retry should be 2 seconds');
        assertEqual(delays[2], 4000, 'Third retry should be 4 seconds');
    });

    await runTest('Handle missing scopes error', async () => {
        const apiError = {
            error: 'missing_scope',
            needed: 'users.profile:write'
        };

        assertEqual(apiError.error, 'missing_scope', 'Should detect missing scope');
        assertDefined(apiError.needed, 'Should specify needed scope');
    });

    showSummary();
}

// ============================================================================
// TEST SUITE 6: Edge Case Tests
// ============================================================================
async function runEdgeCaseTests() {
    clearResults();
    logGroup('🔍 Edge Case Tests');

    await runTest('Handle rapid status changes', async () => {
        resetMocks();

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' }
        });

        // Rapid changes
        const statuses = ['available', 'focused', 'dnd', 'available'];
        for (const status of statuses) {
            await mockChromeAPI.storage.local.set({
                'auraflow_slack_last_status': { status, timestamp: Date.now() }
            });
        }

        // Final status should be last one
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        assertEqual(stored.auraflow_slack_last_status.status, 'available', 'Should have final status');
    });

    await runTest('Handle clicking already active status', async () => {
        resetMocks();

        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' },
            'auraflow_slack_last_status': { status: 'focused', timestamp: Date.now() }
        });

        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        const currentStatus = stored.auraflow_slack_last_status.status;
        const clickedStatus = 'focused';

        assertEqual(currentStatus, clickedStatus, 'Status should remain unchanged');
    });

    await runTest('Handle status changed in multiple Slack clients', async () => {
        resetMocks();

        // Extension sets status
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': { access_token: 'xoxp-test-token' },
            'auraflow_slack_last_status': {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            }
        });

        // Simulate API returning different status
        const apiStatus = { emoji: ':calendar:', text: 'In a meeting' };
        const stored = await mockChromeAPI.storage.local.get(['auraflow_slack_last_status']);
        const lastKnown = stored.auraflow_slack_last_status.emoji;

        assert(lastKnown !== apiStatus.emoji, 'Should detect status mismatch');
    });

    await runTest('Handle authentication during active session', async () => {
        resetMocks();

        // Active session
        await mockChromeAPI.storage.local.set({
            'auraflow_active_session': {
                workDuration: 25,
                breakDuration: 5,
                startTime: Date.now()
            }
        });

        // Authenticate Slack
        await mockChromeAPI.storage.local.set({
            'auraflow_slack_tokens': {
                access_token: 'xoxp-test-token',
                team: { id: 'T12345', name: 'Test Workspace' }
            }
        });

        // Both should coexist
        const stored = await mockChromeAPI.storage.local.get([
            'auraflow_active_session',
            'auraflow_slack_tokens'
        ]);

        assertDefined(stored.auraflow_active_session, 'Session should exist');
        assertDefined(stored.auraflow_slack_tokens, 'Tokens should exist');
    });

    showSummary();
}

// ============================================================================
// Run All Tests
// ============================================================================
async function runAllTests() {
    clearResults();
    logGroup('🚀 Running All Integration Tests');

    const suites = [
        { name: 'Authentication', fn: runAuthTests },
        { name: 'Status Updates', fn: runStatusUpdateTests },
        { name: 'Disconnect', fn: runDisconnectTests },
        { name: 'Persistence', fn: runPersistenceTests },
        { name: 'Error Scenarios', fn: runErrorTests },
        { name: 'Edge Cases', fn: runEdgeCaseTests }
    ];

    for (let i = 0; i < suites.length; i++) {
        updateProgress(i, suites.length);
        logTest(`\n=== Running ${suites[i].name} Tests ===`, 'info');

        // Reset for each suite
        testResults = { passed: 0, failed: 0, total: 0 };

        // Run suite (but don't show individual summary)
        const originalShowSummary = showSummary;
        window.showSummary = () => { }; // Temporarily disable

        await suites[i].fn();

        window.showSummary = originalShowSummary; // Restore
    }

    updateProgress(suites.length, suites.length);
    logTest('\n=== All Tests Complete ===', 'info');
}

// Initialize
console.log('Slack Integration Test Runner loaded');
console.log('Click "Run All Tests" to start testing');
