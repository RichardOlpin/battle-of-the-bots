// AuraFlow Web Application Main Script
// Orchestrates the web application, connecting UI events to core logic

import * as CoreLogic from './core-logic.js';
import * as Platform from './web-platform-services.js';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let currentScreen = 'auth';
let isLoading = false;
let currentTheme = 'light';
let currentEvents = [];
let lastSessionSettings = null;
let currentSoundscape = null;

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Get secure backend URL
 * Enforces HTTPS in production, allows HTTP only for localhost
 * @returns {string} Backend API URL
 */
function getSecureBackendURL() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    
    // Allow HTTP only for localhost development
    if (isLocalhost) {
        return 'http://localhost:3000/api';
    }
    
    // Production: enforce HTTPS
    // Get from environment or use default production URL
    const productionURL = window.AURAFLOW_API_URL || 'https://api.auraflow.app/api';
    
    // Ensure URL uses HTTPS
    if (!productionURL.startsWith('https://')) {
        console.error('Backend API URL must use HTTPS in production');
        throw new Error('Insecure backend URL detected');
    }
    
    return productionURL;
}

/**
 * Validate URL is secure (HTTPS or localhost)
 * @param {string} url - URL to validate
 * @returns {boolean} True if secure
 */
function isSecureURL(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
        
        // Allow HTTP only for localhost
        if (isLocalhost && urlObj.protocol === 'http:') {
            return true;
        }
        
        // Require HTTPS for all other hosts
        return urlObj.protocol === 'https:';
    } catch (error) {
        console.error('Invalid URL:', error);
        return false;
    }
}

// Backend API configuration
// Use HTTPS in production, allow HTTP only for localhost development
const BACKEND_API_URL = getSecureBackendURL();

// Offline state management
let isOffline = !navigator.onLine;
let offlineQueue = [];

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Lazy load images and other resources
 * Uses Intersection Observer for efficient loading
 */
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const lazyElements = document.querySelectorAll('[data-lazy-src]');
        
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const src = element.getAttribute('data-lazy-src');
                    
                    if (src) {
                        element.src = src;
                        element.removeAttribute('data-lazy-src');
                    }
                    
                    lazyObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before element is visible
        });
        
        lazyElements.forEach(element => lazyObserver.observe(element));
    }
}

/**
 * Preload critical resources
 */
function preloadCriticalResources() {
    // Preload core logic module (already loaded as module)
    // Preload platform services (already loaded as module)
    
    // Preload critical icons
    const criticalIcons = [
        '/icons/icon-192.png'
    ];
    
    criticalIcons.forEach(iconPath => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = iconPath;
        document.head.appendChild(link);
    });
}

/**
 * Monitor and log performance metrics
 */
function logPerformanceMetrics() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            // Use setTimeout to ensure all metrics are available
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;
                const domContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
                
                console.log('=== Performance Metrics ===');
                console.log(`Page Load Time: ${pageLoadTime}ms`);
                console.log(`DOM Content Loaded: ${domContentLoadedTime}ms`);
                console.log(`Connect Time: ${connectTime}ms`);
                console.log(`Render Time: ${renderTime}ms`);
                
                // Check if load time is under 3 seconds (3G target)
                if (pageLoadTime < 3000) {
                    console.log('✅ Load time is under 3 seconds (3G target met)');
                } else {
                    console.warn('⚠️ Load time exceeds 3 seconds (3G target not met)');
                }
                
                // Log resource timing if available
                if (window.performance.getEntriesByType) {
                    const resources = window.performance.getEntriesByType('resource');
                    console.log(`Total Resources Loaded: ${resources.length}`);
                    
                    // Find slowest resources
                    const slowResources = resources
                        .filter(r => r.duration > 100)
                        .sort((a, b) => b.duration - a.duration)
                        .slice(0, 5);
                    
                    if (slowResources.length > 0) {
                        console.log('Slowest Resources:');
                        slowResources.forEach(r => {
                            console.log(`  ${r.name}: ${Math.round(r.duration)}ms`);
                        });
                    }
                }
            }, 0);
        });
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('AuraFlow Web App loaded');
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Log performance metrics
    logPerformanceMetrics();
    
    // Check if returning from OAuth (must complete before init)
    await checkAuthSuccess();
    
    await initializeApp();
    setupOfflineDetection();
    
    // Setup lazy loading for non-critical resources
    setupLazyLoading();
});

/**
 * Check if user just completed OAuth authentication
 */
