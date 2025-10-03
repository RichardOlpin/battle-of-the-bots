# Design Document

## Overview

The AuraFlow AI & Integration Service is a Node.js/Express-based backend API that provides intelligent scheduling, ritual generation, and session summary capabilities through rule-based algorithms. The service integrates with Google Calendar via OAuth 2.0 and provides stub implementations for future task management integrations (Notion, Todoist, Asana).

The architecture follows RESTful principles with clear separation of concerns: API routes handle HTTP requests, service layer contains business logic, and integration modules manage external API communications. All AI features use deterministic algorithms rather than machine learning models, making them predictable, testable, and suitable for a hackathon MVP.

### Technology Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Authentication:** OAuth 2.0 (Google APIs)
- **Configuration:** dotenv for environment variables
- **Security:** bcrypt for token encryption, helmet for HTTP security headers
- **API Client:** axios for external API calls
- **Validation:** express-validator for request validation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Web App, Chrome Extension)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express API Server                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Middleware  │  │  Validation  │      │
│  │   Layer      │  │   (Auth,     │  │   Layer      │      │
│  │              │  │   Logging)   │  │              │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Service Layer (Business Logic)          │       │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │       │
│  │  │ Scheduling │ │   Ritual   │ │   Summary    │ │       │
│  │  │  Service   │ │  Service   │ │   Service    │ │       │
│  │  └────────────┘ └────────────┘ └──────────────┘ │       │
│  └──────────────────────────────────────────────────┘       │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │         Integration Layer (External APIs)         │       │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │       │
│  │  │  Google    │ │   Notion   │ │   Todoist    │ │       │
│  │  │  Calendar  │ │   (Stub)   │ │   (Stub)     │ │       │
│  │  └────────────┘ └────────────┘ └──────────────┘ │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services & Data Storage                │
│         (Google Calendar API, Token Storage)                 │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
battle-of-the-bots/
├── src/
│   ├── routes/
│   │   ├── schedule.routes.js      # Scheduling endpoints
│   │   ├── ritual.routes.js        # Ritual generation endpoints
│   │   ├── session.routes.js       # Session summary endpoints
│   │   └── auth.routes.js          # OAuth authentication endpoints
│   ├── services/
│   │   ├── scheduling.service.js   # Smart scheduling logic
│   │   ├── ritual.service.js       # Ritual generation logic
│   │   ├── summary.service.js      # Summary generation logic
│   │   └── calendar.service.js     # Google Calendar integration
│   ├── integrations/
│   │   ├── google-calendar.js      # Google Calendar API client
│   │   ├── notion.stub.js          # Notion stub implementation
│   │   ├── todoist.stub.js         # Todoist stub implementation
│   │   └── asana.stub.js           # Asana stub implementation
│   ├── middleware/
│   │   ├── auth.middleware.js      # Authentication middleware
│   │   ├── validation.middleware.js # Request validation
│   │   └── error.middleware.js     # Error handling
│   ├── utils/
│   │   ├── token-manager.js        # Token encryption/storage
│   │   ├── date-utils.js           # Date/time utilities
│   │   └── config.js               # Configuration loader
│   └── app.js                      # Express app setup
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies
└── README.md                       # API documentation
```

## Components and Interfaces

### 1. Smart Scheduling Service

**Purpose:** Analyzes calendar events and user preferences to suggest optimal focus windows.

**Algorithm Design:**

```javascript
// Scoring factors (weights can be tuned)
const SCORING_WEIGHTS = {
  duration: 0.3,           // Longer slots score higher
  timePreference: 0.4,     // Match user's preferred time
  bufferCompliance: 0.2,   // Adequate buffers
  timeOfDay: 0.1          // Avoid late evening
};

