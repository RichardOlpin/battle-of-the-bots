# Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Clone the battle-of-the-bots repository and configure Git identity with user.name "Karthik Sivarama Krishnan" and user.email "ks7585@g.rit.edu"
  - Create the directory structure: src/routes, src/services, src/integrations, src/middleware, src/utils
  - Initialize package.json with Express, dotenv, axios, bcrypt, helmet, express-validator, and googleapis dependencies
  - Create .env.example file with required environment variable templates
  - Create .gitignore to exclude node_modules, .env, and sensitive files
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement configuration and utility modules
  - Write src/utils/config.js to load and validate environment variables
  - Implement src/utils/date-utils.js with functions for date parsing, time slot calculations, and ISO 8601 formatting
  - Create src/utils/token-manager.js with encryption/decryption functions using bcrypt for secure token storage
  - _Requirements: 9.1, 9.7_
  - [x] 2.1 Implement Google Calendar API integration
    - Write src/integrations/google-calendar.js with functions for fetching calendar events and creating events
    - Implement src/services/calendar.service.js with getCalendarEvents and createCalendarEvent functions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.2 Implement user authentication and authorization
    - Write src/middleware/auth.js with middleware for user authentication
    - Implement src/routes/auth.js with login and register routes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.3 Implement error handling middleware
    - Write src/middleware/error-handler.js with middleware for centralized error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.4 Implement input validation middleware
    - Write src/middleware/validate.js with middleware for input validation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.5 Implement rate limiting middleware
    - Write src/middleware/rate-limiter.js with middleware for rate limiting
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.6 Implement logging middleware
    - Write src/middleware/logger.js with middleware for logging
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
- [-] 3. Build Smart Scheduling Service
  - [x] 3.1 Implement core scheduling algorithm
    - Write src/services/scheduling.service.js with suggestOptimalFocusWindow function
    - Implement time slot identification logic that finds gaps between calendar events
    - Create scoring system with weighted factors (duration, time preference, buffer compliance, time of day)
    - Add logic to enforce 15-minute buffers before and after events
    - Implement time preference scoring for morning (8-12), afternoon (12-17), and evening (17-21) slots
    - Add filtering to exclude slots after 9 PM
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Write unit tests for scheduling service
    - Create tests for various calendar configurations (busy day, clear day, no available slots)
    - Test time preference scoring with different user preferences
    - Verify buffer enforcement with edge cases
    - Test late evening exclusion logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. Build Personalized Ritual Generation Service
  - [x] 4.1 Implement ritual generation logic
    - Write src/services/ritual.service.js with generatePersonalizedRitual function
    - Create ritual template definitions (short-burst, long-form, recovery, balanced)
    - Implement keyword parsing for calendar event titles (case-insensitive matching)
    - Build decision tree logic: check for planning/review/emails keywords → short-burst ritual
    - Add logic for write/develop/research/deep work keywords → long-form ritual
    - Implement busy afternoon detection → recovery ritual with longer breaks
    - Add default balanced ritual for unmatched cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Write unit tests for ritual generation
    - Test keyword matching for all ritual types
    - Verify decision tree branches with various context combinations
    - Test case-insensitive keyword matching
    - Verify default ritual selection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Build Intelligent Session Summary Service
  - [x] 5.1 Implement summary generation logic
    - Write src/services/summary.service.js with createIntelligentSummary function
    - Create regex patterns to extract core actions/verbs from task goals
    - Implement compassionate summary templates with dynamic placeholders
    - Add logic to randomly select templates for variety
    - Implement handling for empty or undefined task goals with generic encouraging messages
    - Ensure all language is non-judgmental and supportive
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Write unit tests for summary generation
    - Test action extraction with various task goal formats
    - Verify template selection and placeholder replacement
    - Test empty/undefined task goal handling
    - Verify tone is compassionate and non-judgmental
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 6. Implement Google Calendar Integration
  - [x] 6.1 Set up OAuth 2.0 authentication flow
    - Write src/integrations/google-calendar.js with OAuth client initialization
    - Implement getAuthorizationUrl function to generate Google consent screen URL
    - Create exchangeCodeForTokens function to exchange authorization code for access/refresh tokens
    - Implement token storage using token-manager utility with encryption
    - Add refreshAccessToken function with automatic token refresh logic
    - Ensure all API keys and secrets are loaded from environment variables
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8_

  - [x] 6.2 Implement calendar event fetching
    - Create fetchCalendarEvents function that accepts userId, startDate, and endDate parameters
    - Implement Google Calendar API call with proper authentication headers
    - Add token refresh logic for expired access tokens
    - Normalize calendar event data to internal format (id, startTime, endTime, title)
    - Add error handling for API failures and network issues
    - _Requirements: 5.5, 5.6, 5.7_

  - [x] 6.3 Create OAuth route handlers
    - Write src/routes/auth.routes.js with GET /api/auth/google endpoint to initiate OAuth flow
    - Implement GET /api/auth/google/callback endpoint to handle OAuth callback
    - Add error handling for failed authentication attempts
    - _Requirements: 5.1, 5.2_

