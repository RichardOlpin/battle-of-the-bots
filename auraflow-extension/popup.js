// Popup script for AuraFlow Calendar Extension
// This file handles the popup UI logic and user interactions

// Import core logic and platform services
import * as CoreLogic from './core-logic.js';
import * as Platform from './chrome-platform-services.js';

// Global state management
let currentScreen = 'auth';
let isLoading = false;
let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;
let mouseActivityTimer;
const MOUSE_INACTIVE_DELAY = 3000; // 3 seconds
let currentTheme = 'light'; // Default theme
let lastSessionSettings = null;
let focusAudio = null;
let currentSoundscape = 'rain';
const DEFAULT_VOLUME = 0.5;
const SOUNDSCAPE_AUDIO_MAP = {
    'rain': {
        path: 'mp3/rain.mp3',
        label: 'Rain Ambience',
        aliases: ['rain', 'rain ambience', 'rain sounds']
    },
    'ritual-templates': {
        path: 'mp3/1__Ritual_Templates_Library.mp3',
        label: 'Ritual Templates Library',
        aliases: ['ritual templates', 'ritual templates library', 'rituals']
    },
    'affirmations-breaks': {
        path: 'mp3/2__Affirmation_Mindfulness_Breaks.mp3',
        label: 'Affirmations & Mindfulness Breaks',
        aliases: ['affirmations', 'mindfulness breaks', 'affirmation mindfulness breaks', 'affirmations & mindfulness breaks']
    },
    'ambient-orchestral': {
        path: 'mp3/3__Ambient Music_Cinematic_Orchestral.mp3',
        label: 'Ambient Cinematic & Orchestral',
        aliases: ['ambient orchestral', 'cinematic orchestral', 'ambient music', 'ambient cinematic & orchestral']
    },
    'positive-affirmation': {
        path: 'mp3/4__Positive_Affirmation.mp3',
        label: 'Positive Affirmation Meditation',
        aliases: ['positive affirmation', 'affirmation meditation', 'positive meditation', 'positive affirmation meditation']
    }
};

const FOCUS_TIMER_STORAGE_KEY = 'auraflow_focus_timer_state';
const SESSION_STATUS = {
    IDLE: 'idle',
    PENDING: 'pending',
    RUNNING: 'running',
    PAUSED: 'paused'
};
const DEFAULT_SESSION_DURATION_MINUTES = 25;

let focusTimerStatus = SESSION_STATUS.IDLE;
let focusTimerDurationMinutes = DEFAULT_SESSION_DURATION_MINUTES;
let focusTimerRemainingMs = DEFAULT_SESSION_DURATION_MINUTES * 60 * 1000;
let focusTimerEndTime = null;
let focusTimerIntervalId = null;
let focusTimerSoundscape = 'rain';

document.addEventListener('DOMContentLoaded', function () {
    console.log('AuraFlow Calendar popup loaded');

    // Initialize popup
    initializePopup();

    // Set up event listeners
    setupEventListeners();

    // Set up keyboard navigation
    setupKeyboardNavigation();

    // Set up message listener for testing
    setupMessageListener();

    // Initialize theme system
    initializeTheme();

    // Initialize Quick Start feature
    initializeQuickStart();

    // Set up session event listeners
    setupSessionEventListeners();

    // Initialize Slack status control
    initializeSlackStatus();

    // Restore any in-progress focus session
    restoreFocusTimerState();
});

async function initializePopup() {
    // Update date header with current date
    updateDateHeader();

    // Check authentication status on popup load
    await checkAuthenticationStatus();

    // Load blocked sites list
    await loadBlockedSites();
}

function setupEventListeners() {
    // Connect button
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
        connectBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleConnect));
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
        refreshBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleRefresh));
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        logoutBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleLogout));
    }

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', handleRetry);
        retryBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleRetry));
    }

    // AI Feature buttons
    const findFocusBtn = document.getElementById('find-focus-btn');
    if (findFocusBtn) {
        findFocusBtn.addEventListener('click', handleFindFocusTime);
        findFocusBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleFindFocusTime));
    }

    const generateRitualBtn = document.getElementById('generate-ritual-btn');
    if (generateRitualBtn) {
        generateRitualBtn.addEventListener('click', handleGenerateRitual);
        generateRitualBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleGenerateRitual));
    }

    // Theme buttons are now directly in the main interface

    // Quick Start button
    const quickStartBtn = document.getElementById('quick-start-button');
    if (quickStartBtn) {
        quickStartBtn.addEventListener('click', handleQuickStart);
        quickStartBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleQuickStart));
    }

    // Quick Focus button
    const quickFocusBtn = document.getElementById('quick-focus-btn');
    if (quickFocusBtn) {
        quickFocusBtn.addEventListener('click', handleQuickFocus);
        quickFocusBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleQuickFocus));
    }

    // Blocked sites save button
    const saveBlockedSitesBtn = document.getElementById('save-blocked-sites-button');
    if (saveBlockedSitesBtn) {
        saveBlockedSitesBtn.addEventListener('click', handleSaveBlockedSites);
        saveBlockedSitesBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleSaveBlockedSites));
    }

    // Slack status control buttons
    const connectSlackBtn = document.getElementById('connect-slack-btn');
    if (connectSlackBtn) {
        connectSlackBtn.addEventListener('click', handleConnectSlack);
        connectSlackBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleConnectSlack));
    }

    const disconnectSlackBtn = document.getElementById('disconnect-slack-btn');
    if (disconnectSlackBtn) {
        disconnectSlackBtn.addEventListener('click', handleDisconnectSlack);
        disconnectSlackBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleDisconnectSlack));
    }

    const slackStatusButtons = document.querySelectorAll('.slack-status-btn');
    slackStatusButtons.forEach(button => {
        button.addEventListener('click', () => handleSlackStatusChange(button.dataset.status));
        button.addEventListener('keydown', (e) => handleButtonKeydown(e, () => handleSlackStatusChange(button.dataset.status)));
    });
}

// Handle keyboard events for buttons (Enter and Space)
function handleButtonKeydown(event, callback) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        callback();
    }
}

// Setup keyboard navigation for the entire popup
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        // Handle Escape key to close error or go back
        if (event.key === 'Escape') {
            if (currentScreen === 'error') {
                handleRetry();
            }
        }

        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'r':
                case 'R':
                    // Ctrl/Cmd + R to refresh
                    if (currentScreen === 'events') {
                        event.preventDefault();
                        handleRefresh();
                    }
                    break;
            }
        }
    });

    // Trap focus within the popup for better accessibility
    const app = document.getElementById('app');
    if (app) {
        app.addEventListener('keydown', trapFocus);
    }
}

// Trap focus within the popup (for accessibility)
function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusableElements = document.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

function showScreen(screenName) {
    // Validate screen name
    const validScreens = ['auth', 'events', 'loading', 'error', 'session'];
    if (!validScreens.includes(screenName)) {
        console.error('Invalid screen name:', screenName);
        return;
    }

    // Update current screen state
    currentScreen = screenName;
    isLoading = screenName === 'loading';

    if (screenName !== 'session') {
        stopFocusAudio();
    }

    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
        screen.setAttribute('aria-hidden', 'true');
    });

    // Show the requested screen
    const targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.setAttribute('aria-hidden', 'false');
        console.log('Switched to screen:', screenName);

        // Focus management for accessibility
        focusFirstElement(targetScreen);

        // Announce screen change to screen readers
        announceScreenChange(screenName);
    } else {
        console.error('Screen not found:', screenName + '-screen');
    }
}

