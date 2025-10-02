// Popup script for AuraFlow Calendar Extension
// This file handles the popup UI logic and user interactions

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

// Communication with service worker
function sendMessageToServiceWorker(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
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

// Backend API configuration
const BACKEND_API_URL = 'http://localhost:3000';

// Store current events for AI features
let currentEvents = [];

/**
 * Handle Find Focus Time button click
 * Fetches calendar events and calls backend scheduling API
 */
async function handleFindFocusTime() {
    console.log('Find Focus Time clicked');
    window.lastAIAction = 'focus'; // Track for retry functionality
    
    try {
        // Show loading state
        showAILoading('Finding optimal focus time...');
        
        // Get current calendar events with timeout
        const response = await Promise.race([
            sendMessageToServiceWorker({ action: 'fetchEvents' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 10000))
        ]);
        
        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch calendar events');
        }
        
        const events = Array.isArray(response.data) ? response.data : [];
        currentEvents = events;
        
        // Transform and validate events
        const calendarEvents = events
            .filter(event => event && event.start && event.end)
            .map(event => {
                try {
                    return {
                        id: event.id || `event-${Date.now()}`,
                        startTime: event.start.dateTime || event.start.date,
                        endTime: event.end.dateTime || event.end.date,
                        title: (event.summary || 'Untitled Event').substring(0, 200) // Limit title length
                    };
                } catch (err) {
                    console.warn('Skipping invalid event:', err);
                    return null;
                }
            })
            .filter(event => event !== null);
        
        // Determine time of day for preferences
        const now = new Date();
        const hour = now.getHours();
        let preferredTime = 'afternoon';
        if (hour >= 6 && hour < 12) {
            preferredTime = 'morning';
        } else if (hour >= 17 && hour < 21) {
            preferredTime = 'evening';
        }
        
        // Call backend scheduling API with timeout
        const focusWindow = await Promise.race([
            callSchedulingAPI(calendarEvents, {
                preferredTime: preferredTime,
                minimumDuration: 75,
                bufferTime: 15
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Backend timeout')), 15000))
        ]);
        
        // Validate response
        if (focusWindow && typeof focusWindow === 'object') {
            displayFocusTimeResult(focusWindow);
        } else {
            displayFocusTimeResult(null);
        }
        
    } catch (error) {
        console.error('Find Focus Time error:', error);
        let errorMessage = 'Failed to find focus time';
        
        if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please ensure the backend server is running.';
        } else if (error.message) {
            errorMessage = `Failed to find focus time: ${error.message}`;
        }
        
        showAIError(errorMessage);
    }
}

/**
 * Handle Generate Ritual button click
 * Analyzes calendar and calls backend ritual generation API
 */
async function handleGenerateRitual() {
    console.log('Generate Ritual clicked');
    window.lastAIAction = 'ritual'; // Track for retry functionality
    
    try {
        // Show loading state
        showAILoading('Generating personalized ritual...');
        
        // Get current calendar events if not already loaded
        if (!Array.isArray(currentEvents) || currentEvents.length === 0) {
            try {
                const response = await Promise.race([
                    sendMessageToServiceWorker({ action: 'fetchEvents' }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 10000))
                ]);
                
                if (response && response.success && Array.isArray(response.data)) {
                    currentEvents = response.data;
                } else {
                    currentEvents = [];
                }
            } catch (err) {
                console.warn('Could not fetch events, using empty array:', err);
                currentEvents = [];
            }
        }
        
        // Determine context from calendar
        const now = new Date();
        const hour = now.getHours();
        
        let timeOfDay = 'afternoon';
        if (hour >= 6 && hour < 12) {
            timeOfDay = 'morning';
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';
        }
        
        // Calculate calendar density safely
        const eventsToday = Array.isArray(currentEvents) ? currentEvents.length : 0;
        let calendarDensity = 'clear';
        if (eventsToday >= 5) {
            calendarDensity = 'busy';
        } else if (eventsToday >= 3) {
            calendarDensity = 'moderate';
        }
        
        // Get next event title for context
        let calendarEventTitle = 'Focus session';
        if (Array.isArray(currentEvents) && currentEvents.length > 0) {
            try {
                const nextEvent = currentEvents.find(event => {
                    if (!event || !event.start) return false;
                    try {
                        const eventTime = new Date(event.start.dateTime || event.start.date);
                        return !isNaN(eventTime.getTime()) && eventTime > now;
                    } catch (err) {
                        return false;
                    }
                });
                
                if (nextEvent && nextEvent.summary) {
                    // Sanitize and limit title length
                    calendarEventTitle = String(nextEvent.summary).substring(0, 200);
                }
            } catch (err) {
                console.warn('Error finding next event:', err);
            }
        }
        
        // Call backend ritual generation API with timeout
        const ritual = await Promise.race([
            callRitualAPI({
                calendarEventTitle: calendarEventTitle,
                timeOfDay: timeOfDay,
                calendarDensity: calendarDensity
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Backend timeout')), 15000))
        ]);
        
        // Validate ritual response
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
        } else {
            throw new Error('Invalid ritual response from server');
        }
        
    } catch (error) {
        console.error('Generate Ritual error:', error);
        let errorMessage = 'Failed to generate ritual';
        
        if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Network error. Please ensure the backend server is running.';
        } else if (error.message) {
            errorMessage = `Failed to generate ritual: ${error.message}`;
        }
        
        showAIError(errorMessage);
    }
}