// Time preference scoring
const TIME_PREFERENCES = {
  morning: { start: 8, end: 12, peak: 10 },
  afternoon: { start: 12, end: 17, peak: 14 },
  evening: { start: 17, end: 21, peak: 18 }
};
```

**Core Function Signature:**
```javascript
/**
 * Suggests optimal focus window based on calendar and preferences
 * @param {Array<CalendarEvent>} calendarEvents - User's calendar events
 * @param {UserPreferences} userPreferences - User's focus preferences
 * @returns {FocusWindow|null} Optimal time block or null if none found
 */
function suggestOptimalFocusWindow(calendarEvents, userPreferences)
```

**Input Types:**
```javascript
CalendarEvent {
  id: string,
  startTime: string (ISO 8601),
  endTime: string (ISO 8601),
  title: string
}

UserPreferences {
  preferredTime: 'morning' | 'afternoon' | 'evening',
  minimumDuration: number (minutes, default: 75),
  bufferTime: number (minutes, default: 15)
}
```

**Output Type:**
```javascript
FocusWindow {
  startTime: string (ISO 8601),
  endTime: string (ISO 8601),
  duration: number (minutes),
  score: number (0-100),
  reasoning: string
}
```

**Algorithm Steps:**
1. Parse calendar events and sort by start time
2. Identify all gaps between events (including start/end of day)
3. Filter gaps that meet minimum duration + buffer requirements
4. Score each valid gap using weighted factors
5. Return highest-scoring gap with metadata

### 2. Ritual Generation Service

**Purpose:** Generates personalized focus ritual structures based on context using decision tree logic.

**Decision Tree Structure:**

```
Context Input
├── Parse calendarEventTitle for keywords
│   ├── Contains [planning, review, emails]
│   │   └── Return: Short-Burst Ritual (25/5)
│   ├── Contains [write, develop, research, deep work]
│   │   └── Return: Long-Form Ritual (50/10)
│   └── No keywords match
│       └── Check calendarDensity + timeOfDay
│           ├── busy + afternoon
│           │   └── Return: Recovery Ritual (40/15)
│           └── Default
│               └── Return: Balanced Ritual (45/10)
```

**Core Function Signature:**
```javascript
/**
 * Generates personalized ritual based on context
 * @param {RitualContext} context - Current user context
 * @returns {Ritual} Suggested ritual structure
 */
function generatePersonalizedRitual(context)
```

**Input Type:**
```javascript
RitualContext {
  calendarEventTitle: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  calendarDensity: 'clear' | 'moderate' | 'busy'
}
```

**Output Type:**
```javascript
Ritual {
  name: string,
  workDuration: number (minutes),
  breakDuration: number (minutes),
  mindfulnessBreaks: boolean,
  description: string,
  suggestedSoundscape: string
}
```

**Ritual Templates:**
```javascript
const RITUAL_TEMPLATES = {
  shortBurst: {
    name: 'Quick Focus Sprint',
    workDuration: 25,
    breakDuration: 5,
    mindfulnessBreaks: false,
    description: 'Perfect for administrative tasks and quick wins'
  },
  longForm: {
    name: 'Creative Deep Work',
    workDuration: 50,
    breakDuration: 10,
    mindfulnessBreaks: true,
    description: 'Ideal for complex, creative work requiring sustained focus'
  },
  recovery: {
    name: 'Gentle Recovery Session',
    workDuration: 40,
    breakDuration: 15,
    mindfulnessBreaks: true,
    description: 'Balanced approach for busy days to prevent burnout'
  },
  balanced: {
    name: 'Balanced Flow',
    workDuration: 45,
    breakDuration: 10,
    mindfulnessBreaks: true,
    description: 'Versatile ritual for general productivity'
  }
};
```

### 3. Session Summary Service

**Purpose:** Generates compassionate, human-like summaries of completed focus sessions.

**Core Function Signature:**
```javascript
/**
 * Creates intelligent summary of focus session
 * @param {SessionData} sessionData - Completed session data
 * @returns {string} Formatted summary text
 */
