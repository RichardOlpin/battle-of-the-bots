# AuraFlow Calendar Chrome Extension

A Chrome extension that provides quick access to today's Google Calendar events. View your daily schedule at a glance without leaving your browser.

## Features

- 🔐 **Secure OAuth Authentication** - Connect safely to your Google Calendar
- 📅 **Today's Events** - See all your events for today in one place
- ⚡ **Fast & Lightweight** - Minimal resource usage, instant access
- 🔄 **Auto-Refresh** - Keep your schedule up to date
- 🎨 **Clean UI** - Simple, intuitive interface
- ♿ **Accessible** - Full keyboard navigation and screen reader support

## Quick Start

### 1. Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `auraflow-extension` directory

### 2. Configuration

Before using the extension, you need to set up Google OAuth credentials:

1. Follow the detailed setup guide: [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)
2. Get your OAuth Client ID from Google Cloud Console
3. Update `manifest.json` with your Client ID
4. Reload the extension

### 3. Usage

1. Click the extension icon in Chrome toolbar
2. Click "Connect Google Calendar"
3. Authorize the extension
4. View your today's events!

## Project Structure

```
auraflow-extension/
├── manifest.json              # Extension configuration
├── popup.html                 # Popup UI structure
├── popup.css                  # Popup styling
├── popup.js                   # Popup logic
├── background.js              # Service worker
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/                      # Documentation
│   ├── DEVELOPER_GUIDE.md            # Developer documentation
│   ├── GOOGLE_CLOUD_SETUP.md         # OAuth setup guide
│   ├── MANUAL_TESTING_CHECKLIST.md   # Testing checklist
│   └── TESTING_GUIDE.md              # Comprehensive testing guide
└── tests/                     # Test files
    ├── unit-tests.html        # Unit test runner
    └── unit-tests.js          # Unit test suite
```

## 📚 Documentation

### Quick Navigation

**For Users:**
1. [Installation Guide](docs/INSTALLATION_GUIDE.md) - Step-by-step installation
2. [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md) - OAuth configuration (required)
3. [Manual Testing Checklist](docs/MANUAL_TESTING_CHECKLIST.md) - Feature walkthrough

**For Developers:**
1. [Developer Guide](docs/DEVELOPER_GUIDE.md) - Architecture, API reference, workflows
2. [Testing Guide](docs/TESTING_GUIDE.md) - Comprehensive testing documentation
3. [Documentation Index](docs/INDEX.md) - Complete documentation navigation

**For QA/Testers:**
1. [Testing Guide](docs/TESTING_GUIDE.md) - Testing overview and procedures
2. [Manual Testing Checklist](docs/MANUAL_TESTING_CHECKLIST.md) - 143 test checkpoints
3. [Unit Tests](tests/unit-tests.html) - Automated test runner

### Documentation Files