// Focus the first interactive element in the screen
function focusFirstElement(screen) {
    setTimeout(() => {
        const firstFocusable = screen.querySelector(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }, 100);
}

// Announce screen changes to screen readers
function announceScreenChange(screenName) {
    const announcements = {
        'auth': 'Authentication screen. Please connect your Google Calendar.',
        'events': 'Calendar events loaded.',
        'loading': 'Loading, please wait.',
        'error': 'An error occurred. Please try again.',
        'session': 'Focus session started. Timer is displayed.'
    };

    const message = announcements[screenName] || '';
    if (message) {
        announceToScreenReader(message);
    }
}

// Helper function to announce messages to screen readers
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Event handlers
async function handleConnect() {
    console.log('Connect button clicked');
    if (isLoading) return; // Prevent multiple clicks during loading

    showScreen('loading');
    updateLoadingMessage('Connecting to Google Calendar...');

    try {
        // Send authentication request to service worker
        const response = await sendMessageToServiceWorker({ action: 'authenticate' });

        if (response.success) {
            console.log('Authentication successful');
            retryAttempts = 0; // Reset retry counter on success
            updateLoadingMessage('Loading your events...');
            // Check authentication status and load events
            await checkAuthenticationStatus();
        } else {
            throw new Error(response.error || 'Authentication failed');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        logError('handleConnect', error);
        showError(
            error.message || 'Failed to connect to Google Calendar. Please try again.',
            'connect'
        );
    }
}

async function handleRefresh() {
    console.log('Refresh button clicked');
    if (isLoading) return; // Prevent multiple clicks during loading

    try {
        showScreen('loading');
        updateLoadingMessage('Refreshing events...');
        retryAttempts = 0; // Reset retry counter
        await loadEvents();
    } catch (error) {
        console.error('Refresh error:', error);
        logError('handleRefresh', error);
        showError(
            error.message || 'Failed to refresh events. Please try again.',
            'refresh'
        );
    }
}

async function handleLogout() {
    console.log('Logout button clicked');
    if (isLoading) return; // Prevent clicks during loading

    try {
        showScreen('loading');
        updateLoadingMessage('Logging out...');

        // Send logout request to service worker
        const response = await sendMessageToServiceWorker({ action: 'logout' });

        if (response.success) {
            console.log('Logout successful');
            retryAttempts = 0; // Reset retry counter
            showScreen('auth');
        } else {
            throw new Error(response.error || 'Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        logError('handleLogout', error);
        showError(
            error.message || 'Failed to logout. Please try again.',
            'logout'
        );
    }
}

async function handleRetry() {
    console.log('Retry button clicked');
    if (isLoading) return; // Prevent multiple clicks during loading

    retryAttempts++;
    console.log(`Retry attempt ${retryAttempts} of ${MAX_RETRY_ATTEMPTS}`);

    showScreen('loading');
    updateLoadingMessage('Retrying...');

    try {
        // Determine what to retry based on last action
        const lastAction = getLastFailedAction();

        if (lastAction === 'connect') {
            await handleConnect();
        } else if (lastAction === 'refresh') {
            await loadEvents();
        } else {
            // Default: retry authentication status check and event loading
            await checkAuthenticationStatus();
        }

        retryAttempts = 0; // Reset on success
    } catch (error) {
        console.error('Retry error:', error);
        logError('handleRetry', error, { attempt: retryAttempts });

        // Check if we've exceeded max retries
        if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
            showError(
                'Multiple retry attempts failed. Please check your internet connection and try again later.',
                'retry',
                false // Don't show retry button
            );
        } else {
            showError(
                error.message || 'Retry failed. Please try again.',
                'retry'
            );
        }
    }
}

// Display calendar events in the UI
function displayEvents(events) {
    const eventsContainer = document.getElementById('events-container');
    const noEventsDiv = document.getElementById('no-events');

    if (!eventsContainer) {
        console.error('Events container not found');
        return;
    }

    // Clear existing events
    eventsContainer.innerHTML = '';

    // Handle empty or no events case
    if (!events || events.length === 0) {
        showNoEventsState(eventsContainer, noEventsDiv);
        return;
    }

    // Filter out cancelled events and events without start time
    const validEvents = filterValidEvents(events);

    if (validEvents.length === 0) {
        showNoEventsState(eventsContainer, noEventsDiv);
        return;
    }

    // Sort events chronologically (earliest to latest)
    const sortedEvents = sortEventsChronologically(validEvents);

    // Show events container and hide no events message
    noEventsDiv.classList.add('hidden');
    eventsContainer.classList.remove('hidden');

    // Render each event
    sortedEvents.forEach(event => {
        const eventElement = renderEventElement(event);
        eventsContainer.appendChild(eventElement);
    });

    console.log(`Displayed ${sortedEvents.length} events`);
}

// Filter out invalid events (cancelled, no start time)
function filterValidEvents(events) {
    return events.filter(event => {
        // Must have a start time
        if (!event.start) {
            console.warn('Event missing start time:', event);
            return false;
        }

        // Skip cancelled events
        if (event.status === 'cancelled') {
            console.log('Skipping cancelled event:', event.summary);
            return false;
        }

        return true;
    });
}

// Sort events chronologically from earliest to latest
function sortEventsChronologically(events) {
    return events.sort((a, b) => {
        const timeA = getEventStartTime(a);
        const timeB = getEventStartTime(b);

        // Handle invalid dates
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;

        return timeA - timeB;
    });
}

// Get event start time as Date object for sorting
function getEventStartTime(event) {
    try {
        const dateTimeString = event.start.dateTime || event.start.date;
        if (!dateTimeString) return null;

        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error('Error parsing event start time:', error);
        return null;
    }
}

// Render a single event element
function renderEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.setAttribute('role', 'listitem');
    eventElement.setAttribute('tabindex', '0');

    // Get event title
    const title = event.summary || 'Untitled Event';

    // Format event times
    const timeDisplay = formatEventTimeRange(event);

    // Set aria-label for screen readers
    eventElement.setAttribute('aria-label', `${title}, ${timeDisplay}`);

    // Build event HTML
    eventElement.innerHTML = `
        <div class="event-title">${escapeHtml(title)}</div>
        <div class="event-time">${escapeHtml(timeDisplay)}</div>
    `;

    return eventElement;
}

// Format event time range for display
function formatEventTimeRange(event) {
    const startDateTime = event.start.dateTime || event.start.date;
    const endDateTime = event.end.dateTime || event.end.date;

    const startTime = formatEventTime(startDateTime);
    const endTime = formatEventTime(endDateTime);

    // Handle all-day events
    if (startTime === 'All day') {
        return 'All day';
    }

    return `${startTime} - ${endTime}`;
}

// Show no events state
function showNoEventsState(eventsContainer, noEventsDiv) {
    noEventsDiv.classList.remove('hidden');
    eventsContainer.classList.add('hidden');
    console.log('No events to display');
}

function showError(message) {
    console.log('Show error:', message);
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message || 'Something went wrong';
    }
    showScreen('error');
}

function formatEventTime(dateTimeString) {
    if (!dateTimeString) return '';

    try {
        // Check if it's an all-day event (date only, no time component)
        // All-day events are in format YYYY-MM-DD (10 characters)
        if (dateTimeString.length === 10 || !dateTimeString.includes('T')) {
            return 'All day';
        }

        const date = new Date(dateTimeString);

        // Validate the date
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateTimeString);
            return 'Invalid time';
        }

        // Format time as HH:MM AM/PM
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
    }
}

// Utility function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update loading message
function updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

// Get last failed action for retry logic
function getLastFailedAction() {
    // This would be stored in a variable or storage
    // For now, return a default
    return 'connect';
}

// Log error for debugging
function logError(context, error, additionalInfo = {}) {
    console.error(`[${context}]`, error, additionalInfo);
}

function updateDateHeader() {
    const dateHeader = document.getElementById('date-header');
    if (dateHeader) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateHeader.textContent = `Today's Events - ${today.toLocaleDateString('en-US', options)}`;
    }
}

// Sample events for UI testing (remove in task 6)
function displaySampleEvents() {
    const eventsContainer = document.getElementById('events-container');
    const noEventsDiv = document.getElementById('no-events');

    if (!eventsContainer) return;

    // Clear existing events
    eventsContainer.innerHTML = '';

    // Sample events for testing
    const sampleEvents = [
        {
            title: 'Team Standup',
            startTime: '9:00 AM',
            endTime: '9:30 AM'
        },
        {
            title: 'Project Review Meeting',
            startTime: '2:00 PM',
            endTime: '3:00 PM'
        },
        {
            title: 'Client Call',
            startTime: '4:30 PM',
            endTime: '5:30 PM'
        }
    ];

    if (sampleEvents.length === 0) {
        noEventsDiv.classList.remove('hidden');
        eventsContainer.classList.add('hidden');
    } else {
        noEventsDiv.classList.add('hidden');
        eventsContainer.classList.remove('hidden');

        sampleEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            eventElement.innerHTML = `
                <div class="event-title">${event.title}</div>
                <div class="event-time">${event.startTime} - ${event.endTime}</div>
            `;
            eventsContainer.appendChild(eventElement);
        });
    }
}

// Communication with service worker (using platform abstraction)
function sendMessageToServiceWorker(message) {
    return Platform.sendMessageToServiceWorker(message);
}

// Check authentication status and show appropriate screen
async function checkAuthenticationStatus() {
    try {
        showScreen('loading');

        const response = await sendMessageToServiceWorker({ action: 'checkAuthStatus' });

        if (response.success && response.data.isAuthenticated) {
            console.log('User is authenticated, loading events');
            await loadEvents();
        } else {
            console.log('User is not authenticated, showing auth screen');
            showScreen('auth');
        }
    } catch (error) {
        console.error('Failed to check authentication status:', error);
        showError('Failed to check authentication status. Please try again.');
    }
}

// Load calendar events
async function loadEvents() {
    try {
        const response = await sendMessageToServiceWorker({ action: 'fetchEvents' });

        if (response.success) {
            console.log('Events loaded successfully:', response.data);
            displayEvents(response.data);
            showScreen('events');
        } else {
            throw new Error(response.error || 'Failed to load events');
        }
    } catch (error) {
        console.error('Failed to load events:', error);

        // Check if it's an authentication error
        if (error.message.includes('Token expired') || error.message.includes('No stored tokens')) {
            showScreen('auth');
        } else {
            showError(error.message || 'Failed to load calendar events. Please try again.');
        }
    }
}

// Message listener for testing
function setupMessageListener() {
    window.addEventListener('message', function (event) {
        console.log('Received message:', event.data);

        if (event.data && event.data.action) {
            switch (event.data.action) {
                case 'showAuth':
                    showScreen('auth');
                    break;
                case 'showEvents':
                    showScreen('events');
                    displaySampleEvents();
                    break;
                case 'showLoading':
                    showScreen('loading');
                    break;
                case 'showError':
                    showError('Test error message');
                    break;
                default:
                    console.log('Unknown action:', event.data.action);
            }
        }
    });
}

// ============================================================================
// AI FEATURES INTEGRATION
// ============================================================================

// Store current events for AI features
let currentEvents = [];

/**
 * Handle Find Focus Time button click
 * Analyzes calendar events to suggest optimal focus windows
 */
