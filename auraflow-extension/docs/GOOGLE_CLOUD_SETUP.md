# Google Cloud Console Setup Guide

Complete guide for configuring Google Cloud Console and OAuth credentials for the AuraFlow Calendar Extension.

## Overview

The AuraFlow Calendar Extension requires OAuth 2.0 credentials from Google Cloud Console to access Google Calendar API. This guide walks you through the complete setup process.

## Prerequisites

- Google account
- Chrome browser with extension loaded
- Basic understanding of OAuth 2.0 (helpful but not required)

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. **Navigate to Google Cloud Console**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top of the page
   - Click "New Project"
   - Enter project details:
     - **Project name:** `AuraFlow Calendar Extension` (or your preferred name)
     - **Organization:** Leave as default (No organization)
     - **Location:** Leave as default
   - Click "Create"
   - Wait for the project to be created (usually takes a few seconds)

3. **Select Your Project**
   - Once created, make sure your new project is selected in the project dropdown
   - The project name should appear at the top of the console

### Step 2: Enable Google Calendar API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   - Or use the search bar to find "API Library"

2. **Search for Google Calendar API**
   - In the API Library search box, type "Google Calendar API"
   - Click on "Google Calendar API" from the results

3. **Enable the API**
   - Click the blue "Enable" button
   - Wait for the API to be enabled (usually instant)
   - You'll be redirected to the API dashboard

### Step 3: Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen.

1. **Navigate to OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Or click "OAuth consent screen" in the left sidebar

2. **Choose User Type**
   - Select "External" (allows any Google account to use your extension)
   - Click "Create"

3. **Fill in App Information**
   
   **OAuth consent screen (Page 1):**
   - **App name:** `AuraFlow Calendar Extension`
   - **User support email:** Your email address (select from dropdown)
   - **App logo:** (Optional) Upload a logo if you have one
   - **Application home page:** (Optional) Leave blank for now
   - **Application privacy policy link:** (Optional) Leave blank for development
   - **Application terms of service link:** (Optional) Leave blank for development
   - **Authorized domains:** Leave blank for Chrome extensions
   - **Developer contact information:** Your email address
   - Click "Save and Continue"

4. **Configure Scopes (Page 2)**
   - Click "Add or Remove Scopes"
   - In the filter box, search for "calendar"
   - Find and select: `https://www.googleapis.com/auth/calendar.readonly`
     - This scope allows read-only access to calendar events
   - Click "Update" at the bottom
   - Verify the scope appears in the list
   - Click "Save and Continue"