| Document | Description | Audience |
|----------|-------------|----------|
| [INSTALLATION_GUIDE.md](docs/INSTALLATION_GUIDE.md) | Installation steps, verification, first use | Users |
| [GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md) | OAuth setup, API configuration, troubleshooting | Users, Developers |
| [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Architecture, API reference, development workflow | Developers |
| [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Unit tests, integration tests, E2E scenarios | Developers, QA |
| [MANUAL_TESTING_CHECKLIST.md](docs/MANUAL_TESTING_CHECKLIST.md) | 143 test checkpoints covering all requirements | QA, Users |
| [INDEX.md](docs/INDEX.md) | Complete documentation index and navigation | All |

### Testing Tools

| Tool | Description | Usage |
|------|-------------|-------|
| [unit-tests.html](tests/unit-tests.html) | Interactive unit test runner with 25+ tests | Open in Chrome browser |
| [debug-auth.html](tests/debug-auth.html) | OAuth debugging and diagnostics tool | Open in Chrome browser |

### Common Tasks

**Installing the Extension:**
1. Read [Installation Guide](docs/INSTALLATION_GUIDE.md)
2. Follow [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md)
3. Verify with [Manual Testing Checklist](docs/MANUAL_TESTING_CHECKLIST.md)

**Developing a Feature:**
1. Review [Developer Guide](docs/DEVELOPER_GUIDE.md) - Architecture section
2. Check [Testing Guide](docs/TESTING_GUIDE.md) - Test requirements
3. Follow development workflow
4. Test with [Manual Testing Checklist](docs/MANUAL_TESTING_CHECKLIST.md)

**Debugging Issues:**
1. Use [debug-auth.html](tests/debug-auth.html) - OAuth debugging tool
2. Check [Developer Guide](docs/DEVELOPER_GUIDE.md) - Debugging section
3. Review [Google Cloud Setup](docs/GOOGLE_CLOUD_SETUP.md) - Troubleshooting

**Running Tests:**
1. Open [unit-tests.html](tests/unit-tests.html) - Automated tests
2. Follow [Manual Testing Checklist](docs/MANUAL_TESTING_CHECKLIST.md) - Manual tests
3. Review [Testing Guide](docs/TESTING_GUIDE.md) - Test scenarios

## Development

### Prerequisites

- Chrome browser (latest version)
- Google account
- Google Cloud Console project with Calendar API enabled
- OAuth 2.0 credentials

### Development Workflow

1. **Make changes** to code files
2. **Reload extension** in `chrome://extensions/`
3. **Test changes** by clicking extension icon
4. **Debug** using Chrome DevTools

### Debugging

**Popup Console:**
```
Right-click extension icon → Inspect popup
```

**Service Worker Console:**
```
chrome://extensions/ → Click "service worker" link
```

**View Storage:**
```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

## Testing

### Unit Tests

1. Open `tests/unit-tests.html` in Chrome
2. Click "Run All Tests"
3. Review results

### Manual Testing

Follow the comprehensive checklist in [docs/MANUAL_TESTING_CHECKLIST.md](docs/MANUAL_TESTING_CHECKLIST.md)

### Test Coverage

- ✅ Authentication flow
- ✅ Event fetching and display
- ✅ Error handling
- ✅ Token management
- ✅ UI state management
- ✅ Accessibility

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Service Worker  │    │  Google Calendar│
│   (popup.js)    │◄──►│  (background.js) │◄──►│      API        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   popup.html    │    │  Chrome Storage  │
│   popup.css     │    │   (tokens)       │
└─────────────────┘    └──────────────────┘
```

### Key Components

- **Popup Interface** - User interaction and event display
- **Service Worker** - OAuth authentication and API requests
- **Chrome Storage** - Secure token persistence
- **Google Calendar API** - Event data source

## Features in Detail

### Authentication

- OAuth 2.0 flow using Chrome Identity API
- Secure token storage in Chrome's local storage
- Automatic token refresh
- Logout functionality

### Event Display

- Fetches today's events from primary calendar
- Chronological sorting (earliest to latest)
- Time formatting (12-hour with AM/PM)
- All-day event support
- Filters out cancelled events

### Error Handling

- User-friendly error messages
- Automatic retry for recoverable errors
- Network error detection
- Token expiration handling
- API rate limiting protection

### Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Screen reader support
- Focus management
- High contrast support

## Requirements Met

All requirements from the specification are implemented:

✅ **Requirement 1**: Extension installation and authentication
- Extension icon in toolbar
- OAuth authentication flow
- Secure token storage
- Error handling

✅ **Requirement 2**: Calendar events display
- Fetch and display today's events
- Show event title, start time, end time
- "No events today" message
- Chronological ordering

✅ **Requirement 3**: Authentication persistence
- Token persistence across sessions
- Automatic event loading
- Token expiration handling
- Logout functionality

## Security

- Minimum required permissions (calendar.readonly)
- Secure token storage
- No sensitive data in logs
- HTTPS for all API calls
- XSS protection (HTML escaping)
- OAuth best practices

## Performance

- Fast popup load time (<500ms)
- Efficient API usage
- Minimal memory footprint
- No background polling
- Optimized event rendering

## Browser Compatibility

- ✅ Chrome (latest)
- ✅ Chrome (previous version)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ✅ Other Chromium-based browsers

## Troubleshooting

### Common Issues

**"OAuth client ID not configured"**
- Update `manifest.json` with your Client ID
- Reload the extension

**"Redirect URI mismatch"**
- Verify redirect URI in Google Cloud Console matches extension ID
- Format: `https://YOUR_EXTENSION_ID.chromiumapp.org/`

**"Calendar access denied"**
- Enable Google Calendar API in Google Cloud Console
- Add your email as a test user
- Grant calendar permissions during OAuth

**Events don't load**
- Check service worker console for errors
- Verify token is valid
- Check network connectivity

See [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md) for detailed troubleshooting.

## API Usage

### Google Calendar API

- **Endpoint**: `https://www.googleapis.com/calendar/v3/calendars/primary/events`
- **Scope**: `calendar.readonly`
- **Rate Limit**: 1,000,000 queries/day (free tier)
- **Authentication**: OAuth 2.0 Bearer token

### Chrome Extension APIs

- `chrome.identity` - OAuth authentication
- `chrome.storage.local` - Token persistence
- `chrome.runtime` - Message passing

## Version History

### v1.0.0 (Current)

- ✅ OAuth authentication with Google Calendar
- ✅ Display today's calendar events
- ✅ Event sorting and filtering
- ✅ Token persistence and refresh
- ✅ Logout functionality
- ✅ Error handling and retry logic
- ✅ Responsive UI design
- ✅ Accessibility features
- ✅ Comprehensive documentation
- ✅ Unit tests

## Contributing

Contributions are welcome! Please:

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test thoroughly
5. Submit clear pull requests

See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for development guidelines.

## License

[Add your license here]

## Support

For issues or questions:

1. Check the [Developer Guide](docs/DEVELOPER_GUIDE.md)
2. Review [Troubleshooting](docs/GOOGLE_CLOUD_SETUP.md#troubleshooting)
3. Check browser console for errors
4. Review service worker logs

## Acknowledgments

- Built with Chrome Extension Manifest V3
- Uses Google Calendar API v3
- Follows Chrome extension best practices
- Implements WCAG accessibility standards

## Related Documentation

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

---

**Made with ❤️ for remote professionals**