async function checkAuthSuccess() {
    // Check if we're coming from OAuth redirect
    // The session cookie will be set automatically
    // Just show a success message if we detect we just authenticated
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth_success')) {
        console.log('Detected successful authentication');
        showAuthSuccessMessage();
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

/**
 * Show authentication success message
 */
function showAuthSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'auth-success-message';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    message.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✅</span>
            <span class="success-text">Successfully connected to Google Calendar!</span>
        </div>
    `;
    
    document.body.appendChild(message);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (message.parentElement) {
            message.classList.add('hiding');
            setTimeout(() => message.remove(), 300);
        }
    }, 5000);
    
    // Trigger animation
    setTimeout(() => message.classList.add('show'), 10);
}

/**
 * Initialize the application
 */
async function initializeApp() {
    // Check authentication status
    await checkAuth();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Register service worker for PWA functionality
    await registerServiceWorker();
    
    // Request notification permission
    await requestNotificationPermission();
    
    // Initialize theme
    await initializeTheme();
    
    // Load blocked sites
    await loadBlockedSites();
    
    // Update date header
    updateDateHeader();
    
    // Initialize Quick Start
    await initializeQuickStart();
    
    // Load offline queue from storage
    await loadOfflineQueue();
    
    // Update offline status indicator
    updateOfflineIndicator();
}

/**
 * Check authentication status
 */
async function checkAuth() {
    try {
        // Check with backend (session cookie is automatically sent)
        const response = await fetch(`${BACKEND_API_URL}/auth/status`, {
            credentials: 'include' // Include cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.authenticated && !data.tokenExpired) {
                console.log('User is authenticated');
                // Store user ID for later use
                if (data.userId) {
                    await Platform.saveData('userId', data.userId);
                }
                await loadEvents();
                return;
            }
        }
        
        console.log('User is not authenticated');
        showScreen('auth');
    } catch (error) {
        console.error('Auth check failed:', error);
        showScreen('auth');
    }
}

/**
 * Register service worker for PWA functionality
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
    const granted = await Platform.requestNotificationPermission();
    
    if (granted) {
        console.log('Notification permission granted');
        showNotificationStatus('granted');
    } else {
        const permission = await Platform.getNotificationPermission();
        console.log('Notification permission status:', permission);
        showNotificationStatus(permission);
    }
}

/**
 * Show notification permission status to user
 * @param {string} status - Permission status
 */
function showNotificationStatus(status) {
    // Only show status message if permission was explicitly denied
    if (status === 'denied') {
        // Show a subtle message that in-app notifications will be used
        const statusMessage = document.createElement('div');
        statusMessage.className = 'notification-status-message';
        statusMessage.setAttribute('role', 'status');
        statusMessage.setAttribute('aria-live', 'polite');
        statusMessage.innerHTML = `
            <div class="status-content">
                <span class="status-icon">ℹ️</span>
                <span class="status-text">Browser notifications disabled. You'll see in-app alerts instead.</span>
            </div>
        `;
        
        document.body.appendChild(statusMessage);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (statusMessage.parentElement) {
                statusMessage.classList.add('hiding');
                setTimeout(() => statusMessage.remove(), 300);
            }
        }, 5000);
        
        // Trigger animation
        setTimeout(() => statusMessage.classList.add('show'), 10);
    }
}

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        
        if (sidebar && mobileToggle && 
            !sidebar.contains(e.target) && 
            !mobileToggle.contains(e.target) &&
            document.body.classList.contains('sidebar-visible')) {
            closeMobileMenu();
        }
    });
    
    // Navigation items
    setupNavigationItems();
    
    // Authentication screen
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
    }
    
    // Events screen
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const quickFocusBtn = document.getElementById('quick-focus-btn');
    if (quickFocusBtn) {
        quickFocusBtn.addEventListener('click', handleQuickFocus);
    }
    
    // Theme buttons
    setupThemeButtons();
    
    // AI features
    const findFocusBtn = document.getElementById('find-focus-btn');
    if (findFocusBtn) {
        findFocusBtn.addEventListener('click', handleFindFocusTime);
    }
    
    const generateRitualBtn = document.getElementById('generate-ritual-btn');
    if (generateRitualBtn) {
        generateRitualBtn.addEventListener('click', handleGenerateRitual);
    }
    
    // Blocked sites
    const saveBlockedSitesBtn = document.getElementById('save-blocked-sites-button');
    if (saveBlockedSitesBtn) {
        // Debounce save to prevent multiple rapid saves
        saveBlockedSitesBtn.addEventListener('click', debounce(handleSaveBlockedSites, 300));
    }
    
    // Quick Start
    const quickStartBtn = document.getElementById('quick-start-button');
    if (quickStartBtn) {
        quickStartBtn.addEventListener('click', handleQuickStart);
    }
    
    // Session controls
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', handlePauseSession);
    }
    
    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', handleStopSession);
    }
    
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        // Debounce volume changes to reduce excessive updates
        volumeSlider.addEventListener('input', debounce(handleVolumeChange, 150));
    }
    
    const soundscapeSelector = document.getElementById('soundscape-selector');
    if (soundscapeSelector) {
        soundscapeSelector.addEventListener('change', handleSoundscapeChange);
    }
    
    // Error screen
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', handleRetry);
    }
}

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

/**
 * Toggle mobile menu visibility
 */
function toggleMobileMenu() {
    document.body.classList.toggle('sidebar-visible');
    
    // Update ARIA attributes for accessibility
    const sidebar = document.querySelector('.sidebar');
    const isVisible = document.body.classList.contains('sidebar-visible');
    
    if (sidebar) {
        sidebar.setAttribute('aria-hidden', !isVisible);
    }
    
    // Announce to screen readers
    const message = isVisible ? 'Navigation menu opened' : 'Navigation menu closed';
    announceToScreenReader(message);
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    document.body.classList.remove('sidebar-visible');
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.setAttribute('aria-hidden', 'true');
    }
    
    announceToScreenReader('Navigation menu closed');
}

/**
 * Setup navigation item event listeners
 */
function setupNavigationItems() {
    // Quick actions
    const navQuickFocus = document.getElementById('nav-quick-focus');
    if (navQuickFocus) {
        navQuickFocus.addEventListener('click', () => {
            handleQuickFocus();
            closeMobileMenu();
        });
    }
    
    const navFindFocus = document.getElementById('nav-find-focus');
    if (navFindFocus) {
        navFindFocus.addEventListener('click', () => {
            handleFindFocusTime();
            closeMobileMenu();
        });
    }
    
    const navGenerateRitual = document.getElementById('nav-generate-ritual');
    if (navGenerateRitual) {
        navGenerateRitual.addEventListener('click', () => {
            handleGenerateRitual();
            closeMobileMenu();
        });
    }
    
    // Settings
    const navThemes = document.getElementById('nav-themes');
    if (navThemes) {
        navThemes.addEventListener('click', () => {
            // Scroll to theme section
            const themeCard = document.querySelector('.theme-card');
            if (themeCard) {
                themeCard.scrollIntoView({ behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    }
    
    const navBlocking = document.getElementById('nav-blocking');
    if (navBlocking) {
        navBlocking.addEventListener('click', () => {
            // Scroll to blocking section
            const blockingCard = document.querySelector('.blocking-card');
            if (blockingCard) {
                blockingCard.scrollIntoView({ behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    }
    
    // Sidebar logout
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', () => {
            handleLogout();
            closeMobileMenu();
        });
    }
}

function setupThemeButtons() {
    const themeButtons = {
        'theme-light-button': 'light',
        'theme-dark-button': 'dark',
        'theme-calm-button': 'calm',
        'theme-beach-button': 'beach',
        'theme-rain-button': 'rain'
    };
    
    Object.entries(themeButtons).forEach(([buttonId, theme]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => handleThemeChange(theme));
        }
    });
}

// ============================================================================
// SCREEN NAVIGATION
// ============================================================================

function showScreen(screenName) {
    const validScreens = ['auth', 'events', 'session', 'loading', 'error'];
    
    if (!validScreens.includes(screenName)) {
        console.error('Invalid screen name:', screenName);
        return;
    }
    
    currentScreen = screenName;
    isLoading = screenName === 'loading';
    
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.add('hidden');
        screen.setAttribute('aria-hidden', 'true');
    });
    
    // Show requested screen
    const targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.setAttribute('aria-hidden', 'false');
        console.log('Switched to screen:', screenName);
    }
}

function updateLoadingMessage(message) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message || 'Something went wrong';
    }
    showScreen('error');
}

// ============================================================================
// AUTHENTICATION HANDLERS
// ============================================================================

async function handleConnect() {
    console.log('Connect button clicked');
    if (isLoading) return;
    
    showScreen('loading');
    updateLoadingMessage('Connecting to Google Calendar...');
    
    try {
        // For web app, redirect to OAuth flow
        const authUrl = `${BACKEND_API_URL}/auth/google`;
        window.location.href = authUrl;
    } catch (error) {
        console.error('Authentication error:', error);
        showError('Failed to connect to Google Calendar. Please try again.');
    }
}

async function handleLogout() {
    console.log('Logout button clicked');
    if (isLoading) return;
    
    try {
        showScreen('loading');
        updateLoadingMessage('Logging out...');
        
        // Call backend logout endpoint to clear session
        const response = await fetch(`${BACKEND_API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include' // Include session cookie
        });
        
        if (!response.ok) {
            throw new Error('Logout failed');
        }
        
        // Clear any cached data
        await Platform.removeData('cachedEvents');
        await Platform.removeData('userId');
        
        console.log('Logout successful');
        showScreen('auth');
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

