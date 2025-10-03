# 🚀 START HERE - AuraFlow Complete Guide

## ✅ Port 3000 Issue Fixed!

I've killed the process that was using port 3000. You're ready to start!

---

## Quick Start (3 Steps)

### Step 1: Start Backend
Open Terminal 1:
```bash
cd battle-of-the-bots
npm start
```

Wait for: `✓ AuraFlow AI & Integration Service running on port 3000`

### Step 2: Start Webapp
Open Terminal 2 (NEW window):
```bash
npx serve webapp
```

Note the URL (usually `http://localhost:5000`)

### Step 3: Open in Browser
```
http://localhost:5000/diagnostic.html
```

Check all sections are green ✅, then open:
```
http://localhost:5000
```

**Done!** 🎉

---

## Load Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select `auraflow-extension` folder
5. Click AuraFlow icon in toolbar

---

## What You'll See

### Webapp Features
- 📅 Google Calendar integration
- ⏱️ Quick Focus timer (25 minutes)
- 🤖 AI scheduling suggestions
- ✨ AI ritual generation
- 🎨 5 beautiful themes
- 📴 Offline mode
- 🔔 Notifications

### Extension Features
- 📅 Calendar events in popup
- ⚡ Quick Focus from toolbar
- 🛡️ Website blocking during sessions
- 🔔 Background notifications
- 🎨 Theme matching webapp

---

## Testing Checklist

### Backend ✓
```bash
# Test health endpoint
curl http://localhost:3000/api/health
```

Should return: `{"status":"healthy"}`

### Webapp ✓
- [ ] Diagnostic page all green: `http://localhost:5000/diagnostic.html`
- [ ] Main page loads: `http://localhost:5000`
- [ ] No console errors (F12)
- [ ] Can click "Connect Google Calendar"
- [ ] Service worker registered

### Extension ✓
- [ ] Loads without errors in `chrome://extensions/`
- [ ] Popup opens when clicked
- [ ] Shows "Connect Google Calendar" button
- [ ] No errors in popup console (right-click → Inspect)

---

## Common Issues

### "Port 3000 already in use"
```bash
# Kill the process
lsof -i :3000
kill <PID>

# Or use stop script
./stop-all.sh
```

### "Service worker registration failed"
```bash
# Clear browser cache
# DevTools (F12) → Application → Clear storage

# Hard refresh
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### "Backend not responding"
```bash
# Make sure backend is running
cd battle-of-the-bots
npm start

# Check it's working
curl http://localhost:3000/api/health
```

---

## File Structure

```
.
├── battle-of-the-bots/     # Backend API server
│   ├── src/
│   │   ├── app.js          # Main server
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── .env                # Environment variables
│
├── webapp/                 # Progressive Web App
│   ├── index.html          # Main page
│   ├── app.js              # Main application
│   ├── core-logic.js       # Timer & session logic
│   ├── service-worker.js   # Offline support
│   └── diagnostic.html     # Diagnostic tool
│
└── auraflow-extension/     # Chrome Extension
    ├── manifest.json       # Extension config
    ├── popup.html          # Extension popup
    ├── popup.js            # Popup logic
    └── background.js       # Background service
```

---

## Helper Scripts

### Start Everything
```bash
./start-all.sh
```

### Stop Everything
```bash
./stop-all.sh
```

### Fix Issues
```bash
cd webapp
./fix-issues.sh
```

---

## Documentation

| File | Purpose |
|------|---------|
| `QUICK_START.md` | Quick start instructions |
| `STARTUP_GUIDE.md` | Detailed startup guide |
| `webapp/ERROR_FIX_GUIDE.md` | Fix common errors |
| `webapp/TROUBLESHOOTING.md` | Comprehensive troubleshooting |
| `webapp/diagnostic.html` | Interactive diagnostic tool |
| `webapp/PERFORMANCE_OPTIMIZATIONS.md` | Performance details |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                                             │
│  Chrome Extension          Webapp (PWA)     │
│  ┌──────────────┐         ┌──────────────┐ │
│  │   Popup UI   │         │   Web UI     │ │
│  │              │         │              │ │
│  │  - Events    │         │  - Events    │ │
│  │  - Timer     │         │  - Timer     │ │
│  │  - AI        │         │  - AI        │ │
│  └──────┬───────┘         └──────┬───────┘ │
│         │                        │         │
│         └────────────┬───────────┘         │
│                      │                     │
└──────────────────────┼─────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Backend Server  │
            │  (Port 3000)     │
            │                  │
            │  - Auth API      │
            │  - Calendar API  │
            │  - AI Services   │
            │  - Session API   │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Google APIs     │
            │  - Calendar      │
            │  - OAuth 2.0     │
            └──────────────────┘
```

---

## Features Comparison

| Feature | Webapp | Extension |
|---------|--------|-----------|
| Calendar Events | ✅ | ✅ |
| Quick Focus | ✅ | ✅ |
| AI Scheduling | ✅ | ✅ |
| AI Rituals | ✅ | ✅ |
| Theme Switching | ✅ | ✅ |
| Website Blocking | ✅ | ✅ |
| Offline Mode | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| Full Screen | ✅ | ❌ |
| Always Accessible | ❌ | ✅ |
| Desktop App | ✅ (PWA) | ❌ |

---

## Performance

Both webapp and extension are optimized for:
- ⚡ Fast load times (< 3s on 3G)
- 🎯 Smooth 60fps animations
- 💾 Efficient caching
- 📴 Offline functionality
- 🔋 Low battery usage

---

## Security

- 🔒 HTTPS required in production
- 🔐 OAuth 2.0 authentication
- 🛡️ Helmet.js security headers
- 🔑 Encrypted token storage
- 🚫 XSS protection
- 🔒 CORS configured

---

## Next Steps

1. **Start the servers** (see Quick Start above)
2. **Test the webapp** at `http://localhost:5000`
3. **Load the extension** in Chrome
4. **Connect Google Calendar** in both
5. **Try Quick Focus** feature
6. **Test AI features** (Find Focus Time, Generate Ritual)
7. **Switch themes** to see animations
8. **Test offline mode** (disconnect internet)

---

## Getting Help

1. **Check diagnostic page:** `http://localhost:5000/diagnostic.html`
2. **Check browser console:** Press F12
3. **Check backend logs:** Look at Terminal 1
4. **Read documentation:** See files listed above
5. **Run fix script:** `cd webapp && ./fix-issues.sh`

---

## Success Indicators

**✅ Everything is working when you see:**

1. **Terminal 1:** "AuraFlow AI & Integration Service running on port 3000"
2. **Terminal 2:** "Serving! - Local: http://localhost:5000"
3. **Browser:** Webapp loads with no errors
4. **Diagnostic:** All checks green ✅
5. **Extension:** Loads without errors in chrome://extensions/

---

**Ready? Start with Terminal 1!** 🚀

```bash
cd battle-of-the-bots && npm start
```

Then open Terminal 2 and run:
```bash
npx serve webapp
```

Then open: `http://localhost:5000/diagnostic.html`

**Good luck!** 🎉
