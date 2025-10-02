# Installation and Setup Guide

Complete guide for installing and setting up the AuraFlow Calendar Extension.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Verification](#verification)
5. [First Use](#first-use)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing the extension, ensure you have:

- [ ] **Chrome Browser** (version 88 or later)
  - Check version: `chrome://version/`
  - Update if needed: `chrome://settings/help`

- [ ] **Google Account** with Google Calendar
  - Sign in at [calendar.google.com](https://calendar.google.com)
  - Verify you can access your calendar

- [ ] **Extension Files** downloaded or cloned
  - All files in `auraflow-extension/` folder
  - Verify `manifest.json` exists

## Installation Steps

### Step 1: Enable Developer Mode

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Look for "Developer mode" toggle in the top right corner
4. Click to enable it (toggle should turn blue)

### Step 2: Load the Extension

1. On the extensions page, click **"Load unpacked"** button
2. Navigate to the `auraflow-extension` folder
3. Select the folder (not individual files)
4. Click **"Select"** or **"Open"**

### Step 3: Verify Installation

After loading, you should see:

- ✅ Extension card appears in the extensions list
- ✅ Extension name: "AuraFlow Calendar"
- ✅ Version: 1.0.0
- ✅ Status: "Enabled" (toggle is blue)
- ✅ No error messages or warnings

### Step 4: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "AuraFlow Calendar" in the list
3. Click the pin icon next to it
4. Extension icon will appear in toolbar

## Configuration

### Google Cloud Console Setup

Before the extension can access your calendar, you need OAuth credentials:

1. **Follow the detailed setup guide**
   - See [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
   - This is a one-time setup process
   - Takes about 10-15 minutes

2. **Get your OAuth Client ID**
   - From Google Cloud Console
   - Format: `123456789-abc...xyz.apps.googleusercontent.com`

3. **Update manifest.json**
   - Open `auraflow-extension/manifest.json`
   - Find the `oauth2` section
   - Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
   - Save the file

4. **Reload the extension**
   - Go to `chrome://extensions/`
   - Find AuraFlow Calendar
   - Click the refresh icon (circular arrow)

### Configuration Checklist

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Extension ID obtained
- [ ] Redirect URI updated
- [ ] Client ID added to manifest.json
- [ ] Extension reloaded

## Verification

### Verify Extension Loaded

1. **Check Extensions Page**
   ```
   Navigate to: chrome://extensions/
   ```
   - Extension should be listed
   - No errors shown
   - Status is "Enabled"

2. **Check Extension Icon**
   - Icon appears in Chrome toolbar
   - Clicking icon opens popup
   - Popup displays correctly

3. **Check Service Worker**
   - On extensions page, find AuraFlow Calendar
   - Look for "service worker" link
   - Click it to open console
   - Should see: "AuraFlow service worker loaded"

### Verify Configuration

1. **Check manifest.json**
   ```javascript
   // Should contain your actual Client ID
   "oauth2": {
     "client_id": "123456789-abc...xyz.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
   }
   ```

2. **Check Google Cloud Console**
   - Calendar API is enabled
   - OAuth credentials exist
   - Redirect URI matches extension ID

### Test Basic Functionality

1. **Open Popup**
   - Click extension icon
   - Popup should open (320px wide)
   - Should show "Connect Google Calendar" button

2. **Test Authentication**
   - Click "Connect Google Calendar"
   - OAuth window should open
   - Should show Google sign-in

3. **Complete Authentication**
   - Sign in with Google account
   - Grant calendar permissions
   - Should return to extension
   - Events should load

## First Use

### Initial Authentication

1. **Click Extension Icon**
   - Popup opens with authentication screen
   - Shows "AuraFlow Calendar" heading
   - Shows "Connect Google Calendar" button

2. **Click "Connect Google Calendar"**
   - New window opens with Google OAuth
   - May need to select Google account
   - Shows permission request

3. **Grant Permissions**
   - Review requested permissions
   - Click "Allow" or "Continue"
   - Window closes automatically

4. **View Events**
   - Extension loads your events
   - Shows today's calendar events
   - Events are sorted chronologically

### What You Should See

**If you have events today:**
```
Today's Events - [Current Date]

Team Standup
9:00 AM - 9:30 AM

Project Review
2:00 PM - 3:00 PM

Client Call
4:30 PM - 5:30 PM
```

**If you have no events:**
```
Today's Events - [Current Date]

No events today
```

### Using the Extension

**Refresh Events:**
- Click the refresh button (↻) in the popup
- Events reload from Google Calendar

**Logout:**
- Click "Logout" button
- Returns to authentication screen
- Clears stored tokens

**Reconnect:**
- Click "Connect Google Calendar" again
- Complete OAuth flow
- Events load again

## Troubleshooting

### Extension Won't Load

**Symptom:** Error when loading extension

**Solutions:**
1. Check that all files are present
2. Verify `manifest.json` is valid JSON
3. Check Chrome console for errors
4. Try reloading the extension

### "OAuth client ID not configured"

**Symptom:** Error when clicking "Connect Google Calendar"

**Solutions:**
1. Verify you updated `manifest.json` with your Client ID
2. Check that Client ID format is correct
3. Ensure you saved the file
4. Reload the extension

### "Redirect URI mismatch"

**Symptom:** OAuth fails with redirect error

**Solutions:**
1. Get your extension ID from `chrome://extensions/`
2. Update redirect URI in Google Cloud Console
3. Format: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
4. Ensure no typos or extra characters

### "Calendar access denied"

**Symptom:** Can't access calendar after authentication

**Solutions:**
1. Verify Calendar API is enabled
2. Check OAuth consent screen has correct scope
3. Add your email as test user
4. Try revoking and re-granting access

### Extension ID Changes

**Symptom:** Extension ID changes when reloaded

**Solutions:**
1. This is normal in development mode
2. Update redirect URI with new ID
3. Or add a `key` field to manifest.json for consistent ID

### No Events Display

**Symptom:** Extension authenticates but shows no events

**Solutions:**
1. Check that you have events in Google Calendar for today
2. Verify calendar is not empty
3. Check browser console for errors
4. Try refreshing events

### Popup Won't Open

**Symptom:** Clicking icon doesn't open popup

**Solutions:**
1. Check that `popup.html` exists
2. Verify path in `manifest.json`
3. Check browser console for errors
4. Try reloading extension

## Verification Checklist

Use this checklist to verify successful installation:

### Installation
- [ ] Extension appears in `chrome://extensions/`
- [ ] No errors on extensions page
- [ ] Extension is enabled
- [ ] Extension icon in toolbar

### Configuration
- [ ] Google Cloud project set up
- [ ] Calendar API enabled
- [ ] OAuth credentials created
- [ ] Client ID in manifest.json
- [ ] Extension reloaded after config

### Functionality
- [ ] Popup opens when clicking icon
- [ ] "Connect Google Calendar" button works
- [ ] OAuth flow completes successfully
- [ ] Events load and display
- [ ] Refresh button works
- [ ] Logout button works

### Verification
- [ ] Service worker loads without errors
- [ ] No console errors in popup
- [ ] Events display correctly
- [ ] Times formatted properly
- [ ] Can reconnect after logout

## Next Steps

After successful installation:

1. **Explore Features**
   - Try refreshing events
   - Test logout and reconnect
   - Check different calendar scenarios

2. **Read Documentation**
   - [User Manual](MANUAL_TESTING_CHECKLIST.md)
   - [Developer Guide](DEVELOPER_GUIDE.md)
   - [Testing Guide](TESTING_GUIDE.md)

3. **Customize (Optional)**
   - Modify styling in `popup.css`
   - Adjust popup size
   - Change colors or fonts

4. **Report Issues**
   - Check console for errors
   - Review troubleshooting section
   - Document any problems found

## Support Resources

- **Setup Guide**: [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Chrome Extension Docs**: [developer.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions/)

## Security Notes

- Extension only requests read-only calendar access
- Tokens stored securely in Chrome storage
- No data sent to external servers
- OAuth follows Google's best practices
- All API calls use HTTPS

## Privacy

- Extension only accesses your calendar data
- No data is stored permanently
- No analytics or tracking
- No data shared with third parties
- You can revoke access anytime

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "AuraFlow Calendar"
3. Click "Remove"
4. Confirm removal

To revoke calendar access:

1. Go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Find "AuraFlow Calendar Extension"
3. Click "Remove Access"

## Conclusion

You should now have the AuraFlow Calendar Extension installed and configured. If you encounter any issues, refer to the troubleshooting section or check the detailed documentation.

Enjoy quick access to your calendar events!
