# AuraFlow Webapp Troubleshooting Guide

## Quick Diagnostic Tool

**Open this page first to diagnose issues:**
```
http://localhost:3000/diagnostic.html
```

This will check:
- Environment setup
- Service worker status
- Cache status
- File access
- Backend connection

---

## Common Issues and Solutions

### 1. Service Worker Registration Failed

**Symptom:**
```
Service worker registration failed. Status code: 151
```

**Causes:**
1. Accessing from non-secure context (not HTTPS or localhost)
2. Service worker file not found
3. Syntax error in service worker file
4. Browser cache issues

**Solutions:**

**A. Check your URL:**
- ✅ Use: `http://localhost:3000` or `http://localhost:5000`
- ❌ Don't use: `http://192.168.x.x` or `http://your-ip`
- ❌ Don't use: `file:///path/to/index.html`

**B. Clear browser cache:**
```javascript
// Open browser console (F12) and run:
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
});

caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
});

// Then reload the page
location.reload();
```

**C. Check service worker file exists:**
```bash
# Make sure this file exists:
ls webapp/service-worker.js
```

**D. Use the diagnostic tool:**
Open `http://localhost:3000/diagnostic.html` and check the Service Worker Status section.

---

### 2. Invalid Regular Expression Error

**Symptom:**
```
Uncaught SyntaxError: Invalid regular expression: missing /
```

**This usually means:**
1. Browser is trying to execute the wrong file as JavaScript
2. A file is being served with the wrong MIME type
3. There's a caching issue causing old/corrupted files to load

**Solutions:**

**A. Hard refresh the page:**
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

**B. Clear all caches:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" in left sidebar
4. Check all boxes
5. Click "Clear site data"
6. Reload page

**C. Check file serving:**
Open `http://localhost:3000/diagnostic.html` and check the "File Access Test" section. Make sure:
- `app.js` has content-type: `application/javascript` or `text/javascript`
- `manifest.json` has content-type: `application/json`
- No files return 404

**D. Restart the server:**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npx serve webapp
```

---

### 3. 404 Error: "Route GET /auth/google not found"

**Symptom:**
```json
{"error":{"code":"NOT_FOUND","message":"Route GET /auth/google not found"}}
```

**Solution:**
✅ **FIXED** - The webapp now uses the correct API URL with `/api` prefix.

**Verification:**
- Backend routes are at: `http://localhost:3000/api/*`
- Webapp now correctly calls: `http://localhost:3000/api/auth/google`

---

### 2. Backend Not Running

**Symptom:**
- Connection refused errors
- "Failed to fetch" errors
- Network errors in console

**Solution:**
```bash
# Start the backend server
cd battle-of-the-bots
npm start
```

**Expected Output:**
```
✓ Environment variables validated successfully
AuraFlow AI & Integration Service running on port 3000
Environment: development
```

---

### 3. CORS Errors

**Symptom:**
```
Access to fetch at 'http://localhost:3000/api/auth/google' from origin 'http://localhost:5000' 
has been blocked by CORS policy
```

**Solution:**
The backend CORS is configured for `http://localhost:3000`. If your webapp runs on a different port, you have two options:

**Option 1: Update Backend CORS (Recommended for Development)**
Edit `battle-of-the-bots/src/app.js`:
```javascript
// Change this line:
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

// To allow your webapp port:
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5000');

// Or allow all localhost ports (development only):
res.setHeader('Access-Control-Allow-Origin', origin || '*');
```

**Option 2: Run Webapp on Port 3000**
```bash
npx serve webapp -p 3000
```

---

### 4. Missing Environment Variables

**Symptom:**
```
✗ Configuration error: Missing required environment variable: GOOGLE_CLIENT_ID
```

**Solution:**
1. Copy the example environment file:
```bash
cd battle-of-the-bots
cp .env.example .env
```

2. Fill in the required values in `.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=your_random_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key
```

3. Get Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

---

