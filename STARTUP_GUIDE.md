# AuraFlow Complete Startup Guide

This guide will help you run both the webapp and Chrome extension successfully.

## Prerequisites

Make sure you have:
- Node.js installed (v14 or higher)
- Chrome browser
- Terminal/Command Prompt access

---

## Part 1: Start the Backend Server

The backend is required for both the webapp and extension to work.

### Step 1: Navigate to Backend Directory
```bash
cd battle-of-the-bots
```

### Step 2: Install Dependencies (if not already done)
```bash
npm install
```

### Step 3: Check Environment Variables
```bash
# Make sure .env file exists
ls .env

# If not, copy from example
cp .env.example .env
```

### Step 4: Start the Backend
```bash
npm start
```

**Expected Output:**
```
✓ Environment variables validated successfully
AuraFlow AI & Integration Service running on port 3000
Environment: development

Available endpoints:
  GET    /api/health              - Health check
  POST   /api/scheduling/suggest  - AI scheduling suggestions
  POST   /api/ritual/generate     - Personalized ritual generation
  POST   /api/session/summary     - Session summary generation
  GET    /api/auth/google         - Initiate Google OAuth
  GET    /api/auth/status         - Check auth status
  POST   /api/auth/logout         - Logout
```

**✅ Backend is ready when you see "running on port 3000"**

Keep this terminal window open!

---

## Part 2: Start the Webapp

Open a **NEW terminal window** (keep backend running).

### Step 1: Navigate to Project Root
```bash
cd /path/to/your/project
# (The directory containing both webapp/ and battle-of-the-bots/)
```

### Step 2: Install serve (if not already installed)
```bash
npm install -g serve
```

### Step 3: Start the Webapp Server
```bash
npx serve webapp
```

**Expected Output:**
```
   ┌────────────────────────────────────────┐
   │                                        │
   │   Serving!                             │
   │                                        │
   │   - Local:    http://localhost:3000   │
   │   - Network:  http://192.168.x.x:3000 │
   │                                        │
   └────────────────────────────────────────┘
```

**Note:** If port 3000 is taken (by backend), it will use port 5000 or another available port.

**✅ Webapp is ready!**

Keep this terminal window open too!

---

## Part 3: Open and Test the Webapp

### Step 1: Open Diagnostic Page First
```
http://localhost:3000/diagnostic.html
```
(Or whatever port serve is using)

**Check that all sections show green ✅:**
- Environment Check
- Service Worker Status
- Cache Status
- File Access Test
- Backend Connection

### Step 2: Open Main Webapp
```
http://localhost:3000/index.html
```
(Or just `http://localhost:3000/`)

**You should see:**
- AuraFlow logo and header
- "Connect Google Calendar" button
- Clean, modern interface with gradient background

### Step 3: Test Authentication
1. Click "Connect Google Calendar"
2. You should be redirected to Google's OAuth consent screen
3. Sign in with your Google account
4. Grant calendar permissions
5. You'll be redirected back to the app
6. Your calendar events should load

**✅ Webapp is working!**

---

## Part 4: Load the Chrome Extension

### Step 1: Open Chrome Extensions Page
1. Open Chrome browser
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)

### Step 2: Load Extension
1. Click "Load unpacked"
2. Navigate to your project directory
3. Select the `auraflow-extension` folder
4. Click "Select Folder"

**You should see:**
- AuraFlow Calendar extension card
- Extension ID
- No errors

### Step 3: Pin the Extension
1. Click the puzzle piece icon in Chrome toolbar
2. Find "AuraFlow Calendar"
3. Click the pin icon to pin it to toolbar

**✅ Extension is loaded!**

---

## Part 5: Test the Chrome Extension

### Step 1: Open Extension Popup
1. Click the AuraFlow icon in Chrome toolbar
2. You should see the extension popup

**You should see:**
- AuraFlow logo
- "Connect Google Calendar" button
- Clean interface

### Step 2: Test Authentication
1. Click "Connect Google Calendar"
2. Extension will use Chrome's identity API
3. Sign in with Google account
4. Grant calendar permissions
5. Your calendar events should load in the popup

### Step 3: Test Features
1. **View Events:** See today's calendar events
2. **Quick Focus:** Click "Quick Focus" to start a 25-minute session
3. **AI Features:** Try "Find Focus Time" or "Generate Ritual"
4. **Theme Switcher:** Change themes (Light, Dark, Calm, Beach, Rain)
5. **Blocked Sites:** Add websites to block during focus sessions

**✅ Extension is working!**

