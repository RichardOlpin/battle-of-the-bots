/**
 * Integration tests for AuraFlow API endpoints
 * Tests complete request/response cycles with validation and error handling
 */

const request = require('supertest');
const { createApp } = require('./app');

// Mock the Google Calendar integration to avoid real API calls
jest.mock('./integrations/google-calendar', () => ({
  getAuthorizationUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth?mock=true'),
  exchangeCodeForTokens: jest.fn(async (code) => {
    if (code === 'valid_code') {
      return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expiry_date: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/calendar.readonly'
      };
    }
    throw new Error('Invalid authorization code');
  })
}));

// Mock token manager
jest.mock('./utils/token-manager', () => ({
  storeTokens: jest.fn(),
  getTokens: jest.fn(() => null),
  clearTokens: jest.fn(),
  isTokenExpired: jest.fn(() => false)
}));

describe('AuraFlow API Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Create app instance for testing
    app = createApp();
  });

  describe('Health Check Endpoint', () => {
    test('GET /api/health should return 200 with health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/schedule/suggest - Smart Scheduling', () => {
    test('should return 200 with valid calendar events and preferences', async () => {
      const payload = {
        calendarEvents: [
          {
            id: '1',
            startTime: '2025-10-03T09:00:00Z',
            endTime: '2025-10-03T10:00:00Z',
            title: 'Team standup'
          },
          {
            id: '2',
            startTime: '2025-10-03T14:00:00Z',
            endTime: '2025-10-03T15:00:00Z',
            title: 'Client meeting'
          }
        ],
        userPreferences: {
          preferredTime: 'morning',
          minimumDuration: 75,
          bufferTime: 15
        }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('suggestion');
      if (response.body.suggestion) {
        expect(response.body.suggestion).toHaveProperty('startTime');
        expect(response.body.suggestion).toHaveProperty('endTime');
        expect(response.body.suggestion).toHaveProperty('duration');
        expect(response.body.suggestion).toHaveProperty('score');
      }
    });

    test('should return 200 with no suggestion when calendar is too busy', async () => {
      const payload = {
        calendarEvents: [
          {
            id: '1',
            startTime: '2025-10-03T08:00:00Z',
            endTime: '2025-10-03T12:00:00Z',
            title: 'Morning workshop'
          },
          {
            id: '2',
            startTime: '2025-10-03T12:30:00Z',
            endTime: '2025-10-03T17:00:00Z',
            title: 'Afternoon sessions'
          },
          {
            id: '3',
            startTime: '2025-10-03T17:30:00Z',
            endTime: '2025-10-03T20:00:00Z',
            title: 'Evening event'
          }
        ],
        userPreferences: {
          preferredTime: 'afternoon',
          minimumDuration: 90
        }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('suggestion', null);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 400 when calendarEvents is missing', async () => {
      const payload = {
        userPreferences: {
          preferredTime: 'morning'
        }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should return 400 when calendarEvents is not an array', async () => {
      const payload = {
        calendarEvents: 'not-an-array',
        userPreferences: {}
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 when event startTime is invalid ISO 8601', async () => {
      const payload = {
        calendarEvents: [
          {
            id: '1',
            startTime: 'invalid-date',
            endTime: '2025-10-03T10:00:00Z',
            title: 'Meeting'
          }
        ],
        userPreferences: {}
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 when preferredTime has invalid value', async () => {
      const payload = {
        calendarEvents: [
          {
            id: '1',
            startTime: '2025-10-03T09:00:00Z',
            endTime: '2025-10-03T10:00:00Z',
            title: 'Meeting'
          }
        ],
        userPreferences: {
          preferredTime: 'midnight' // Invalid value
        }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty calendar events array', async () => {
      const payload = {
        calendarEvents: [],
        userPreferences: {
          preferredTime: 'morning'
        }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      // Should suggest a time slot since calendar is completely free
      expect(response.body).toHaveProperty('suggestion');
    });
  });

  describe('POST /api/ritual/generate - Ritual Generation', () => {
    test('should return 200 with valid context for planning task', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'Planning session for Q4',
          timeOfDay: 'morning',
          calendarDensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('ritual');
      expect(response.body.ritual).toHaveProperty('name');
      expect(response.body.ritual).toHaveProperty('workDuration');
      expect(response.body.ritual).toHaveProperty('breakDuration');
      expect(response.body.ritual).toHaveProperty('mindfulnessBreaks');
      expect(response.body.ritual).toHaveProperty('description');
      
      // Should suggest short-burst ritual for planning
      expect(response.body.ritual.workDuration).toBe(25);
      expect(response.body.ritual.breakDuration).toBe(5);
    });

    test('should return 200 with valid context for deep work', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'Deep work - research project',
          timeOfDay: 'afternoon',
          calendarDensity: 'clear'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('ritual');
      
      // Should suggest long-form ritual for deep work
      expect(response.body.ritual.workDuration).toBe(50);
      expect(response.body.ritual.breakDuration).toBe(10);
    });

    test('should return recovery ritual for busy afternoon', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'General task',
          timeOfDay: 'afternoon',
          calendarDensity: 'busy'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('ritual');
      
      // Should suggest recovery ritual
      expect(response.body.ritual.workDuration).toBe(40);
      expect(response.body.ritual.breakDuration).toBe(15);
    });

    test('should return balanced ritual for unmatched context', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'Random task',
          timeOfDay: 'morning',
          calendarDensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('ritual');
      
      // Should suggest balanced ritual as default
      expect(response.body.ritual.workDuration).toBe(45);
      expect(response.body.ritual.breakDuration).toBe(10);
    });

    test('should return 400 when context is missing', async () => {
      const payload = {};

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should return 400 when timeOfDay has invalid value', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'Meeting',
          timeOfDay: 'midnight', // Invalid
          calendarDensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 when calendarDensity has invalid value', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'Meeting',
          timeOfDay: 'morning',
          calendarDensity: 'extremely-busy' // Invalid
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle case-insensitive keyword matching', async () => {
      const payload = {
        context: {
          calendarEventTitle: 'PLANNING SESSION', // Uppercase
          timeOfDay: 'morning',
          calendarDensity: 'moderate'
        }
      };

      const response = await request(app)
        .post('/api/ritual/generate')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      // Should still match planning keyword
      expect(response.body.ritual.workDuration).toBe(25);
    });
  });

  describe('POST /api/session/summary - Session Summary', () => {
    test('should return 200 with valid session data', async () => {
      const payload = {
        sessionData: {
          taskGoal: 'Finalize Q4 presentation',
          duration: 50,
          completedAt: '2025-10-03T15:30:00Z',
          distractionCount: 2,
          ritualUsed: 'Long-Form Deep Work'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(typeof response.body.summary).toBe('string');
      expect(response.body.summary.length).toBeGreaterThan(0);
      
      // Should include duration and goal
      expect(response.body.summary).toContain('50');
      expect(response.body.summary.toLowerCase()).toContain('finalize');
    });

    test('should handle empty taskGoal gracefully', async () => {
      const payload = {
        sessionData: {
          taskGoal: '',
          duration: 30,
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(typeof response.body.summary).toBe('string');
      // Should still generate encouraging message
      expect(response.body.summary.length).toBeGreaterThan(0);
    });

    test('should handle undefined taskGoal', async () => {
      const payload = {
        sessionData: {
          duration: 45,
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(typeof response.body.summary).toBe('string');
    });

    test('should extract action verbs from task goals', async () => {
      const payload = {
        sessionData: {
          taskGoal: 'Write documentation for API',
          duration: 60,
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body.summary).toContain('60');
      expect(response.body.summary.toLowerCase()).toContain('write');
    });

    test('should return 400 when sessionData is missing', async () => {
      const payload = {};

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('should return 400 when duration is missing', async () => {
      const payload = {
        sessionData: {
          taskGoal: 'Complete task',
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 when duration is not a number', async () => {
      const payload = {
        sessionData: {
          taskGoal: 'Complete task',
          duration: 'sixty',
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should generate compassionate tone in summaries', async () => {
      const payload = {
        sessionData: {
          taskGoal: 'Review code',
          duration: 25,
          completedAt: '2025-10-03T15:30:00Z'
        }
      };

      const response = await request(app)
        .post('/api/session/summary')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      const summary = response.body.summary.toLowerCase();
      
      // Should contain positive/encouraging words
      const positiveWords = ['great', 'nice', 'progress', 'forward', 'momentum', 'celebrating'];
      const hasPositiveTone = positiveWords.some(word => summary.includes(word));
      
      expect(hasPositiveTone).toBe(true);
    });
  });

  describe('OAuth Authentication Endpoints', () => {
    test('GET /api/auth/google should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/api/auth/google')
        .expect(302);

      expect(response.headers.location).toContain('accounts.google.com');
    });

    test('GET /api/auth/google/callback should return 400 without code', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('MISSING_AUTH_CODE');
    });

    test('GET /api/auth/google/callback should handle OAuth error', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback?error=access_denied')
        .expect(400);

      expect(response.text).toContain('Authentication Failed');
    });

    test('GET /api/auth/google/callback should succeed with valid code', async () => {
      const response = await request(app)
        .get('/api/auth/google/callback?code=valid_code')
        .expect(200);

      expect(response.text).toContain('Authentication Successful');
    });

    test('GET /api/auth/status should return authentication status', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body).toHaveProperty('authenticated');
    });

    test('POST /api/auth/logout should clear tokens', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/schedule/suggest')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express will handle this as a bad request
      expect(response.status).toBe(400);
    });

    test('should include timestamp in error responses', async () => {
      const response = await request(app)
        .post('/api/schedule/suggest')
        .send({})
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Request Validation', () => {
    test('should validate Content-Type header', async () => {
      const response = await request(app)
        .post('/api/schedule/suggest')
        .send('plain text data')
        .expect(400);

      expect(response.status).toBe(400);
    });

    test('should handle large payloads within limit', async () => {
      const largeCalendar = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        startTime: `2025-10-03T${String(8 + Math.floor(i / 10)).padStart(2, '0')}:00:00Z`,
        endTime: `2025-10-03T${String(8 + Math.floor(i / 10)).padStart(2, '0')}:30:00Z`,
        title: `Event ${i}`
      }));

      const payload = {
        calendarEvents: largeCalendar,
        userPreferences: { preferredTime: 'afternoon' }
      };

      const response = await request(app)
        .post('/api/schedule/suggest')
        .send(payload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('suggestion');
    });
  });
});
