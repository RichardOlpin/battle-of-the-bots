// Popup script for AuraFlow Calendar Extension
// This file handles the popup UI logic and user interactions

// Global state management
let currentScreen = 'auth';
let isLoading = false;
let retryAttempts = 0;
const MAX_RETRY_ATTEMPTS = 3;

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
});

async function initializePopup() {
    // Update date header with current date
    updateDateHeader();

    // Check authentication status on popup load
    await checkAuthenticationStatus();
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
    const validScreens = ['auth', 'events', 'loading', 'error'];
    if (!validScreens.includes(screenName)) {
        console.error('Invalid screen name:', screenName);
        return;
    }

    // Update current screen state
    currentScreen = screenName;
    isLoading = screenName === 'loading';

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
        'error': 'An error occurred. Please try again.'
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
            <div class="ai-result-card">
                <div class="ai-result-title">🎯 Focus Time Suggestion</div>
                <div class="ai-result-content">
                    <p>No suitable focus windows found in your calendar today. Your schedule is quite full!</p>
                    <p style="margin-top: 8px;">Consider blocking time tomorrow or finding a shorter 30-minute slot for a quick focus session.</p>
                </div>
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
        <div class="ai-result-card">
            <div class="ai-result-title">🎯 Optimal Focus Window Found</div>
            <div class="ai-result-time">${startTimeStr} - ${endTimeStr}</div>
            <div class="ai-result-content">
                <div class="ai-result-detail">
                    <span class="ai-result-label">Duration:</span>
                    <span class="ai-result-value">${result.duration} minutes</span>
                </div>
                <div class="ai-result-detail">
                    <span class="ai-result-label">Quality Score:</span>
                    <span class="ai-result-value">${Math.round(result.score)}/100</span>
                </div>
                ${result.reasoning ? `
                    <div class="ai-result-description">${escapeHtml(result.reasoning)}</div>
                ` : ''}
            </div>
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
    
    aiResults.innerHTML = `
        <div class="ai-result-card">
            <div class="ai-result-title">✨ ${escapeHtml(ritual.name)}</div>
            <div class="ai-result-content">
                <div class="ai-result-detail">
                    <span class="ai-result-label">Work Duration:</span>
                    <span class="ai-result-value">${ritual.workDuration} minutes</span>
                </div>
                <div class="ai-result-detail">
                    <span class="ai-result-label">Break Duration:</span>
                    <span class="ai-result-value">${ritual.breakDuration} minutes</span>
                </div>
                <div class="ai-result-detail">
                    <span class="ai-result-label">Mindfulness Breaks:</span>
                    <span class="ai-result-value">${ritual.mindfulnessBreaks ? 'Yes' : 'No'}</span>
                </div>
                ${ritual.description ? `
                    <div class="ai-result-description">${escapeHtml(ritual.description)}</div>
                ` : ''}
                ${ritual.suggestedSoundscape ? `
                    <div class="ai-result-detail" style="margin-top: 8px;">
                        <span class="ai-result-label">Soundscape:</span>
                        <span class="ai-result-value">${escapeHtml(ritual.suggestedSoundscape)}</span>
                    </div>
                ` : ''}
            </div>
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
            <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto 8px;"></div>
            <p>${escapeHtml(message)}</p>
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
        <div class="ai-result-card ai-error">
            <div class="ai-result-title">⚠️ Error</div>
            <div class="ai-result-content">
                <p>${escapeHtml(message)}</p>
                <p style="margin-top: 8px; font-size: 11px;">Make sure the backend server is running at ${BACKEND_API_URL}</p>
            </div>
        </div>
    `;
    aiResults.classList.remove('hidden');
}