async function handleFindFocusTime() {
    console.log('Find Focus Time clicked');
    window.lastAIAction = 'focus';

    try {
        showAILoading('Analyzing your calendar...');

        // Get calendar events
        const response = await sendMessageToServiceWorker({ action: 'fetchEvents' });
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch calendar events');
        }

        const events = Array.isArray(response.data) ? response.data : [];

        // Analyze events and find optimal focus time
        const focusWindow = analyzeCalendarForFocus(events);
        displayFocusTimeResult(focusWindow);

    } catch (error) {
        console.error('Find Focus Time error:', error);
        showAIError('Failed to analyze calendar. Please try again.');
    }
}

/**
 * Handle Generate Ritual button click
 * Creates personalized work rituals based on calendar context
 */
async function handleGenerateRitual() {
    console.log('Generate Ritual clicked');
    window.lastAIAction = 'ritual';

    try {
        showAILoading('Creating your personalized ritual...');

        // Get calendar events for context
        const response = await sendMessageToServiceWorker({ action: 'fetchEvents' });
        const events = response?.success ? response.data : [];

        // Generate ritual based on current context
        const ritual = generatePersonalizedRitual(events);
        displayRitualResult(ritual);

    } catch (error) {
        console.error('Generate Ritual error:', error);
        showAIError('Failed to generate ritual. Please try again.');
    }
}

/**
 * Analyze calendar events to find optimal focus windows
 * @param {Array} events - Calendar events
 * @returns {Object|null} Focus window suggestion
 */
function analyzeCalendarForFocus(events) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(18, 0, 0, 0); // End analysis at 6 PM

    // If no events or empty calendar, suggest immediate focus time
    if (!events || events.length === 0) {
        const duration = 90; // Default 90-minute session
        const endTime = new Date(now.getTime() + duration * 60 * 1000);

        return {
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
            score: 100,
            reasoning: "Perfect! Your calendar is completely free. This is an ideal time for deep, uninterrupted focus work."
        };
    }

    // Parse and sort events
    const todayEvents = events
        .filter(event => event && event.start)
        .map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            title: event.summary || 'Event'
        }))
        .filter(event => event.start >= now && event.start <= endOfDay)
        .sort((a, b) => a.start - b.start);

    // If no events today, suggest immediate focus time
    if (todayEvents.length === 0) {
        const duration = 90;
        const endTime = new Date(now.getTime() + duration * 60 * 1000);

        return {
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
            score: 95,
            reasoning: "Excellent! No events scheduled for today. You have complete freedom to focus on your most important work."
        };
    }

    // Find gaps between events
    const gaps = [];
    let currentTime = new Date(Math.max(now.getTime(), now.getTime()));

    // Check if there's time before the first event
    if (todayEvents[0].start - currentTime >= 45 * 60 * 1000) {
        gaps.push({
            start: new Date(currentTime),
            end: new Date(todayEvents[0].start),
            duration: Math.floor((todayEvents[0].start - currentTime) / (60 * 1000))
        });
    }

    // Check gaps between events
    for (let i = 0; i < todayEvents.length - 1; i++) {
        const currentEvent = todayEvents[i];
        const nextEvent = todayEvents[i + 1];

        if (nextEvent.start - currentEvent.end >= 45 * 60 * 1000) {
            gaps.push({
                start: new Date(currentEvent.end),
                end: new Date(nextEvent.start),
                duration: Math.floor((nextEvent.start - currentEvent.end) / (60 * 1000))
            });
        }
    }

    // Check if there's time after the last event
    const lastEvent = todayEvents[todayEvents.length - 1];
    if (endOfDay - lastEvent.end >= 45 * 60 * 1000) {
        gaps.push({
            start: new Date(lastEvent.end),
            end: new Date(endOfDay),
            duration: Math.floor((endOfDay - lastEvent.end) / (60 * 1000))
        });
    }

    if (gaps.length === 0) {
        return null; // No suitable gaps found
    }

    // Score gaps based on duration and time of day
    const scoredGaps = gaps.map(gap => {
        let score = Math.min(gap.duration, 120); // Base score from duration (max 120)

        // Time of day bonus
        const hour = gap.start.getHours();
        if (hour >= 9 && hour <= 11) score += 20; // Morning focus bonus
        if (hour >= 14 && hour <= 16) score += 15; // Afternoon focus bonus
        if (hour >= 8 && hour <= 17) score += 10; // Work hours bonus

        // Duration bonus for longer sessions
        if (gap.duration >= 90) score += 15;
        if (gap.duration >= 120) score += 10;

        return { ...gap, score };
    });

    // Return best gap
    const bestGap = scoredGaps.reduce((best, current) =>
        current.score > best.score ? current : best
    );

    // Suggest 75-90 minute session within the gap
    const suggestedDuration = Math.min(90, Math.max(75, bestGap.duration - 15));
    const endTime = new Date(bestGap.start.getTime() + suggestedDuration * 60 * 1000);

    return {
        startTime: bestGap.start.toISOString(),
        endTime: endTime.toISOString(),
        duration: suggestedDuration,
        score: Math.min(100, bestGap.score),
        reasoning: generateFocusReasoning(bestGap, todayEvents.length)
    };
}

/**
 * Generate reasoning text for focus time suggestion
 */
function generateFocusReasoning(gap, eventCount) {
    const hour = gap.start.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    let reasoning = `This ${gap.duration}-minute window in the ${timeOfDay} provides `;

    if (gap.duration >= 120) {
        reasoning += 'excellent space for deep work with minimal interruptions.';
    } else if (gap.duration >= 90) {
        reasoning += 'good opportunity for focused work before your next commitment.';
    } else {
        reasoning += 'a solid block for concentrated effort.';
    }

    if (eventCount <= 2) {
        reasoning += ' Your light schedule today allows for sustained focus.';
    } else if (eventCount <= 4) {
        reasoning += ' Despite a moderate schedule, this gap offers quality focus time.';
    } else {
        reasoning += ' This is your best available window in a busy day.';
    }

    return reasoning;
}

/**
 * Generate personalized ritual based on calendar context
 * @param {Array} events - Calendar events for context
 * @returns {Object} Generated ritual
 */
function generatePersonalizedRitual(events) {
    const now = new Date();
    const hour = now.getHours();
    const eventCount = events ? events.length : 0;

    // Determine context
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const calendarDensity = eventCount <= 2 ? 'light' : eventCount <= 4 ? 'moderate' : 'busy';

    // Ritual templates based on context
    const rituals = {
        morning: {
            light: {
                name: 'Morning Flow',
                workDuration: 90,
                breakDuration: 15,
                description: 'Start your day with extended deep work when your mind is fresh and your schedule is open.',
                suggestedSoundscape: 'forest'
            },
            moderate: {
                name: 'Morning Sprint',
                workDuration: 75,
                breakDuration: 10,
                description: 'Efficient focused work session designed for productive mornings with upcoming commitments.',
                suggestedSoundscape: 'cafe'
            },
            busy: {
                name: 'Morning Burst',
                workDuration: 50,
                breakDuration: 10,
                description: 'Quick but effective focus session to tackle priorities before a packed day begins.',
                suggestedSoundscape: 'white-noise'
            }
        },
        afternoon: {
            light: {
                name: 'Afternoon Deep Dive',
                workDuration: 85,
                breakDuration: 15,
                description: 'Sustained afternoon focus session perfect for complex tasks and creative work.',
                suggestedSoundscape: 'rain'
            },
            moderate: {
                name: 'Afternoon Focus',
                workDuration: 70,
                breakDuration: 12,
                description: 'Balanced work session that fits well between your afternoon commitments.',
                suggestedSoundscape: 'nature'
            },
            busy: {
                name: 'Power Hour',
                workDuration: 60,
                breakDuration: 8,
                description: 'Concentrated effort designed to maximize productivity in limited time.',
                suggestedSoundscape: 'waves'
            }
        },
        evening: {
            light: {
                name: 'Evening Reflection',
                workDuration: 75,
                breakDuration: 20,
                description: 'Thoughtful evening session with extended breaks for reflection and planning.',
                suggestedSoundscape: 'rain'
            },
            moderate: {
                name: 'Evening Wind-Down',
                workDuration: 60,
                breakDuration: 15,
                description: 'Gentle evening focus with mindful breaks to transition toward rest.',
                suggestedSoundscape: 'forest'
            },
            busy: {
                name: 'Evening Wrap-Up',
                workDuration: 45,
                breakDuration: 10,
                description: 'Quick evening session to complete essential tasks before day\'s end.',
                suggestedSoundscape: 'cafe'
            }
        }
    };

    const selectedRitual = rituals[timeOfDay][calendarDensity];

    return {
        ...selectedRitual,
        mindfulnessBreaks: calendarDensity !== 'busy', // More mindful when less busy
        timeOfDay,
        calendarDensity
    };
}

/**
 * Display focus time result in UI
 * @param {Object} result - Focus window from backend
 */
