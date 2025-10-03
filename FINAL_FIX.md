# Final Fix: Webapp Port Issue

## The Real Problem

The webapp was starting on a **random port** (49185) instead of port 5000!

```
Webapp started on: http://localhost:49185  ❌
Backend redirects to: http://localhost:5000  ❌
Result: Connection refused!
```

## Why This Happened

The `serve` command thought port 3000 was in use (by the backend) and automatically picked a different port for the webapp. But we need it on port 5000!

## The Fix

Updated `start-all.sh` to force webapp to use port 5000:

```bash
# Before:
npx serve webapp

# After:
npx serve webapp -l 5000
```

The `-l 5000` flag forces it to use port 5000.

---

## Test It Now!

### Step 1: Stop Everything
```bash
./stop-all.sh
```

### Step 2: Start Everything (with fixed script)
```bash
./start-all.sh
```

### Step 3: Verify Ports

You should see:
```
Backend: http://localhost:3000  ✅
Webapp:  http://localhost:5000  ✅
```

NOT:
```
Webapp: http://localhost:49185  ❌
```

### Step 4: Test Authentication

1. Open: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. Sign in with Google
4. Should redirect successfully! ✅

---

## Quick Commands

### Restart Everything (Use This!)
```bash
./restart-all.sh
```

### Check What's Running
```bash
./check-servers.sh
```

### Manual Start (if needed)
```bash
# Terminal 1: Backend
cd battle-of-the-bots
npm start

# Terminal 2: Webapp (force port 5000)
npx serve webapp -l 5000
```

---

## Expected Output

### When Starting Webapp

**Good (port 5000):**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│   Serving!                                       │
│                                                  │
│   - Local:    http://localhost:5000             │  ✅
│                                                  │
└──────────────────────────────────────────────────┘
```

**Bad (random port):**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│   Serving!                                       │
│                                                  │
│   - Local:    http://localhost:49185            │  ❌
│   This port was picked because 3000 is in use.  │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Port 5000 is already in use"

**Check what's using it:**
```bash
lsof -i :5000
```

**Kill it:**
```bash
kill <PID>
```

**Or use stop script:**
```bash
./stop-all.sh
```

### Still Getting Random Port

**Make sure you're using the updated script:**
```bash
./restart-all.sh
```

**Or manually specify port:**
```bash
npx serve webapp -l 5000
```

---

## Summary

**Problem:** Webapp started on random port (49185)  
**Solution:** Force webapp to use port 5000 with `-l 5000` flag  
**Test:** `./restart-all.sh` then open `http://localhost:5000`

---

## Files Modified

1. **start-all.sh**
   - Changed: `npx serve webapp`
   - To: `npx serve webapp -l 5000`

---

## Next Steps

1. **Stop everything:**
   ```bash
   ./stop-all.sh
   ```

2. **Start with fixed script:**
   ```bash
   ./start-all.sh
   ```

3. **Verify webapp is on port 5000:**
   - Should see: `Local: http://localhost:5000`

4. **Test authentication:**
   ```
   http://localhost:5000
   Click "Connect Google Calendar"
   Should work now! ✅
   ```

---

**TL;DR:**

Webapp was on wrong port. Fixed the start script to force port 5000.

Run: `./restart-all.sh`

Then test: `http://localhost:5000`
