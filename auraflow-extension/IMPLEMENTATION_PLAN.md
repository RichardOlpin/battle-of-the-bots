# AuraFlow Chrome Extension UI/UX Enhancement Implementation Plan

This document outlines the detailed implementation plan for enhancing the user experience of the AuraFlow Chrome Extension with three key features:

1. Minimalist Focus Mode
2. Customizable Themes
3. Quick Start Shortcuts

## 1. Minimalist Focus Mode Implementation

### HTML Changes (popup.html)

Add the following session screen HTML to the popup.html file, inside the `#app` div, alongside the other screens:

```html
<!-- Session Screen (Focus Mode) -->
<div id="session-screen" class="screen hidden" role="region" aria-label="Focus Session">
    <div class="session-container">
        <div class="timer-display" id="timer-display">25:00</div>
        
        <div class="session-controls">
            <div class="control-group">
                <label for="volume-slider">Volume</label>
                <input type="range" id="volume-slider" min="0" max="100" value="50" class="volume-slider" aria-label="Volume control">
            </div>
            
            <div class="control-group">
                <label for="soundscape-selector">Soundscape</label>
                <select id="soundscape-selector" class="soundscape-selector" aria-label="Select soundscape">
                    <option value="rain">Rain</option>
                    <option value="forest">Forest</option>
                    <option value="cafe">Café</option>
                    <option value="waves">Ocean Waves</option>
                    <option value="white-noise">White Noise</option>
                </select>
            </div>
            
            <div class="button-group">
                <button id="pause-btn" class="session-btn" aria-label="Pause session">Pause</button>
                <button id="stop-btn" class="session-btn" aria-label="Stop session">Stop</button>
            </div>
        </div>
    </div>
</div>
```

### CSS Changes (popup.css)

Add the following CSS rules to popup.css:

```css
/* Session Screen (Focus Mode) */
#session-screen {
    text-align: center;
    padding: 30px 0;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.session-container {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.timer-display {
    font-size: 64px; /* Significantly increased font size */
    font-weight: 700;
    color: #202124;
    margin-bottom: 30px;
    transition: all 0.5s ease;
    font-variant-numeric: tabular-nums;
    letter-spacing: -2px;
}

.session-controls {
    width: 80%;
    transition: opacity 0.8s ease; /* Slow-fading transition */
}

/* When container doesn't have .mouse-active class, reduce opacity */
.session-container:not(.mouse-active) .session-controls {
    opacity: 0.1;
}

.control-group {
    margin-bottom: 16px;
}

.control-group label {
    display: block;
    margin-bottom: 6px;
    color: #5f6368;
    font-size: 13px;
    transition: all 0.8s ease;
}

.volume-slider,
.soundscape-selector {
    width: 100%;
    transition: all 0.8s ease;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
}

.session-btn {
    padding: 8px 16px;
    transition: all 0.8s ease;
}
```

### JavaScript Changes (popup.js)

Add the following JavaScript code to popup.js:

```javascript
// Global variables for session screen
let mouseActivityTimer;
const MOUSE_INACTIVE_DELAY = 3000; // 3 seconds

// Setup event listeners for session screen
function setupSessionEventListeners() {
    const sessionContainer = document.querySelector('.session-container');
    if (sessionContainer) {
        // Add mouse movement listener
        sessionContainer.addEventListener('mousemove', handleMouseActivity);
        
        // Add button event listeners
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', handlePauseSession);
            pauseBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handlePauseSession));
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', handleStopSession);
            stopBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleStopSession));
        }
    }
}

// Handle mouse activity in session screen
function handleMouseActivity() {
    const sessionContainer = document.querySelector('.session-container');
    if (!sessionContainer) return;
    
    // Add active class to show controls
    sessionContainer.classList.add('mouse-active');
    
    // Clear any existing timer
    clearTimeout(mouseActivityTimer);
    
    // Set timer to hide controls after delay
    mouseActivityTimer = setTimeout(() => {
        sessionContainer.classList.remove('mouse-active');
    }, MOUSE_INACTIVE_DELAY);
}

// Function to show session screen
function showSessionScreen() {
    showScreen('session');
    
    // Initialize with active controls, then fade out
    const sessionContainer = document.querySelector('.session-container');
    if (sessionContainer) {
        sessionContainer.classList.add('mouse-active');
        
        // Set timer to hide controls after delay
        mouseActivityTimer = setTimeout(() => {
            sessionContainer.classList.remove('mouse-active');
        }, MOUSE_INACTIVE_DELAY);
    }
}

// Handle pause session button click
function handlePauseSession() {
    console.log('Pause session clicked');
    // Implement pause functionality
}

// Handle stop session button click
function handleStopSession() {
    console.log('Stop session clicked');
    // Implement stop functionality
    showScreen('events'); // Return to events screen
}
```