function displayFocusTimeResult(result) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    // Check if no focus window found
    if (!result || !result.startTime) {
        aiResults.innerHTML = `
            <div class="focus-time-result">
                <div class="focus-time-header">
                    <span>🎯</span>
                    <h5>No Focus Time Available</h5>
                </div>
                <div class="focus-reasoning">
                    No suitable focus windows found in your calendar today. Your schedule is quite full! Consider blocking time tomorrow or finding a shorter 30-minute slot for a quick focus session.
                </div>
                <button class="close-results-btn" data-action="close-results" aria-label="Close results">×</button>
            </div>
        `;
        aiResults.classList.remove('hidden');

        // Add event listeners for dynamic buttons
        addAIResultsEventListeners();
        return;
    }

    // Format times for display
    const startTime = new Date(result.startTime);
    const endTime = new Date(result.endTime);

    const timeFormat = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };

    const startTimeStr = startTime.toLocaleTimeString('en-US', timeFormat);
    const endTimeStr = endTime.toLocaleTimeString('en-US', timeFormat);

    aiResults.innerHTML = `
        <div class="focus-time-result">
            <div class="focus-time-header">
                <span>🎯</span>
                <h5>Optimal Focus Window</h5>
            </div>
            <div class="focus-time-slot">
                <div class="focus-time-duration">${result.duration} min</div>
                <div class="focus-time-period">${startTimeStr} - ${endTimeStr}</div>
                <div class="focus-score">
                    <span>Quality Score:</span>
                    <span class="score-badge">${Math.round(result.score)}/100</span>
                </div>
            </div>
            ${result.reasoning ? `
                <div class="focus-reasoning">${escapeHtml(result.reasoning)}</div>
            ` : ''}
            <button class="start-session-btn" data-action="start-session" data-duration="${result.duration}">
                <span>🚀</span>
                Start Focus Session
            </button>
            <button class="close-results-btn" data-action="close-results" aria-label="Close results">×</button>
        </div>
    `;

    aiResults.classList.remove('hidden');
    announceToScreenReader(`Optimal focus window found from ${startTimeStr} to ${endTimeStr}`);

    // Add event listeners for dynamic buttons
    addAIResultsEventListeners();
}

/**
 * Display ritual result in UI
 * @param {Object} ritual - Generated ritual from backend
 */
function displayRitualResult(ritual) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    // Get soundscape icon
    const soundscapeIcons = {
        'rain': '🌧️',
        'forest': '🌲',
        'cafe': '☕',
        'waves': '🌊',
        'ocean': '🌊',
        'white-noise': '🔊',
        'nature': '🍃',
        'ritual-templates': '📘',
        'affirmations-breaks': '🧘',
        'ambient-orchestral': '🎼',
        'positive-affirmation': '🌅'
    };

    const soundscapeIcon = soundscapeIcons[ritual.suggestedSoundscape?.toLowerCase()] || '🎵';

    aiResults.innerHTML = `
        <div class="ritual-result">
            <div class="ritual-header">
                <span>✨</span>
                <h5>Personalized Ritual</h5>
            </div>
            <div class="ritual-card">
                <div class="ritual-name">${escapeHtml(ritual.name)}</div>
                <div class="ritual-timing">
                    <div class="timing-item">
                        <span class="timing-value">${ritual.workDuration}</span>
                        <span class="timing-label">Work</span>
                    </div>
                    <div class="timing-item">
                        <span class="timing-value">${ritual.breakDuration}</span>
                        <span class="timing-label">Break</span>
                    </div>
                </div>
                <div class="ritual-features">
                    ${ritual.mindfulnessBreaks ? '<span class="feature-badge">🧘 Mindful</span>' : ''}
                    <span class="feature-badge">⚡ Focused</span>
                    <span class="feature-badge">🎯 Adaptive</span>
                </div>
                ${ritual.description ? `
                    <div class="ritual-description">${escapeHtml(ritual.description)}</div>
                ` : ''}
                ${ritual.suggestedSoundscape ? `
                    <div class="soundscape-suggestion">
                        <span class="soundscape-icon">${soundscapeIcon}</span>
                        <span>Recommended: ${escapeHtml(ritual.suggestedSoundscape)}</span>
                    </div>
                ` : ''}
                <button class="use-ritual-btn" data-action="use-ritual" data-name="${escapeHtml(ritual.name)}" data-work="${ritual.workDuration}" data-break="${ritual.breakDuration}" data-soundscape="${ritual.suggestedSoundscape || 'rain'}">
                    <span>🚀</span>
                    Use This Ritual
                </button>
            </div>
            <button class="close-results-btn" data-action="close-results" aria-label="Close results">×</button>
        </div>
    `;

    aiResults.classList.remove('hidden');
    announceToScreenReader(`Ritual generated: ${ritual.name}`);

    // Add event listeners for dynamic buttons
    addAIResultsEventListeners();
}

/**
 * Show AI loading state
 * @param {string} message - Loading message
 */
function showAILoading(message) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    aiResults.innerHTML = `
        <div class="ai-loading">
            <div class="ai-spinner"></div>
            <div class="ai-loading-text">${escapeHtml(message)}</div>
        </div>
    `;
    aiResults.classList.remove('hidden');
}

/**
 * Show AI error state
 * @param {string} message - Error message
 */
function showAIError(message) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    aiResults.innerHTML = `
        <div class="ai-error">
            <div class="ai-error-icon">⚠️</div>
            <div class="ai-error-message">${escapeHtml(message)}</div>
            <button class="retry-ai-btn" data-action="retry-ai">
                <span>🔄</span>
                Try Again
            </button>
            <button class="close-results-btn" data-action="close-results" aria-label="Close results">×</button>
        </div>
    `;
    aiResults.classList.remove('hidden');
}

// ============================================================================
// FOCUS MODE IMPLEMENTATION
// ============================================================================

// Setup event listeners for session screen
function setupSessionEventListeners() {
    const sessionContainer = document.querySelector('.session-container');
    if (sessionContainer) {
        // Add mouse movement listener
        sessionContainer.addEventListener('mousemove', handleMouseActivity);

        // Add button event listeners
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const startBtn = document.getElementById('start-btn');
        
        if (startBtn) {
            startBtn.addEventListener('click', handleStartSessionButton);
            startBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleStartSessionButton));
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', handlePauseSession);
            pauseBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handlePauseSession));
        }


        if (stopBtn) {
            stopBtn.addEventListener('click', handleStopSession);
            stopBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, handleStopSession));
        }

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', handleVolumeChange);
            volumeSlider.addEventListener('change', handleVolumeChange);
        }

        const soundscapeSelector = document.getElementById('soundscape-selector');
        if (soundscapeSelector) {
            populateSoundscapeOptions(soundscapeSelector);
            soundscapeSelector.addEventListener('change', handleSoundscapeChange);
        }

        updateSessionControlState(focusTimerStatus);
        updateTimerDisplay();
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

    updateSessionControlState(focusTimerStatus);
    updateTimerDisplay();

    if (focusTimerStatus === SESSION_STATUS.RUNNING) {
        playFocusAudio(focusTimerSoundscape);
    }
}

// Handle pause session button click
function handlePauseSession() {
    console.log('Pause session clicked');
    pauseFocusTimer();
}

// Handle stop session button click
function handleStopSession() {
    console.log('Stop session clicked');
    stopFocusTimer({ resetToDefault: false });
    // Return to events screen
    showScreen('events');
}

// ============================================================================
// FOCUS TIMER STATE MANAGEMENT
// ============================================================================

function handleStartSessionButton() {
    if (focusTimerStatus === SESSION_STATUS.RUNNING) {
        return;
    }

    if (focusTimerStatus === SESSION_STATUS.IDLE) {
        focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
    } else if (focusTimerStatus === SESSION_STATUS.PENDING && focusTimerRemainingMs <= 0) {
        focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
    } else if (focusTimerStatus === SESSION_STATUS.PAUSED && focusTimerRemainingMs <= 0) {
        focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
    }

    startFocusTimerCountdown({ announce: true });
}

function updateSessionControlState(status) {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (!startBtn || !pauseBtn || !stopBtn) {
        return;
    }

    switch (status) {
        case SESSION_STATUS.RUNNING:
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            stopBtn.classList.remove('hidden');
            break;
        case SESSION_STATUS.PAUSED:
            startBtn.textContent = 'Resume';
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            break;
        case SESSION_STATUS.PENDING:
            startBtn.textContent = 'Start';
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.add('hidden');
            break;
        default:
            startBtn.textContent = 'Start';
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.add('hidden');
            break;
    }
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) {
        return;
    }

    let displayMs = focusTimerRemainingMs;

    if (!displayMs || displayMs <= 0) {
        const fallbackMinutes = focusTimerDurationMinutes || DEFAULT_SESSION_DURATION_MINUTES;
        displayMs = fallbackMinutes * 60 * 1000;
    }

    timerDisplay.textContent = formatMilliseconds(displayMs);
}

function formatMilliseconds(ms) {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
}

function startFocusTimerCountdown({ announce = false } = {}) {
    if (focusTimerRemainingMs <= 0) {
        focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
    }

    focusTimerEndTime = Date.now() + focusTimerRemainingMs;
    focusTimerStatus = SESSION_STATUS.RUNNING;

    updateSessionControlState(focusTimerStatus);
    persistFocusTimerState();
    updateTimerDisplay();

    playFocusAudio(focusTimerSoundscape);
    startFocusTimerInterval();

    if (announce) {
        const minutesRemaining = Math.max(1, Math.ceil(focusTimerRemainingMs / 60000));
        announceToScreenReader(`Focus session started with ${minutesRemaining} minutes remaining`);
    }
}

function startFocusTimerInterval() {
    clearFocusTimerInterval();

    if (focusTimerStatus !== SESSION_STATUS.RUNNING || !focusTimerEndTime) {
        return;
    }

    focusTimerIntervalId = setInterval(() => {
        if (focusTimerStatus !== SESSION_STATUS.RUNNING || !focusTimerEndTime) {
            clearFocusTimerInterval();
            return;
        }

        const remaining = focusTimerEndTime - Date.now();
        focusTimerRemainingMs = Math.max(0, remaining);
        updateTimerDisplay();

        if (remaining <= 0) {
            clearFocusTimerInterval();
            completeFocusTimer();
        }
    }, 1000);
}