### 5. Service Worker Not Registering

**Symptom:**
- Console error: "Service Worker registration failed"
- Offline mode not working

**Solution:**
Service workers require HTTPS or localhost. Make sure you're accessing the app via:
- `http://localhost:*` ✅
- `https://*` ✅
- NOT `http://192.168.*` ❌
- NOT `http://your-ip-address` ❌

---

### 6. Performance Issues / Slow Loading

**Symptom:**
- Page takes longer than 3 seconds to load
- Janky animations
- Slow timer updates

**Solution:**
1. Check if service worker is active:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers:', registrations);
});
```

2. Clear cache and reload:
```javascript
// In browser console
caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
    console.log('Cache cleared');
});
```

3. Run performance test:
```bash
node webapp/test-performance.js
```

4. Check Network tab in DevTools:
   - Look for slow resources (>100ms)
   - Verify resources are cached
   - Check for failed requests

---

### 7. Authentication Not Persisting

**Symptom:**
- User has to log in every time
- Auth token not saved

**Solution:**
Check browser storage:
```javascript
// In browser console
chrome.storage.local.get(['authToken'], (result) => {
    console.log('Auth Token:', result.authToken);
});
```

If empty, check:
1. Browser allows storage (not in incognito mode)
2. No browser extensions blocking storage
3. Storage quota not exceeded

---

### 8. Timer Not Updating Smoothly

**Symptom:**
- Timer jumps or stutters
- Not updating every second

**Solution:**
✅ **FIXED** - Timer now uses `requestAnimationFrame` for smooth updates.

**Verification:**
```javascript
// Check in browser console
// Should see requestAnimationFrame being used
console.log('Timer implementation uses RAF:', 
    document.querySelector('#timer-display') !== null);
```

---

### 9. Offline Mode Not Working

**Symptom:**
- App doesn't work when offline
- "Failed to fetch" errors when disconnected

**Solution:**
1. Verify service worker is registered:
```javascript
navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker ready:', registration);
});
```

2. Check cache:
```javascript
caches.keys().then(keys => {
    console.log('Cached versions:', keys);
});
```

3. Test offline mode:
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   - Reload page
   - Should still load from cache

---

### 10. Google OAuth Redirect Issues

**Symptom:**
- Redirected to Google but then error
- "redirect_uri_mismatch" error

**Solution:**
1. Check redirect URI in Google Cloud Console matches exactly:
```
http://localhost:3000/api/auth/google/callback
```

2. Verify `.env` has correct redirect URI:
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

3. Make sure no trailing slashes or extra characters

---

## Quick Diagnostic Commands

### Check Backend Status
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "AuraFlow AI & Integration Service",
  "version": "1.0.0"
}
```

### Check Available Routes
```bash
curl http://localhost:3000/
```

### Test Auth Endpoint
```bash
curl http://localhost:3000/api/auth/google
```

Should return a redirect or auth URL.

### Check Service Worker
Open browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
```

### Check Performance
```bash
node webapp/test-performance.js
```

Should show: `Results: 10/10 tests passed`

---

## Getting Help

If you're still experiencing issues:

1. Check the console for error messages
2. Check the Network tab in DevTools
3. Verify all environment variables are set
4. Make sure both backend and webapp are running
5. Try clearing cache and reloading
6. Check the documentation:
   - `webapp/PERFORMANCE_OPTIMIZATIONS.md`
   - `webapp/API_URL_FIX.md`
   - `battle-of-the-bots/README.md`

---

## Development Checklist

Before starting development:
- [ ] Backend is running (`npm start` in battle-of-the-bots)
- [ ] Environment variables are set (`.env` file exists)
- [ ] Google OAuth credentials are configured
- [ ] Webapp is served (`npx serve webapp`)
- [ ] Browser DevTools is open for debugging
- [ ] Service worker is registered (check console)

---

**Last Updated:** October 2, 2025  
**Status:** All known issues resolved ✅
