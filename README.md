# AuraFlow - Mindful Flow Assistant

A complete productivity system combining AI-powered scheduling with a Chrome extension for calendar management and focus sessions.

## 🎯 Project Overview

AuraFlow is a two-part application designed for the Battle of the Bots hackathon:

1. **Backend AI Service** - Node.js/Express API providing intelligent scheduling, ritual generation, and session summaries
2. **Chrome Extension** - Calendar viewer with AI-powered features for optimal focus time suggestions and personalized work rituals

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│              (Calendar + AI Features)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend AI Service (Node.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Scheduling  │  │    Ritual    │  │   Summary    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Calendar API (OAuth 2.0)                 │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Backend AI Services

- **Smart Scheduling Assistant** - Analyzes calendar events to suggest optimal 75-90 minute focus windows
- **Personalized Ritual Generation** - Creates custom work/break patterns based on task type and calendar density
- **Intelligent Session Summaries** - Generates compassionate summaries of completed focus sessions

### Chrome Extension

- **Google Calendar Integration** - OAuth 2.0 authentication with read-only calendar access
- **Today's Events Display** - Clean, chronological view of your daily schedule
- **AI-Powered Features**:
  - 🎯 Find Focus Time - Get AI suggestions for optimal work blocks
  - ✨ Generate Ritual - Receive personalized work/break patterns
- **Responsive UI** - Dark mode support and accessibility features

## 📁 Project Structure

```
battle-of-the-bots/
├── .kiro/                          # Kiro AI specs and documentation
│   └── specs/
│       ├── auraflow-ai-integration/    # Backend AI integration spec
│       └── auraflow-focus-session/     # Focus session feature spec
├── auraflow-extension/             # Chrome Extension
│   ├── manifest.json               # Extension configuration
│   ├── popup.html                  # Popup UI
│   ├── popup.js                    # Popup logic
│   ├── popup.css                   # Styles
│   ├── background.js               # Service worker
│   ├── icons/                      # Extension icons
│   ├── docs/                       # Extension documentation
│   └── tests/                      # Unit tests
├── battle-of-the-bots/             # Backend API
│   ├── src/
│   │   ├── routes/                 # API endpoints
│   │   ├── services/               # Business logic
│   │   ├── middleware/             # Validation & error handling
│   │   └── utils/                  # Helper functions
│   ├── .env                        # Environment variables (not in git)
│   ├── .env.example                # Environment template
│   └── package.json                # Dependencies
├── AuraFlowSpecs.md                # Product specification
├── END_TO_END_TESTING_GUIDE.txt    # Complete testing guide
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Chrome browser
- Google account with Calendar API access
- Google Cloud Console project with OAuth credentials

### 1. Backend Setup

```bash
# Navigate to backend directory
cd battle-of-the-bots

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Start the server
npm start
```

The backend will run on `http://localhost:3000`

### 2. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `auraflow-extension` directory
5. The extension icon will appear in your toolbar

### 3. Google Cloud Configuration

Follow the detailed guide in `auraflow-extension/docs/GOOGLE_CLOUD_SETUP.md` to:
- Create a Google Cloud project
- Enable Google Calendar API
- Configure OAuth consent screen
- Create OAuth 2.0 credentials
- Add your extension ID to authorized redirect URIs

## 📖 API Documentation

### Backend Endpoints

#### POST /api/schedule/suggest
Suggests optimal focus window based on calendar events.

**Request:**
```json
{
  "calendarEvents": [
    {
      "id": "event1",
      "startTime": "2025-10-02T14:00:00Z",
      "endTime": "2025-10-02T15:00:00Z",
      "title": "Team Meeting"
    }
  ],
  "userPreferences": {
    "preferredTime": "morning",
    "minimumDuration": 75,
    "bufferTime": 15
  }
}
```

**Response:**
```json
{
  "startTime": "2025-10-02T14:00:00Z",
  "endTime": "2025-10-02T15:30:00Z",
  "duration": 90,
  "score": 96,
  "reasoning": "This 90-minute slot aligns with your morning preference..."
}
```

#### POST /api/ritual/generate
Generates personalized work ritual based on context.

**Request:**
```json
{
  "context": {
    "calendarEventTitle": "Write documentation",
    "timeOfDay": "morning",
    "calendarDensity": "moderate"
  }
}
```

**Response:**
```json
{
  "name": "Creative Deep Work",
  "workDuration": 50,
  "breakDuration": 10,
  "mindfulnessBreaks": true,
  "description": "Ideal for complex, creative work requiring sustained focus",
  "suggestedSoundscape": "nature"
}
```

#### POST /api/session/summary
Creates compassionate summary of completed session.

**Request:**
```json
{
  "sessionData": {
    "taskGoal": "Complete project documentation",
    "duration": 90,
    "completedAt": "2025-10-02T16:30:00Z",
    "distractionCount": 2
  }
}
```

**Response:**
```json
"You dedicated 90 minutes to 'Complete project documentation'. That's a great step forward."
```

## 🧪 Testing

### Backend Tests

```bash
cd battle-of-the-bots
npm test
```

### Extension Tests

1. Open `auraflow-extension/tests/unit-tests.html` in Chrome
2. Click "Run All Tests"
3. Review results

### End-to-End Testing

Follow the comprehensive guide in `END_TO_END_TESTING_GUIDE.txt` for complete system verification.

## 🔧 Development

### Backend Development

```bash
# Watch mode (if configured)
npm run dev

# Run specific tests
npm test -- scheduling.service.test.js

# Check for errors
npm run lint
```

### Extension Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click reload icon on AuraFlow Calendar
4. Test changes by clicking extension icon

**Debugging:**
- Popup: Right-click extension icon → "Inspect popup"
- Service Worker: `chrome://extensions/` → Click "service worker" link
- Storage: Check `chrome.storage.local` in console

## 📚 Documentation

- **Product Spec**: `AuraFlowSpecs.md` - Complete product vision and features
- **Backend Spec**: `.kiro/specs/auraflow-ai-integration/` - Backend requirements, design, and tasks
- **Focus Session Spec**: `.kiro/specs/auraflow-focus-session/` - Future feature specification
- **Extension Docs**: `auraflow-extension/docs/` - Setup guides and testing documentation
- **Testing Guide**: `END_TO_END_TESTING_GUIDE.txt` - Complete testing procedures

## 🎨 Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Authentication**: OAuth 2.0 (Google APIs)
- **Validation**: express-validator
- **Security**: helmet, bcrypt
- **Testing**: Jest

### Chrome Extension
- **Manifest**: V3
- **APIs**: Chrome Identity, Storage, Notifications
- **UI**: Vanilla JavaScript, CSS3
- **Testing**: Custom test runner

## 🔐 Security

- OAuth 2.0 for Google Calendar access
- Secure token storage with encryption
- Environment variables for sensitive data
- CORS configuration for extension origins
- Input validation on all API endpoints
- XSS protection with HTML escaping

## 🤝 Contributing

This project was developed for the Battle of the Bots hackathon. Key contributors:

- **Backend AI Services**: Karthik Sivarama Krishnan (ks7585@g.rit.edu)
- **Chrome Extension**: Team collaboration
- **Integration**: Full team effort

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Built for the Battle of the Bots hackathon
- Uses Google Calendar API v3
- Follows Chrome Extension Manifest V3 best practices
- Implements WCAG accessibility standards

## 📞 Support

For issues or questions:
1. Check the documentation in `auraflow-extension/docs/`
2. Review `END_TO_END_TESTING_GUIDE.txt`
3. Check browser console for errors
4. Review service worker logs in `chrome://extensions/`

## 🚧 Future Enhancements

See `.kiro/specs/auraflow-focus-session/` for planned features:
- Interactive focus session timer
- Ambient soundscape engine
- Gentle nudges and affirmations
- Session state persistence
- Ritual execution interface

---

**Made with ❤️ for the Battle of the Bots hackathon**
