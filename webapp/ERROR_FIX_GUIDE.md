# Error Fix Guide

## Your Errors

### Error 1: Service Worker Registration Failed
```
Service worker registration failed. Status code: 151
```

### Error 2: Invalid Regular Expression
```
Uncaught SyntaxError: Invalid regular expression: missing /
```

Plus the error message showed manifest.json content being parsed as JavaScript.

---

## What's Happening

These errors typically indicate:
1. **Browser cache corruption** - Old or corrupted files are being loaded
2. **Wrong MIME types** - Files being served with incorrect content-type headers
3. **Service worker conflicts** - Multiple or broken service worker registrations
4. **Non-secure context** - Accessing from IP address instead of localhost

---

## Quick Fix (Do This First)

### Step 1: Use the Diagnostic Tool
```bash
# Make sure server is running
npx serve webapp

# Open in browser:
http://localhost:3000/diagnostic.html
```

This will show you exactly what's wrong.

### Step 2: Clear Everything
Open browser DevTools (F12), then:

**In Console tab, run:**
```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    console.log('Service workers unregistered');
});

// Clear all caches
caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
    console.log('Caches cleared');
});
```

**Then:**
1. Go to Application tab
2. Click "Clear storage" in left sidebar
3. Check ALL boxes
4. Click "Clear site data"
5. Close DevTools
6. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Step 3: Verify URL
Make sure you're accessing via:
- ✅ `http://localhost:3000`
- ✅ `http://localhost:5000`
- ❌ NOT `http://192.168.x.x`
- ❌ NOT `http://your-ip-address`
- ❌ NOT `file:///path/to/file`

---

## Detailed Troubleshooting

### If Service Worker Still Fails

**Check 1: Verify file exists**
```bash
ls webapp/service-worker.js
```

**Check 2: Check for syntax errors**
```bash
node -c webapp/service-worker.js
```

**Check 3: Check file is being served correctly**
```bash
curl -I http://localhost:3000/service-worker.js
```

Should show:
```
HTTP/1.1 200 OK
Content-Type: application/javascript
```

**Check 4: Try accessing service worker directly**
Open in browser: `http://localhost:3000/service-worker.js`

Should show JavaScript code, NOT an error or manifest.json content.

### If Regex Error Persists

This error usually means a JSON file is being executed as JavaScript.

**Check 1: Verify manifest.json is valid**
```bash
cat webapp/manifest.json | python -m json.tool
```

**Check 2: Check HTML script tags**
```bash
grep "<script" webapp/index.html
```

Should only show:
```html
<script type="module" src="app.js"></script>
```

NOT:
```html
<script src="manifest.json"></script>  <!-- WRONG! -->
```

**Check 3: Check for browser extension conflicts**
- Disable all browser extensions
- Try in incognito/private mode
- Try a different browser

---

## Run the Fix Script

```bash
cd webapp
./fix-issues.sh
```

This will:
- Check all required files exist
- Check for syntax errors
- Verify backend is running
- Provide specific next steps

---

## Start Fresh

If nothing works, start completely fresh:

### 1. Stop all servers
```bash
# Press Ctrl+C in all terminal windows
```

### 2. Clear browser completely
- Close ALL browser windows
- Reopen browser
- Open DevTools (F12)
- Application tab → Clear storage → Clear site data

### 3. Restart backend
```bash
cd battle-of-the-bots
npm start
```

Wait for:
```
AuraFlow AI & Integration Service running on port 3000
```

### 4. Start webapp in NEW terminal
```bash
npx serve webapp
```

Note the port (usually 3000 or 5000).

### 5. Open diagnostic page
```
http://localhost:[PORT]/diagnostic.html
```

Check all sections are green ✅.

### 6. Open main app
```
http://localhost:[PORT]/index.html
```

---

## Common Mistakes

### ❌ Wrong: Accessing by IP
```
http://192.168.1.100:3000  ← Service workers won't work
```

### ✅ Correct: Accessing by localhost
```
http://localhost:3000  ← Service workers work
```

### ❌ Wrong: Opening file directly
```
file:///Users/you/webapp/index.html  ← Nothing works
```

### ✅ Correct: Using a server
```
npx serve webapp
http://localhost:3000
```

### ❌ Wrong: Backend not running
```
# Webapp loads but API calls fail
```

### ✅ Correct: Backend running
```bash
cd battle-of-the-bots
npm start
# See: "running on port 3000"
```

---

## Verification Checklist

After fixing, verify:

- [ ] Diagnostic page shows all green ✅
- [ ] No errors in browser console
- [ ] Service worker registered successfully
- [ ] Backend health check works: `http://localhost:3000/api/health`
- [ ] Main app loads: `http://localhost:3000/index.html`
- [ ] No 404 errors in Network tab
- [ ] All files have correct MIME types

---

## Still Having Issues?

### Check These Files

1. **webapp/TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
2. **webapp/diagnostic.html** - Interactive diagnostic tool
3. **webapp/API_URL_FIX.md** - API URL configuration
4. **battle-of-the-bots/README.md** - Backend setup guide

### Get More Info

Run diagnostic tool and share the output:
```
http://localhost:3000/diagnostic.html
```

Check browser console (F12) for specific error messages.

---

## Summary

**Most Common Fix:**
1. Clear browser cache completely
2. Unregister service workers
3. Hard refresh page
4. Access via `localhost`, not IP address

**If that doesn't work:**
1. Run `./fix-issues.sh`
2. Check `diagnostic.html`
3. Follow specific error messages

**Last Resort:**
1. Close all browsers
2. Restart backend
3. Restart webapp server
4. Open in fresh browser window

---

**Status:** Ready to fix your issues! 🔧  
**Date:** October 2, 2025
