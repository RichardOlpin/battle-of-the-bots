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