function createIntelligentSummary(sessionData)
```

**Input Type:**
```javascript
SessionData {
  taskGoal: string,
  duration: number (minutes),
  completedAt: string (ISO 8601),
  distractionCount: number (optional),
  ritualUsed: string (optional)
}
```

**Summary Generation Logic:**

```javascript
// Extract core action using regex patterns
const ACTION_PATTERNS = [
  /^(finalize|complete|finish|wrap up)/i,
  /^(write|draft|compose)/i,
  /^(review|analyze|evaluate)/i,
  /^(develop|build|create|design)/i,
  /^(plan|organize|structure)/i
];

// Compassionate templates (randomly selected for variety)
const SUMMARY_TEMPLATES = [
  "You dedicated {duration} minutes to '{goal}'. That's a great step forward.",
  "Nice work! You focused for {duration} minutes on '{goal}'.",
  "You spent {duration} minutes working on '{goal}'. Every session counts.",
  "{duration} minutes of focused time on '{goal}'. You're building momentum.",
  "You gave {duration} minutes to '{goal}'. That's progress worth celebrating."
];
```

**Output:** Formatted string with extracted goal and encouraging message.

### 4. Google Calendar Integration

**Purpose:** Implements OAuth 2.0 flow and provides calendar event fetching capabilities.

**OAuth 2.0 Flow:**

```
1. User initiates auth → GET /api/auth/google
2. Redirect to Google consent screen
3. Google redirects back → GET /api/auth/google/callback?code=...
4. Exchange code for tokens
5. Store encrypted tokens
6. Return success to client
```

**Core Functions:**

```javascript
/**
 * Initiates OAuth flow
 * @returns {string} Authorization URL
 */
function getAuthorizationUrl()

/**
 * Exchanges authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {TokenSet} Access and refresh tokens
 */
async function exchangeCodeForTokens(code)

/**
 * Fetches calendar events for date range
 * @param {string} userId - User identifier
 * @param {string} startDate - ISO 8601 date
 * @param {string} endDate - ISO 8601 date
 * @returns {Array<CalendarEvent>} Calendar events
 */
async function fetchCalendarEvents(userId, startDate, endDate)

/**
 * Refreshes expired access token
 * @param {string} refreshToken - Refresh token
 * @returns {string} New access token
 */
async function refreshAccessToken(refreshToken)
```

**Token Storage:**
- Tokens stored in-memory Map for MVP (can be replaced with database)
- Encrypted using bcrypt before storage
- Keyed by userId for multi-user support

### 5. Task Management Stubs

**Purpose:** Provide architectural hooks for future integrations with consistent interfaces.

**Stub Implementations:**

```javascript
// Notion stub
async function fetchTasksFromNotion(apiToken) {
  return {
    tasks: [
      { id: '1', title: 'Review Q4 roadmap', status: 'in_progress' },
      { id: '2', title: 'Update documentation', status: 'todo' }
    ],
    source: 'notion',
    mock: true
  };
}

// Todoist stub
async function fetchTasksFromTodoist(apiToken) {
  return {
    tasks: [
      { id: '101', content: 'Finalize presentation', priority: 4 },
      { id: '102', content: 'Code review', priority: 3 }
    ],
    source: 'todoist',
    mock: true
  };
}

