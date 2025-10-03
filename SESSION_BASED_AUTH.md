# Session-Based Authentication Setup

## What Changed

We've upgraded from a localStorage-based workaround to **proper session-based authentication** using express-session and HTTP-only cookies.

---

## New Architecture

### Backend (Express Session)

```
User authenticates
  ↓
Backend creates session
  ↓
Session stored server-side
  ↓
Session ID sent as HTTP-only cookie
  ↓
Cookie automatically included in all requests
  ↓
Backend validates session on each request
```

### Benefits

✅ **Secure** - Session ID in HTTP-only cookie (not accessible to JavaScript)  
✅ **Automatic** - Browser sends cookie with every request  
✅ **Server-side** - Session data stored on server, not client  
✅ **Standard** - Industry-standard approach  
✅ **No localStorage hacks** - Clean, proper implementation  

---

## How It Works

### 1. User Authenticates

```
1. User clicks "Connect Google Calendar"
2. Redirects to Google OAuth
3. User grants permissions
4. Google redirects to /api/auth/google/callback
```

### 2. Backend Creates Session

```javascript
// In auth.routes.js
req.session.userId = `user_${Date.now()}_${random}`;
req.session.authenticated = true;
req.session.authTime = Date.now();
```

### 3. Session Cookie Sent

```
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly; SameSite=Lax
```

### 4. Webapp Checks Auth

```javascript
// Webapp calls /api/auth/status
// Cookie automatically included
fetch('/api/auth/status', { credentials: 'include' })
```

### 5. Backend Validates Session

```javascript
// Backend checks req.session
if (req.session.authenticated) {
  // User is authenticated!
}
```

---

## Installation

### Packages Installed

```bash
npm install express-session cookie-parser
```

### Configuration

**In `battle-of-the-bots/src/app.js`:**

```javascript
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(session({
  secret: config.sessionSecret,  // From .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // true in production (HTTPS)
    httpOnly: true,  // Not accessible to JavaScript
    maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    sameSite: 'lax'  // CSRF protection
  }
}));
```

---

## Files Modified

### 1. Backend: `battle-of-the-bots/src/app.js`

**Added:**
- `express-session` middleware
- `cookie-parser` middleware
- Session configuration

### 2. Backend: `battle-of-the-bots/src/routes/auth.routes.js`

**Changed:**
- `/google/callback` - Creates session, stores userId
- `/status` - Checks session instead of just tokens
- `/logout` - Destroys session and clears cookie
- Success page - No more localStorage, just redirects

### 3. Webapp: `webapp/app.js`

**Changed:**
- `checkAuth()` - Calls backend with credentials
- `checkAuthSuccess()` - Simplified, checks URL parameter
- Removed localStorage token management

---

## Testing

### Step 1: Restart Backend

```bash
./restart-all.sh
```

### Step 2: Clear Browser Data