async function handleRefresh() {
    console.log('Refresh button clicked');
    if (isLoading) return;
    
    try {
        showScreen('loading');
        updateLoadingMessage('Refreshing events...');
        await loadEvents();
    } catch (error) {
        console.error('Refresh error:', error);
        showError('Failed to refresh events. Please try again.');
    }
}

async function handleRetry() {
    console.log('Retry button clicked');
    if (isLoading) return;
    
    showScreen('loading');
    updateLoadingMessage('Retrying...');
    
    try {
        await checkAuth();
    } catch (error) {
        console.error('Retry error:', error);
        showError('Retry failed. Please try again.');
    }
}

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

async function loadEvents() {
    try {
        // If offline, try to load cached events
        if (isOffline) {
            console.log('Offline mode: loading cached events');
            const cachedEvents = await Platform.getData('cachedEvents');
            if (cachedEvents && Array.isArray(cachedEvents)) {
                currentEvents = cachedEvents;
                displayEvents(currentEvents);
                showScreen('events');
                return;
            } else {
                // No cached events available
                currentEvents = [];
                displayEvents(currentEvents);
                showScreen('events');
                return;
            }
        }
        
        // Use session-based authentication (cookie is sent automatically)
        const response = await fetch(`${BACKEND_API_URL}/calendar/events`, {
            method: 'GET',
            credentials: 'include' // Include session cookie
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Not authenticated');
            }
            throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        currentEvents = data.events || [];
        
        // Cache events for offline use
        await Platform.saveData('cachedEvents', currentEvents);
        
        displayEvents(currentEvents);
        showScreen('events');
    } catch (error) {
        console.error('Failed to load events:', error);
        
        if (error.message.includes('authenticated')) {
            showScreen('auth');
        } else {
            // Try to load cached events as fallback
            const cachedEvents = await Platform.getData('cachedEvents');
            if (cachedEvents && Array.isArray(cachedEvents)) {
                console.log('Using cached events due to network error');
                currentEvents = cachedEvents;
                displayEvents(currentEvents);
                showScreen('events');
            } else {
                showError('Failed to load calendar events. Please try again.');
            }
        }
    }
}

function displayEvents(events) {
    const eventsContainer = document.getElementById('events-container');
    const noEventsDiv = document.getElementById('no-events');
    
    if (!eventsContainer) {
        console.error('Events container not found');
        return;
    }
    
    eventsContainer.innerHTML = '';
    
    if (!events || events.length === 0) {
        noEventsDiv.classList.remove('hidden');
        eventsContainer.classList.add('hidden');
        return;
    }
    
    const validEvents = events.filter(event => {
        return event && event.start && event.status !== 'cancelled';
    });
    
    if (validEvents.length === 0) {
        noEventsDiv.classList.remove('hidden');
        eventsContainer.classList.add('hidden');
        return;
    }
    
    const sortedEvents = validEvents.sort((a, b) => {
        const timeA = new Date(a.start.dateTime || a.start.date);
        const timeB = new Date(b.start.dateTime || b.start.date);
        return timeA - timeB;
    });
    
    noEventsDiv.classList.add('hidden');
    eventsContainer.classList.remove('hidden');
    
    sortedEvents.forEach(event => {
        const eventElement = renderEventElement(event);
        eventsContainer.appendChild(eventElement);
    });
    
    console.log(`Displayed ${sortedEvents.length} events`);
}

function renderEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.setAttribute('role', 'listitem');
    
    const title = event.summary || 'Untitled Event';
    const timeDisplay = formatEventTimeRange(event);
    
    eventElement.innerHTML = `
        <div class="event-title">${escapeHtml(title)}</div>
        <div class="event-time">${escapeHtml(timeDisplay)}</div>
    `;
    
    return eventElement;
}

