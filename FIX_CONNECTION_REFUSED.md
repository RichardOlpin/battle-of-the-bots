# Fix "Connection Refused" Error

## Problem

After OAuth authentication, you see:
```
This site can't be reached
localhost refused to connect.
ERR_CONNECTION_REFUSED
```

## Root Cause

The webapp server (port 5000) is not running, so when the backend tries to redirect you back to `http://localhost:5000`, the connection fails.

---

## Quick Fix

### Step 1: Check Which Servers Are Running

```bash
./check-servers.sh
```

This will show you:
- ✅ Backend running (port 3000)
- ❌ Webapp NOT running (port 5000) ← This is the problem!

### Step 2: Start the Webapp

```bash
npx serve webapp
```

**Wait for:**
```
   ┌────────────────────────────────────────┐
   │                                        │
   │   Serving!                             │
   │                                        │
   │   - Local:    http://localhost:5000   │
   │                                        │
   └────────────────────────────────────────┘
```

### Step 3: Restart Backend (to load new .env)

```bash
# In Terminal 1 (where backend is running):
# Press Ctrl+C

# Then restart:
cd battle-of-the-bots
npm start
```

### Step 4: Test Authentication Again

1. Open: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. Sign in with Google
4. Should now redirect successfully! ✅

---

## Using the Start/Stop Scripts

### Option 1: Restart Everything

```bash
./restart-all.sh
```

This will:
1. Stop all servers
2. Wait 2 seconds
3. Start backend on port 3000
4. Start webapp on port 5000

### Option 2: Manual Control

**Stop everything:**
```bash
./stop-all.sh
```

**Start everything:**
```bash
./start-all.sh
```

**Check status:**
```bash
./check-servers.sh
```

---

## What I Fixed

### 1. Added WEBAPP_URL to .env

Updated `battle-of-the-bots/.env`:
```bash
WEBAPP_URL=http://localhost:5000
```

This ensures the backend knows where to redirect after authentication.

### 2. Created check-servers.sh

New script to verify both servers are running:
```bash
./check-servers.sh
```

Shows:
- Backend status (port 3000)
- Webapp status (port 5000)
- What to do if either is not running

---

## Typical Workflow

### Starting Fresh

```bash
# Terminal 1: Start everything
./start-all.sh

# Wait for both servers to start
# Backend: port 3000
# Webapp: port 5000

# Open browser
http://localhost:5000
```

### If Something Goes Wrong

```bash
# Check what's running
./check-servers.sh

# Restart everything
./restart-all.sh

# Or stop and start manually
./stop-all.sh
./start-all.sh
```

---

## Troubleshooting

### "Backend is running but webapp is not"

**Problem:** Webapp server stopped or never started

**Solution:**
```bash
npx serve webapp
```

### "Webapp is running but backend is not"

**Problem:** Backend server stopped or crashed

**Solution:**
```bash
cd battle-of-the-bots
npm start
```

### "Neither server is running"

**Problem:** Both servers stopped

**Solution:**
```bash
./start-all.sh
```

### "Port already in use"

**Problem:** Old process still running

**Solution:**
```bash
./stop-all.sh
sleep 2
./start-all.sh
```

### Still getting "Connection Refused"

**Checklist:**
- [ ] Run `./check-servers.sh` - both should show ✅
- [ ] Backend shows: "running on port 3000"
- [ ] Webapp shows: "Local: http://localhost:5000"
- [ ] Can access: http://localhost:5000 in browser
- [ ] Can access: http://localhost:3000/api/health
- [ ] .env has: `WEBAPP_URL=http://localhost:5000`
- [ ] Backend was restarted after .env change

---

## Expected Server Output

### Terminal 1 (Backend)
```
✓ Environment variables validated successfully
AuraFlow AI & Integration Service running on port 3000
Environment: development

Available endpoints:
  GET    /api/health
  POST   /api/scheduling/suggest
  ...
```

### Terminal 2 (Webapp)
```
   ┌────────────────────────────────────────┐
   │                                        │
   │   Serving!                             │
   │                                        │
   │   - Local:    http://localhost:5000   │
   │   - Network:  http://192.168.x.x:5000 │
   │                                        │
   └────────────────────────────────────────┘
```

---

## Test URLs

### Before Authentication

**Webapp:**
```
http://localhost:5000
```
Should show: AuraFlow interface with "Connect Google Calendar" button

**Backend Health:**
```
http://localhost:3000/api/health
```
Should return: `{"status":"healthy",...}`

**Diagnostic:**
```
http://localhost:5000/diagnostic.html
```
Should show: All checks green ✅

### After Authentication

**OAuth Flow:**
```
1. http://localhost:5000 (webapp)
2. Click "Connect Google Calendar"
3. https://accounts.google.com/... (Google)
4. http://localhost:3000/api/auth/google/callback (backend)
5. http://localhost:5000 (webapp - redirected back)
```

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `./start-all.sh` | Start both servers |
| `./stop-all.sh` | Stop both servers |
| `./restart-all.sh` | Restart both servers |
| `./check-servers.sh` | Check server status |
| `npx serve webapp` | Start webapp only |
| `cd battle-of-the-bots && npm start` | Start backend only |

---

## Files Modified

1. **battle-of-the-bots/.env**
   - Added: `WEBAPP_URL=http://localhost:5000`

2. **check-servers.sh** (new)
   - Script to verify server status

---

## Next Steps

1. **Run check script:**
   ```bash
   ./check-servers.sh
   ```

2. **If webapp not running:**
   ```bash
   npx serve webapp
   ```

3. **Restart backend:**
   ```bash
   cd battle-of-the-bots
   npm start
   ```

4. **Test authentication:**
   ```
   http://localhost:5000
   ```

---

## Success Indicators

**✅ Everything is working when:**

1. `./check-servers.sh` shows both servers running
2. Can access `http://localhost:5000` (webapp loads)
3. Can access `http://localhost:3000/api/health` (returns JSON)
4. Authentication redirects successfully
5. Calendar events load after auth

---

**TL;DR:**

The webapp server wasn't running. Start it with:
```bash
npx serve webapp
```

Or restart everything:
```bash
./restart-all.sh
```

Then test: `http://localhost:5000`
