# API URL Fix

## Issue
The webapp was getting a 404 error when trying to authenticate:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /auth/google not found",
    "timestamp": "2025-10-02T22:17:32.590Z"
  }
}
```

## Root Cause
The webapp was calling `/auth/google`, but the backend routes are mounted at `/api/auth/google`.

The backend (battle-of-the-bots/src/app.js) mounts routes with the `/api` prefix:
```javascript
app.use('/api/auth', authRoutes);
```

This means the full path is `/api/auth/google`, not `/auth/google`.

## Solution
Updated the `getSecureBackendURL()` function in `webapp/app.js` to include the `/api` prefix:

**Before:**
```javascript
if (isLocalhost) {
    return 'http://localhost:3000';
}
const productionURL = window.AURAFLOW_API_URL || 'https://api.auraflow.app';
```

**After:**
```javascript
if (isLocalhost) {
    return 'http://localhost:3000/api';
}
const productionURL = window.AURAFLOW_API_URL || 'https://api.auraflow.app/api';
```

## Verification

### Backend Routes (Correct)
All backend routes are mounted under `/api`:
- `GET /api/auth/google` - Initiate OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Logout
- `GET /api/calendar/events` - Get calendar events
- `POST /api/scheduling/find-focus-time` - Find focus time
- `POST /api/ritual/generate` - Generate ritual
- `POST /api/sessions` - Save session data

### Webapp Calls (Now Fixed)
The webapp now correctly calls:
- `${BACKEND_API_URL}/auth/google` → `http://localhost:3000/api/auth/google` ✅
- `${BACKEND_API_URL}/calendar/events` → `http://localhost:3000/api/calendar/events` ✅
- `${BACKEND_API_URL}/scheduling/find-focus-time` → `http://localhost:3000/api/scheduling/find-focus-time` ✅
- `${BACKEND_API_URL}/ritual/generate` → `http://localhost:3000/api/ritual/generate` ✅
- `${BACKEND_API_URL}/sessions` → `http://localhost:3000/api/sessions` ✅

## Testing

### Start the Backend
```bash
cd battle-of-the-bots
npm start
```

The backend should start on port 3000 and show:
```
AuraFlow AI & Integration Service running on port 3000
Environment: development
```

### Start the Webapp
```bash
# In a new terminal
npx serve webapp
```

The webapp should be available at `http://localhost:3000` (or another port if 3000 is taken).

### Test Authentication
1. Open the webapp in your browser
2. Click "Connect Google Calendar"
3. You should be redirected to Google's OAuth consent screen (not get a 404 error)

## Additional Notes

### CORS Configuration
The backend is configured to allow requests from:
- Chrome extensions (`chrome-extension://`)
- Localhost (`http://localhost:3000`)

If you're running the webapp on a different port, you may need to update the CORS configuration in `battle-of-the-bots/src/app.js`.

### Environment Variables
Make sure the backend has all required environment variables set in `.env`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`

See `battle-of-the-bots/.env.example` for the template.

## Status
✅ **FIXED** - The webapp now correctly calls backend API routes with the `/api` prefix.