Also, modify the existing `showScreen` function to include 'session' as a valid screen:

```javascript
function showScreen(screenName) {
    // Validate screen name
    const validScreens = ['auth', 'events', 'loading', 'error', 'session'];
    if (!validScreens.includes(screenName)) {
        console.error('Invalid screen name:', screenName);
        return;
    }
    
    // Rest of the existing function...
}
```

Add the session event listeners setup to the DOMContentLoaded event:

```javascript
document.addEventListener('DOMContentLoaded', function () {
    // Existing code...
    
    // Set up session event listeners
    setupSessionEventListeners();
    
    // Rest of existing code...
});
```

## 2. Customizable Themes Implementation

### CSS Changes (popup.css)

Add the following CSS variables and theme classes to the top of popup.css:

```css
/* Theme System - CSS Variables */
:root {
    /* Default Light Theme */
    --background-color: #F8F8F8;
    --card-background: #ffffff;
    --text-color: #333333;
    --secondary-text-color: #5f6368;
    --accent-color: #4A90E2;
    --border-color: #e8eaed;
    --hover-color: #f1f3f4;
    --gradient-start: #667eea;
    --gradient-end: #764ba2;
    --shadow-color: rgba(0, 0, 0, 0.1);
    --error-color: #d93025;
    --success-color: #0f9d58;
}

/* Dark Theme */
.theme-dark {
    --background-color: #2C2C2C;
    --card-background: #1a202c;
    --text-color: #EAEAEA;
    --secondary-text-color: #a0aec0;
    --accent-color: #58A6FF;
    --border-color: #4a5568;
    --hover-color: #3a3a3a;
    --gradient-start: #4a5568;
    --gradient-end: #2d3748;
    --shadow-color: rgba(0, 0, 0, 0.3);
    --error-color: #fc8181;
    --success-color: #68d391;
}

/* Calm Theme */
.theme-calm {
    --background-color: #E8F0F2;
    --card-background: #ffffff;
    --text-color: #4A5568;
    --secondary-text-color: #718096;
    --accent-color: #38A169;
    --border-color: #CBD5E0;
    --hover-color: #EDF2F7;
    --gradient-start: #38A169;
    --gradient-end: #2F855A;
    --shadow-color: rgba(56, 161, 105, 0.1);
    --error-color: #E53E3E;
    --success-color: #38A169;
}
```

Then, update all color references in the CSS to use these variables. For example:

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-color);
    background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
    width: 360px;
    min-height: 240px;
    overflow-x: hidden;
}

#app {
    padding: 20px;
    background: var(--card-background);
    border-radius: 8px;
    margin: 8px;
    box-shadow: 0 4px 6px var(--shadow-color);
    min-height: 224px;
}
```

Add the following CSS for the theme settings UI:

```css
/* Settings Section */
.settings-section {
    background: var(--card-background);
    border-radius: 8px;
    padding: 16px;
    position: absolute;
    top: 20px;
    right: 20px;
    left: 20px;
    z-index: 100;
    box-shadow: 0 4px 12px var(--shadow-color);
    border: 1px solid var(--border-color);
}

.settings-section h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--text-color);
    font-size: 16px;
    font-weight: 600;
}

.settings-group {
    margin-bottom: 16px;
}

.settings-group h5 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--secondary-text-color);
}

.theme-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
}

.theme-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.theme-button.active {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color);
}