function formatEventTimeRange(event) {
    const startDateTime = event.start.dateTime || event.start.date;
    const endDateTime = event.end.dateTime || event.end.date;
    
    const startTime = formatEventTime(startDateTime);
    const endTime = formatEventTime(endDateTime);
    
    if (startTime === 'All day') {
        return 'All day';
    }
    
    return `${startTime} - ${endTime}`;
}

function formatEventTime(dateTimeString) {
    if (!dateTimeString) return '';
    
    try {
        if (dateTimeString.length === 10 || !dateTimeString.includes('T')) {
            return 'All day';
        }
        
        const date = new Date(dateTimeString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid time';
        }
        
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

// ============================================================================
// SESSION HANDLERS
// ============================================================================

async function handleQuickFocus() {
    console.log('Quick Focus clicked');
    
    const config = {
        mode: 'work',
        workDuration: 1500, // 25 minutes
        breakDuration: 300, // 5 minutes
        soundscape: 'rain',
        volume: 50,
        taskGoal: 'Quick Focus Session'
    };
    
    await startSession(config);
}

async function handleQuickStart() {
    console.log('Quick Start clicked');
    
    if (!lastSessionSettings) {
        await handleQuickFocus();
        return;
    }
    
    const config = {
        mode: 'work',
        workDuration: 1500,
        breakDuration: 300,
        soundscape: lastSessionSettings.soundscape || 'rain',
        volume: 50,
        ritualName: lastSessionSettings.ritual?.name,
        taskGoal: lastSessionSettings.ritual?.name || 'Focus Session'
    };
    
    await startSession(config);
}

async function startSession(config) {
    try {
        // Initialize session
        const session = CoreLogic.initializeSession(config);
        
        if (!session) {
            throw new Error('Failed to initialize session');
        }
        
        // Save session config
        await Platform.saveData('currentSession', session);
        
        // Show session screen
        showScreen('session');
        
        // Start timer
        const duration = config.mode === 'work' ? config.workDuration : config.breakDuration;
        
        CoreLogic.startTimer(
            duration,
            (remaining) => updateTimerDisplay(remaining),
            () => handleSessionComplete()
        );
        
        // Start soundscape
        if (config.soundscape && config.soundscape !== 'silence') {
            currentSoundscape = config.soundscape;
            await Platform.playSound(config.soundscape, config.volume || 50);
        }
        
        console.log('Session started');
    } catch (error) {
        console.error('Failed to start session:', error);
        showError('Failed to start session. Please try again.');
    }
}

// Optimized timer display update using requestAnimationFrame
const updateTimerDisplay = (() => {
    let rafId = null;
    
    return (remainingSeconds) => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.textContent = CoreLogic.formatTime(remainingSeconds);
            }
            rafId = null;
        });
    };
})();

