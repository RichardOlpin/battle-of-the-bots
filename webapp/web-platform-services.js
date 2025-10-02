/**
 * Web Platform Services
 * 
 * Provides web API implementations for platform-agnostic operations.
 * This module implements the platform abstraction layer using standard
 * web APIs (localStorage, Web Notifications API, HTML5 Audio API, fetch).
 */

// ============================================================================
// Storage Operations (using localStorage)
// ============================================================================

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export async function saveData(key, value) {
    try {
        // Validate key
        if (!validateStorageKey(key)) {
            throw new Error('Invalid storage key');
        }
        
        // Validate value
        if (!validateStorageValue(value)) {
            throw new Error('Invalid storage value');
        }
        
        // Sanitize value before storing
        const sanitizedValue = sanitizeStorageValue(value);
        
        localStorage.setItem(key, JSON.stringify(sanitizedValue));
    } catch (error) {
        console.error('Failed to save data to localStorage:', error);
        throw new Error(`Storage error: ${error.message}`);
    }
}

/**
 * Validate storage key
 * @param {string} key - Storage key to validate
 * @returns {boolean} True if valid
 */
function validateStorageKey(key) {
    if (typeof key !== 'string') return false;
    if (key.length === 0 || key.length > 256) return false;
    
    // Only allow alphanumeric, underscore, hyphen, and dot
    const keyRegex = /^[a-zA-Z0-9._-]+$/;
    return keyRegex.test(key);
}

/**
 * Validate storage value
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid
 */
function validateStorageValue(value) {
    // Null and undefined are valid
    if (value === null || value === undefined) return true;
    
    // Check if value can be JSON stringified
    try {
        const jsonString = JSON.stringify(value);
        
        // Limit size to 5MB to prevent quota issues
        if (jsonString.length > 5 * 1024 * 1024) {
            console.warn('Storage value exceeds 5MB limit');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Value cannot be JSON stringified:', error);
        return false;
    }
}

/**
 * Sanitize storage value to prevent XSS
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
function sanitizeStorageValue(value) {
    if (value === null || value === undefined) return value;
    
    // For strings, sanitize HTML and script content
    if (typeof value === 'string') {
        return sanitizeString(value);
    }
    
    // For arrays, sanitize each element
    if (Array.isArray(value)) {
        return value.map(item => sanitizeStorageValue(item));
    }
    
    // For objects, sanitize each property
    if (typeof value === 'object') {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            // Validate property key
            if (validateStorageKey(key)) {
                sanitized[key] = sanitizeStorageValue(val);
            }
        }
        return sanitized;
    }
    
    // For primitives (number, boolean), return as-is
    return value;
}

/**
 * Sanitize string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove script tags and event handlers
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    str = str.replace(/javascript:/gi, '');
    
    // Limit string length to prevent abuse
    return str.substring(0, 100000); // 100KB max per string
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Parsed value or null if not found
 */
export async function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to get data from localStorage:', error);
        return null;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeData(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to remove data from localStorage:', error);
        throw new Error(`Storage error: ${error.message}`);
    }
}

// ============================================================================
// Notification Operations (using Web Notifications API)
// ============================================================================

/**
 * Create and display a notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message/body
 * @param {string} [options.iconUrl] - Icon URL
 * @returns {Promise<void>}
 */