```javascript
// Open console (F12) and run:
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Step 3: Test Authentication

1. Go to: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. Sign in with Google
4. Should redirect and load events! ✅

### Step 4: Verify Session

```javascript
// In console:
fetch('http://localhost:3000/api/auth/status', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Should show:
// { authenticated: true, userId: "user_...", ... }
```

---

## How to Check Session

### In Browser DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Cookies** → `http://localhost:5000`
4. Look for `connect.sid` cookie

**Should see:**
```
Name: connect.sid
Value: s%3A...
Domain: localhost
Path: /
HttpOnly: ✓
Secure: (empty for localhost)
SameSite: Lax
```

### In Backend Logs

```javascript
// Add to any route:
console.log('Session:', req.session);

// Should show:
// Session: {
//   userId: 'user_1696...',
//   authenticated: true,
//   authTime: 1696...
// }
```

---

## Security Features

### HTTP-Only Cookie

```javascript
httpOnly: true
```

- Cookie not accessible to JavaScript
- Prevents XSS attacks
- Can't be stolen by malicious scripts

### SameSite Protection

```javascript
sameSite: 'lax'
```

- Cookie only sent to same site
- Prevents CSRF attacks
- Protects against cross-site requests

### Secure in Production

```javascript
secure: config.nodeEnv === 'production'
```

- HTTPS only in production
- HTTP allowed for localhost development

### Session Expiration

```javascript
maxAge: 24 * 60 * 60 * 1000  // 24 hours
```

- Session expires after 24 hours
- User must re-authenticate

---

## API Changes

### GET /api/auth/status

**Before:**
```json
{
  "authenticated": false
}
```

**After:**
```json
{
  "authenticated": true,
  "userId": "user_1696...",
  "tokenExpired": false,
  "message": "Authenticated"
}
```

### POST /api/auth/logout

**Before:**
- Just cleared tokens

**After:**
- Destroys session
- Clears cookie
- Clears tokens

---

## Troubleshooting

### "authenticated: false" after login

**Problem:** Cookie not being sent

**Check:**
1. Cookie exists in DevTools → Application → Cookies
2. Request includes cookie (Network tab → Headers → Cookie)
3. Using `credentials: 'include'` in fetch

**Solution:**
```javascript
fetch(url, {
  credentials: 'include'  // Must include this!
})
```

### Session not persisting

**Problem:** Session destroyed on each request

**Check:**
1. `resave: false` and `saveUninitialized: false` are set
2. SESSION_SECRET is set in .env
3. Backend not restarting between requests

**Solution:**
- Make sure backend stays running
- Check .env has SESSION_SECRET

### Cookie not set

**Problem:** Set-Cookie header not sent

**Check:**
1. Session middleware is before routes
2. Session is being modified (req.session.userId = ...)
3. Response is sent after session is saved

**Solution:**
- Ensure session middleware is configured correctly
- Check middleware order in app.js

---

## Development vs Production

### Development (localhost)

```javascript
cookie: {
  secure: false,  // HTTP allowed
  sameSite: 'lax'
}
```

### Production (HTTPS)

```javascript
cookie: {
  secure: true,  // HTTPS required
  sameSite: 'strict',  // Stricter CSRF protection
  domain: '.yourdomain.com'  // Allow subdomains
}
```

---

## Migration from Old Approach

### Old (localStorage)

```javascript
// Webapp stored token in localStorage
localStorage.setItem('authToken', token);

// Had to manually check on each page load
const token = localStorage.getItem('authToken');
```

**Problems:**
- ❌ Accessible to JavaScript (XSS risk)
- ❌ Manual management required
- ❌ Not sent automatically
- ❌ Can be stolen

### New (Session Cookie)

```javascript
// Backend creates session
req.session.authenticated = true;

// Cookie sent automatically
// No manual management needed
```

**Benefits:**
- ✅ HTTP-only (XSS protected)
- ✅ Automatic management
- ✅ Sent automatically
- ✅ Secure

---

## Summary

### What We Built

1. **Express Session** - Server-side session storage
2. **HTTP-Only Cookies** - Secure session ID transmission
3. **Session Validation** - Backend checks session on each request
4. **Automatic Auth** - No manual token management
5. **Proper Logout** - Session destruction and cookie clearing

### What You Get

- ✅ Industry-standard authentication
- ✅ Secure by default
- ✅ No localStorage hacks
- ✅ Automatic session management
- ✅ Proper logout functionality
- ✅ CSRF protection
- ✅ XSS protection

---

## Next Steps

1. **Test authentication** - Should work without loops
2. **Check session cookie** - Verify in DevTools
3. **Test logout** - Should clear session
4. **Test expiration** - Session expires after 24 hours
5. **Production setup** - Enable secure cookies for HTTPS

---

**Status:** ✅ Proper session-based auth implemented!  
**Test:** Restart backend, clear cookies, try auth  
**Expected:** Clean authentication flow with secure sessions