/**
 * Call backend scheduling API
 * @param {Array} calendarEvents - Array of calendar events
 * @param {Object} userPreferences - User preferences for scheduling
 * @returns {Promise<Object>} Focus window suggestion
 */
async function callSchedulingAPI(calendarEvents, userPreferences) {
    // Validate inputs
    if (!Array.isArray(calendarEvents)) {
        throw new Error('Invalid calendar events data');
    }
    
    if (!userPreferences || typeof userPreferences !== 'object') {
        throw new Error('Invalid user preferences');
    }
    
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/schedule/suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                calendarEvents: calendarEvents,
                userPreferences: userPreferences
            }),
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!response.ok) {
            let errorMessage = 'Scheduling API request failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (data === null) {
            return null; // No focus window found
        }
        
        if (typeof data !== 'object') {
            throw new Error('Invalid response format from server');
        }
        
        return data;
        
    } catch (error) {
        console.error('Scheduling API error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - server took too long to respond');
        }
        
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - cannot reach backend server');
        }
        
        throw error;
    }
}

/**
 * Call backend ritual generation API
 * @param {Object} context - Context for ritual generation
 * @returns {Promise<Object>} Generated ritual
 */
async function callRitualAPI(context) {
    // Validate input
    if (!context || typeof context !== 'object') {
        throw new Error('Invalid context data');
    }
    
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/ritual/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ context: context }),
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!response.ok) {
            let errorMessage = 'Ritual API request failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error?.message || errorMessage;
            } catch (parseError) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from server');
        }
        
        // Validate required ritual properties
        const requiredProps = ['name', 'workDuration', 'breakDuration', 'mindfulnessBreaks', 'description'];
        for (const prop of requiredProps) {
            if (!(prop in data)) {
                throw new Error(`Missing required property: ${prop}`);
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('Ritual API error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - server took too long to respond');
        }
        
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - cannot reach backend server');
        }
        
        throw error;
    }
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
                <button class="close-results-btn" onclick="hideAIResults()" aria-label="Close results">×</button>
            </div>
        `;
        aiResults.classList.remove('hidden');
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
            <button class="start-session-btn" onclick="startFocusSession(${result.duration})">
                <span>🚀</span>
                Start Focus Session
            </button>
            <button class="close-results-btn" onclick="hideAIResults()" aria-label="Close results">×</button>
        </div>
    `;
    
    aiResults.classList.remove('hidden');
    announceToScreenReader(`Optimal focus window found from ${startTimeStr} to ${endTimeStr}`);
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
                <button class="use-ritual-btn" onclick="useRitual('${escapeHtml(ritual.name)}', ${ritual.workDuration}, ${ritual.breakDuration}, '${ritual.suggestedSoundscape || 'rain'}')">
                    <span>🚀</span>
                    Use This Ritual
                </button>
            </div>
            <button class="close-results-btn" onclick="hideAIResults()" aria-label="Close results">×</button>
        </div>
    `;
    
    aiResults.classList.remove('hidden');
    announceToScreenReader(`Ritual generated: ${ritual.name}`);
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
            <button class="retry-ai-btn" onclick="retryLastAIAction()">
                <span>🔄</span>
                Try Again
            </button>
            <button class="close-results-btn" onclick="hideAIResults()" aria-label="Close results">×</button>
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
    // For now, just show controls
    handleMouseActivity();
}

// Handle stop session button click
function handleStopSession() {
    console.log('Stop session clicked');
    stopFocusAudio();
    // Return to events screen
    showScreen('events');
}

function handleVolumeChange(event) {
    const rawValue = Number(event.target.value);
    const normalizedVolume = Number.isNaN(rawValue) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, rawValue / 100));
    setFocusAudioVolume(normalizedVolume);
}

function handleSoundscapeChange(event) {
    const selectedSoundscape = event.target.value || 'rain';
    playFocusAudio(selectedSoundscape);
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

    const resolvedDefault = resolveSoundscapeKey(currentSoundscape);
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
function initializeTheme() {
    // Load saved theme from storage
    chrome.storage.sync.get(['auraflow_theme'], function(result) {
        if (result.auraflow_theme) {
            applyTheme(result.auraflow_theme);
            // Update active state on theme buttons
            updateThemeButtonStates(result.auraflow_theme);
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

// Update theme button states on initialization
function updateInitialThemeState() {
    updateThemeButtonStates(currentTheme);
}

// ============================================================================
// QUICK START IMPLEMENTATION
// ============================================================================

// Initialize Quick Start feature
function initializeQuickStart() {
    // Load saved session settings from storage
    chrome.storage.sync.get(['auraflow_last_session'], function(result) {
        if (result.auraflow_last_session) {
            lastSessionSettings = result.auraflow_last_session;
            updateQuickStartButton();
        }
    });
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
    }

    // Set soundscape if available
    const soundscapeSelector = document.getElementById('soundscape-selector');
    const resolvedSoundscape = resolveSoundscapeKey(settings.soundscape || currentSoundscape);
    currentSoundscape = resolvedSoundscape;
    if (soundscapeSelector) {
        soundscapeSelector.value = resolvedSoundscape;
    }
    
    // Show the session screen
    showSessionScreen();
}

// ============================================================================
// GENTLE NUDGE SESSION CONTROL
// ============================================================================

/**
 * Starts a focus session with notifications
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} taskGoal - User's task goal
 */
async function startFocusSession(workDuration, breakDuration, taskGoal) {
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
      playFocusAudio(currentSoundscape);
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
      stopFocusAudio();
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
    const result = await chrome.storage.sync.get(['auraFlowBlockedSites']);
    const blockedSites = result.auraFlowBlockedSites || [];
    
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
    
    // Save to chrome.storage.sync
    await chrome.storage.sync.set({ auraFlowBlockedSites: sites });
    
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
 * Shows success feedback when blocked sites are saved
 */
function showBlockingSaveSuccess() {
  const button = document.getElementById('save-blocked-sites-button');
  if (!button) return;
  
  const originalText = button.innerHTML;
  button.innerHTML = '<span class="btn-icon">✅</span> Saved!';
  button.disabled = true;
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
  }, 2000);
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

    // Store session settings
    chrome.storage.local.set({
        sessionDuration: duration,
        sessionType: 'focus'
    });

    // Switch to session screen
    showSessionScreen();

    // Start the timer
    startTimer(duration);

    // Hide AI results
    hideAIResults();

    playFocusAudio(currentSoundscape);
    announceToScreenReader(`Starting ${duration} minute focus session`);
}

/**
 * Use the generated ritual for a session
 * @param {string} name - Ritual name
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} soundscape - Recommended soundscape
 */
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
    
    // Set the soundscape selector if available
    const resolvedSoundscape = resolveSoundscapeKey(soundscape);

    const soundscapeSelector = document.getElementById('soundscape-selector');
    if (soundscapeSelector) {
        soundscapeSelector.value = resolvedSoundscape;
    }

    // Switch to session screen
    showSessionScreen();

    // Start the timer
    startTimer(workDuration);

    // Hide AI results
    hideAIResults();

    playFocusAudio(resolvedSoundscape);
    announceToScreenReader(`Starting ${name} ritual with ${workDuration} minute work session`);
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
 * Handle Quick Focus button click - starts a standard 25-minute focus session
 */
function handleQuickFocus() {
    console.log('Quick Focus button clicked');
    
    // Start a standard 25-minute focus session
    startFocusSession(25);
    
    announceToScreenReader('Starting 25 minute focus session');
}
