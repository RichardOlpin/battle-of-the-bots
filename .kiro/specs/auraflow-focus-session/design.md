# Focus Session Experience Design

## Overview

The Focus Session Experience transforms the AuraFlow Chrome Extension from a calendar viewer with AI suggestions into a complete productivity tool. Users can execute AI-generated rituals with visual timers, ambient soundscapes, and compassionate notifications.

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  Popup UI      │◄───────►│  Background      │       │
│  │  (popup.js)    │ Message │  (background.js) │       │
│  │                │ Passing │                  │       │
│  │  - Timer Logic │         │  - Notifications │       │
│  │  - Audio       │         │  - State Mgmt    │       │
│  │  - UI Updates  │         │                  │       │
│  └────────────────┘         └──────────────────┘       │
│         │                            │                  │
│         ▼                            ▼                  │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │ Chrome Storage │         │ Chrome           │       │
│  │ (Session State)│         │ Notifications    │       │
│  └────────────────┘         └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Session Screen UI (popup.html)

**New HTML Structure:**

```html
<!-- Session State -->
<div id="session-screen" class="screen hidden">
    <div class="session-header">
        <h2 id="session-title">Creative Deep Work</h2>
        <button id="end-session-btn" class="icon-btn" aria-label="End session">✕</button>
    </div>
    
    <div class="timer-container">
        <div id="timer-display" class="timer-display">50:00</div>
        <p id="timer-phase" class="timer-phase">Work Time</p>
    </div>
    
    <div class="task-goal-container">
        <label>Current Goal:</label>
        <p id="current-task-goal">Complete project documentation</p>
    </div>
    
    <div class="session-controls">
        <button id="pause-resume-btn" class="session-btn">Pause</button>
    </div>
    
    <div class="soundscape-controls">
        <label for="soundscape-select">Soundscape:</label>
        <select id="soundscape-select">
            <option value="none">None</option>
            <option value="rain">Rain</option>
            <option value="cafe">Cafe Ambience</option>
        </select>
        <input type="range" id="volume-slider" min="0" max="100" value="50">
    </div>
</div>
```

### 2. Timer Logic (popup.js)

**Session State Object:**

```javascript
const sessionState = {
    isActive: false,
    isPaused: false,
    phase: 'work', // 'work' or 'break'
    timeRemaining: 0, // seconds
    ritual: null,
    taskGoal: '',
    intervalId: null
};
```

**Core Timer Functions:**

```javascript
function startSession(ritual, taskGoal) {
    // Initialize session state
    // Show session screen
    // Start timer countdown
    // Save state to chrome.storage
}

function updateTimer() {
    // Decrement timeRemaining
    // Update UI display
    // Check if phase complete
    // Save state periodically
}

function switchPhase() {
    // Toggle between work and break
    // Reset timer for new phase
    // Trigger notification
    // Update UI
}

function pauseSession() {
    // Stop interval
    // Update button text
    // Save state
}

function resumeSession() {
    // Restart interval
    // Update button text
}

function endSession() {
    // Stop timer
    // Stop audio
    // Clear state
    // Return to events screen
}
```

### 3. Audio Engine (popup.js)

**Audio Management:**

```javascript
const audioEngine = {
    currentAudio: null,
    soundscapes: {
        rain: 'sounds/rain.mp3',
        cafe: 'sounds/cafe.mp3'
    },
    
    play(soundscape) {
        this.stop();
        if (soundscape === 'none') return;
        
        this.currentAudio = new Audio(this.soundscapes[soundscape]);
        this.currentAudio.loop = true;
        this.currentAudio.volume = 0.5;
        this.currentAudio.play();
    },
    
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    },
    
    setVolume(volume) {
        if (this.currentAudio) {
            this.currentAudio.volume = volume / 100;
        }
    }
};
```

### 4. Notification System (background.js)

**Affirmation Library:**

```javascript
const AFFIRMATIONS = [
    "A short break is a productive break.",
    "You're making steady progress. Keep it up.",
    "Rest is part of the work.",
    "Every focused minute counts.",
    "You're building momentum.",
    "Taking breaks makes you more effective.",
    "You're doing great. Time to recharge.",
    "Mindful rest fuels mindful work.",
    "You've earned this break.",
    "Progress over perfection."
];
```

**Notification Functions:**

```javascript
function showBreakNotification() {
    const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Time for a break!',
        message: affirmation,
        priority: 1
    });
}

function showWorkNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Break complete',
        message: 'Ready to dive back in? Your focus awaits.',
        priority: 1
    });
}
```

### 5. State Persistence

**Storage Schema:**

```javascript
{
    activeSession: {
        isActive: boolean,
        isPaused: boolean,
        phase: 'work' | 'break',
        timeRemaining: number,
        ritual: Object,
        taskGoal: string,
        startedAt: timestamp
    }
}
```

**Persistence Functions:**

```javascript
async function saveSessionState() {
    await chrome.storage.local.set({ activeSession: sessionState });
}

async function loadSessionState() {
    const { activeSession } = await chrome.storage.local.get('activeSession');
    if (activeSession && activeSession.isActive) {
        restoreSession(activeSession);
    }
}

async function clearSessionState() {
    await chrome.storage.local.remove('activeSession');
}
```

## UI/UX Design

### Session Screen Layout

```
┌─────────────────────────────────────┐
│  Creative Deep Work            [✕]  │
├─────────────────────────────────────┤
│                                     │
│            50:00                    │
│          Work Time                  │
│                                     │
├─────────────────────────────────────┤
│  Current Goal:                      │
│  Complete project documentation     │
├─────────────────────────────────────┤
│         [    Pause    ]             │
├─────────────────────────────────────┤
│  Soundscape: [Rain ▼]  ━━━●━━━     │
└─────────────────────────────────────┘
```

### Color Scheme

- **Work Phase:** Blue tones (#667eea)
- **Break Phase:** Green tones (#48bb78)
- **Paused:** Gray tones (#a0aec0)

### Animations

- Timer countdown: Smooth number transitions
- Phase switch: Gentle fade transition
- Pause/Resume: Button pulse effect

## Testing Strategy

### Unit Tests

- Timer countdown logic
- Phase switching
- Audio playback control
- State persistence

### Integration Tests

- Full session flow (work → break → work)
- Notification triggering
- State restoration after popup close
- Audio cleanup on session end

### Manual Tests

- Start session from ritual
- Pause and resume
- End session early
- Switch soundscapes
- Verify notifications appear
- Close and reopen popup during session

## Sound Files

### Requirements

- Format: MP3
- Size: < 5MB each
- Quality: 128kbps minimum
- License: Royalty-free or Creative Commons

### Sources

- rain.mp3: Gentle rain ambience (3-5 minutes loop)
- cafe.mp3: Coffee shop ambience (3-5 minutes loop)

## Accessibility

- All buttons have aria-labels
- Timer updates announced to screen readers
- Keyboard navigation support
- High contrast mode support
- Volume control accessible via keyboard

## Performance

- Timer updates: 1 second intervals
- State saves: Every 10 seconds
- Audio preloading: On session start
- Memory cleanup: On session end