.theme-light-preview {
    background: linear-gradient(135deg, #F8F8F8 0%, #ffffff 100%);
}

.theme-dark-preview {
    background: linear-gradient(135deg, #2C2C2C 0%, #1a202c 100%);
}

.theme-calm-preview {
    background: linear-gradient(135deg, #E8F0F2 0%, #ffffff 100%);
    border: 1px solid #CBD5E0;
}

.icon-btn {
    background: transparent;
    color: var(--secondary-text-color);
    border: none;
    padding: 6px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    transition: all 0.2s ease;
}

.icon-btn:hover {
    background: var(--hover-color);
    color: var(--text-color);
}
```

### HTML Changes (popup.html)

Add the settings button to the header in the events screen:

```html
<div class="header">
    <h3 id="date-header">Today's Events</h3>
    <button id="settings-btn" class="icon-btn" aria-label="Settings" title="Settings">
        ⚙️
    </button>
    <button id="refresh-btn" aria-label="Refresh events" title="Refresh events" tabindex="0">
        ↻
    </button>
    <button id="logout-btn" aria-label="Logout from Google Calendar" tabindex="0">
        Logout
    </button>
</div>
```

Add the settings section to the popup.html file, right after the header in the events screen:

```html
<!-- Settings Section -->
<div id="settings-section" class="settings-section hidden">
    <h4>Settings</h4>
    
    <div class="settings-group">
        <h5>Theme</h5>
        <div class="theme-buttons">
            <button id="theme-light-button" class="theme-button theme-light-preview" aria-label="Light theme">
                <span class="sr-only">Light Theme</span>
            </button>
            <button id="theme-dark-button" class="theme-button theme-dark-preview" aria-label="Dark theme">
                <span class="sr-only">Dark Theme</span>
            </button>
            <button id="theme-calm-button" class="theme-button theme-calm-preview" aria-label="Calm theme">
                <span class="sr-only">Calm Theme</span>
            </button>
        </div>
    </div>
    
    <button id="settings-close-btn" class="secondary-btn" aria-label="Close settings">
        Close
    </button>
</div>
```

### JavaScript Changes (popup.js)

Add the following theme management code to popup.js:

```javascript
// Theme management
let currentTheme = 'light'; // Default theme

// Initialize theme system
function initializeTheme() {
    // Load saved theme from storage
    chrome.storage.sync.get(['auraflow_theme'], function(result) {
        if (result.auraflow_theme) {
            applyTheme(result.auraflow_theme);
        }
    });
    
    // Set up theme button event listeners
    setupThemeButtons();
}

// Set up theme button event listeners
function setupThemeButtons() {
    const lightBtn = document.getElementById('theme-light-button');
    const darkBtn = document.getElementById('theme-dark-button');
    const calmBtn = document.getElementById('theme-calm-button');
    
    if (lightBtn) {
        lightBtn.addEventListener('click', () => switchTheme('light'));
        lightBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, () => switchTheme('light')));
    }
    
    if (darkBtn) {
        darkBtn.addEventListener('click', () => switchTheme('dark'));
        darkBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, () => switchTheme('dark')));
    }
    
    if (calmBtn) {
        calmBtn.addEventListener('click', () => switchTheme('calm'));
        calmBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, () => switchTheme('calm')));
    }
    
    // Settings toggle button
    const settingsBtn = document.getElementById('settings-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', toggleSettings);
        settingsBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, toggleSettings));
    }
    
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', toggleSettings);
        settingsCloseBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, toggleSettings));
    }
}

// Switch theme
function switchTheme(theme) {
    applyTheme(theme);
    
    // Save theme preference
    chrome.storage.sync.set({ 'auraflow_theme': theme });
    
    // Update active state on buttons
    updateThemeButtonStates(theme);
    
    // Announce theme change to screen readers
    announceToScreenReader(`Theme changed to ${theme}`);
}

// Apply theme to document
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-dark', 'theme-calm');
    
    // Add appropriate theme class
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (theme === 'calm') {
        document.body.classList.add('theme-calm');
    }
    
    currentTheme = theme;
}