async function handleSessionComplete() {
    console.log('Session completed');
    
    // Stop soundscape
    if (currentSoundscape) {
        Platform.stopSound(currentSoundscape);
        currentSoundscape = null;
    }
    
    // Show notification
    await Platform.createNotification({
        title: 'Session Complete!',
        message: 'Great work! Time for a break.',
        iconUrl: '/icons/icon-192.png'
    });
    
    // Save session data
    const sessionState = CoreLogic.getSessionState();
    const timerState = CoreLogic.getTimerState();
    const sessionData = CoreLogic.prepareSessionData({ sessionState, timerState });
    
    try {
        const response = await fetchWithOfflineSupport(`${BACKEND_API_URL}/sessions`, {
            method: 'POST',
            credentials: 'include', // Use session cookie
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        }, true);
        
        if (response.queued) {
            console.log('Session data queued for sync when online');
        }
    } catch (error) {
        console.error('Failed to save session data:', error);
    }
    
    // Return to events screen
    showScreen('events');
}

async function handlePauseSession() {
    const timerState = CoreLogic.getTimerState();
    
    if (timerState.isPaused) {
        CoreLogic.resumeTimer();
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = 'Pause';
        }
    } else {
        CoreLogic.pauseTimer();
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = 'Resume';
        }
    }
}

async function handleStopSession() {
    console.log('Stop session clicked');
    
    // Stop timer
    CoreLogic.stopTimer();
    
    // Stop soundscape
    if (currentSoundscape) {
        Platform.stopSound(currentSoundscape);
        currentSoundscape = null;
    }
    
    // Return to events screen
    showScreen('events');
}

async function handleVolumeChange(event) {
    const volume = parseInt(event.target.value);
    
    if (currentSoundscape) {
        Platform.setSoundVolume(currentSoundscape, volume);
    }
    
    // Save volume preference
    await Platform.saveData('volume', volume);
}

async function handleSoundscapeChange(event) {
    const newSoundscape = event.target.value;
    
    // Stop current soundscape
    if (currentSoundscape) {
        Platform.stopSound(currentSoundscape);
    }
    
    // Start new soundscape
    if (newSoundscape !== 'silence') {
        const volumeSlider = document.getElementById('volume-slider');
        const volume = volumeSlider ? parseInt(volumeSlider.value) : 50;
        
        currentSoundscape = newSoundscape;
        await Platform.playSound(newSoundscape, volume);
    } else {
        currentSoundscape = null;
    }
}

// ============================================================================
// AI FEATURES
// ============================================================================

async function handleFindFocusTime() {
    console.log('Find Focus Time clicked');
    
    try {
        showAILoading('Finding optimal focus time...');
        
        // Use client-side analysis (like the extension)
        const focusWindow = analyzeCalendarForFocus(currentEvents);
        
        if (focusWindow) {
            displayFocusTimeResult(focusWindow);
        } else {
            showAIError('No suitable focus time found in your schedule today.');
        }
    } catch (error) {
        console.error('Find Focus Time error:', error);
        showAIError('Failed to find focus time. Please try again.');
    }
}

/**
 * Analyze calendar events to find optimal focus windows (client-side)
 */
function analyzeCalendarForFocus(events) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(18, 0, 0, 0);
    
    if (!events || events.length === 0) {
        const duration = 90;
        const endTime = new Date(now.getTime() + duration * 60 * 1000);
        
        return {
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
            score: 100,
            reasoning: "Perfect! Your calendar is completely free. This is an ideal time for deep, uninterrupted focus work."
        };
    }
    
    const todayEvents = events
        .filter(event => event && event.start)
        .map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            title: event.summary || 'Event'
        }))
        .filter(event => event.start >= now && event.start <= endOfDay)
        .sort((a, b) => a.start - b.start);
    
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
    
    const gaps = [];
    let currentTime = new Date(Math.max(now.getTime(), now.getTime()));
    
    if (todayEvents[0].start - currentTime >= 45 * 60 * 1000) {
        gaps.push({
            start: new Date(currentTime),
            end: new Date(todayEvents[0].start),
            duration: Math.floor((todayEvents[0].start - currentTime) / (60 * 1000))
        });
    }
    
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
    
    const lastEvent = todayEvents[todayEvents.length - 1];
    if (endOfDay - lastEvent.end >= 45 * 60 * 1000) {
        gaps.push({
            start: new Date(lastEvent.end),
            end: new Date(endOfDay),
            duration: Math.floor((endOfDay - lastEvent.end) / (60 * 1000))
        });
    }
    
    if (gaps.length === 0) {
        return null;
    }
    
    const scoredGaps = gaps.map(gap => {
        let score = Math.min(gap.duration, 120);
        const hour = gap.start.getHours();
        if (hour >= 9 && hour <= 11) score += 20;
        if (hour >= 14 && hour <= 16) score += 15;
        if (hour >= 8 && hour <= 17) score += 10;
        if (gap.duration >= 90) score += 15;
        if (gap.duration >= 120) score += 10;
        
        return { ...gap, score };
    });
    
    const bestGap = scoredGaps.reduce((best, current) => 
        current.score > best.score ? current : best
    );
    
    const suggestedDuration = Math.min(90, Math.max(75, bestGap.duration - 15));
    const endTime = new Date(bestGap.start.getTime() + suggestedDuration * 60 * 1000);
    
    const hour = bestGap.start.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    let reasoning = `This ${bestGap.duration}-minute window in the ${timeOfDay} provides `;
    
    if (bestGap.duration >= 120) {
        reasoning += 'excellent space for deep work with minimal interruptions.';
    } else if (bestGap.duration >= 90) {
        reasoning += 'good opportunity for focused work before your next commitment.';
    } else {
        reasoning += 'a solid block for concentrated effort.';
    }
    
    if (todayEvents.length <= 2) {
        reasoning += ' Your light schedule today allows for sustained focus.';
    } else if (todayEvents.length <= 4) {
        reasoning += ' Despite a moderate schedule, this gap offers quality focus time.';
    } else {
        reasoning += ' This is your best available window in a busy day.';
    }
    
    return {
        startTime: bestGap.start.toISOString(),
        endTime: endTime.toISOString(),
        duration: suggestedDuration,
        score: Math.min(100, bestGap.score),
        reasoning: reasoning
    };
}