- [x] 7. Create Task Management Integration Stubs
  - Write src/integrations/notion.stub.js with fetchTasksFromNotion function returning mock data
  - Write src/integrations/todoist.stub.js with fetchTasksFromTodoist function returning mock data
  - Write src/integrations/asana.stub.js with fetchTasksFromAsana function returning mock data
  - Ensure all stub functions accept apiToken parameter and have correct signatures
  - Return realistic mock data with proper structure for each service
  - Add 'mock: true' flag to all stub responses
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Build API Routes and Middleware
  - [x] 8.1 Implement request validation middleware
    - Write src/middleware/validation.middleware.js with express-validator schemas
    - Create validation rules for schedule suggestion requests (calendar events, user preferences)
    - Create validation rules for ritual generation requests (context object)
    - Create validation rules for session summary requests (session data)
    - Add validation error handling that returns 400 with descriptive messages
    - _Requirements: 7.6, 9.2_

  - [x] 8.2 Implement error handling middleware
    - Write src/middleware/error.middleware.js with centralized error handler
    - Implement error categorization (validation, authentication, external API, server errors)
    - Create consistent error response format with code, message, and timestamp
    - Add logging for errors without exposing sensitive information
    - Implement retry logic utility for external API calls with exponential backoff
    - _Requirements: 7.7, 9.6_

  - [x] 8.3 Create scheduling API routes
    - Write src/routes/schedule.routes.js with POST /api/schedule/suggest endpoint
    - Wire validation middleware to the route
    - Call scheduling service with request payload
    - Return focus window suggestion or appropriate error response
    - _Requirements: 7.1, 7.5, 7.6, 7.7_

  - [x] 8.4 Create ritual generation API routes
    - Write src/routes/ritual.routes.js with POST /api/ritual/generate endpoint
    - Wire validation middleware to the route
    - Call ritual service with context from request
    - Return ritual structure or appropriate error response
    - _Requirements: 7.2, 7.5, 7.6, 7.7_

  - [x] 8.5 Create session summary API routes
    - Write src/routes/session.routes.js with POST /api/session/summary endpoint
    - Wire validation middleware to the route
    - Call summary service with session data from request
    - Return formatted summary string or appropriate error response
    - _Requirements: 7.3, 7.5, 7.6, 7.7_

- [x] 9. Set up Express application
  - Write src/app.js to initialize Express application
  - Configure helmet middleware for security headers
  - Configure express.json() middleware for JSON parsing
  - Register all route modules (schedule, ritual, session, auth)
  - Wire error handling middleware as final middleware
  - Add health check endpoint GET /api/health
  - Create server startup script that validates environment variables
  - _Requirements: 7.8, 9.4, 9.7_

- [ ] 10. Write integration tests for API endpoints
  - Set up Supertest and Jest for API testing
  - Write tests for POST /api/schedule/suggest with valid and invalid payloads
  - Write tests for POST /api/ritual/generate with various context combinations
  - Write tests for POST /api/session/summary with different session data
  - Test error responses for validation failures (400 status codes)
  - Test OAuth endpoints with mocked Google API responses
  - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

- [ ] 11. Create comprehensive API documentation
  - Update README.md with new section "AuraFlow AI & Integration Service"
  - Document the purpose and architecture of each AI feature (scheduling, ritual generation, summaries)
  - Explain the rule-based simulation approach for each feature
  - Document POST /api/schedule/suggest endpoint with request/response examples
  - Document POST /api/ritual/generate endpoint with request/response examples
  - Document POST /api/session/summary endpoint with request/response examples
  - Document OAuth endpoints (GET /api/auth/google and GET /api/auth/google/callback)
  - Include example request payloads in JSON format for all endpoints
  - Include example success responses with status codes
  - Include example error responses with status codes and error format
  - Add setup instructions for environment variables
  - Add instructions for running the server locally
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 12. Create interactive testing environment with Postman
  - [x] 12.1 Generate Postman collection file
    - Create AuraFlow_API_Interactive_Test.postman_collection.json in project root
    - Add "Auth - Step 1 (Manual Browser Action)" request (GET http://localhost:3000/api/auth/google) with browser warning description
    - Add "AI - Suggest a Focus Session" request (POST http://localhost:3000/api/schedule/suggest) with sample calendar events and preferences in JSON body
    - Add "AI - Generate a Ritual" request (POST http://localhost:3000/api/ritual/generate) with sample context in JSON body
    - Set Content-Type: application/json headers for POST requests
    - Include descriptive names and purposes for each request
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 12.2 Create manual testing guide
    - Create MANUAL_TESTING_GUIDE.txt in project root
    - Write prerequisites section (Postman installation, .env file setup)
    - Write step-by-step instructions for starting server (npm start)
    - Write instructions for importing Postman collection
    - Write instructions for manual OAuth browser step
    - Write instructions for testing scheduling AI endpoint with expected visual results
    - Write instructions for testing ritual AI endpoint with expected visual results
    - Include clear success indicators for each test
    - _Requirements: 10.7, 10.8, 10.9_

- [ ] 13. Final integration and testing
  - Verify all environment variables are properly loaded from .env file
  - Test complete OAuth flow manually with Google Calendar
  - Verify token encryption and storage works correctly
  - Test all API endpoints using the Postman collection
  - Verify error handling for various failure scenarios
  - Test scheduling algorithm with real calendar data
  - Verify ritual generation with different contexts
  - Test summary generation with various task goals
  - Commit all code to battle-of-the-bots repository as ks7585 user
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_
