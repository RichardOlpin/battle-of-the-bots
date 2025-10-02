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
        'nature': '🍃'
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
    
    const timerState = CoreLogic.getTimerState();
    
    if (timerState.isPaused) {
        // Resume the timer
        CoreLogic.resumeTimer();
        updatePauseButton(false);
        announceToScreenReader('Session resumed');
    } else {
        // Pause the timer
        CoreLogic.pauseTimer();
        updatePauseButton(true);
        announceToScreenReader('Session paused');
    }
    
    handleMouseActivity();
}

// Handle stop session button click
function handleStopSession() {
    console.log('Stop session clicked');
    
    // Stop the timer
    CoreLogic.stopTimer();
    
    // Stop any playing sounds
    Platform.stopAllSounds();
    
    // Return to events screen
    showScreen('events');
    
    announceToScreenReader('Session stopped');
}

// Update pause button text based on state
function updatePauseButton(isPaused) {
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    }
}

// Start a timer with the given duration in minutes
function startTimer(durationMinutes) {
    console.log(`Starting timer for ${durationMinutes} minutes`);
    
    const durationSeconds = CoreLogic.minutesToSeconds(durationMinutes);
    
    // Start the timer with callbacks
    CoreLogic.startTimer(
        durationSeconds,
        (remainingSeconds) => {
            // Update timer display on each tick
            updateTimerDisplay(remainingSeconds);
        },
        () => {
            // Handle timer completion
            handleTimerComplete();
        }
    );
    
    // Initialize the display
    updateTimerDisplay(durationSeconds);
    updatePauseButton(false);
}

// Update the timer display
function updateTimerDisplay(remainingSeconds) {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = CoreLogic.formatTime(remainingSeconds);
    }
    
    // Update progress bar if it exists
    const timerState = CoreLogic.getTimerState();
    const progressBar = document.getElementById('timer-progress');
    if (progressBar && timerState.totalDuration > 0) {
        const progress = CoreLogic.calculateProgress(timerState.elapsed, timerState.totalDuration);
        progressBar.style.width = `${progress}%`;
    }
}

// Handle timer completion
async function handleTimerComplete() {
    console.log('Timer completed');
    
    // Show notification
    try {
        await Platform.createNotification({
            title: 'AuraFlow',
            message: 'Focus session complete! Great work!',
            iconUrl: Platform.getResourceURL('icons/icon128.png')
        });
    } catch (error) {
        console.error('Error showing notification:', error);
    }
    
    // Play completion sound
    try {
        await Platform.playSound('notification', 80);
    } catch (error) {
        console.error('Error playing sound:', error);
    }
    
    // Announce to screen reader
    announceToScreenReader('Focus session complete!');
    
    // Return to events screen after a short delay
    setTimeout(() => {
        showScreen('events');
    }, 2000);
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
    startFocusSession(lastSessionSettings);
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
 * Start focus session with specified duration (handled by unified function above)
 */

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
