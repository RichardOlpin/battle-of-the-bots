# AuraFlow Desktop Testing - Quick Reference Card

## 🚀 Quick Start

```bash
# Start local server
cd webapp
python3 -m http.server 8080
# OR
./start-server.sh
```

**Open:** http://localhost:8080

---

## 🧪 Automated Tests

**URL:** http://localhost:8080/test-desktop.html

Click "Run All Tests" to execute automated test suite.

---

## 🔑 Manual Auth Simulation

Without backend, simulate authentication:

```javascript
// Open DevTools Console (F12)
localStorage.setItem('authToken', JSON.stringify({token: 'test-token'}))
location.reload()
```

---

## ⏱️ Quick Timer Test

```javascript
// In DevTools Console
CoreLogic.startTimer(5, (r) => console.log(r), () => console.log('Done'))
```

---

## 🎨 Theme Testing

1. Navigate to events screen
2. Click theme buttons (Light, Dark, Calm, Beach, Rain)
3. Refresh page to verify persistence

---

## 💾 Check LocalStorage

**Chrome/Edge:**
1. F12 → Application tab
2. Local Storage → http://localhost:8080

**Firefox:**
1. F12 → Storage tab
2. Local Storage → http://localhost:8080

**Safari:**
1. Cmd+Option+C → Storage tab
2. Local Storage → http://localhost:8080

---

## 📱 Responsive Testing

**Chrome DevTools:**
1. F12 → Device Toolbar (Cmd+Shift+M)
2. Select device or enter custom dimensions

**Test Sizes:**
- 375px (Mobile)
- 768px (Tablet)
- 1024px (Desktop)
- 1920px (Large Desktop)

---

## 🔔 Notification Testing

**Grant Permission:**
- Allow when prompted on first load

**Test Notification:**
```javascript
Platform.createNotification({
  title: 'Test',
  message: 'This is a test',
  iconUrl: '/icons/icon-192.png'
})
```

---

## 🛠️ Service Worker Check

**Chrome:**
1. F12 → Application tab
2. Service Workers section
3. Verify "activated and is running"

**Clear Cache:**
```javascript
// In DevTools Console
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
```

---

## 🌐 Offline Testing

**Chrome:**
1. F12 → Network tab
2. Throttling dropdown → Offline
3. Test app functionality

---

## 📊 Performance Check

**Chrome:**
1. F12 → Performance tab
2. Record → Use app → Stop
3. Analyze timeline

**Memory:**
1. F12 → Memory tab
2. Take heap snapshot
3. Use app for 5 minutes
4. Take another snapshot
5. Compare

---

## 🐛 Common Issues

### Blank Screen
- Check console for errors
- Verify using http:// not file://
- Clear cache and reload

### Timer Not Working
```javascript
// Check timer state
CoreLogic.getTimerState()
```

### LocalStorage Not Saving
- Check browser privacy settings
- Try incognito mode
- Verify no extensions blocking

### Service Worker Not Registering
- Must use localhost or HTTPS
- Check service-worker.js exists
- Clear old service workers

---

## 📝 Test Checklist

- [ ] App loads in Chrome, Firefox, Safari
- [ ] Timer starts, pauses, resumes, stops
- [ ] Themes switch and persist
- [ ] LocalStorage saves data
- [ ] Service worker registers
- [ ] Notifications work or fallback
- [ ] Responsive at all breakpoints
- [ ] No console errors
- [ ] AI features show proper errors
- [ ] Offline mode works

---

## 🔍 Debugging Commands

```javascript
// Check what's in localStorage
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})

// Check timer state
console.log(CoreLogic.getTimerState())

// Check session state
console.log(CoreLogic.getSessionState())

// Test notification permission
Platform.getNotificationPermission().then(console.log)

// Check service worker
navigator.serviceWorker.getRegistrations().then(console.log)

// Clear all data
localStorage.clear()
caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
```

---

## 📞 Need Help?

1. Check DESKTOP_TESTING_GUIDE.md for detailed instructions
2. Review console errors
3. Check Network tab for failed requests
4. Verify all files exist with verify-desktop-ready.js

---

## ✅ Success Criteria

**All tests pass when:**
- ✓ App loads without errors
- ✓ Timer counts down accurately
- ✓ Data persists after refresh
- ✓ Works in Chrome, Firefox, Safari
- ✓ Responsive on all screen sizes
- ✓ Service worker caches assets
- ✓ Notifications work or fallback gracefully
- ✓ No critical console errors

---

**Version:** 1.0  
**Last Updated:** 2025-10-02