// Asana stub
async function fetchTasksFromAsana(apiToken) {
  return {
    tasks: [
      { gid: 'a1', name: 'Design mockups', completed: false },
      { gid: 'a2', name: 'Team sync', completed: false }
    ],
    source: 'asana',
    mock: true
  };
}
```

## Data Models

### Calendar Event Model
```javascript
{
  id: string,              // Unique event identifier
  startTime: string,       // ISO 8601 datetime
  endTime: string,         // ISO 8601 datetime
  title: string,           // Event title/summary
  description: string,     // Optional event description
  location: string         // Optional location
}
```

### User Preferences Model
```javascript
{
  userId: string,
  preferredTime: string,   // 'morning' | 'afternoon' | 'evening'
  minimumDuration: number, // Minutes (default: 75)
  bufferTime: number,      // Minutes (default: 15)
  soundscapePreference: string,
  ritualHistory: Array<string>
}
```

### Token Storage Model
```javascript
{
  userId: string,
  accessToken: string,     // Encrypted
  refreshToken: string,    // Encrypted
  expiresAt: number,       // Unix timestamp
  scope: string,
  tokenType: string
}
```

### Session Data Model
```javascript
{
  sessionId: string,
  userId: string,
  taskGoal: string,
  duration: number,        // Minutes
  startedAt: string,       // ISO 8601
  completedAt: string,     // ISO 8601
  ritualUsed: string,
  distractionCount: number,
  completed: boolean
}
```

## Error Handling

### Error Categories

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid date formats
   - Out-of-range values

2. **Authentication Errors (401)**
   - Missing or invalid OAuth tokens
   - Expired tokens that cannot be refreshed

3. **External API Errors (502/503)**
   - Google Calendar API failures
   - Network timeouts
   - Rate limiting

4. **Server Errors (500)**
   - Unexpected exceptions
   - Configuration errors

### Error Response Format

```javascript
{
  error: {
    code: string,          // Machine-readable error code
    message: string,       // Human-readable message
    details: object,       // Optional additional context
    timestamp: string      // ISO 8601
  }
}
```

### Error Handling Strategy

```javascript
// Centralized error middleware
app.use((err, req, res, next) => {
  // Log error (without sensitive data)
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send sanitized response
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});
```

### Retry Logic for External APIs

```javascript
async function fetchWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

## Testing Strategy

### Unit Testing

**Scope:** Individual functions and services in isolation

**Tools:** Jest

**Coverage Areas:**
- Scheduling algorithm with various calendar configurations
- Ritual generation decision tree with all branches
- Summary generation with different input patterns
- Date/time utility functions
- Token encryption/decryption

**Example Test Cases:**
```javascript
describe('suggestOptimalFocusWindow', () => {
  test('should return morning slot for morning preference', () => {
    const events = [/* mock events */];
    const prefs = { preferredTime: 'morning' };
    const result = suggestOptimalFocusWindow(events, prefs);
    expect(result.startTime).toMatch(/T0[89]:/); // 8-9 AM
  });

  test('should enforce 15-minute buffer', () => {
    const events = [
      { startTime: '2025-10-03T10:00:00Z', endTime: '2025-10-03T11:00:00Z' }
    ];
    const result = suggestOptimalFocusWindow(events, {});
    expect(result.startTime).not.toBe('2025-10-03T11:00:00Z');
  });

  test('should exclude slots after 9 PM', () => {
    const events = [/* events ending at 8 PM */];
    const result = suggestOptimalFocusWindow(events, {});
    expect(result).toBeNull(); // No valid slot
  });
});
```

### Integration Testing

**Scope:** API endpoints with mocked external services

**Tools:** Supertest + Jest

**Coverage Areas:**
- Complete request/response cycles
- Authentication middleware
- Request validation
- Error handling

**Example Test Cases:**
```javascript
describe('POST /api/schedule/suggest', () => {
  test('should return 200 with valid request', async () => {
    const response = await request(app)
      .post('/api/schedule/suggest')
      .send({
        calendarEvents: [/* mock events */],
        userPreferences: { preferredTime: 'morning' }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('startTime');
  });

  test('should return 400 for missing calendarEvents', async () => {
    const response = await request(app)
      .post('/api/schedule/suggest')
      .send({ userPreferences: {} });
    
    expect(response.status).toBe(400);
  });
});
```

### Manual Testing

**Scope:** OAuth flow and external API interactions

**Approach:**
1. Test Google OAuth flow in browser
2. Verify token storage and retrieval
3. Test calendar event fetching with real Google Calendar
4. Verify token refresh mechanism
5. Test error scenarios (invalid tokens, network failures)

### Test Data

