# AuraFlow Calendar Extension - Documentation Index

Complete documentation for the AuraFlow Calendar Chrome Extension.

## Quick Links

- [Installation Guide](#installation-guide)
- [Setup Guide](#setup-guide)
- [User Documentation](#user-documentation)
- [Developer Documentation](#developer-documentation)
- [Testing Documentation](#testing-documentation)

## Documentation Overview

### For End Users

If you want to **install and use** the extension:

1. **[Installation Guide](INSTALLATION_GUIDE.md)** - Step-by-step installation instructions
2. **[Google Cloud Setup](GOOGLE_CLOUD_SETUP.md)** - Configure OAuth credentials
3. **[Manual Testing Checklist](MANUAL_TESTING_CHECKLIST.md)** - Feature walkthrough

### For Developers

If you want to **develop or modify** the extension:

1. **[Developer Guide](DEVELOPER_GUIDE.md)** - Architecture, API reference, development workflow
2. **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive testing documentation
3. **[Manual Testing Checklist](MANUAL_TESTING_CHECKLIST.md)** - Complete testing checklist

## Installation Guide

**File:** [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

**Contents:**
- Prerequisites
- Installation steps
- Configuration
- Verification
- First use
- Troubleshooting

**When to use:**
- First-time installation
- Setting up the extension
- Verifying installation
- Troubleshooting installation issues

## Setup Guide

**File:** [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)

**Contents:**
- Google Cloud Console setup
- OAuth 2.0 configuration
- API enablement
- Credential creation
- Extension configuration
- Troubleshooting

**When to use:**
- Configuring OAuth credentials
- Setting up Google Calendar API
- Resolving authentication issues
- Understanding OAuth flow

## User Documentation

### Manual Testing Checklist

**File:** [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

**Contents:**
- Feature walkthrough
- Testing all requirements
- Edge cases
- Accessibility testing
- Security testing

**When to use:**
- Learning extension features
- Verifying functionality
- Testing after changes
- Quality assurance

## Developer Documentation

### Developer Guide

**File:** [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

**Contents:**
- Architecture overview
- File structure
- Core components
- API reference
- Development workflow
- Debugging
- Common tasks
- Best practices

**When to use:**
- Understanding architecture
- Developing new features
- Debugging issues
- Learning codebase
- Contributing to project

### Testing Guide

**File:** [TESTING_GUIDE.md](TESTING_GUIDE.md)

**Contents:**
- Testing overview
- Unit tests
- Integration tests
- Manual testing
- End-to-end testing
- Test scenarios
- Automated testing

**When to use:**
- Writing tests
- Running test suites
- Understanding test coverage
- Setting up CI/CD
- Quality assurance

## Documentation by Task

### I want to install the extension

1. Read [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
2. Follow [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
3. Verify with [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

### I want to develop a new feature

1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Architecture section
2. Review [TESTING_GUIDE.md](TESTING_GUIDE.md) - Test requirements
3. Follow development workflow in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
4. Test with [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

### I want to fix a bug

1. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Debugging section
2. Review [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md) - Troubleshooting
3. Test fix with [TESTING_GUIDE.md](TESTING_GUIDE.md)

### I want to test the extension

1. Run unit tests (see [TESTING_GUIDE.md](TESTING_GUIDE.md))
2. Follow [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)
3. Review test scenarios in [TESTING_GUIDE.md](TESTING_GUIDE.md)

### I'm having authentication issues

1. Check [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md) - Troubleshooting
2. Review [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Troubleshooting
3. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Debugging

### I want to understand the code

1. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Architecture
2. Review [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Core Components
3. Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - API Reference

## Documentation by Role

### End User

**Primary Documents:**
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)

**Optional:**
- [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md) - Feature reference

### QA Tester

**Primary Documents:**
- [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)

**Optional:**
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Understanding architecture

### Developer

**Primary Documents:**
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [TESTING_GUIDE.md](TESTING_GUIDE.md)

**Reference:**
- [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)
- [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

### DevOps/CI Engineer

**Primary Documents:**
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Automated testing
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Build process

**Reference:**
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

## Quick Reference

### File Locations

```
auraflow-extension/
├── docs/
│   ├── INDEX.md                      # This file
│   ├── INSTALLATION_GUIDE.md         # Installation instructions
│   ├── GOOGLE_CLOUD_SETUP.md         # OAuth setup
│   ├── DEVELOPER_GUIDE.md            # Developer documentation
│   ├── TESTING_GUIDE.md              # Testing documentation
│   └── MANUAL_TESTING_CHECKLIST.md   # Testing checklist
├── tests/
│   ├── unit-tests.html               # Unit test runner
│   └── unit-tests.js                 # Unit tests
├── manifest.json                     # Extension config
├── popup.html                        # Popup UI
├── popup.css                         # Popup styling
├── popup.js                          # Popup logic
├── background.js                     # Service worker
└── README.md                         # Project overview
```

### Key Concepts

**Manifest V3**
- Chrome extension architecture
- Service workers instead of background pages
- Enhanced security and performance

**OAuth 2.0**
- Authentication protocol
- Secure access to Google Calendar
- Token-based authentication

**Service Worker**
- Background script
- Handles API requests
- Manages authentication

**Chrome Storage**
- Persistent data storage
- Secure token storage
- Cross-session persistence

### Common Commands

**Load Extension:**
```
chrome://extensions/ → Load unpacked
```

**Reload Extension:**
```
chrome://extensions/ → Click refresh icon
```

**View Popup Console:**
```
Right-click extension icon → Inspect popup
```

**View Service Worker Console:**
```
chrome://extensions/ → Click "service worker"
```

**View Storage:**
```javascript
chrome.storage.local.get(null, console.log)
```

### Common Issues

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Extension won't load | Check manifest.json | [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md#extension-wont-load) |
| OAuth fails | Check Client ID | [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md#oauth-client-id-not-configured-error) |
| No events display | Check API enabled | [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md#no-events-display) |
| Token expired | Re-authenticate | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#token-refresh-fails) |

## Documentation Standards

### Writing Style

- Clear and concise
- Step-by-step instructions
- Code examples included
- Screenshots where helpful
- Troubleshooting sections

### Document Structure

- Table of contents
- Clear headings
- Consistent formatting
- Cross-references
- Quick reference sections

### Code Examples

- Syntax highlighted
- Complete and runnable
- Well-commented
- Real-world scenarios

## Contributing to Documentation

### Adding New Documentation

1. Create file in `docs/` folder
2. Follow existing format
3. Add to this index
4. Cross-reference from related docs
5. Update README.md if needed

### Updating Existing Documentation

1. Make changes to relevant file
2. Update cross-references
3. Update this index if needed
4. Test all code examples
5. Verify links work

### Documentation Checklist

- [ ] Clear title and purpose
- [ ] Table of contents
- [ ] Step-by-step instructions
- [ ] Code examples tested
- [ ] Screenshots included (if needed)
- [ ] Troubleshooting section
- [ ] Cross-references added
- [ ] Added to this index
- [ ] Spelling and grammar checked

## Version History

### v1.0.0 - Initial Documentation

- Installation guide
- Google Cloud setup guide
- Developer guide
- Testing guide
- Manual testing checklist
- Documentation index

## Feedback

If you find issues with documentation:

1. Check if issue is already documented
2. Review related documentation
3. Check code comments
4. Submit feedback or issue

## Additional Resources

### External Documentation

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/)
- [JSON Formatter](https://chrome.google.com/webstore/detail/json-formatter/)

### Community

- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-chrome-extension)
- [Chrome Extension Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)

## Summary

This documentation provides comprehensive coverage of:

✅ Installation and setup
✅ OAuth configuration
✅ Development workflow
✅ Testing procedures
✅ Troubleshooting
✅ Best practices
✅ API reference
✅ Architecture details

Choose the appropriate document based on your role and task, and refer to this index for navigation.

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