---

## Verification Checklist

### Backend ✓
- [ ] Backend running on port 3000
- [ ] No errors in terminal
- [ ] Health check works: `curl http://localhost:3000/api/health`

### Webapp ✓
- [ ] Webapp server running
- [ ] Diagnostic page shows all green
- [ ] Main page loads without errors
- [ ] Can connect to Google Calendar
- [ ] Events load successfully
- [ ] Service worker registered
- [ ] No console errors (F12)

### Extension ✓
- [ ] Extension loaded in Chrome
- [ ] No errors on extensions page
- [ ] Popup opens when clicked
- [ ] Can connect to Google Calendar
- [ ] Events display in popup
- [ ] Quick Focus works
- [ ] AI features accessible

---

## Troubleshooting

### Backend Won't Start
```bash
# Check if port 3000 is already in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port
PORT=3001 npm start
```

### Webapp Shows Errors
1. Open diagnostic page: `http://localhost:3000/diagnostic.html`
2. Check browser console (F12)
3. Clear cache: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. See `webapp/ERROR_FIX_GUIDE.md`

### Extension Won't Load
1. Check for errors on `chrome://extensions/`
2. Make sure you selected the `auraflow-extension` folder
3. Try clicking "Reload" on the extension card
4. Check `auraflow-extension/manifest.json` exists

### Authentication Fails
1. Make sure backend is running
2. Check `.env` file has Google OAuth credentials
3. Verify redirect URI in Google Cloud Console:
   - For webapp: `http://localhost:3000/api/auth/google/callback`
   - For extension: Chrome extension OAuth (automatic)

---

## Quick Commands Reference

### Start Everything
```bash
# Terminal 1: Backend
cd battle-of-the-bots && npm start

# Terminal 2: Webapp
npx serve webapp
```

### Stop Everything
```bash
# In each terminal window:
Ctrl+C
```

### Check Status
```bash
# Backend health
curl http://localhost:3000/api/health

# Webapp diagnostic
# Open: http://localhost:3000/diagnostic.html
```

### Reset Everything
```bash
# Stop all servers (Ctrl+C in terminals)

# Clear browser cache
# Open DevTools (F12) → Application → Clear storage

# Restart backend
cd battle-of-the-bots && npm start

# Restart webapp
npx serve webapp

# Reload extension
# Go to chrome://extensions/ → Click reload icon
```

---

## What You Should See

### Backend Terminal
```
✓ Environment variables validated successfully
AuraFlow AI & Integration Service running on port 3000
Environment: development
[2025-10-02T22:30:00.000Z] GET /api/health
[2025-10-02T22:30:05.000Z] GET /api/auth/google
```

### Webapp Browser
- Clean, modern interface
- Gradient background with animations
- Calendar events displayed
- No errors in console
- Service worker registered

### Extension Popup
- Compact interface (380px wide)
- Today's events listed
- Quick Focus button prominent
- Theme switcher working
- AI features accessible

---

## Success Indicators

**✅ Everything is working when:**

1. **Backend:** Terminal shows "running on port 3000" with no errors
2. **Webapp:** 
   - Loads at `http://localhost:3000`
   - Diagnostic page shows all green
   - Can authenticate with Google
   - Events display correctly
3. **Extension:**
   - Loads without errors in `chrome://extensions/`
   - Popup opens and displays correctly
   - Can authenticate with Google
   - Events display in popup

---

## Next Steps

Once everything is running:

1. **Test the webapp features:**
   - Calendar integration
   - Quick Focus sessions
   - AI scheduling suggestions
   - AI ritual generation
   - Theme switching
   - Offline mode

2. **Test the extension features:**
   - Calendar events in popup
   - Quick Focus from extension
   - Website blocking during sessions
   - Notifications
   - Background sync

3. **Compare both:**
   - Both should show same calendar events
   - Both should support authentication
   - Both should have AI features
   - Extension is more compact
   - Webapp has more screen space

---

## Getting Help

If you encounter issues:

1. **Check diagnostic page:** `http://localhost:3000/diagnostic.html`
2. **Check browser console:** Press F12
3. **Check backend logs:** Look at terminal running backend
4. **Read troubleshooting guides:**
   - `webapp/ERROR_FIX_GUIDE.md`
   - `webapp/TROUBLESHOOTING.md`
   - `auraflow-extension/TESTING_GUIDE.md`

---

**Ready to start? Follow the steps above in order!** 🚀

**Date:** October 2, 2025  
**Status:** Complete startup guide ready
