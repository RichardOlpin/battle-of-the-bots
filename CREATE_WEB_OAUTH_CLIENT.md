# Create Web Application OAuth Client

## You Need TWO OAuth Clients

### 1. Web Application (For Webapp) ← YOU NEED THIS NOW!
- Type: Web application
- For: http://localhost:5000 (webapp)
- Has: Client ID + Client Secret
- Used by: Backend server

### 2. Chrome Extension (For Extension) ← YOU'RE CREATING THIS
- Type: Chrome extension
- For: Chrome extension popup
- Has: Client ID only (no secret)
- Used by: Chrome extension

---

## Create Web Application OAuth Client

### Step 1: Go to Credentials
```
https://console.cloud.google.com/apis/credentials
```

### Step 2: Create New Credentials

1. Click "**+ CREATE CREDENTIALS**" (blue button at top)
2. Select "**OAuth client ID**"

### Step 3: Choose Application Type

**IMPORTANT:** Select "**Web application**"

```
┌─────────────────────────────────────┐
│ Create OAuth client ID              │
├─────────────────────────────────────┤
│ Application type:                   │
│                                     │
│ ○ Android                           │
│ ○ Chrome extension  ← NOT THIS!    │
│ ○ Desktop app                       │
│ ○ iOS                               │
│ ○ Universal Windows Platform (UWP) │
│ ● Web application   ← SELECT THIS! │
│ ○ TVs and Limited Input devices    │
└─────────────────────────────────────┘
```

### Step 4: Configure Web Application

**Name:**
```
AuraFlow Web App
```

**Authorized JavaScript origins:**

Click "**+ ADD URI**" and add these two:
```
http://localhost:3000
http://localhost:5000
```

**Authorized redirect URIs:**

Click "**+ ADD URI**" and add:
```
http://localhost:3000/api/auth/google/callback
```

**IMPORTANT:** Make sure the redirect URI is EXACTLY:
- ✅ `http://localhost:3000/api/auth/google/callback`
- ❌ NOT `http://localhost:3000/auth/google/callback` (missing /api)
- ❌ NOT `http://localhost:3000/api/auth/google/callback/` (extra slash)

### Step 5: Create

Click "**CREATE**" button at bottom

### Step 6: Copy Credentials

A popup appears with your credentials:

```
┌─────────────────────────────────────┐
│ OAuth client created                │
├─────────────────────────────────────┤
│ Your Client ID                      │
│ 123456789-abc123.apps.google...     │
│ [Copy]                              │
│                                     │
│ Your Client Secret                  │
│ GOCSPX-abc123xyz789...             │
│ [Copy]                              │
│                                     │
│ [OK]                                │
└─────────────────────────────────────┘
```

**Copy BOTH values!**

### Step 7: Update .env File

Open `battle-of-the-bots/.env` and update:

```bash
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Step 8: Restart Backend

```bash
# Stop backend (Ctrl+C in Terminal 1)
cd battle-of-the-bots
npm start
```

### Step 9: Test

```
http://localhost:5000
Click "Connect Google Calendar"
Should work now! ✅
```

---

## For Chrome Extension (Later)

After the webapp works, you can create the Chrome Extension OAuth client:

### Step 1: Load Extension First

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `auraflow-extension` folder
5. **Copy the Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### Step 2: Create Chrome Extension OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Select "**Chrome extension**"
4. **Name:** AuraFlow Extension
5. **Application ID:** Paste your extension ID
6. Click "CREATE"
7. Copy the Client ID

### Step 3: Update Extension Manifest

Open `auraflow-extension/manifest.json` and update:

```json
"oauth2": {
  "client_id": "YOUR_EXTENSION_CLIENT_ID_HERE.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly"
  ]
}
```

### Step 4: Reload Extension

1. Go to `chrome://extensions/`
2. Click reload icon on AuraFlow extension
3. Test authentication in extension

---

## Summary

### For Webapp (Do This First!)
```
Type: Web application
Client ID: Goes in .env
Client Secret: Goes in .env
Redirect URI: http://localhost:3000/api/auth/google/callback
```

### For Extension (Do This Later)
```
Type: Chrome extension
Client ID: Goes in manifest.json
Client Secret: Not needed
Application ID: Extension ID from chrome://extensions/
```

---

## Quick Checklist

**To fix webapp authentication:**

- [ ] Go to https://console.cloud.google.com/apis/credentials
- [ ] Click "+ CREATE CREDENTIALS"
- [ ] Select "OAuth client ID"
- [ ] Choose "**Web application**" (NOT Chrome extension!)
- [ ] Add JavaScript origins: localhost:3000 and localhost:5000
- [ ] Add redirect URI: http://localhost:3000/api/auth/google/callback
- [ ] Click "CREATE"
- [ ] Copy Client ID and Client Secret
- [ ] Paste both in battle-of-the-bots/.env
- [ ] Restart backend: npm start
- [ ] Test: http://localhost:5000

---

## Common Mistakes

### ❌ Wrong: Creating Chrome Extension client for webapp
```
Type: Chrome extension
→ This won't work for webapp!
```

### ✅ Correct: Creating Web application client for webapp
```
Type: Web application
→ This is what you need!
```

### ❌ Wrong: Using same client for both
```
One OAuth client for webapp and extension
→ They need separate clients!
```

### ✅ Correct: Two separate clients
```
1. Web application client → For webapp
2. Chrome extension client → For extension
```

---

## Visual Guide

```
Google Cloud Console
│
├─ OAuth Client #1: Web Application
│  ├─ For: Webapp (localhost:5000)
│  ├─ Has: Client ID + Client Secret
│  └─ Goes in: battle-of-the-bots/.env
│
└─ OAuth Client #2: Chrome Extension
   ├─ For: Chrome extension
   ├─ Has: Client ID only
   └─ Goes in: auraflow-extension/manifest.json
```

---

## Next Steps

1. **Create Web Application OAuth client** (follow steps above)
2. **Update .env file** with Client ID and Secret
3. **Restart backend**
4. **Test webapp authentication** - Should work! ✅
5. **Then** create Chrome Extension OAuth client
6. **Update manifest.json**
7. **Test extension authentication**

---

**Start here:** https://console.cloud.google.com/apis/credentials

Click "+ CREATE CREDENTIALS" → "OAuth client ID" → "**Web application**"
