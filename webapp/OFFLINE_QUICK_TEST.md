# AuraFlow PWA - Quick Offline Test

**⏱️ 5-Minute Quick Test** | Use this for rapid verification

---

## Desktop Quick Test (2 minutes)

### Setup
1. Open `http://localhost:3000` in Chrome
2. Use the app normally (load events, start a session)
3. Open DevTools (F12) > Network tab

### Test
1. ✅ Check "Offline" box in Network tab
2. ✅ Reload page (Cmd+R / Ctrl+R)
3. ✅ Click "Quick Focus" button
4. ✅ Verify timer counts down
5. ✅ Uncheck "Offline" box
6. ✅ Click refresh button

### Pass Criteria
- App loads when offline ✅
- Timer works offline ✅
- No console errors ✅

---

## Mobile Quick Test (3 minutes)

### Setup
1. Install PWA to home screen
2. Open app and use normally
3. Close app completely

### Test
1. ✅ Enable Airplane Mode
2. ✅ Launch app from home screen
3. ✅ Tap "Quick Focus"
4. ✅ Watch timer for 10 seconds
5. ✅ Stop session
6. ✅ Disable Airplane Mode

### Pass Criteria
- App opens in Airplane Mode ✅
- Timer counts down ✅
- No errors or crashes ✅

---

## Automated Quick Test (1 minute)

### In Browser Console
```javascript
// Load verification script
const script = document.createElement('script');
script.src = '/verify-offline.js';
document.head.appendChild(script);

// Wait 2 seconds, then run
setTimeout(async () => {
  await OfflineVerification.runAllChecks();
}, 2000);
```

### Pass Criteria
- All checks show ✅
- Success rate 100%

---

## Visual Quick Test

### Open Test Page
Navigate to: `http://localhost:3000/test-offline-verification.html`

### Click
1. "▶️ Run All Tests" button

### Pass Criteria
- Green checkmarks ✅
- 100% success rate

---

## What Should Work Offline

✅ **WORKS**
- App loads
- Timer (start/pause/stop)
- View cached events
- Theme switching
- Settings

❌ **DOESN'T WORK** (by design)
- AI features
- Refresh events
- Login/logout
- Sync to server

---

## Quick Troubleshooting

### App won't load offline
→ Did you load it online first?
→ Check DevTools > Application > Service Workers

### Timer doesn't work
→ Check console for errors
→ Verify core-logic.js is cached

### No offline indicator
→ Check if actually offline (airplane icon)
→ Reload the page

---

## Full Documentation

For detailed testing: `webapp/OFFLINE_TESTING_GUIDE.md`

---

**Quick Test Complete?** ✅

If all quick tests pass, the offline functionality is working correctly!
