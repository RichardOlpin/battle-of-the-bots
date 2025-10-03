# AuraFlow Extension Setup

## Slack Integration Configuration

To use the Slack integration features, you need to configure your Slack app credentials.

### Steps:

1. **Create a Slack App** (if you haven't already):
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name your app (e.g., "AuraFlow") and select your workspace

2. **Configure OAuth Scopes**:
   - In your app settings, go to "OAuth & Permissions"
   - Under "User Token Scopes", add:
     - `users:write` - Set user status and presence
     - `users:read` - Read user information

3. **Get Your Credentials**:
   - In "Basic Information", find your:
     - Client ID
     - Client Secret

4. **Configure the Extension**:
   ```bash
   cd auraflow-extension
   cp config.example.js config.js
   ```

5. **Edit config.js** and add your credentials:
   ```javascript
   const CONFIG = {
       slack: {
           CLIENT_ID: 'your-actual-client-id',
           CLIENT_SECRET: 'your-actual-client-secret'
       }
   };
   ```

6. **Add Redirect URL**:
   - In your Slack app settings, go to "OAuth & Permissions"
   - Add the redirect URL: `https://<your-extension-id>.chromiumapp.org/slack`
   - You can find your extension ID in Chrome's extension management page

### Security Notes:

- **NEVER commit config.js to version control** - it's already in .gitignore
- The config.example.js file is safe to commit (it contains no real credentials)
- Keep your Client Secret secure and never share it publicly
- If your credentials are compromised, regenerate them in the Slack app settings

### Troubleshooting:

If you see "Slack OAuth client ID not configured" errors:
1. Make sure config.js exists in the auraflow-extension directory
2. Verify your credentials are correct
3. Check that config.js follows the correct format
4. Reload the extension in Chrome after making changes
