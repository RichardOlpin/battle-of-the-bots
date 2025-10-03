# Where to Find Your Google Client Secret

## Quick Answer

**URL:** https://console.cloud.google.com/apis/credentials

**Your Client ID:** `369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn.apps.googleusercontent.com`

---

## Step-by-Step with Screenshots Description

### Step 1: Open Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### Step 2: Find Your OAuth Client

You'll see a page titled "Credentials"

Look for a table with columns:
- Name
- Type
- Client ID
- Created

Find the row where:
- **Type:** OAuth 2.0 Client ID
- **Client ID:** 369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn

### Step 3: Click on the Client Name

Click on the name in that row (probably "Web client 1" or "AuraFlow" or similar)

### Step 4: View Client Secret

A panel will open on the right side showing:

```
┌─────────────────────────────────────┐
│ Edit OAuth client                   │
├─────────────────────────────────────┤
│ Name: [Your client name]            │
│                                     │
│ Client ID:                          │
│ 369028620284-5ln73vr959uiiuccov... │
│ [Copy icon]                         │
│                                     │
│ Client secret:                      │
│ GOCSPX-abc123xyz789...             │
│ [Copy icon] [Show/Hide icon]       │
│                                     │
│ Creation date: ...                  │
│                                     │
│ Authorized JavaScript origins:      │
│ ...                                 │
│                                     │
│ Authorized redirect URIs:           │
│ ...                                 │
└─────────────────────────────────────┘
```

### Step 5: Copy the Client Secret

1. Find the "Client secret" field
2. Click the **copy icon** (📋) next to it
3. The secret is now in your clipboard!

It looks like: `GOCSPX-` followed by random characters

---

## What to Do Next

### 1. Open Your .env File

```bash
# On Mac/Linux:
nano battle-of-the-bots/.env

# Or use any text editor:
code battle-of-the-bots/.env
```

### 2. Find This Line

```bash
GOOGLE_CLIENT_SECRET=test_client_secret
```

### 3. Replace with Your Real Secret

```bash
GOOGLE_CLIENT_SECRET=GOCSPX-paste_what_you_copied_here
```

**Example (with fake secret):**
```bash
GOOGLE_CLIENT_SECRET=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12
```

### 4. Save the File

- In nano: Press `Ctrl+X`, then `Y`, then `Enter`
- In VS Code: Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)

### 5. Restart Backend

```bash
# In Terminal 1 (where backend is running):
# Press Ctrl+C to stop

# Then restart:
cd battle-of-the-bots
npm start
```

---

## If You Can't Find the Client

### Option A: The Client Doesn't Exist Yet

If you don't see any OAuth 2.0 Client ID in the credentials page:

**Create a new one:**

1. Click "Create Credentials" button (top of page)
2. Select "OAuth client ID"
3. Choose "Web application"
4. Fill in:
   - **Name:** AuraFlow Web App
   - **Authorized JavaScript origins:**
     - Click "Add URI"
     - Enter: `http://localhost:3000`
     - Click "Add URI" again
     - Enter: `http://localhost:5000`
   - **Authorized redirect URIs:**
     - Click "Add URI"
     - Enter: `http://localhost:3000/api/auth/google/callback`
5. Click "Create"
6. **Copy both** Client ID and Client Secret
7. Update your `.env` file with both

### Option B: Wrong Project Selected

Make sure you're in the right Google Cloud project:

1. Look at the top of the page
2. You'll see the project name in a dropdown
3. Click it to see all your projects
4. Select the project where you created the OAuth client

---

## Troubleshooting

### "I see the Client ID but no Client Secret field"

**Solution:** Click on the client name to open the details panel. The secret is in the panel, not in the table.

### "The Client Secret is hidden (shows dots)"

**Solution:** Click the "Show" icon (👁️) next to the secret to reveal it, then copy.

### "I accidentally regenerated the secret"

**Solution:** That's okay! Just copy the new secret and update your `.env` file. The old secret won't work anymore.

### "I don't have access to Google Cloud Console"

**Solution:** You need to:
1. Create a Google Cloud account (free)
2. Create a new project
3. Follow the full setup guide in `GOOGLE_OAUTH_SETUP.md`

---

## Security Note

**⚠️ Keep your Client Secret private!**

- ✅ Store in `.env` file (which is in `.gitignore`)
- ❌ Don't commit to Git
- ❌ Don't share publicly
- ❌ Don't post in screenshots

If you accidentally expose it:
1. Go to Google Cloud Console
2. Click on your OAuth client
3. Click "Reset secret"
4. Copy the new secret
5. Update your `.env` file

---

## Quick Reference

**What you need:**
- Client ID: `369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn.apps.googleusercontent.com` ✅ (you have this)
- Client Secret: `GOCSPX-...` ❌ (you need to get this)

**Where to get it:**
- URL: https://console.cloud.google.com/apis/credentials
- Click on your OAuth client
- Copy the "Client secret" field

**Where to put it:**
- File: `battle-of-the-bots/.env`
- Line: `GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here`

**Then:**
- Restart backend: `npm start`
- Test: `http://localhost:5000`

---

## Visual Checklist

```
┌─────────────────────────────────────────────┐
│ Google Cloud Console                        │
│ https://console.cloud.google.com            │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ APIs & Services → Credentials               │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Find OAuth 2.0 Client ID                    │
│ Client ID: 369028620284-5ln73vr959...       │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Click on client name                        │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Panel opens on right                        │
│ Shows: Client secret: GOCSPX-...            │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Click copy icon 📋                          │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Paste in .env file                          │
│ GOOGLE_CLIENT_SECRET=GOCSPX-...             │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Restart backend: npm start                  │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ ✅ OAuth should work now!                   │
└─────────────────────────────────────────────┘
```

---

**Ready?** Go to: https://console.cloud.google.com/apis/credentials

Find your client, copy the secret, paste in `.env`, restart backend, done! 🚀