async function handleGenerateRitual() {
    console.log('Generate Ritual clicked');
    
    try {
        showAILoading('Generating personalized ritual...');
        
        // Use client-side generation (like the extension)
        const ritual = generatePersonalizedRitual(currentEvents);
        displayRitualResult(ritual);
        
        // Save for Quick Start
        await saveSessionSettings({
            ritual,
            soundscape: ritual.suggestedSoundscape || 'rain',
            timestamp: Date.now()
        });
        
        await updateQuickStartButton();
    } catch (error) {
        console.error('Generate Ritual error:', error);
        showAIError('Failed to generate ritual. Please try again.');
    }
}

/**
 * Generate personalized ritual based on calendar context (client-side)
 */
function generatePersonalizedRitual(events) {
    const now = new Date();
    const hour = now.getHours();
    const eventCount = events ? events.length : 0;
    
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const calendarDensity = eventCount <= 2 ? 'light' : eventCount <= 4 ? 'moderate' : 'busy';
    
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
                suggestedSoundscape: 'waves'
            },
            busy: {
                name: 'Power Hour',
                workDuration: 60,
                breakDuration: 8,
                description: 'Concentrated effort designed to maximize productivity in limited time.',
                suggestedSoundscape: 'white-noise'
            }
        },
        evening: {
            light: {
                name: 'Evening Wind Down',
                workDuration: 75,
                breakDuration: 15,
                description: 'Relaxed evening session for wrapping up tasks and planning tomorrow.',
                suggestedSoundscape: 'rain'
            },
            moderate: {
                name: 'Evening Push',
                workDuration: 60,
                breakDuration: 10,
                description: 'Final productive push to complete remaining priorities before day ends.',
                suggestedSoundscape: 'forest'
            },
            busy: {
                name: 'Quick Evening Session',
                workDuration: 45,
                breakDuration: 8,
                description: 'Short focused session to tie up loose ends after a busy day.',
                suggestedSoundscape: 'waves'
            }
        }
    };
    
    return rituals[timeOfDay][calendarDensity];
}

