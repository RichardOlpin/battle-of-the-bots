// AuraFlow Extension Configuration
// Copy this file to config.js and fill in your actual credentials
// NEVER commit config.js to version control!

const CONFIG = {
    slack: {
        // Get these from https://api.slack.com/apps
        CLIENT_ID: 'YOUR_SLACK_CLIENT_ID',
        CLIENT_SECRET: 'YOUR_SLACK_CLIENT_SECRET'
    }
};

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
