# Find Your OAuth Client (Not Service Account!)

## You're in the Wrong Place!

You're looking at **Service Accounts**, but you need **OAuth 2.0 Client IDs**.

---

## Quick Fix

### Direct Link to Credentials Page
```
https://console.cloud.google.com/apis/credentials?project=battle-of-the-bots
```

### What to Look For

On the credentials page, you'll see sections:

```
┌─────────────────────────────────────────────┐
│ Credentials                                 │
├─────────────────────────────────────────────┤
│                                             │
│ 🔑 API Keys                                 │
│ └─ (if you have any)                        │
│                                             │
│ 🔐 OAuth 2.0 Client IDs  ← LOOK HERE!      │
│ ├─ Name: Web client 1                       │
│ │  Type: Web application                    │
│ │  Client ID: 369028620284-5ln73vr959...   │
│ │  Created: Oct 2, 2025                     │
│ └─ [Click on this row!]                     │
│                                             │
│ 👤 Service Accounts  ← NOT HERE!            │
│ └─ 369028620284-compute@...                 │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Step-by-Step

### 1. Go to Credentials
```
https://console.cloud.google.com/apis/credentials
```

### 2. Scroll to "OAuth 2.0 Client IDs"

**Skip these sections:**
- ❌ API Keys
- ❌ Service Accounts (where you are now)

**Find this section:**
- ✅ OAuth 2.0 Client IDs

### 3. Find Your Client

Look for:
- **Type:** Web application
- **Client ID:** 369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn

### 4. Click on the Name

Click on the client name (first column), NOT the client ID.

### 5. Panel Opens

You'll see:
```
┌─────────────────────────────────────┐
│ Edit OAuth client                   │
├─────────────────────────────────────┤
│ Name: Web client 1                  │
│                                     │
│ Client ID:                          │
│ 369028620284-5ln73vr959uiiuccov... │
│ [📋 Copy]                           │
│                                     │
│ Client secret:                      │
│ GOCSPX-abc123xyz789...             │
│ [📋 Copy] [👁️ Show]                │
│                                     │
│ Authorized JavaScript origins:      │
│ http://localhost:3000               │
│ http://localhost:5000               │
│                                     │
│ Authorized redirect URIs:           │
│ http://localhost:3000/api/auth/... │
└─────────────────────────────────────┘
```

### 6. Copy Client Secret

Click the **📋 Copy** icon next to "Client secret"

---

## If You Don't See OAuth 2.0 Client IDs Section

### Option 1: Create New OAuth Client

1. Click "**+ CREATE CREDENTIALS**" button (top of page)
2. Select "**OAuth client ID**"
3. If prompted, configure consent screen first
4. Choose "**Web application**"
5. Fill in:
   - **Name:** AuraFlow Web App
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:5000`
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/google/callback`
6. Click "**Create**"
7. Copy both Client ID and Client Secret

### Option 2: Check Project

Make sure you're in the right project:
1. Look at top of page
2. Click project dropdown
3. Select "**battle-of-the-bots**" project

---

## Visual Guide

### Wrong Page (Service Account):
```
URL: .../iam-admin/serviceaccounts/details/...
Shows: Service account email, keys, permissions
❌ This is NOT what you need!
```

### Right Page (OAuth Client):
```
URL: .../apis/credentials
Shows: OAuth 2.0 Client IDs section
✅ This is what you need!
```

---

## What Each Credential Type Is For

### Service Account (What you're looking at)
- **Purpose:** Server-to-server authentication
- **Use case:** Backend services calling Google APIs
- **Has:** Email address, JSON key files
- **Example:** 369028620284-compute@developer.gserviceaccount.com

### OAuth 2.0 Client (What you need)
- **Purpose:** User authentication (Sign in with Google)
- **Use case:** Web apps where users log in
- **Has:** Client ID, Client Secret
- **Example:** 369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn

---

## Quick Checklist

- [ ] Go to: https://console.cloud.google.com/apis/credentials
- [ ] Find "OAuth 2.0 Client IDs" section (NOT Service Accounts)
- [ ] Click on client with ID: 369028620284-5ln73vr959uiiuccov304bpcfmnn8dsn
- [ ] Copy the "Client secret" field
- [ ] Paste in battle-of-the-bots/.env as GOOGLE_CLIENT_SECRET=
- [ ] Restart backend: npm start
- [ ] Test: http://localhost:5000

---

## Still Can't Find It?

### Try This Direct Link

Replace `YOUR_PROJECT_ID` with your actual project ID:
```
https://console.cloud.google.com/apis/credentials?project=YOUR_PROJECT_ID
```

Or just go to:
```
https://console.cloud.google.com/apis/credentials
```

And make sure:
1. You're in the "battle-of-the-bots" project (check top of page)
2. You're looking at the "Credentials" page (not IAM, not Service Accounts)
3. You're scrolling to the "OAuth 2.0 Client IDs" section

---

## Summary

**You need:**
- OAuth 2.0 Client ID (for user login)
- Client Secret that starts with GOCSPX-

**You're currently looking at:**
- Service Account (for server-to-server)
- This is the wrong type of credential

**Go to:**
- https://console.cloud.google.com/apis/credentials
- Find "OAuth 2.0 Client IDs" section
- Click on your client
- Copy the Client Secret

**Then:**
- Paste in .env file
- Restart backend
- Test authentication

---

**Need help?** Share a screenshot of the Credentials page and I can guide you better!
