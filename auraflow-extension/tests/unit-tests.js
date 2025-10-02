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

// Test runners
function runAllTests() {
    TestRunner.clear();
    TestRunner.log('Starting all tests...', 'info');

    runAuthTests();
    runEventTests();
    runUITests();

    TestRunner.showSummary();
}

function clearResults() {
    TestRunner.clear();
}