function clearFocusTimerInterval() {
    if (focusTimerIntervalId) {
        clearInterval(focusTimerIntervalId);
        focusTimerIntervalId = null;
    }
}

function pauseFocusTimer() {
    if (focusTimerStatus !== SESSION_STATUS.RUNNING) {
        return;
    }

    const remaining = focusTimerEndTime ? Math.max(0, focusTimerEndTime - Date.now()) : focusTimerRemainingMs;
    focusTimerRemainingMs = remaining;
    focusTimerEndTime = null;
    focusTimerStatus = SESSION_STATUS.PAUSED;

    clearFocusTimerInterval();
    persistFocusTimerState();
    updateSessionControlState(focusTimerStatus);
    updateTimerDisplay();
    stopFocusAudio();
    announceToScreenReader('Focus session paused');
}

function stopFocusTimer({ resetToDefault = false } = {}) {
    clearFocusTimerInterval();
    focusTimerEndTime = null;

    if (resetToDefault) {
        focusTimerDurationMinutes = DEFAULT_SESSION_DURATION_MINUTES;
    }

    focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
    focusTimerStatus = SESSION_STATUS.IDLE;

    persistFocusTimerState({ remove: true });
    updateSessionControlState(focusTimerStatus);
    updateTimerDisplay();
    stopFocusAudio();
}

function completeFocusTimer() {
    focusTimerStatus = SESSION_STATUS.IDLE;
    focusTimerEndTime = null;
    focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;

    persistFocusTimerState({ remove: true });
    updateSessionControlState(focusTimerStatus);
    updateTimerDisplay();
    stopFocusAudio();
    showSessionEndedUI();
    announceToScreenReader('Focus session completed');
}

function prepareFocusTimer(durationMinutes, options = {}) {
    const safeMinutes = Number(durationMinutes) && durationMinutes > 0 ? Number(durationMinutes) : DEFAULT_SESSION_DURATION_MINUTES;
    focusTimerDurationMinutes = safeMinutes;

    if (options.remainingMs && options.remainingMs > 0) {
        focusTimerRemainingMs = options.remainingMs;
    } else {
        focusTimerRemainingMs = safeMinutes * 60 * 1000;
    }

    focusTimerStatus = options.status || SESSION_STATUS.PENDING;
    focusTimerEndTime = null;

    const resolvedSoundscape = resolveSoundscapeKey(options.soundscape || focusTimerSoundscape || 'rain');
    focusTimerSoundscape = resolvedSoundscape;
    currentSoundscape = resolvedSoundscape;

    const soundscapeSelector = document.getElementById('soundscape-selector');
    if (soundscapeSelector) {
        soundscapeSelector.value = resolvedSoundscape;
    }

    updateTimerDisplay();
    updateSessionControlState(focusTimerStatus);
    persistFocusTimerState();
}

function persistFocusTimerState({ remove = false } = {}) {
    try {
        if (remove || focusTimerStatus === SESSION_STATUS.IDLE) {
            chrome.storage.local.remove(FOCUS_TIMER_STORAGE_KEY);
            return;
        }

        const state = {
            status: focusTimerStatus,
            durationMinutes: focusTimerDurationMinutes,
            remainingMs: focusTimerRemainingMs,
            endTime: focusTimerEndTime,
            soundscape: focusTimerSoundscape
        };

        chrome.storage.local.set({ [FOCUS_TIMER_STORAGE_KEY]: state });
    } catch (error) {
        console.error('Failed to persist focus timer state:', error);
    }
}

function restoreFocusTimerState() {
    try {
        chrome.storage.local.get([FOCUS_TIMER_STORAGE_KEY], (result) => {
            const stored = result ? result[FOCUS_TIMER_STORAGE_KEY] : null;

            if (!stored) {
                focusTimerStatus = SESSION_STATUS.IDLE;
                focusTimerDurationMinutes = DEFAULT_SESSION_DURATION_MINUTES;
                focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
                focusTimerEndTime = null;
                focusTimerSoundscape = 'rain';
                updateSessionControlState(focusTimerStatus);
                updateTimerDisplay();
                return;
            }

            focusTimerStatus = stored.status || SESSION_STATUS.IDLE;
            focusTimerDurationMinutes = stored.durationMinutes || DEFAULT_SESSION_DURATION_MINUTES;
            focusTimerRemainingMs = stored.remainingMs || (focusTimerDurationMinutes * 60 * 1000);
            focusTimerEndTime = stored.endTime || null;
            focusTimerSoundscape = resolveSoundscapeKey(stored.soundscape || focusTimerSoundscape || 'rain');
            currentSoundscape = focusTimerSoundscape;

            const soundscapeSelector = document.getElementById('soundscape-selector');
            if (soundscapeSelector) {
                soundscapeSelector.value = focusTimerSoundscape;
            }

            if (focusTimerStatus === SESSION_STATUS.RUNNING && focusTimerEndTime) {
                const remaining = focusTimerEndTime - Date.now();
                if (remaining <= 0) {
                    completeFocusTimer();
                    return;
                }

                focusTimerRemainingMs = remaining;
                updateSessionControlState(focusTimerStatus);
                updateTimerDisplay();
                startFocusTimerInterval();
            } else if (focusTimerStatus === SESSION_STATUS.PAUSED || focusTimerStatus === SESSION_STATUS.PENDING) {
                focusTimerEndTime = null;
                updateSessionControlState(focusTimerStatus);
                updateTimerDisplay();
            } else {
                focusTimerStatus = SESSION_STATUS.IDLE;
                focusTimerEndTime = null;
                focusTimerRemainingMs = focusTimerDurationMinutes * 60 * 1000;
                updateSessionControlState(focusTimerStatus);
                updateTimerDisplay();
            }
        });
    } catch (error) {
        console.error('Failed to restore focus timer state:', error);
    }
}

function handleVolumeChange(event) {
    const rawValue = Number(event.target.value);
    const normalizedVolume = Number.isNaN(rawValue) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, rawValue / 100));
    setFocusAudioVolume(normalizedVolume);
}

function handleSoundscapeChange(event) {
    const selectedSoundscape = event.target.value || 'rain';
    const resolved = resolveSoundscapeKey(selectedSoundscape);
    focusTimerSoundscape = resolved;
    currentSoundscape = resolved;
    persistFocusTimerState();

    if (focusTimerStatus === SESSION_STATUS.RUNNING) {
        playFocusAudio(resolved);
    } else {
        stopFocusAudio();
    }
}

function populateSoundscapeOptions(soundscapeSelector) {
    const selector = soundscapeSelector || document.getElementById('soundscape-selector');
    if (!selector) {
        return;
    }

    selector.innerHTML = '';

    const fragment = document.createDocumentFragment();
    Object.entries(SOUNDSCAPE_AUDIO_MAP).forEach(([key, meta]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = meta.label || key;
        fragment.appendChild(option);
    });

    selector.appendChild(fragment);

    const resolvedDefault = resolveSoundscapeKey(focusTimerSoundscape || currentSoundscape);
    focusTimerSoundscape = resolvedDefault;
    currentSoundscape = resolvedDefault;
    selector.value = resolvedDefault;
}

function resolveSoundscapeKey(soundscape) {
    const normalizedInput = (soundscape || '').toString().toLowerCase().trim();
    if (!normalizedInput) {
        return 'rain';
    }

    if (SOUNDSCAPE_AUDIO_MAP[normalizedInput]) {
        return normalizedInput;
    }

    const hyphenatedInput = normalizedInput.replace(/[\s_]+/g, '-');
    if (SOUNDSCAPE_AUDIO_MAP[hyphenatedInput]) {
        return hyphenatedInput;
    }

    for (const [key, meta] of Object.entries(SOUNDSCAPE_AUDIO_MAP)) {
        if (!meta.aliases) {
            continue;
        }

        const match = meta.aliases.some(alias => {
            const aliasNormalized = alias.toLowerCase().trim();
            if (aliasNormalized === normalizedInput) {
                return true;
            }

            const aliasHyphenated = aliasNormalized.replace(/[\s_]+/g, '-');
            return aliasHyphenated === hyphenatedInput;
        });
        if (match) {
            return key;
        }
    }

    if (normalizedInput && normalizedInput !== 'rain') {
        console.warn(`Soundscape '${normalizedInput}' not available. Defaulting to rain.`);
    }

    return 'rain';
}

function getVolumeFromSlider() {
    const volumeSlider = document.getElementById('volume-slider');
    if (!volumeSlider) {
        return DEFAULT_VOLUME;
    }

    const rawValue = Number(volumeSlider.value);
    if (Number.isNaN(rawValue)) {
        return DEFAULT_VOLUME;
    }

    return Math.min(1, Math.max(0, rawValue / 100));
}

function setFocusAudioVolume(volume) {
    if (!focusAudio) {
        return;
    }

    const clampedVolume = Math.min(1, Math.max(0, volume));
    focusAudio.volume = clampedVolume;
}

