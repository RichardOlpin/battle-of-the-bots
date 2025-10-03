# Fix OAuth Error - Quick Guide

## Your Current Issue

**Error:** "Error 400: invalid_request"

**Cause:** Your `.env` file has `GOOGLE_CLIENT_SECRET=test_client_secret` which is not a real secret.

---

## Quick Fix (2 Steps)

### Step 1: Get Your Client Secret

1. Go to: https://console.cloud.google.com/apis/credentials

2. Find your OAuth client:
   - Client ID: `369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn`
   - Click on it

3. Copy the **Client secret**
   - It looks like: `GOCSPX-abc123xyz789...`
   - Click the copy icon next to it

### Step 2: Update .env File

Open `battle-of-the-bots/.env` and replace this line:

```bash
# WRONG (current):
GOOGLE_CLIENT_SECRET=test_client_secret

# RIGHT (paste your real secret):
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret_here
```

**Full .env file should look like:**
```bash
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=b512418feffd87ad774032863a17fe012817939ee35c806e336ce65ca631aa4d
ENCRYPTION_KEY=3945505c29210f0c6c5bf9f53e650942
```

### Step 3: Restart Backend

```bash
# Stop the backend (Ctrl+C in Terminal 1)
# Then restart:
cd battle-of-the-bots
npm start
```

### Step 4: Test Again

1. Open: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. Should work now! ✅

---

## If You Don't Have the Client Secret

If you can't find the client secret or it was never created:

### Create New OAuth Credentials

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click "Create Credentials" → "OAuth client ID"

3. Select "Web application"

4. Configure:
   - **Name:** AuraFlow Web App
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:5000`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/google/callback`

5. Click "Create"

6. **Copy both:**
   - Client ID
   - Client Secret

7. Update your `.env` file with both values

---

## Additional Setup (If Needed)

### Enable Google Calendar API

1. Go to: https://console.cloud.google.com/apis/library
2. Search: "Google Calendar API"
3. Click "Enable"

### Add Test User

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to "Test users"
3. Click "Add Users"
4. Add: `ks7585@g.rit.edu`
5. Save

### Check Redirect URI

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client
3. Check "Authorized redirect URIs" includes:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
4. If not, add it and save

---

## Verification

After updating `.env` and restarting:

```bash
# Check backend is using new credentials
cd battle-of-the-bots
npm start

# Should see:
# ✓ Environment variables validated successfully
# AuraFlow AI & Integration Service running on port 3000
```

Then test:
```bash
# Open webapp
http://localhost:5000

# Click "Connect Google Calendar"
# Should redirect to Google (not show error)
```

---

## Common Mistakes

### ❌ Wrong: Quotes around secret
```bash
GOOGLE_CLIENT_SECRET="GOCSPX-abc123"  # Don't use quotes!
```

### ✅ Correct: No quotes
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
```

### ❌ Wrong: Extra spaces
```bash
GOOGLE_CLIENT_SECRET= GOCSPX-abc123  # Space before secret
```

### ✅ Correct: No spaces
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
```

### ❌ Wrong: Placeholder value
```bash
GOOGLE_CLIENT_SECRET=test_client_secret  # Not real!
```

### ✅ Correct: Real secret from Google
```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789def456
```

---

## Quick Checklist

Before testing:

- [ ] Got real Client Secret from Google Cloud Console
- [ ] Updated `.env` file (no quotes, no spaces)
- [ ] Restarted backend server
- [ ] Google Calendar API is enabled
- [ ] Your email (ks7585@g.rit.edu) is added as test user
- [ ] Redirect URI matches: `http://localhost:3000/api/auth/google/callback`

---

## Still Not Working?

### Check Backend Logs

Look at Terminal 1 (backend) for errors:
```
[ERROR] OAuth error: invalid_client
```

This means the Client ID or Secret is wrong.

### Check Browser Console

Press F12 and look for errors:
```
Failed to fetch
```

This means backend isn't running or wrong URL.

### Try Incognito Mode

Sometimes browser cache causes issues:
1. Open Chrome incognito window
2. Go to `http://localhost:5000`
3. Try authentication again

---

## Need More Help?

See detailed guide: `GOOGLE_OAUTH_SETUP.md`

Or check:
- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Your project should have:
  - ✅ Google Calendar API enabled
  - ✅ OAuth consent screen configured
  - ✅ OAuth credentials created
  - ✅ Test user added (ks7585@g.rit.edu)

---

**TL;DR:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth client (ID: 369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn)
3. Copy the Client Secret (starts with GOCSPX-)
4. Paste it in `battle-of-the-bots/.env` as `GOOGLE_CLIENT_SECRET=`
5. Restart backend: `npm start`
6. Test: `http://localhost:5000`

**That's it!** 🚀
