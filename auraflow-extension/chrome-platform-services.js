// AuraFlow Chrome Platform Services
// Wrapper functions for Chrome-specific APIs
// This abstraction layer allows the same interface to be implemented for web platforms

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Save data to Chrome storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON serialized)
 * @returns {Promise<void>}
 */
export async function saveData(key, value) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log(`Data saved to Chrome storage: ${key}`);
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get data from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<*>} Retrieved value or null if not found
 */
export async function getData(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    const value = result[key] !== undefined ? result[key] : null;
                    console.log(`Data retrieved from Chrome storage: ${key}`);
                    resolve(value);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Remove data from Chrome storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeData(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.remove(key, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log(`Data removed from Chrome storage: ${key}`);
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Save data to Chrome local storage (for larger data)
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {Promise<void>}
 */
export async function saveLocalData(key, value) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log(`Data saved to Chrome local storage: ${key}`);
                    resolve();
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get data from Chrome local storage
 * @param {string} key - Storage key
 * @returns {Promise<*>} Retrieved value or null if not found
 */
export async function getLocalData(key) {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    const value = result[key] !== undefined ? result[key] : null;
                    console.log(`Data retrieved from Chrome local storage: ${key}`);
                    resolve(value);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================================================
// NOTIFICATION OPERATIONS
// ============================================================================

/**
 * Create a Chrome notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.iconUrl] - Icon URL (optional)
 * @param {string} [options.type] - Notification type (default: 'basic')
 * @returns {Promise<string>} Notification ID
 */
export async function createNotification(options) {
    return new Promise((resolve, reject) => {
        try {
            const notificationOptions = {
                type: options.type || 'basic',
                iconUrl: options.iconUrl || chrome.runtime.getURL('icons/icon128.png'),
                title: options.title || 'AuraFlow',
                message: options.message || '',
                priority: options.priority || 2
            };

            chrome.notifications.create('', notificationOptions, (notificationId) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log('Chrome notification created:', notificationId);
                    resolve(notificationId);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Request notification permission (Chrome extensions have this by default)
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requestNotificationPermission() {
    // Chrome extensions with notifications permission in manifest have this by default
    // Check if notifications API is available
    if (chrome.notifications) {
        console.log('Chrome notification permission available');
        return Promise.resolve(true);
    } else {
        console.warn('Chrome notifications API not available');
        return Promise.resolve(false);
    }
}

/**
 * Clear a Chrome notification
 * @param {string} notificationId - Notification ID to clear
 * @returns {Promise<boolean>} True if notification was cleared
 */
export async function clearNotification(notificationId) {
    return new Promise((resolve, reject) => {
        try {
            chrome.notifications.clear(notificationId, (wasCleared) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log(`Notification cleared: ${notificationId}`);
                    resolve(wasCleared);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================================================
// AUDIO OPERATIONS
// ============================================================================

// Audio elements cache
const audioElements = new Map();

/**
 * Play a sound
 * @param {string} soundId - Sound identifier (e.g., 'notification', 'rain', 'beach')
 * @param {number} [volume] - Volume level (0-100), optional
 * @returns {Promise<void>}
 */
export async function playSound(soundId, volume) {
    try {
        let audio = audioElements.get(soundId);
        
        // Create audio element if it doesn't exist
        if (!audio) {
            audio = new Audio();
            
            // Map sound IDs to file paths
            const soundPaths = {
                'notification': 'sounds/notification.mp3',
                'rain': 'sounds/rain.mp3',
                'beach': 'sounds/beach.mp3',
                'calm': 'sounds/calm.mp3',
                'forest': 'sounds/forest.mp3'
            };
            
            const soundPath = soundPaths[soundId];
            if (!soundPath) {
                console.warn(`Unknown sound ID: ${soundId}`);
                return;
            }
            
            // Use chrome.runtime.getURL for extension resources
            audio.src = chrome.runtime.getURL(soundPath);
            audio.loop = soundId !== 'notification'; // Loop ambient sounds, not notifications
            
            audioElements.set(soundId, audio);
        }
        
        // Set volume if provided
        if (typeof volume === 'number') {
            audio.volume = Math.max(0, Math.min(1, volume / 100));
        }
        
        // Play the audio
        await audio.play();
        console.log(`Playing sound: ${soundId}`);
    } catch (error) {
        console.error(`Error playing sound ${soundId}:`, error);
        throw error;
    }
}

/**
 * Stop a sound
 * @param {string} soundId - Sound identifier
 * @returns {void}
 */
export function stopSound(soundId) {
    try {
        const audio = audioElements.get(soundId);
        
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            console.log(`Stopped sound: ${soundId}`);
        }
    } catch (error) {
        console.error(`Error stopping sound ${soundId}:`, error);
    }
}

/**
 * Set volume for a sound
 * @param {string} soundId - Sound identifier
 * @param {number} volume - Volume level (0-100)
 * @returns {void}
 */
export function setSoundVolume(soundId, volume) {
    try {
        const audio = audioElements.get(soundId);
        
        if (audio) {
            audio.volume = Math.max(0, Math.min(1, volume / 100));
            console.log(`Set volume for ${soundId}: ${volume}`);
        }
    } catch (error) {
        console.error(`Error setting volume for ${soundId}:`, error);
    }
}

/**
 * Stop all sounds
 * @returns {void}
 */
export function stopAllSounds() {
    try {
        audioElements.forEach((audio, soundId) => {
            audio.pause();
            audio.currentTime = 0;
        });
        console.log('All sounds stopped');
    } catch (error) {
        console.error('Error stopping all sounds:', error);
    }
}

// ============================================================================
// NETWORK OPERATIONS
// ============================================================================

/**
 * Fetch data from backend API
 * @param {string} endpoint - API endpoint URL
 * @param {Object} [options] - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchFromBackend(endpoint, options = {}) {
    try {
        console.log(`Fetching from backend: ${endpoint}`);
        
        // Set default headers
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        // Merge with provided headers
        const headers = {
            ...defaultHeaders,
            ...(options.headers || {})
        };
        
        // Make the fetch request
        const response = await fetch(endpoint, {
            ...options,
            headers
        });
        
        console.log(`Backend response: ${response.status} ${response.statusText}`);
        
        return response;
    } catch (error) {
        console.error(`Error fetching from backend: ${endpoint}`, error);
        throw error;
    }
}

/**
 * Send message to Chrome service worker (background script)
 * @param {Object} message - Message to send
 * @returns {Promise<*>} Response from service worker
 */
export async function sendMessageToServiceWorker(message) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    console.log('Message sent to service worker:', message.action);
                    resolve(response);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get Chrome extension resource URL
 * @param {string} path - Resource path
 * @returns {string} Full resource URL
 */
export function getResourceURL(path) {
    return chrome.runtime.getURL(path);
}

/**
 * Check if running in Chrome extension context
 * @returns {boolean} True if in Chrome extension
 */
export function isChromeExtension() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

// ============================================================================
// EXPORTS
// ============================================================================

// All functions are already exported using ES6 export syntax above
// This module provides Chrome-specific implementations of the platform abstraction layer