export async function createNotification(options) {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        showInAppNotification(options);
        return;
    }

    if (Notification.permission === 'granted') {
        try {
            new Notification(options.title, {
                body: options.message,
                icon: options.iconUrl || '/icons/icon-192.png',
                badge: options.iconUrl || '/icons/icon-192.png',
                tag: 'auraflow-notification',
                requireInteraction: false
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            showInAppNotification(options);
        }
    } else {
        // Permission denied or default - show in-app notification
        showInAppNotification(options);
    }
}

/**
 * Show in-app fallback notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message/body
 */
function showInAppNotification(options) {
    // Create in-app notification element
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    notification.innerHTML = `
        <div class="in-app-notification-content">
            <div class="in-app-notification-icon">🔔</div>
            <div class="in-app-notification-text">
                <div class="in-app-notification-title">${escapeHtml(options.title)}</div>
                <div class="in-app-notification-message">${escapeHtml(options.message)}</div>
            </div>
            <button class="in-app-notification-close" aria-label="Close notification">×</button>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Close button handler
    const closeBtn = notification.querySelector('.in-app-notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} True if permission granted, false otherwise
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        await saveData('notificationPermission', 'unsupported');
        return false;
    }

    if (Notification.permission === 'granted') {
        await saveData('notificationPermission', 'granted');
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Notification permission denied by user');
        await saveData('notificationPermission', 'denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        await saveData('notificationPermission', permission);
        
        if (permission === 'granted') {
            console.log('Notification permission granted');
            return true;
        } else {
            console.log('Notification permission denied');
            return false;
        }
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        await saveData('notificationPermission', 'error');
        return false;
    }
}

/**
 * Get current notification permission status
 * @returns {Promise<string>} Permission status: 'granted', 'denied', 'default', 'unsupported'
 */
export async function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

// ============================================================================
// Audio Operations (using HTML5 Audio API)
// ============================================================================

// Store audio instances by soundId
const audioInstances = new Map();

/**
 * Play a sound
 * @param {string} soundId - Unique identifier for the sound
 * @param {number} [volume=50] - Volume level (0-100)
 * @returns {Promise<void>}
 */
export async function playSound(soundId, volume = 50) {
    try {
        let audio = audioInstances.get(soundId);
        
        if (!audio) {
            // Create new audio instance if it doesn't exist
            audio = new Audio();
            
            // Map soundId to actual audio file paths
            const soundPaths = {
                'notification': '/sounds/notification.mp3',
                'complete': '/sounds/complete.mp3',
                'tick': '/sounds/tick.mp3',
                'rain': '/sounds/rain.mp3',
                'forest': '/sounds/forest.mp3',
                'cafe': '/sounds/cafe.mp3',
                'ocean': '/sounds/ocean.mp3'
            };
            
            audio.src = soundPaths[soundId] || soundPaths['notification'];
            audio.loop = ['rain', 'forest', 'cafe', 'ocean'].includes(soundId);
            audioInstances.set(soundId, audio);
        }
        
        // Set volume (0-100 to 0-1)
        audio.volume = Math.max(0, Math.min(100, volume)) / 100;
        
        // Reset to beginning if already playing
        audio.currentTime = 0;
        
        await audio.play();
    } catch (error) {
        console.error(`Failed to play sound ${soundId}:`, error);
    }
}

/**
 * Stop a sound
 * @param {string} soundId - Unique identifier for the sound
 */
export function stopSound(soundId) {
    const audio = audioInstances.get(soundId);
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

/**
 * Set volume for a sound
 * @param {string} soundId - Unique identifier for the sound
 * @param {number} volume - Volume level (0-100)
 */
export function setSoundVolume(soundId, volume) {
    const audio = audioInstances.get(soundId);
    if (audio) {
        audio.volume = Math.max(0, Math.min(100, volume)) / 100;
    }
}

// ============================================================================
// Network Operations (using fetch API)
// ============================================================================

/**
 * Fetch data from backend API
 * @param {string} endpoint - API endpoint URL
 * @param {Object} [options={}] - Fetch options
 * @returns {Promise<Response>}
 */
export async function fetchFromBackend(endpoint, options = {}) {
    try {
        // Validate endpoint URL is secure
        if (!isSecureEndpoint(endpoint)) {
            throw new Error('Insecure endpoint: HTTPS required in production');
        }
        
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        return response;
    } catch (error) {
        console.error('Backend fetch failed:', error);
        throw error;
    }
}

/**
 * Validate endpoint is secure (HTTPS or localhost)
 * @param {string} endpoint - Endpoint URL to validate
 * @returns {boolean} True if secure
 */
function isSecureEndpoint(endpoint) {
    try {
        const url = new URL(endpoint);
        const hostname = url.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
        
        // Allow HTTP only for localhost
        if (isLocalhost && url.protocol === 'http:') {
            return true;
        }
        
        // Require HTTPS for all other hosts
        if (url.protocol === 'https:') {
            return true;
        }
        
        console.error(`Insecure endpoint detected: ${endpoint}`);
        return false;
    } catch (error) {
        console.error('Invalid endpoint URL:', error);
        return false;
    }
}