5. **Add Test Users (Page 3)**
   - Click "Add Users"
   - Enter your Google email address (the one you'll use for testing)
   - Add any other email addresses that need to test the extension
   - Click "Add"
   - Click "Save and Continue"

6. **Review Summary (Page 4)**
   - Review all the information
   - Click "Back to Dashboard"

### Step 4: Create OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Or click "Credentials" in the left sidebar

2. **Create OAuth Client ID**
   - Click "Create Credentials" at the top
   - Select "OAuth client ID" from the dropdown

3. **Configure OAuth Client**
   - **Application type:** Select "Web application"
   - **Name:** `AuraFlow Calendar Extension` (or your preferred name)
   
4. **Add Authorized Redirect URIs**
   - Under "Authorized redirect URIs", click "Add URI"
   - Enter: `https://<EXTENSION_ID>.chromiumapp.org/`
   - **Important:** You'll need to get your extension ID first (see next section)
   - For now, you can use a placeholder and update it later

5. **Create the Client**
   - Click "Create"
   - A dialog will appear with your credentials

6. **Save Your Credentials**
   - **Client ID:** Copy this - you'll need it for the extension
   - **Client Secret:** Not needed for Chrome extensions
   - Click "OK" to close the dialog

### Step 5: Get Your Extension ID

1. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `auraflow-extension` folder
   - The extension will appear in the list

2. **Copy Extension ID**
   - Find your extension in the list
   - Look for the "ID" field below the extension name
   - Copy the entire ID (it's a long string of letters)
   - Example: `abcdefghijklmnopqrstuvwxyz123456`

### Step 6: Update OAuth Redirect URI

1. **Return to Google Cloud Console**
   - Go back to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID in the list
   - Click the edit icon (pencil) next to it

2. **Update Redirect URI**
   - Under "Authorized redirect URIs", update the placeholder
   - Replace `<EXTENSION_ID>` with your actual extension ID
   - Final format: `https://YOUR_ACTUAL_EXTENSION_ID.chromiumapp.org/`
   - Example: `https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/`
   - Click "Save"

### Step 7: Configure the Extension

1. **Open manifest.json**
   - Navigate to your extension folder
   - Open `manifest.json` in a text editor

2. **Update Client ID**
   - Find the `oauth2` section
   - Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
   - Example:
   ```json
   "oauth2": {
     "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
   }
   ```

3. **Save the File**
   - Save `manifest.json`
   - Go back to `chrome://extensions/`
   - Click the refresh icon on your extension to reload it

### Step 8: Test the Extension

1. **Open the Extension**
   - Click the extension icon in Chrome toolbar
   - The popup should open

2. **Authenticate**
   - Click "Connect Google Calendar"
   - You should see the Google OAuth consent screen
   - Select your Google account
   - Review the permissions (read-only calendar access)
   - Click "Allow" or "Continue"

3. **Verify Success**
   - You should be redirected back to the extension
   - Your calendar events should load and display
   - If you see events, setup is complete!

## Troubleshooting

### "OAuth client ID not configured" Error

**Problem:** The extension shows this error when clicking "Connect Google Calendar"

**Solution:**
- Verify you replaced `YOUR_GOOGLE_CLIENT_ID_HERE` in `manifest.json`
- Make sure you saved the file
- Reload the extension in `chrome://extensions/`

### "Redirect URI mismatch" Error

**Problem:** OAuth flow fails with redirect URI error

**Solution:**
- Verify the redirect URI in Google Cloud Console matches your extension ID exactly
- Format must be: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
- No trailing slashes or extra characters
- Extension ID is case-sensitive

### "Access denied" or "Calendar access denied" Error

**Problem:** Can't access calendar after authentication

**Solution:**
- Verify Google Calendar API is enabled in your project
- Check that the scope `calendar.readonly` is added in OAuth consent screen
- Make sure your email is added as a test user
- Try revoking access and re-authenticating

### Extension ID Changes

**Problem:** Extension ID changes when you reload the extension

**Solution:**
- This is normal in development mode
- Option 1: Update the redirect URI each time
- Option 2: Add a `key` field to `manifest.json` for consistent ID:
  ```json
  "key": "YOUR_PUBLIC_KEY_HERE"
  ```
- To generate a key, use Chrome's extension packer or keep the same unpacked folder

### "This app isn't verified" Warning

**Problem:** Google shows a warning that the app isn't verified

**Solution:**
- This is normal for development/testing
- Click "Advanced" → "Go to [App Name] (unsafe)"
- For production, you would need to verify your app with Google
- For personal use, you can continue with the warning

### Can't Find Calendar Events

**Problem:** Extension authenticates but shows no events

**Solution:**
- Verify you have events in your Google Calendar for today
- Check that the calendar is not empty
- Try creating a test event for today
- Check browser console for API errors

## Security Best Practices

### For Development

- Use a test Google account, not your primary account
- Only add necessary test users to the OAuth consent screen
- Keep your Client ID private (don't commit to public repositories)
- Regularly review authorized applications in your Google account

### For Production

- Complete Google's app verification process
- Implement proper error handling and logging
- Use environment variables for sensitive configuration
- Regularly rotate credentials
- Monitor API usage and quotas
- Implement rate limiting

## API Quotas and Limits

### Free Tier Limits

- **Queries per day:** 1,000,000
- **Queries per 100 seconds per user:** 1,000
- **Queries per 100 seconds:** 10,000

### Monitoring Usage

1. Go to "APIs & Services" → "Dashboard"
2. Click on "Google Calendar API"
3. View usage metrics and quotas
4. Set up alerts for quota limits

### Staying Within Limits

- Cache calendar events when possible
- Implement exponential backoff for retries
- Don't poll the API continuously
- Only fetch events when user opens popup

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/tut_oauth/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Chrome Extension Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review the service worker console in `chrome://extensions/`
3. Verify all steps were completed correctly
4. Check Google Cloud Console for API errors
5. Review the extension's error logs

## Checklist

Use this checklist to verify your setup:

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added
- [ ] OAuth 2.0 credentials created
- [ ] Extension ID obtained
- [ ] Redirect URI updated with extension ID
- [ ] Client ID added to manifest.json
- [ ] Extension reloaded in Chrome
- [ ] Authentication tested successfully
- [ ] Calendar events display correctly

Once all items are checked, your setup is complete!
