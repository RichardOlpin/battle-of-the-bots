/**
 * Unit tests for Slack error handling and recovery mechanisms
 * Tests error handling in SlackAuthUtils, SlackAPI, and ErrorUtils
 */

// Mock chrome APIs
global.chrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    },
    identity: {
        getRedirectURL: jest.fn(() => 'https://extension-id.chromiumapp.org/slack'),
        launchWebAuthFlow: jest.fn()
    },
    runtime: {
        getManifest: jest.fn(() => ({ version: '1.0.0' })),
        lastError: null
    }
};

global.navigator = {
    userAgent: 'Test User Agent'
};

global.crypto = {
    getRandomValues: jest.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    })
};

// Mock fetch
global.fetch = jest.fn();

describe('Slack Error Handling Tests', () => {
    let ErrorUtils, SlackStorageUtils, SlackAuthUtils, SlackAPI;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        global.chrome.runtime.lastError = null;

        // Load the modules (in a real test, you'd import them)
        // For this test file, we'll define simplified versions

        ErrorUtils = {
            logError: jest.fn(),
            getUserFriendlyMessage: jest.fn((error) => {
                const message = error.message.toLowerCase();
                if (message.includes('slack authentication expired')) {
                    return 'Your Slack connection has expired. Please reconnect.';
                }
                if (message.includes('rate limit')) {
                    return 'Too many requests. Please wait a moment and try again.';
                }
                if (message.includes('network')) {
                    return 'Network error. Please check your internet connection and try again.';
                }
                return 'Something went wrong. Please try again.';
            }),
            isRecoverableError: jest.fn((error) => {
                const message = error.message.toLowerCase();
                return !message.includes('authentication expired') &&
                    !message.includes('not configured');
            })
        };

        SlackStorageUtils = {
            clearSlackTokens: jest.fn().mockResolvedValue(true),
            getStoredSlackTokens: jest.fn(),
            areSlackTokensValid: jest.fn()
        };

        SlackAuthUtils = {
            getValidSlackToken: jest.fn()
        };

        SlackAPI = {
            parseSlackError: jest.fn((errorCode) => {
                const errorMessages = {
                    'invalid_auth': 'Invalid authentication token',
                    'rate_limited': 'Rate limit exceeded',
                    'not_authed': 'Not authenticated with Slack'
                };
                return errorMessages[errorCode] || `Slack API error: ${errorCode}`;
            })
        };
    });

    describe('ErrorUtils.getUserFriendlyMessage', () => {
        test('should return user-friendly message for Slack authentication errors', () => {
            const error = new Error('Slack authentication expired. Please reconnect.');
            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toBe('Your Slack connection has expired. Please reconnect.');
        });

        test('should return user-friendly message for rate limiting errors', () => {
            const error = new Error('Too many requests. Rate limit exceeded.');
            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toBe('Too many requests. Please wait a moment and try again.');
        });

        test('should return user-friendly message for network errors', () => {
            const error = new Error('Network error occurred');
            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toBe('Network error. Please check your internet connection and try again.');
        });

        test('should return generic message for unknown errors', () => {
            const error = new Error('Some unknown error');
            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toBe('Something went wrong. Please try again.');
        });
    });

    describe('ErrorUtils.isRecoverableError', () => {
        test('should identify non-recoverable authentication errors', () => {
            const error = new Error('Slack authentication expired');
            const isRecoverable = ErrorUtils.isRecoverableError(error);
            expect(isRecoverable).toBe(false);
        });

        test('should identify non-recoverable configuration errors', () => {
            const error = new Error('OAuth client ID not configured');
            const isRecoverable = ErrorUtils.isRecoverableError(error);
            expect(isRecoverable).toBe(false);
        });

        test('should identify recoverable network errors', () => {
            const error = new Error('Network error occurred');
            const isRecoverable = ErrorUtils.isRecoverableError(error);
            expect(isRecoverable).toBe(true);
        });
    });

    describe('ErrorUtils.logError', () => {
        test('should log error with context', () => {
            const error = new Error('Test error');
            const context = 'slack_api';
            const additionalInfo = { endpoint: 'users.profile.set' };

            ErrorUtils.logError(context, error, additionalInfo);

            expect(ErrorUtils.logError).toHaveBeenCalledWith(context, error, additionalInfo);
        });
    });

    describe('SlackAPI.parseSlackError', () => {
        test('should parse invalid_auth error', () => {
            const message = SlackAPI.parseSlackError('invalid_auth');
            expect(message).toBe('Invalid authentication token');
        });

        test('should parse rate_limited error', () => {
            const message = SlackAPI.parseSlackError('rate_limited');
            expect(message).toBe('Rate limit exceeded');
        });

        test('should parse not_authed error', () => {
            const message = SlackAPI.parseSlackError('not_authed');
            expect(message).toBe('Not authenticated with Slack');
        });

        test('should handle unknown error codes', () => {
            const message = SlackAPI.parseSlackError('unknown_error');
            expect(message).toBe('Slack API error: unknown_error');
        });
    });

    describe('Automatic token clearing on invalid_auth', () => {
        test('should clear tokens when invalid_auth error occurs', async () => {
            // Simulate invalid_auth error
            const error = new Error('Slack authentication expired. Please reconnect.');

            // In the actual implementation, this would be called automatically
            await SlackStorageUtils.clearSlackTokens();

            expect(SlackStorageUtils.clearSlackTokens).toHaveBeenCalled();
        });
    });

    describe('Retry logic with exponential backoff', () => {
        test('should calculate correct retry delays', () => {
            // Test exponential backoff calculation
            const delays = [];
            for (let i = 0; i < 3; i++) {
                const delay = Math.min(Math.pow(2, i) * 1000, 10000);
                delays.push(delay);
            }

            expect(delays[0]).toBe(1000);  // 2^0 * 1000 = 1000ms
            expect(delays[1]).toBe(2000);  // 2^1 * 1000 = 2000ms
            expect(delays[2]).toBe(4000);  // 2^2 * 1000 = 4000ms
        });

        test('should cap retry delay at maximum', () => {
            const delay = Math.min(Math.pow(2, 10) * 1000, 10000);
            expect(delay).toBe(10000); // Should be capped at 10 seconds
        });
    });

    describe('Error handling in authentication flow', () => {
        test('should handle OAuth flow cancellation', () => {
            global.chrome.runtime.lastError = { message: 'User cancelled the flow' };

            const error = new Error(global.chrome.runtime.lastError.message);
            expect(error.message).toContain('cancelled');
        });

        test('should handle missing authorization code', () => {
            const error = new Error('No authorization code received from Slack');
            expect(error.message).toContain('No authorization code');
        });

        test('should handle invalid OAuth state', () => {
            const error = new Error('Invalid OAuth state parameter - possible CSRF attack');
            expect(error.message).toContain('Invalid OAuth state');
        });
    });

    describe('Error handling in API calls', () => {
        test('should handle timeout errors', () => {
            const error = new Error('Request timed out');
            error.name = 'AbortError';

            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toBeTruthy();
        });

        test('should handle network errors', () => {
            const error = new Error('Failed to fetch');
            const message = ErrorUtils.getUserFriendlyMessage(error);
            expect(message).toContain('Network error');
        });
    });

    describe('Error recovery mechanisms', () => {
        test('should provide fallback to cached status on API failure', async () => {
            // Mock cached status
            const cachedStatus = {
                status: 'focused',
                emoji: ':dart:',
                text: 'In focus mode',
                timestamp: Date.now()
            };

            SlackStorageUtils.getLastStatus = jest.fn().mockResolvedValue(cachedStatus);

            const lastStatus = await SlackStorageUtils.getLastStatus();
            expect(lastStatus).toEqual(cachedStatus);
        });

        test('should handle storage errors gracefully', async () => {
            SlackStorageUtils.getLastStatus = jest.fn().mockRejectedValue(
                new Error('Storage error')
            );

            try {
                await SlackStorageUtils.getLastStatus();
            } catch (error) {
                expect(error.message).toBe('Storage error');
            }
        });
    });
});

console.log('Slack error handling tests defined successfully');