function showAILoading(message) {
    const aiResults = document.getElementById('ai-results');
    if (aiResults) {
        aiResults.classList.remove('hidden');
        aiResults.innerHTML = `
            <div class="ai-loading">
                <div class="spinner"></div>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
}

function showAIError(message) {
    const aiResults = document.getElementById('ai-results');
    if (aiResults) {
        aiResults.classList.remove('hidden');
        aiResults.innerHTML = `
            <div class="ai-error">
                <p>⚠️ ${escapeHtml(message)}</p>
            </div>
        `;
    }
}

function displayFocusTimeResult(focusWindow) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;
    
    aiResults.classList.remove('hidden');
    
    if (!focusWindow || !focusWindow.startTime) {
        aiResults.innerHTML = `
            <div class="focus-time-result">
                <div class="focus-time-header">
                    <span>🎯</span>
                    <h5>No Focus Time Available</h5>
                </div>
                <div class="focus-reasoning">
                    No suitable focus windows found in your calendar today. Your schedule is quite full! Consider blocking time tomorrow or finding a shorter 30-minute slot for a quick focus session.
                </div>
                <button class="close-results-btn" onclick="document.getElementById('ai-results').classList.add('hidden')">×</button>
            </div>
        `;
        return;
    }
    
    const startTime = new Date(focusWindow.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    const endTime = new Date(focusWindow.endTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    aiResults.innerHTML = `
        <div class="focus-time-result">
            <div class="focus-time-header">
                <span>🎯</span>
                <h5>Optimal Focus Window</h5>
            </div>
            <div class="focus-time-slot">
                <div class="focus-time-duration">${focusWindow.duration} min</div>
                <div class="focus-time-period">${startTime} - ${endTime}</div>
                <div class="focus-score">
                    <span>Quality Score:</span>
                    <span class="score-badge">${Math.round(focusWindow.score)}/100</span>
                </div>
            </div>
            ${focusWindow.reasoning ? `
                <div class="focus-reasoning">${escapeHtml(focusWindow.reasoning)}</div>
            ` : ''}
            <button class="start-session-btn" onclick="startFocusSession(${focusWindow.duration})">
                <span>🚀</span>
                Start Focus Session
            </button>
            <button class="close-results-btn" onclick="document.getElementById('ai-results').classList.add('hidden')">×</button>
        </div>
    `;
}

async function startFocusSession(duration) {
    const config = {
        mode: 'work',
        workDuration: duration * 60, // Convert minutes to seconds
        breakDuration: 300,
        soundscape: 'rain',
        volume: 50,
        taskGoal: 'Focus Session'
    };
    await startSession(config);
}

function displayRitualResult(ritual) {
    const aiResults = document.getElementById('ai-results');
    if (!aiResults) return;
    
    aiResults.classList.remove('hidden');
    
    if (!ritual || !ritual.name) {
        aiResults.innerHTML = `
            <div class="ritual-result">
                <div class="ritual-header">
                    <span>✨</span>
                    <h5>Ritual Generation Failed</h5>
                </div>
                <p>Unable to generate a ritual at this time.</p>
                <button class="close-results-btn" onclick="document.getElementById('ai-results').classList.add('hidden')">×</button>
            </div>
        `;
        return;
    }
    
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
                <button class="use-ritual-btn" onclick="useRitual('${escapeHtml(ritual.name)}', ${ritual.workDuration}, ${ritual.breakDuration}, '${ritual.suggestedSoundscape || 'rain'}')">
                    <span>🚀</span>
                    Use This Ritual
                </button>
            </div>
            <button class="close-results-btn" onclick="document.getElementById('ai-results').classList.add('hidden')">×</button>
        </div>
    `;
}

async function useRitual(name, workDuration, breakDuration, soundscape) {
    const config = {
        mode: 'work',
        workDuration: workDuration * 60, // Convert minutes to seconds
        breakDuration: breakDuration * 60,
        soundscape: soundscape,
        volume: 50,
        taskGoal: name
    };
    await startSession(config);
}

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

async function initializeTheme() {
    const savedTheme = await Platform.getData('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(currentTheme);
    }
}

async function handleThemeChange(theme) {
    currentTheme = theme;
    applyTheme(theme);
    await Platform.saveData('theme', theme);
}

function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    
    // Update active theme button
    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    const activeButton = document.getElementById(`theme-${theme}-button`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Show/hide background animations
    const rainBg = document.getElementById('rain-background');
    const wavesBg = document.getElementById('waves-background');
    
    if (rainBg) rainBg.style.display = theme === 'rain' ? 'block' : 'none';
    if (wavesBg) wavesBg.style.display = theme === 'beach' ? 'block' : 'none';
}

// ============================================================================
// BLOCKED SITES
// ============================================================================

async function loadBlockedSites() {
    const blockedSites = await Platform.getData('blockedSites');
    const textarea = document.getElementById('blocked-sites-list');
    
    if (textarea && blockedSites && Array.isArray(blockedSites)) {
        textarea.value = blockedSites.join('\n');
    }
}

async function handleSaveBlockedSites() {
    const textarea = document.getElementById('blocked-sites-list');
    if (!textarea) return;
    
    const sites = textarea.value
        .split('\n')
        .map(site => sanitizeDomain(site.trim()))
        .filter(site => site.length > 0 && isValidDomain(site));
    
    // Validate data before storing
    if (!validateBlockedSites(sites)) {
        showError('Invalid blocked sites list. Please check your entries.');
        return;
    }
    
    await Platform.saveData('blockedSites', sites);
    
    // Show success feedback
    const saveBtn = document.getElementById('save-blocked-sites-button');
    if (saveBtn) {
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<span class="btn-icon">✓</span> Saved!';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
        }, 2000);
    }
}

/**
 * Sanitize domain input to prevent XSS and injection attacks
 * @param {string} domain - Domain to sanitize
 * @returns {string} Sanitized domain
 */
function sanitizeDomain(domain) {
    if (!domain || typeof domain !== 'string') return '';
    
    // Remove any HTML tags
    domain = domain.replace(/<[^>]*>/g, '');
    
    // Remove any script-like content
    domain = domain.replace(/javascript:/gi, '');
    domain = domain.replace(/on\w+=/gi, '');
    
    // Remove special characters except dots, hyphens, and alphanumeric
    domain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
    
    // Remove leading/trailing dots and hyphens
    domain = domain.replace(/^[.-]+|[.-]+$/g, '');
    
    // Convert to lowercase
    domain = domain.toLowerCase();
    
    // Limit length to prevent abuse
    return domain.substring(0, 253); // Max domain length per RFC 1035
}

/**
 * Validate if a string is a valid domain
 * @param {string} domain - Domain to validate
 * @returns {boolean} True if valid domain
 */
function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    
    // Basic domain validation regex
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    
    // Allow simple domain names without TLD for localhost/internal
    const simpleRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/i;
    
    return domainRegex.test(domain) || simpleRegex.test(domain);
}