function playFocusAudio(soundscape = 'rain') {
    const resolvedSoundscape = resolveSoundscapeKey(soundscape);
    const soundscapeMeta = SOUNDSCAPE_AUDIO_MAP[resolvedSoundscape];
    const audioPath = soundscapeMeta?.path;
    if (!audioPath) {
        console.error(`No audio configured for soundscape '${resolvedSoundscape}'.`);
        return;
    }
    const audioUrl = chrome.runtime.getURL(audioPath);

    if (!focusAudio) {
        focusAudio = new Audio(audioUrl);
        focusAudio.loop = true;
    }

    const audioChanged = focusAudio.src !== audioUrl;
    if (audioChanged) {
        focusAudio.pause();
        focusAudio.src = audioUrl;
    }

    currentSoundscape = resolvedSoundscape;
    focusTimerSoundscape = resolvedSoundscape;

    const currentVolume = getVolumeFromSlider();
    setFocusAudioVolume(currentVolume);

    try {
        if (audioChanged) {
            focusAudio.currentTime = 0;
        }
        const playPromise = focusAudio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(error => {
                console.error('Failed to play focus audio:', error);
            });
        }
    } catch (error) {
        console.error('Failed to play focus audio:', error);
    }

    const soundscapeSelector = document.getElementById('soundscape-selector');
    if (soundscapeSelector && soundscapeSelector.value !== resolvedSoundscape) {
        soundscapeSelector.value = resolvedSoundscape;
    }
}

function stopFocusAudio() {
    if (!focusAudio) {
        return;
    }

    focusAudio.pause();
    focusAudio.currentTime = 0;
}

// ============================================================================
// THEME SYSTEM IMPLEMENTATION
// ============================================================================

// Initialize theme system
async function initializeTheme() {
    // Load saved theme from storage
    try {
        const theme = await Platform.getData('auraflow_theme');
        if (theme) {
            applyTheme(theme);
            // Update active state on theme buttons
            updateThemeButtonStates(theme);
        }
    } catch (error) {
        console.error('Error loading theme:', error);
    }

    // Set up theme button event listeners
    setupThemeButtons();
}

// Set up theme button event listeners
function setupThemeButtons() {
    const lightBtn = document.getElementById('theme-light-button');
    const darkBtn = document.getElementById('theme-dark-button');
    const calmBtn = document.getElementById('theme-calm-button');
    const beachBtn = document.getElementById('theme-beach-button');
    const rainBtn = document.getElementById('theme-rain-button');

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

    if (beachBtn) {
        beachBtn.addEventListener('click', () => switchTheme('beach'));
        beachBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, () => switchTheme('beach')));
    }

    if (rainBtn) {
        rainBtn.addEventListener('click', () => switchTheme('rain'));
        rainBtn.addEventListener('keydown', (e) => handleButtonKeydown(e, () => switchTheme('rain')));
    }
}

// Switch theme
async function switchTheme(theme) {
    applyTheme(theme);

    // Save theme preference
    try {
        await Platform.saveData('auraflow_theme', theme);
    } catch (error) {
        console.error('Error saving theme:', error);
    }

    // Update active state on buttons
    updateThemeButtonStates(theme);

    // Announce theme change to screen readers
    announceToScreenReader(`Theme changed to ${theme}`);
}

// Apply theme to document
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-calm', 'theme-beach', 'theme-rain');

    // Add new theme class
    document.body.classList.add(`theme-${theme}`);

    // Update background animations
    updateBackgroundAnimation(theme);

    currentTheme = theme;
}

/**
 * Update background animations based on theme
 * @param {string} theme - The selected theme
 */
function updateBackgroundAnimation(theme) {
    const rainBg = document.getElementById('rain-background');
    const wavesBg = document.getElementById('waves-background');

    // Hide all animations first
    if (rainBg) rainBg.classList.remove('active');
    if (wavesBg) wavesBg.classList.remove('active');

    // Show appropriate animation
    if (theme === 'rain' && rainBg) {
        rainBg.classList.add('active');
        generateRainDrops();
    } else if (theme === 'beach' && wavesBg) {
        wavesBg.classList.add('active');
    }
}

/**
 * Generate rain drops animation
 */
function generateRainDrops() {
    const rainContainer = document.getElementById('rain-background');
    if (!rainContainer) return;

    // Clear existing drops
    rainContainer.innerHTML = '';

    // Generate 60 rain drops
    for (let i = 0; i < 60; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';

        // Random positioning and timing
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 1.5 + 0.5) + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';

        rainContainer.appendChild(drop);
    }
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

// Update theme button states on initialization
function updateInitialThemeState() {
    updateThemeButtonStates(currentTheme);
}

// ============================================================================
// QUICK START IMPLEMENTATION
// ============================================================================

// Initialize Quick Start feature
async function initializeQuickStart() {
    // Load saved session settings from storage
    try {
        const settings = await Platform.getData('auraflow_last_session');
        if (settings) {
            lastSessionSettings = settings;
            updateQuickStartButton();
        }
    } catch (error) {
        console.error('Error loading Quick Start settings:', error);
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
    startFocusSessionFromSettings(lastSessionSettings);
}

// Save session settings when starting a new session
async function saveSessionSettings(settings) {
    lastSessionSettings = settings;

    // Save to storage for persistence
    try {
        await Platform.saveData('auraflow_last_session', settings);
        console.log('Session settings saved:', settings);
    } catch (error) {
        console.error('Error saving session settings:', error);
    }
}

// Start a focus session with the given settings or duration
function startFocusSession(settingsOrDuration, breakDuration, taskGoal) {
    console.log('Starting focus session with:', settingsOrDuration);

    // Handle different parameter types
    if (typeof settingsOrDuration === 'number') {
        // Called with duration only
        const duration = settingsOrDuration;

        // Store session settings
        chrome.storage.local.set({
            sessionDuration: duration,
            sessionType: 'focus'
        });

        // Switch to session screen
        showSessionScreen();

        // Start the timer
        startTimer(duration);

        announceToScreenReader(`Starting ${duration} minute focus session`);
    } else {
        // Called with settings object
        const settings = settingsOrDuration;

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
    }
// Start a focus session with the given settings
function startFocusSessionFromSettings(settings) {
    console.log('Starting focus session with settings:', settings);
    
    const durationMinutes = settings?.ritual?.workDuration || focusTimerDurationMinutes;
    const resolvedSoundscape = resolveSoundscapeKey(settings?.soundscape || focusTimerSoundscape);

    prepareFocusTimer(durationMinutes, { soundscape: resolvedSoundscape, status: SESSION_STATUS.PENDING });
    showSessionScreen();
    hideAIResults();
    startFocusTimerCountdown({ announce: true });
}

// ============================================================================
// GENTLE NUDGE SESSION CONTROL
// ============================================================================

/**
 * Handle Quick Focus button click - starts a standard 25-minute focus session
 */
function handleQuickFocus() {
    console.log('Quick Focus button clicked');

    // Start a standard 25-minute focus session
    startFocusSession(25);

    announceToScreenReader('Starting 25 minute focus session');
 * Starts a focus session with notifications
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} taskGoal - User's task goal
 */
async function startFocusSessionWithNotifications(workDuration, breakDuration, taskGoal) {
  try {
    // Start the session with notifications
    const response = await sendMessageToServiceWorker({
      action: 'startSession',
      data: {
        workDuration,
        breakDuration,
        taskGoal
      }
    });
    
    if (response.success) {
      console.log('Focus session started');
      
      // Enable website blocking
      try {
        const blockingResponse = await sendMessageToServiceWorker({
          action: 'startFocus'
        });
        if (blockingResponse.success) {
          console.log('Website blocking enabled');
        }
      } catch (blockingError) {
        console.warn('Failed to enable blocking, but session continues:', blockingError);
      }
      
      // Update UI to show active session
      showSessionStartedUI(workDuration, breakDuration, taskGoal);
      announceToScreenReader(`Focus session started: ${workDuration} minutes of work, ${breakDuration} minutes of break`);

      const durationMinutes = Number(workDuration) && workDuration > 0 ? Number(workDuration) : DEFAULT_SESSION_DURATION_MINUTES;
      prepareFocusTimer(durationMinutes, { soundscape: currentSoundscape, status: SESSION_STATUS.PENDING });
      startFocusTimerCountdown({ announce: false });
    } else {
      throw new Error(response.error || 'Failed to start session');
    }
  } catch (error) {
    console.error('Failed to start focus session:', error);
    showError('Failed to start focus session. Please try again.');
  }
}

/**
 * Ends the current focus session early
 */
async function endFocusSession() {
    try {
        // End the session
        const response = await sendMessageToServiceWorker({
            action: 'endSession'
        });

        if (response.success) {
            console.log('Focus session ended');

            // Disable website blocking
            try {
                const blockingResponse = await sendMessageToServiceWorker({
                    action: 'endFocus'
                });
                if (blockingResponse.success) {
                    console.log('Website blocking disabled');
                }
            } catch (blockingError) {
                console.warn('Failed to disable blocking:', blockingError);
            }

            // Update UI to show session ended
            showSessionEndedUI();
            announceToScreenReader('Focus session ended');
        } else {
            throw new Error(response.error || 'Failed to end session');
        }
    } catch (error) {
        console.error('Failed to end focus session:', error);
        showError('Failed to end focus session. Please try again.');
    }
  try {
    // End the session
    const response = await sendMessageToServiceWorker({
      action: 'endSession'
    });
    
    if (response.success) {
      console.log('Focus session ended');
      
      // Disable website blocking
      try {
        const blockingResponse = await sendMessageToServiceWorker({
          action: 'endFocus'
        });
        if (blockingResponse.success) {
          console.log('Website blocking disabled');
        }
      } catch (blockingError) {
        console.warn('Failed to disable blocking:', blockingError);
      }
      
      // Update UI to show session ended
      stopFocusTimer({ resetToDefault: false });
      showSessionEndedUI();
      announceToScreenReader('Focus session ended');
    } else {
      throw new Error(response.error || 'Failed to end session');
    }
  } catch (error) {
    console.error('Failed to end focus session:', error);
    showError('Failed to end focus session. Please try again.');
  }
}

/**
 * Shows UI for active session
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} taskGoal - Task goal
 */
function showSessionStartedUI(workDuration, breakDuration, taskGoal) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    const endTime = new Date(Date.now() + workDuration * 60 * 1000);
    const endTimeStr = endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    aiResults.innerHTML = `
    <div class="ai-result-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      <div class="ai-result-title" style="color: white;">🎯 Focus Session Active</div>
      <div class="ai-result-content">
        <div class="ai-result-detail" style="color: rgba(255,255,255,0.95);">
          <span class="ai-result-label" style="color: rgba(255,255,255,0.8);">Task:</span>
          <span class="ai-result-value">${escapeHtml(taskGoal || 'Focus session')}</span>
        </div>
        <div class="ai-result-detail" style="color: rgba(255,255,255,0.95);">
          <span class="ai-result-label" style="color: rgba(255,255,255,0.8);">Work Duration:</span>
          <span class="ai-result-value">${workDuration} minutes</span>
        </div>
        <div class="ai-result-detail" style="color: rgba(255,255,255,0.95);">
          <span class="ai-result-label" style="color: rgba(255,255,255,0.8);">Break Duration:</span>
          <span class="ai-result-value">${breakDuration} minutes</span>
        </div>
        <div class="ai-result-detail" style="color: rgba(255,255,255,0.95);">
          <span class="ai-result-label" style="color: rgba(255,255,255,0.8);">Work ends at:</span>
          <span class="ai-result-value">${endTimeStr}</span>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.3);">
          <p style="font-size: 12px; color: rgba(255,255,255,0.9); margin-bottom: 8px;">
            You'll receive a notification when it's time for your break. You can close this popup.
          </p>
          <button id="end-session-btn" class="btn btn-secondary" style="width: 100%; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);">
            End Session Early
          </button>
        </div>
      </div>
    </div>
  `;

    aiResults.classList.remove('hidden');

    // Add event listener to end session button
    const endSessionBtn = document.getElementById('end-session-btn');
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', endFocusSession);
    }
}

