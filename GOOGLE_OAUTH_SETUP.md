# Google OAuth Setup Guide

## The Problem

You're getting "Error 400: invalid_request" because the Google OAuth credentials in your `.env` file are placeholders, not real credentials.

Current `.env` has:
```
GOOGLE_CLIENT_SECRET=test_client_secret  ❌ This is not real!
```

---

## Solution: Get Real Google OAuth Credentials

### Step 1: Go to Google Cloud Console

Open: https://console.cloud.google.com/

### Step 2: Create or Select a Project

1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "AuraFlow" (or any name)
4. Click "Create"
5. Wait for project to be created
6. Select your new project from the dropdown

### Step 3: Enable Google Calendar API

1. In the left sidebar, click "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it
4. Click "Enable"
5. Wait for it to enable

### Step 4: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"

**Fill in the form:**
- **App name:** AuraFlow
- **User support email:** Your email (ks7585@g.rit.edu)
- **App logo:** (optional, skip for now)
- **App domain:** (leave blank for testing)
- **Authorized domains:** (leave blank for testing)
- **Developer contact:** Your email (ks7585@g.rit.edu)

4. Click "Save and Continue"

**Scopes:**
5. Click "Add or Remove Scopes"
6. Search for "calendar"
7. Check: `https://www.googleapis.com/auth/calendar.readonly`
8. Click "Update"
9. Click "Save and Continue"

**Test users:**
10. Click "Add Users"
11. Add your email: ks7585@g.rit.edu
12. Click "Add"
13. Click "Save and Continue"

14. Review and click "Back to Dashboard"

### Step 5: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"

**Configure:**
- **Name:** AuraFlow Web App
- **Authorized JavaScript origins:**
  - Click "Add URI"
  - Add: `http://localhost:3000`
  - Click "Add URI" again
  - Add: `http://localhost:5000`

- **Authorized redirect URIs:**
  - Click "Add URI"
  - Add: `http://localhost:3000/api/auth/google/callback`

4. Click "Create"

### Step 6: Copy Your Credentials

A popup will show your credentials:
- **Client ID:** Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret:** Something like `GOCSPX-abc123xyz789`

**IMPORTANT:** Copy both of these! You'll need them in the next step.

### Step 7: Update Your .env File

Open `battle-of-the-bots/.env` and update these lines:

```bash
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Example (with fake values):**
```bash
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789def456
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Step 8: Restart the Backend

```bash
# Stop the backend (Ctrl+C in Terminal 1)
# Then restart:
cd battle-of-the-bots
npm start
```

### Step 9: Test Authentication

1. Open webapp: `http://localhost:5000`
2. Click "Connect Google Calendar"
3. You should now see Google's consent screen
4. Sign in with: ks7585@g.rit.edu
5. Grant calendar permissions
6. You'll be redirected back to the app

**Success!** 🎉

---

## For Chrome Extension

The extension uses a different OAuth flow (Chrome Identity API).

### Step 1: Create Extension OAuth Credentials

1. Go back to Google Cloud Console → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Chrome extension" (or "Chrome app")

**Configure:**
- **Name:** AuraFlow Extension
- **Application ID:** Your extension ID from `chrome://extensions/`

4. Click "Create"
5. Copy the Client ID

### Step 2: Update Extension Manifest

Open `auraflow-extension/manifest.json` and update:

```json
"oauth2": {
  "client_id": "YOUR_EXTENSION_CLIENT_ID_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly"
  ]
}
```

### Step 3: Reload Extension

1. Go to `chrome://extensions/`
2. Click the reload icon on AuraFlow extension
3. Click the extension icon
4. Click "Connect Google Calendar"
5. Should work now!

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"

**Problem:** The redirect URI in your `.env` doesn't match Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Check "Authorized redirect URIs"
4. Make sure it has: `http://localhost:3000/api/auth/google/callback`
5. If not, add it and save
6. Update your `.env` file to match exactly

### "Error 403: access_denied"

**Problem:** Your email isn't added as a test user.

**Solution:**
1. Go to Google Cloud Console → OAuth consent screen
2. Scroll to "Test users"
3. Click "Add Users"
4. Add: ks7585@g.rit.edu
5. Save

### "This app isn't verified"

**Problem:** Your app is in testing mode.

**Solution:**
1. This is normal for development
2. Click "Advanced"
3. Click "Go to AuraFlow (unsafe)"
4. This is safe because it's your own app

### Still getting "invalid_request"?

**Check these:**
1. Client ID and Secret are correct in `.env`
2. Redirect URI matches exactly (no trailing slash)
3. Backend is restarted after changing `.env`
4. Google Calendar API is enabled
5. Your email is added as test user

---

## Quick Checklist

Before testing authentication:

- [ ] Created Google Cloud project
- [ ] Enabled Google Calendar API
- [ ] Configured OAuth consent screen
- [ ] Added your email as test user
- [ ] Created OAuth credentials (Web application)
- [ ] Copied Client ID and Secret
- [ ] Updated `.env` file with real credentials
- [ ] Restarted backend server
- [ ] Redirect URI matches exactly

---

## Security Notes

### For Development
- ✅ Use `http://localhost` (this is safe for testing)
- ✅ Keep credentials in `.env` file
- ✅ Add `.env` to `.gitignore`

### For Production
- 🔒 Use HTTPS only
- 🔒 Use environment variables (not `.env` file)
- 🔒 Publish OAuth consent screen
- 🔒 Remove test users
- 🔒 Use production redirect URI

---

## Example .env File

Here's what your `.env` should look like with real credentials:

```bash
PORT=3000
NODE_ENV=development

# Get these from Google Cloud Console
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz789def456ghi789
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Generate random strings for these
SESSION_SECRET=your_random_session_secret_here_make_it_long
ENCRYPTION_KEY=your_32_character_encryption_key_here_exactly_32_chars
```

### Generate Random Secrets

```bash
# For SESSION_SECRET (any length)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For ENCRYPTION_KEY (must be exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Next Steps

1. **Follow Step 1-9 above** to get real Google OAuth credentials
2. **Update your `.env` file** with the real credentials
3. **Restart the backend:** `npm start`
4. **Test authentication** in the webapp
5. **Set up extension OAuth** (Steps for Chrome Extension)
6. **Test extension authentication**

---

## Need Help?

If you're still stuck:

1. **Check Google Cloud Console:**
   - Is Calendar API enabled?
   - Is your email added as test user?
   - Do redirect URIs match exactly?

2. **Check your `.env` file:**
   - Are credentials real (not "test_client_secret")?
   - Is redirect URI correct?
   - No extra spaces or quotes?

3. **Check backend logs:**
   - Look at Terminal 1 for error messages
   - Should show the OAuth URL being generated

4. **Try in incognito mode:**
   - Sometimes browser cache causes issues
   - Open `http://localhost:5000` in incognito

---

**Ready to set up OAuth?** Start with Step 1! 🚀

https://console.cloud.google.com/