/**
 * Validate blocked sites list
 * @param {Array} sites - Array of domains
 * @returns {boolean} True if valid
 */
function validateBlockedSites(sites) {
    if (!Array.isArray(sites)) return false;
    
    // Limit number of blocked sites to prevent abuse
    if (sites.length > 1000) return false;
    
    // Validate each site
    return sites.every(site => {
        return typeof site === 'string' && 
               site.length > 0 && 
               site.length <= 253 &&
               isValidDomain(site);
    });
}

// ============================================================================
// QUICK START
// ============================================================================

async function initializeQuickStart() {
    const settings = await Platform.getData('lastSessionSettings');
    if (settings) {
        lastSessionSettings = settings;
        await updateQuickStartButton();
    }
}

async function saveSessionSettings(settings) {
    lastSessionSettings = settings;
    await Platform.saveData('lastSessionSettings', settings);
}

async function updateQuickStartButton() {
    const quickStartBtn = document.getElementById('quick-start-button');
    const quickStartDesc = document.getElementById('quick-start-description');
    
    if (lastSessionSettings && lastSessionSettings.ritual) {
        if (quickStartBtn) {
            quickStartBtn.classList.remove('hidden');
        }
        if (quickStartDesc) {
            quickStartDesc.textContent = `Start '${lastSessionSettings.ritual.name}' Session`;
            quickStartDesc.classList.remove('hidden');
        }
    }
}

// ============================================================================
// OFFLINE FUNCTIONALITY
// ============================================================================

/**
 * Setup offline/online detection
 */
function setupOfflineDetection() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    isOffline = !navigator.onLine;
    updateOfflineIndicator();
}

/**
 * Handle online event
 */
async function handleOnline() {
    console.log('App is now online');
    isOffline = false;
    updateOfflineIndicator();
    
    // Process offline queue
    await processOfflineQueue();
}

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('App is now offline');
    isOffline = true;
    updateOfflineIndicator();
}

/**
 * Update offline status indicator in UI
 */
function updateOfflineIndicator() {
    // Remove existing indicator
    let indicator = document.getElementById('offline-indicator');
    
    if (isOffline) {
        if (!indicator) {
            // Create offline indicator
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = `
                <span class="offline-icon">📡</span>
                <span class="offline-text">Offline Mode - Timer works, but sync is paused</span>
            `;
            document.body.appendChild(indicator);
        }
    } else {
        if (indicator) {
            indicator.remove();
        }
    }
}

/**
 * Queue an API call for later when offline
 */
async function queueOfflineRequest(endpoint, options, data) {
    const request = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endpoint,
        options,
        data,
        timestamp: Date.now()
    };
    
    offlineQueue.push(request);
    await saveOfflineQueue();
    
    console.log('Request queued for offline processing:', request.id);
}

/**
 * Save offline queue to localStorage
 */
async function saveOfflineQueue() {
    try {
        await Platform.saveData('offlineQueue', offlineQueue);
    } catch (error) {
        console.error('Failed to save offline queue:', error);
    }
}

/**
 * Load offline queue from localStorage
 */
async function loadOfflineQueue() {
    try {
        const queue = await Platform.getData('offlineQueue');
        if (queue && Array.isArray(queue)) {
            offlineQueue = queue;
            console.log(`Loaded ${offlineQueue.length} queued requests`);
        }
    } catch (error) {
        console.error('Failed to load offline queue:', error);
    }
}

/**
 * Process queued offline requests
 */
async function processOfflineQueue() {
    if (offlineQueue.length === 0) {
        return;
    }
    
    console.log(`Processing ${offlineQueue.length} queued requests...`);
    
    const processedIds = [];
    
    for (const request of offlineQueue) {
        try {
            console.log(`Processing queued request: ${request.id}`);
            
            const response = await Platform.fetchFromBackend(request.endpoint, request.options);
            
            if (response.ok) {
                console.log(`Successfully processed: ${request.id}`);
                processedIds.push(request.id);
            } else {
                console.warn(`Failed to process: ${request.id}, status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error processing queued request ${request.id}:`, error);
        }
    }
    
    // Remove successfully processed requests
    offlineQueue = offlineQueue.filter(req => !processedIds.includes(req.id));
    await saveOfflineQueue();
    
    console.log(`Processed ${processedIds.length} requests, ${offlineQueue.length} remaining`);
}

/**
 * Make an API call with offline support
 */
async function fetchWithOfflineSupport(endpoint, options, queueIfOffline = true) {
    if (isOffline && queueIfOffline) {
        // Queue the request for later
        await queueOfflineRequest(endpoint, options);
        return { queued: true };
    }
    
    try {
        const response = await Platform.fetchFromBackend(endpoint, options);
        return response;
    } catch (error) {
        // Network error - might have gone offline
        if (!navigator.onLine) {
            isOffline = true;
            updateOfflineIndicator();
            
            if (queueIfOffline) {
                await queueOfflineRequest(endpoint, options);
                return { queued: true };
            }
        }
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        if (announcement.parentElement) {
            announcement.parentElement.removeChild(announcement);
        }
    }, 1000);
}