/**
 * Shows UI for ended session
 */
function showSessionEndedUI() {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    aiResults.innerHTML = `
    <div class="ai-result-card">
      <div class="ai-result-title">✅ Session Ended</div>
      <div class="ai-result-content">
        <p>Your focus session has been ended. Great work!</p>
      </div>
    </div>
  `;

    aiResults.classList.remove('hidden');

    // Hide after 3 seconds
    setTimeout(() => {
        aiResults.classList.add('hidden');
    }, 3000);
}


// ============================================================================
// WEBSITE BLOCKING (DISTRACTION SHIELD)
// ============================================================================

/**
 * Loads the blocked sites list from storage and populates the textarea
 */
async function loadBlockedSites() {
    try {
        const blockedSites = await Platform.getData('auraFlowBlockedSites') || [];

        const textarea = document.getElementById('blocked-sites-list');
        if (textarea && blockedSites.length > 0) {
            textarea.value = blockedSites.join('\n');
        }
    } catch (error) {
        console.error('Failed to load blocked sites:', error);
    }
}

/**
 * Handles saving the blocked sites list
 */
async function handleSaveBlockedSites() {
    try {
        const textarea = document.getElementById('blocked-sites-list');
        if (!textarea) return;

        // Get text content and split by newlines
        const text = textarea.value;
        const sites = text
            .split('\n')
            .map(site => site.trim())
            .filter(site => site.length > 0); // Remove empty lines

        // Save to storage
        await Platform.saveData('auraFlowBlockedSites', sites);

        console.log('Blocked sites saved:', sites);

        // Show success feedback
        showBlockingSaveSuccess();

        // Announce to screen reader
        announceToScreenReader(`Saved ${sites.length} blocked sites`);
    } catch (error) {
        console.error('Failed to save blocked sites:', error);
        showError('Failed to save blocked sites. Please try again.');
    }
}

/**
 * Hide AI results panel
 */
function hideAIResults() {
    const aiResults = document.getElementById('ai-results');
    if (aiResults) {
        aiResults.classList.add('hidden');
        aiResults.innerHTML = '';
    }
}

/**
 * Start focus session with specified duration
 * @param {number} duration - Session duration in minutes
 */
function startFocusSession(duration) {
    console.log(`Starting focus session for ${duration} minutes`);

    const durationMinutes = Number(duration) && duration > 0 ? Number(duration) : DEFAULT_SESSION_DURATION_MINUTES;

    // Store session settings for legacy integrations
    chrome.storage.local.set({
        sessionDuration: durationMinutes,
        sessionType: 'focus'
    });

    prepareFocusTimer(durationMinutes, { soundscape: currentSoundscape, status: SESSION_STATUS.PENDING });
    showSessionScreen();
    hideAIResults();
    startFocusTimerCountdown({ announce: true });
}

/**
 * Use the generated ritual for a session
 * @param {string} name - Ritual name
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} soundscape - Recommended soundscape
 */
async function useRitual(name, workDuration, breakDuration, soundscape) {
    console.log(`Using ritual: ${name}, Work: ${workDuration}, Break: ${breakDuration}, Soundscape: ${soundscape}`);

    try {
        // Store ritual settings using Chrome storage
        chrome.storage.local.set({
            ritualName: name,
            sessionDuration: workDuration,
            breakDuration: breakDuration,
            recommendedSoundscape: soundscape,
            sessionType: 'ritual'
        });

        // Set the soundscape selector if available
        const soundscapeSelector = document.getElementById('soundscape-selector');
        if (soundscapeSelector) {
            soundscapeSelector.value = soundscape;
        }

        // Switch to session screen
        showSessionScreen();

        // Start the timer (simplified for now)
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `${workDuration}:00`;
        }

        // Hide AI results
        hideAIResults();

        announceToScreenReader(`Starting ${name} ritual with ${workDuration} minute work session`);

    } catch (error) {
        console.error('Error using ritual:', error);
        showAIError('Failed to start ritual. Please try again.');
    }
function useRitual(name, workDuration, breakDuration, soundscape) {
    console.log(`Using ritual: ${name}`);

    // Store ritual settings
    chrome.storage.local.set({
        ritualName: name,
        sessionDuration: workDuration,
        breakDuration: breakDuration,
        recommendedSoundscape: soundscape,
        sessionType: 'ritual'
    });
    
    const resolvedSoundscape = resolveSoundscapeKey(soundscape);
    const durationMinutes = Number(workDuration) && workDuration > 0 ? Number(workDuration) : DEFAULT_SESSION_DURATION_MINUTES;

    prepareFocusTimer(durationMinutes, { soundscape: resolvedSoundscape, status: SESSION_STATUS.PENDING });
    showSessionScreen();
    hideAIResults();
    startFocusTimerCountdown({ announce: true });
    announceToScreenReader(`Starting ${name} ritual with ${durationMinutes} minute work session`);
}

/**
 * Retry the last AI action
 */
function retryLastAIAction() {
    // Store the last action type to retry
    if (window.lastAIAction === 'focus') {
        handleFindFocusTime();
    } else if (window.lastAIAction === 'ritual') {
        handleGenerateRitual();
    }
}

/**
 * Add event listeners for dynamically created AI result buttons
 */
function addAIResultsEventListeners() {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;

    // Use event delegation
    aiResults.addEventListener('click', (e) => {
        const action = e.target.dataset.action;

        if (action === 'close-results') {
            hideAIResults();
        } else if (action === 'start-session') {
            const duration = parseInt(e.target.dataset.duration);
            startFocusSession(duration);
        } else if (action === 'use-ritual') {
            const name = e.target.dataset.name;
            const work = parseInt(e.target.dataset.work);
            const breakTime = parseInt(e.target.dataset.break);
            const soundscape = e.target.dataset.soundscape;
            useRitual(name, work, breakTime, soundscape);
        } else if (action === 'retry-ai') {
            retryLastAIAction();
        }
    });
}

// ============================================================================
// SLACK STATUS CONTROL
// ============================================================================

/**
 * Handle Connect Slack button click
 * Initiates OAuth flow to authenticate with Slack
 */
async function handleConnectSlack() {
    console.log('Connect Slack button clicked');

    const connectBtn = document.getElementById('connect-slack-btn');
    if (!connectBtn) return;

    try {
        // Show loading state
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="btn-icon">⏳</span> Connecting...';

        // Send authentication request to service worker
        const response = await sendMessageToServiceWorker({ action: 'authenticateSlack' });

        if (response && response.success) {
            console.log('Slack authentication successful');

            // Show connected state
            const workspaceName = response.data?.workspaceName || 'Slack Workspace';
            showSlackConnectedState(workspaceName);

            // Load current status
            await loadCurrentSlackStatus();

            announceToScreenReader('Successfully connected to Slack');
        } else {
            throw new Error(response?.error || 'Failed to connect to Slack');
        }
    } catch (error) {
        console.error('Slack authentication error:', error);
        displaySlackError(error.message || 'Failed to connect to Slack. Please try again.');

        // Reset button state
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<span class="btn-icon">🔗</span> Connect Slack';
    }
}