// Update active state on theme buttons
function updateThemeButtonStates(activeTheme) {
    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    const activeButton = document.getElementById(`theme-${activeTheme}-button`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Toggle settings panel
function toggleSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
        settingsSection.classList.toggle('hidden');
        
        // If showing settings, update active theme button
        if (!settingsSection.classList.contains('hidden')) {
            updateThemeButtonStates(currentTheme);
        }
    }
}
```

Add theme initialization to the DOMContentLoaded event:

```javascript
document.addEventListener('DOMContentLoaded', function () {
    // Existing code...
    
    // Initialize theme system
    initializeTheme();
    
    // Rest of existing code...
});
```

## 3. Quick Start Shortcuts Implementation

### HTML Changes (popup.html)

Add the Quick Start button to the events screen, right before the AI features section:

```html
<!-- Quick Start Section -->
<div class="quick-start-section">
    <button id="quick-start-button" class="primary-btn quick-start-btn hidden" aria-label="Start session with previous settings">
        <span class="quick-start-icon">⚡</span>
        <span class="quick-start-text">Quick Start</span>
    </button>
    <p id="quick-start-description" class="quick-start-description hidden">Start 'Deep Work' Session</p>
</div>
```

### CSS Changes (popup.css)

Add the following CSS for the Quick Start button:

```css
/* Quick Start Button */
.quick-start-section {
    margin-top: 16px;
    text-align: center;
}

.quick-start-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--accent-color) 0%, var(--gradient-end) 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin: 0 auto;
}

.quick-start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.quick-start-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quick-start-icon {
    font-size: 18px;
}

.quick-start-description {
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-top: 8px;
    font-style: italic;
}

.quick-start-btn.hidden,
.quick-start-description.hidden {
    display: none;
}
```

### JavaScript Changes (popup.js)

Add the following Quick Start functionality to popup.js:

```javascript
// Quick Start functionality
let lastSessionSettings = null;

// Initialize Quick Start feature
function initializeQuickStart() {
    // Load saved session settings from storage
    chrome.storage.sync.get(['auraflow_last_session'], function(result) {
        if (result.auraflow_last_session) {
            lastSessionSettings = result.auraflow_last_session;
            updateQuickStartButton();
        }
    });
    
    // Set up Quick Start button event listener
    const quickStartBtn = document.getElementById('quick-start-button');
    if (quickStartBtn) {
        quickStartBtn.addEventListener('click', handleQuickStart);
        quickStartBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleQuickStart));
    }
}

// Update Quick Start button visibility and text
function updateQuickStartButton() {
    const quickStartBtn = document.getElementById('quick-start-button');
    const quickStartDesc = document.getElementById('quick-start-description');
    
    if (!quickStartBtn || !quickStartDesc || !lastSessionSettings) return;
    
    // Show the Quick Start button
    quickStartBtn.classList.remove('hidden');
    quickStartDesc.classList.remove('hidden');
    
    // Update description with ritual name
    if (lastSessionSettings.ritual && lastSessionSettings.ritual.name) {
        quickStartDesc.textContent = `Start '${lastSessionSettings.ritual.name}' Session`;
    } else {
        quickStartDesc.textContent = 'Start Previous Session';
    }
}

// Handle Quick Start button click
function handleQuickStart() {
    console.log('Quick Start button clicked');
    
    if (!lastSessionSettings) {
        console.error('No previous session settings found');
        return;
    }
    
    // Start a new session with the saved settings
    startFocusSession(lastSessionSettings);
}

// Save session settings when starting a new session
function saveSessionSettings(settings) {
    lastSessionSettings = settings;
    
    // Save to chrome.storage.sync for persistence
    chrome.storage.sync.set({ 'auraflow_last_session': settings });
    
    console.log('Session settings saved:', settings);
}

