# Quick Start Guide

## The port 3000 issue is now fixed! ✅

I killed the process that was using port 3000. Now you can start everything.

---

## Option 1: Manual Start (Recommended for Testing)

### Terminal 1: Start Backend
```bash
cd battle-of-the-bots
npm start
```

**Wait for:** `AuraFlow AI & Integration Service running on port 3000`

### Terminal 2: Start Webapp
```bash
# Open a NEW terminal window
npx serve webapp
```

**Note the port** (usually 5000 if 3000 is taken by backend)

### Browser: Open Webapp
```
http://localhost:5000
```

Or check the terminal output for the exact URL.

---

## Option 2: Automated Start (Background)

### Start Everything
```bash
./start-all.sh
```

This will:
- Kill any process on port 3000
- Start backend on port 3000
- Start webapp on port 5000
- Show you the URLs

### Stop Everything
```bash
./stop-all.sh
```

---

## What You Should See

### Terminal 1 (Backend)
```
✓ Environment variables validated successfully
AuraFlow AI & Integration Service running on port 3000
Environment: development

Available endpoints:
  GET    /api/health              - Health check
  POST   /api/scheduling/suggest  - AI scheduling suggestions
  ...
```

### Terminal 2 (Webapp)
```
   ┌────────────────────────────────────────┐
   │                                        │
   │   Serving!                             │
   │                                        │
   │   - Local:    http://localhost:5000   │
   │                                        │
   └────────────────────────────────────────┘
```

### Browser
1. **Diagnostic Page:** `http://localhost:5000/diagnostic.html`
   - All checks should be green ✅

2. **Main Webapp:** `http://localhost:5000`
   - AuraFlow interface loads
   - "Connect Google Calendar" button visible
   - No errors in console (F12)

---

## Load Chrome Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `auraflow-extension` folder
6. Click the AuraFlow icon in toolbar

---

## Quick Test

### Test Backend
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "AuraFlow AI & Integration Service"
}
```

### Test Webapp
Open: `http://localhost:5000/diagnostic.html`

All sections should show ✅

### Test Extension
1. Click extension icon in Chrome toolbar
2. Should see AuraFlow popup
3. Click "Connect Google Calendar"
4. Should authenticate successfully

---

## Troubleshooting

### Port 3000 Still In Use?
```bash
# Find and kill the process
lsof -i :3000
kill <PID>

# Or use the stop script
./stop-all.sh
```

### Backend Won't Start?
```bash
# Check .env file exists
ls battle-of-the-bots/.env

# Check for errors
cd battle-of-the-bots
npm start
```

### Webapp Shows Errors?
```bash
# Clear browser cache
# Open DevTools (F12) → Application → Clear storage

# Hard refresh
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Check diagnostic page
# http://localhost:5000/diagnostic.html
```

### Extension Won't Load?
```bash
# Check manifest exists
ls auraflow-extension/manifest.json

# Reload extension
# Go to chrome://extensions/
# Click reload icon on AuraFlow card
```

---

## URLs Reference

| Service | URL |
|---------|-----|
| Backend Health | http://localhost:3000/api/health |
| Backend API | http://localhost:3000/api/* |
| Webapp Main | http://localhost:5000 |
| Webapp Diagnostic | http://localhost:5000/diagnostic.html |
| Chrome Extensions | chrome://extensions/ |

---

## Next Steps

Once everything is running:

1. ✅ **Backend running** on port 3000
2. ✅ **Webapp running** on port 5000
3. ✅ **Extension loaded** in Chrome

Then:
- Test authentication in webapp
- Test authentication in extension
- Try Quick Focus feature
- Test AI features (Find Focus Time, Generate Ritual)
- Switch themes
- Test offline mode

---

## Need Help?

Check these files:
- `STARTUP_GUIDE.md` - Detailed startup instructions
- `webapp/ERROR_FIX_GUIDE.md` - Fix common errors
- `webapp/TROUBLESHOOTING.md` - Comprehensive troubleshooting
- `webapp/diagnostic.html` - Interactive diagnostic tool

---

**Ready to start!** 🚀

Run in Terminal 1:
```bash
cd battle-of-the-bots && npm start
```

Run in Terminal 2:
```bash
npx serve webapp
```

Then open: `http://localhost:5000`