/**
 * Handle Disconnect Slack button click
 * Clears tokens and updates UI to disconnected state
 */
async function handleDisconnectSlack() {
    console.log('Disconnect Slack button clicked');

    try {
        // Send disconnect request to service worker
        const response = await sendMessageToServiceWorker({ action: 'disconnectSlack' });

        if (response && response.success) {
            console.log('Slack disconnected successfully');
            showSlackDisconnectedState();
            announceToScreenReader('Disconnected from Slack');
        } else {
            throw new Error(response?.error || 'Failed to disconnect from Slack');
        }
    } catch (error) {
        console.error('Slack disconnect error:', error);
        displaySlackError(error.message || 'Failed to disconnect. Please try again.');
    }
}

/**
 * Handle Slack status change button click
 * Sends status update request to service worker
 * Status is automatically stored in chrome.storage.local by the service worker
 * @param {string} status - The status to set ('available', 'focused', 'dnd')
 */
async function handleSlackStatusChange(status) {
    console.log('Slack status change requested:', status);

    // Don't update if clicking the currently active status
    const button = document.querySelector(`.slack-status-btn[data-status="${status}"]`);
    if (!button) return;

    if (button.classList.contains('active')) {
        console.log('Status already active, no action needed');
        return;
    }

    try {
        // Show loading state on the clicked button
        const spinner = button.querySelector('.loading-spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
        button.disabled = true;

        // Send status update request to service worker
        // The service worker will update Slack and store the status in chrome.storage.local
        const response = await sendMessageToServiceWorker({
            action: 'updateSlackStatus',
            status: status
        });

        if (response && response.success) {
            console.log('Slack status updated and stored successfully:', status);

            // Update UI to reflect new active status
            updateSlackStatusUI(status);

            announceToScreenReader(`Slack status set to ${status}`);
        } else {
            throw new Error(response?.error || 'Failed to update Slack status');
        }
    } catch (error) {
        console.error('Slack status update error:', error);
        displaySlackError(error.message || 'Failed to update status. Please try again.');
    } finally {
        // Hide loading state
        const spinner = button.querySelector('.loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
        button.disabled = false;
    }
}

/**
 * Load current Slack status from service worker
 * Fetches and displays the current status to sync with actual Slack state
 * Handles cases where status was changed outside the extension
 */
async function loadCurrentSlackStatus() {
    console.log('Loading current Slack status from Slack API');

    try {
        // Fetch current status from Slack API
        const response = await sendMessageToServiceWorker({ action: 'getCurrentSlackStatus' });

        if (response && response.success && response.data) {
            const currentStatus = response.data.status;
            const currentEmoji = response.data.emoji;
            const currentText = response.data.text;
            const fromCache = response.data.fromCache;

            console.log('Current Slack status:', {
                status: currentStatus,
                emoji: currentEmoji,
                text: currentText,
                fromCache: fromCache
            });

            // Get last known status from storage to compare
            const lastStatusResponse = await sendMessageToServiceWorker({ action: 'getLastSlackStatus' });
            const lastStatus = lastStatusResponse?.data?.status;

            // Update UI with current status
            if (currentStatus) {
                updateSlackStatusUI(currentStatus);

                // If status differs from last known, log it
                if (lastStatus && lastStatus !== currentStatus) {
                    console.log(`Status changed outside extension: ${lastStatus} -> ${currentStatus}`);
                    announceToScreenReader(`Slack status synced to ${currentStatus}`);
                }
            } else if (lastStatus) {
                // If we couldn't determine current status from Slack, use last known
                console.log('Could not determine current status, using last known:', lastStatus);
                updateSlackStatusUI(lastStatus);
            }

            // Show warning if displaying cached status
            if (fromCache) {
                console.warn('Displaying cached status - could not fetch from Slack');
            }
        } else {
            // If fetching failed, try to show last known status
            const lastStatusResponse = await sendMessageToServiceWorker({ action: 'getLastSlackStatus' });
            if (lastStatusResponse && lastStatusResponse.success && lastStatusResponse.data) {
                const lastStatus = lastStatusResponse.data.status;
                if (lastStatus) {
                    console.log('Using last known status from storage:', lastStatus);
                    updateSlackStatusUI(lastStatus);
                }
            }
        }
    } catch (error) {
        console.error('Error loading Slack status:', error);

        // Try to fall back to last known status from storage
        try {
            const lastStatusResponse = await sendMessageToServiceWorker({ action: 'getLastSlackStatus' });
            if (lastStatusResponse && lastStatusResponse.success && lastStatusResponse.data) {
                const lastStatus = lastStatusResponse.data.status;
                if (lastStatus) {
                    console.log('Error occurred, falling back to last known status:', lastStatus);
                    updateSlackStatusUI(lastStatus);
                }
            }
        } catch (fallbackError) {
            console.error('Failed to load fallback status:', fallbackError);
        }

        // Don't show error to user for status loading failures
        // Just log it and continue with default state
    }
}

/**
 * Update Slack status UI to reflect active status
 * Removes active class from all buttons and adds it to the current status
 * @param {string} status - The active status ('available', 'focused', 'dnd')
 */
function updateSlackStatusUI(status) {
    console.log('Updating Slack status UI:', status);

    // Remove active class from all status buttons
    const allButtons = document.querySelectorAll('.slack-status-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });

    // Add active class to the current status button
    const activeButton = document.querySelector(`.slack-status-btn[data-status="${status}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-pressed', 'true');
    }
}

/**
 * Display error message in Slack status section
 * Shows error message and auto-hides after 5 seconds
 * @param {string} message - The error message to display
 */
function displaySlackError(message) {
    console.log('Displaying Slack error:', message);

    const errorDiv = document.getElementById('slack-status-error');
    if (!errorDiv) return;

    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');

    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);

    announceToScreenReader(`Error: ${message}`);
}

/**
 * Show Slack connected state in UI
 * Displays workspace name and status buttons
 * @param {string} workspaceName - The name of the connected Slack workspace
 */
function showSlackConnectedState(workspaceName) {
    const notConnectedDiv = document.getElementById('slack-not-connected');
    const connectedDiv = document.getElementById('slack-connected');
    const workspaceNameSpan = document.getElementById('slack-workspace-name');

    if (notConnectedDiv) {
        notConnectedDiv.classList.add('hidden');
    }

    if (connectedDiv) {
        connectedDiv.classList.remove('hidden');
    }

    if (workspaceNameSpan && workspaceName) {
        workspaceNameSpan.textContent = workspaceName;
    }
}

/**
 * Show Slack disconnected state in UI
 * Displays connect button and hides status controls
 */
function showSlackDisconnectedState() {
    const notConnectedDiv = document.getElementById('slack-not-connected');
    const connectedDiv = document.getElementById('slack-connected');

    if (notConnectedDiv) {
        notConnectedDiv.classList.remove('hidden');
    }

    if (connectedDiv) {
        connectedDiv.classList.add('hidden');
    }

    // Clear any active status
    const allButtons = document.querySelectorAll('.slack-status-btn');
    allButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
}

/**
 * Initialize Slack status control on popup load
 * Checks connection status and loads current status if connected
 */
async function initializeSlackStatus() {
    console.log('Initializing Slack status control');

    try {
        // Check if Slack is connected
        const authResponse = await sendMessageToServiceWorker({ action: 'checkSlackAuthStatus' });

        if (authResponse && authResponse.success && authResponse.data) {
            const authData = authResponse.data;

            if (authData.isAuthenticated) {
                console.log('Slack is connected, loading status');

                // Show connected state with workspace name
                const workspaceName = authData.team?.name || 'Slack Workspace';
                showSlackConnectedState(workspaceName);

                // Load and display last known status immediately (from storage)
                const lastStatusResponse = await sendMessageToServiceWorker({ action: 'getLastSlackStatus' });
                console.log('Last status response:', lastStatusResponse);
                if (lastStatusResponse && lastStatusResponse.success && lastStatusResponse.data) {
                    const lastStatus = lastStatusResponse.data.status;
                    console.log('Last status from storage:', lastStatus);
                    if (lastStatus) {
                        console.log('Displaying last known status:', lastStatus);
                        updateSlackStatusUI(lastStatus);
                    } else {
                        console.log('No last status found in response data');
                    }
                } else {
                    console.log('Failed to get last status or no data:', lastStatusResponse);
                }

                // Note: We're NOT fetching current status from Slack API here
                // because the emoji matching is unreliable (Slack uses :emoji: format)
                // We rely on the last stored status which is updated when user changes it
                // If needed, we can add a manual "Sync" button later
            } else {
                console.log('Slack is not connected');
                showSlackDisconnectedState();
            }
        } else {
            console.log('Could not check Slack auth status');
            showSlackDisconnectedState();
        }
    } catch (error) {
        console.error('Error initializing Slack status:', error);
        // Show disconnected state on error
        showSlackDisconnectedState();
    }
 * Handle Quick Focus button click - starts a standard 25-minute focus session
 */
function handleQuickFocus() {
    console.log('Quick Focus button clicked');
    
    // Prepare a standard 25-minute focus session and wait for explicit start
    prepareFocusTimer(25, { soundscape: 'rain', status: SESSION_STATUS.PENDING });
    hideAIResults();
    showSessionScreen();
    announceToScreenReader('Quick focus session ready. Press start to begin your 25 minute timer.');
}