**Mock Calendar Events:**
```javascript
const MOCK_BUSY_DAY = [
  { startTime: '2025-10-03T09:00:00Z', endTime: '2025-10-03T10:00:00Z', title: 'Team standup' },
  { startTime: '2025-10-03T11:00:00Z', endTime: '2025-10-03T12:00:00Z', title: 'Client call' },
  { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:30:00Z', title: 'Planning session' }
];

const MOCK_CLEAR_DAY = [
  { startTime: '2025-10-03T09:00:00Z', endTime: '2025-10-03T09:30:00Z', title: 'Quick sync' }
];
```

## Security Considerations

### Environment Variables

Required variables in `.env`:
```
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Application
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_session_secret

# Token Encryption
ENCRYPTION_KEY=your_encryption_key
```

### Token Security

1. **Encryption at Rest:** All tokens encrypted using bcrypt before storage
2. **Secure Transmission:** HTTPS only in production
3. **Token Rotation:** Automatic refresh token usage
4. **Scope Limitation:** Request minimal Google Calendar scopes

### Input Validation

All API endpoints use express-validator:
```javascript
const validateScheduleRequest = [
  body('calendarEvents').isArray().notEmpty(),
  body('calendarEvents.*.startTime').isISO8601(),
  body('calendarEvents.*.endTime').isISO8601(),
  body('userPreferences.preferredTime')
    .optional()
    .isIn(['morning', 'afternoon', 'evening'])
];
```

### HTTP Security Headers

Using helmet.js for security headers:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (production)

## Deployment Considerations

### Environment Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Set up Google Cloud Project and OAuth credentials
5. Run: `npm start`

### Production Checklist

- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Use production-grade token storage (database)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure CORS for specific origins
- [ ] Enable request logging
- [ ] Set up health check endpoint

### Scalability Notes

For MVP (hackathon):
- In-memory token storage acceptable
- Single server instance sufficient
- No database required

For production:
- Replace in-memory storage with Redis/PostgreSQL
- Implement proper session management
- Add caching layer for calendar events
- Consider serverless deployment (AWS Lambda, Google Cloud Functions)

## Interactive Testing Environment

### Postman Collection Structure

The Postman collection provides a graphical interface for testing all API endpoints without writing code. It includes pre-configured requests with proper headers, bodies, and descriptions.

**Collection File:** `AuraFlow_API_Interactive_Test.postman_collection.json`

**Included Requests:**

1. **Auth - Step 1 (Manual Browser Action)**
   - Method: GET
   - URL: `http://localhost:3000/api/auth/google`
   - Purpose: Initiates OAuth flow (must be opened in browser, not run in Postman)
   - Description: Includes warning about manual browser action requirement

2. **AI - Suggest a Focus Session**
   - Method: POST
   - URL: `http://localhost:3000/api/schedule/suggest`
   - Headers: `Content-Type: application/json`
   - Body: Sample calendar events and user preferences
   - Purpose: Tests scheduling algorithm with visual JSON response

3. **AI - Generate a Ritual**
   - Method: POST
   - URL: `http://localhost:3000/api/ritual/generate`
   - Headers: `Content-Type: application/json`
   - Body: Sample context (event title, time of day, calendar density)
   - Purpose: Tests ritual generation logic with visual JSON response

**Postman Collection Format:**

```json
{
  "info": {
    "name": "AuraFlow API Interactive Test",
    "description": "Interactive testing suite for AuraFlow backend services",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Step 1 (Manual Browser Action)",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/auth/google",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "auth", "google"]
        },
        "description": "IMPORTANT: Do not run this request in Postman..."
      }
    }
    // Additional requests...
  ]
}
```

### Testing Guide Structure

**File:** `MANUAL_TESTING_GUIDE.txt`

**Content Sections:**

1. **Prerequisites**
   - Postman installation
   - Environment setup (.env file)

2. **Step-by-Step Instructions**
   - Server startup
   - Postman collection import
   - OAuth authentication (manual browser step)
   - Testing each API endpoint
   - Expected visual results

3. **Success Indicators**
   - What to look for in JSON responses
   - How to verify each service is working correctly

**Purpose:** Provides non-technical, clear instructions for human developers to visually confirm all backend services work together before Chrome Extension integration.
