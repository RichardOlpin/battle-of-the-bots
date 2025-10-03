# Complete AuraFlow Setup Guide

## Current Status

✅ Backend running on port 3000  
✅ Webapp running on port 5000  
✅ OAuth credentials configured  
🔧 Fixing auth loop...

---

## Final Fix Applied

### The Problem
Auth loop was happening because:
1. User authenticates ✅
2. Redirects to webapp ✅
3. Webapp tries to save token (async) ⏳
4. Webapp checks auth (before token is saved) ❌
5. No token found → redirects to auth again ❌
6. Loop continues...

### The Solution
Made `checkAuthSuccess()` async and await it before `initializeApp()`:

```javascript
// Before:
checkAuthSuccess();  // Not awaited!
await initializeApp();  // Runs before token is saved!

// After:
await checkAuthSuccess();  // Wait for token to be saved!
await initializeApp();  // Now token exists!
```

---

## Test It Now!

### Step 1: Clear Browser Storage
```javascript
// Open browser console (F12) and run:
localStorage.clear();
```

### Step 2: Hard Refresh
```
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 3: Test Authentication
1. Go to: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. Sign in with Google
4. **Should work without loop!** ✅

---

## What You Should See

### In Browser Console (F12)
```
AuraFlow Web App loaded
Detected successful authentication, saving token...
Auth token saved successfully
User is authenticated
```

### In Browser
1. Success page with spinner (2 seconds)
2. Redirect to webapp
3. Green success banner appears
4. Calendar events load
5. **No more redirects!** ✅

---

## If Still Looping

### Check Console Messages

**Good (working):**
```
Detected successful authentication, saving token...
Auth token saved successfully
User is authenticated
```

**Bad (still broken):**
```
User is not authenticated
User is not authenticated
User is not authenticated
...
```

### Debug Steps

1. **Check localStorage:**
```javascript
// In console:
localStorage.getItem('auraflow_auth_success')
localStorage.getItem('auraflow_user_id')
```

2. **Check saved token:**
```javascript
// In console:
chrome.storage.local.get(['authToken'], (result) => {
    console.log('Auth Token:', result.authToken);
});
```

3. **Check timing:**
   - Success page should show for 2 seconds
   - Then redirect to webapp
   - Token should be saved before auth check

---

## Complete Flow

```
1. User clicks "Connect Google Calendar"
   ↓
2. Redirects to Google OAuth
   ↓
3. User signs in and grants permissions
   ↓
4. Google redirects to: /api/auth/google/callback
   ↓
5. Backend exchanges code for tokens
   ↓
6. Backend stores tokens server-side
   ↓
7. Backend shows success page
   ↓
8. Success page stores flags in localStorage:
   - auraflow_auth_success = 'true'
   - auraflow_auth_time = timestamp
   - auraflow_user_id = 'default_user'
   ↓
9. After 2 seconds, redirects to webapp
   ↓
10. Webapp loads
   ↓
11. checkAuthSuccess() runs (AWAITED)
   ↓
12. Detects auth success flags
   ↓
13. Saves authToken to storage (AWAITED)
   ↓
14. Clears localStorage flags
   ↓
15. Shows success banner
   ↓
16. initializeApp() runs
   ↓
17. checkAuth() runs
   ↓
18. Finds authToken in storage ✅
   ↓
19. Loads calendar events
   ↓
20. DONE! No loop! ✅
```

---

## Quick Commands

### Restart Everything
```bash
./restart-all.sh
```

### Check Server Status
```bash
./check-servers.sh
```

### Stop Everything
```bash
./stop-all.sh
```

---

## Files Modified (Final)

1. **webapp/app.js**
   - Made `checkAuthSuccess()` async
   - Added await before `checkAuthSuccess()`
   - Added console logs for debugging
   - Simplified `checkAuth()` to just check local storage

2. **battle-of-the-bots/src/routes/auth.routes.js**
   - Added `localStorage.setItem('auraflow_user_id', userId)`

---

## Success Checklist

After authentication:

- [ ] Success page shows for 2 seconds
- [ ] Redirects to webapp
- [ ] Green success banner appears
- [ ] Console shows: "Detected successful authentication"
- [ ] Console shows: "Auth token saved successfully"
- [ ] Console shows: "User is authenticated"
- [ ] Calendar events load
- [ ] **No more auth redirects!**

---

## Next Steps After Auth Works

1. ✅ **Test calendar events** - Should display your events
2. ✅ **Test Quick Focus** - Start a 25-minute session
3. ✅ **Test AI features** - Find Focus Time, Generate Ritual
4. ✅ **Test themes** - Switch between Light, Dark, Calm, Beach, Rain
5. ✅ **Test offline mode** - Disconnect internet, app still works
6. ✅ **Load Chrome extension** - Test extension separately

---

## Troubleshooting

### "Detected successful authentication" but still loops

**Problem:** Token not being saved properly

**Solution:**
```javascript
// Check if Platform.saveData works:
Platform.saveData('test', {value: 'hello'}).then(() => {
    Platform.getData('test').then(data => {
        console.log('Test data:', data);
    });
});
```

### No console messages at all

**Problem:** JavaScript error preventing execution

**Solution:**
1. Open console (F12)
2. Look for red error messages
3. Check if files loaded correctly (Network tab)

### Success banner doesn't show

**Problem:** CSS not loaded or function not called

**Solution:**
1. Check Network tab - style.css loaded?
2. Check console - any CSS errors?
3. Hard refresh: Ctrl+Shift+R

---

## Summary

**What was wrong:**
- `checkAuthSuccess()` wasn't awaited
- Token was being saved async
- `checkAuth()` ran before token was saved
- No token found → auth loop

**What's fixed:**
- `checkAuthSuccess()` is now async
- We await it before `initializeApp()`
- Token is saved before auth check
- Auth check finds token → no loop!

---

**Status:** ✅ Should be fixed now!  
**Test:** Clear localStorage, hard refresh, try auth  
**Expected:** One redirect, then events load, no loop!

---

## Quick Test Command

```bash
# 1. Restart servers
./restart-all.sh

# 2. Open browser to http://localhost:5000

# 3. Open console (F12)

# 4. Clear storage:
localStorage.clear();

# 5. Refresh page

# 6. Click "Connect Google Calendar"

# 7. Should work! ✅
```