// Start a focus session with the given settings
function startFocusSession(settings) {
    console.log('Starting focus session with settings:', settings);
    
    // Apply settings to the session
    if (settings.ritual) {
        // Set timer duration
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay && settings.ritual.workDuration) {
            const minutes = settings.ritual.workDuration;
            timerDisplay.textContent = `${minutes}:00`;
        }
        
        // Set soundscape if available
        const soundscapeSelector = document.getElementById('soundscape-selector');
        if (soundscapeSelector && settings.soundscape) {
            soundscapeSelector.value = settings.soundscape;
        }
    }
    
    // Show the session screen
    showSessionScreen();
    
    // Save these settings for next time
    saveSessionSettings(settings);
}
```

Modify the `handleGenerateRitual` function to save the ritual for Quick Start:

```javascript
function handleGenerateRitual() {
    console.log('Generate Ritual clicked');
    
    try {
        // Show loading state
        showAILoading('Generating personalized ritual...');
        
        // ... existing code ...
        
        // When ritual is successfully generated:
        if (ritual && typeof ritual === 'object' && ritual.name) {
            displayRitualResult(ritual);
            
            // Save ritual for Quick Start
            saveSessionSettings({
                ritual: ritual,
                soundscape: ritual.suggestedSoundscape || 'rain',
                timestamp: Date.now()
            });
            
            // Update Quick Start button
            updateQuickStartButton();
        }
        
    } catch (error) {
        // ... existing error handling ...
    }
}
```

Add Quick Start initialization to the DOMContentLoaded event:

```javascript
document.addEventListener('DOMContentLoaded', function () {
    // Existing code...
    
    // Initialize Quick Start feature
    initializeQuickStart();
    
    // Rest of existing code...
});
```

## 4. UI Testing Guide

### Minimalist Focus Mode Tests

#### Test 1.1: Verify controls fade out after inactivity
- Steps:
  1. Generate a ritual or use Quick Start to begin a focus session
  2. Observe the session screen with timer and controls
  3. Move your mouse and verify controls are fully visible
  4. Keep the mouse still for 3 seconds
  5. Verify that controls fade to near-zero opacity
  6. Move the mouse again
  7. Verify controls become fully visible again

#### Test 1.2: Verify controls are accessible
- Steps:
  1. Start a focus session
  2. Tab through the controls using the keyboard
  3. Verify that controls become visible when focused
  4. Verify that you can adjust volume and soundscape using keyboard

### Customizable Themes Tests

#### Test 2.1: Verify theme switching
- Steps:
  1. Open the extension popup
  2. Click the settings (gear) icon
  3. Click on the Dark theme button
  4. Verify the UI changes to dark colors
  5. Click on the Calm theme button
  6. Verify the UI changes to calm colors
  7. Click on the Light theme button
  8. Verify the UI returns to light colors

#### Test 2.2: Verify theme persistence
- Steps:
  1. Open the extension popup
  2. Set the theme to Dark
  3. Close the popup
  4. Reopen the popup
  5. Verify the Dark theme is still applied
  6. Change to a different theme
  7. Close and reopen the extension
  8. Verify the new theme persists

### Quick Start Shortcuts Tests

#### Test 3.1: Verify Quick Start button appears after session
- Steps:
  1. Open the extension popup
  2. Generate a ritual using the "Generate Ritual" button
  3. Verify a ritual is displayed in the results
  4. Verify the Quick Start button appears above the AI features section
  5. Verify the button description shows the ritual name

#### Test 3.2: Verify Quick Start functionality
- Steps:
  1. After generating a ritual, click the Quick Start button
  2. Verify the session screen appears with the correct timer duration
  3. Verify the soundscape is set to the suggested one (if available)
  4. End the session by clicking Stop
  5. Verify you return to the events screen
  6. Verify the Quick Start button is still available

#### Test 3.3: Verify Quick Start persistence
- Steps:
  1. Generate a ritual
  2. Close the extension popup
  3. Reopen the extension
  4. Verify the Quick Start button is visible with the correct ritual name
  5. Click the Quick Start button
  6. Verify the session starts with the saved settings

## Implementation Notes

1. The implementation follows the product vision of AuraFlow as a mindful, human-centered productivity assistant with a compassionate and distraction-free design.

2. All changes are confined to the frontend files in the auraflow-extension/ directory:
   - popup.html
   - popup.css
   - popup.js

3. The implementation does not modify the backend code or require any changes to the background.js service worker.

4. The code includes accessibility features such as:
   - Proper ARIA attributes
   - Keyboard navigation support
   - Screen reader announcements
   - Focus management

5. The implementation uses Chrome Storage API for persistence:
   - chrome.storage.sync.set for saving settings
   - chrome.storage.sync.get for retrieving settings

6. The UI is responsive and works well on different screen sizes.