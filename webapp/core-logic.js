// AuraFlow Core Logic Module
// Platform-agnostic timer, state management, and data preparation functions
// This module can be reused across Chrome extension, web app, and PWA

// ============================================================================
// TIMER MANAGEMENT
// ============================================================================

let timerState = {
    isRunning: false,
    isPaused: false,
    elapsed: 0,           // seconds
    remaining: 0,         // seconds
    totalDuration: 0,     // seconds
    startTime: null,      // timestamp
    pauseTime: null,      // timestamp
    intervalId: null,
    onTickCallback: null,
    onCompleteCallback: null
};

/**
 * Start a timer with specified duration
 * @param {number} duration - Duration in seconds
 * @param {function} onTick - Callback function called every second with remaining time
 * @param {function} onComplete - Callback function called when timer completes
 * @returns {boolean} Success status
 */
export function startTimer(duration, onTick, onComplete) {
    if (typeof duration !== 'number' || duration <= 0) {
        console.error('Invalid duration:', duration);
        return false;
    }

    // Stop any existing timer
    stopTimer();

    // Initialize timer state
    timerState = {
        isRunning: true,
        isPaused: false,
        elapsed: 0,
        remaining: duration,
        totalDuration: duration,
        startTime: Date.now(),
        pauseTime: null,
        intervalId: null,
        onTickCallback: onTick,
        onCompleteCallback: onComplete
    };

    // Start the countdown interval with requestAnimationFrame for smooth updates
    let lastTickTime = Date.now();
    
    const tick = () => {
        if (!timerState.isRunning) return;
        
        const now = Date.now();
        const deltaTime = now - lastTickTime;
        
        // Only update every second
        if (deltaTime >= 1000 && !timerState.isPaused) {
            lastTickTime = now;
            timerState.elapsed++;
            timerState.remaining = timerState.totalDuration - timerState.elapsed;

            // Call tick callback with remaining time
            if (typeof timerState.onTickCallback === 'function') {
                timerState.onTickCallback(timerState.remaining);
            }

            // Check if timer completed
            if (timerState.remaining <= 0) {
                const completeCallback = timerState.onCompleteCallback;
                stopTimer();
                
                // Call complete callback
                if (typeof completeCallback === 'function') {
                    completeCallback();
                }
                return;
            }
        }
        
        // Continue animation loop
        timerState.intervalId = requestAnimationFrame(tick);
    };
    
    timerState.intervalId = requestAnimationFrame(tick);

    console.log(`Timer started: ${duration} seconds`);
    return true;
}

/**
 * Pause the running timer
 * @returns {boolean} Success status
 */
export function pauseTimer() {
    if (!timerState.isRunning || timerState.isPaused) {
        console.warn('Cannot pause: timer not running or already paused');
        return false;
    }

    timerState.isPaused = true;
    timerState.pauseTime = Date.now();
    
    console.log('Timer paused');
    return true;
}

/**
 * Resume a paused timer
 * @returns {boolean} Success status
 */
export function resumeTimer() {
    if (!timerState.isRunning || !timerState.isPaused) {
        console.warn('Cannot resume: timer not running or not paused');
        return false;
    }

    timerState.isPaused = false;
    timerState.pauseTime = null;
    
    console.log('Timer resumed');
    return true;
}

/**
 * Stop the timer completely
 * @returns {boolean} Success status
 */
export function stopTimer() {
    if (timerState.intervalId) {
        cancelAnimationFrame(timerState.intervalId);
    }

    const wasRunning = timerState.isRunning;
    
    timerState = {
        isRunning: false,
        isPaused: false,
        elapsed: 0,
        remaining: 0,
        totalDuration: 0,
        startTime: null,
        pauseTime: null,
        intervalId: null,
        onTickCallback: null,
        onCompleteCallback: null
    };

    if (wasRunning) {
        console.log('Timer stopped');
    }
    
    return true;
}

/**
 * Get current timer state
 * @returns {Object} Current timer state
 */
export function getTimerState() {
    return {
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        elapsed: timerState.elapsed,
        remaining: timerState.remaining,
        totalDuration: timerState.totalDuration,
        startTime: timerState.startTime,
        pauseTime: timerState.pauseTime
    };
}

// ============================================================================
// SESSION STATE MANAGEMENT
// ============================================================================

let sessionState = {
    mode: 'work',              // 'work' or 'break'
    workDuration: 1500,        // 25 minutes in seconds
    breakDuration: 300,        // 5 minutes in seconds
    sessionId: null,
    userId: null,
    startTime: null,
    taskGoal: '',
    ritualName: null,
    soundscape: 'rain',
    volume: 50,
    blockedSites: [],
    autoStartBreak: true,
    interruptions: 0,
    completed: false
};

/**
 * Initialize a new session with configuration
 * @param {Object} config - Session configuration
 * @returns {Object} Initialized session state
 */
export function initializeSession(config) {
    if (!config || typeof config !== 'object') {
        console.error('Invalid session config:', config);
        return null;
    }

    // Validate and set session configuration
    const validatedConfig = validateSessionConfig(config);
    if (!validatedConfig) {
        console.error('Session config validation failed');
        return null;
    }

    sessionState = {
        mode: validatedConfig.mode || 'work',
        workDuration: validatedConfig.workDuration || 1500,
        breakDuration: validatedConfig.breakDuration || 300,
        sessionId: generateSessionId(),
        userId: validatedConfig.userId || null,
        startTime: Date.now(),
        taskGoal: validatedConfig.taskGoal || '',
        ritualName: validatedConfig.ritualName || null,
        soundscape: validatedConfig.soundscape || 'rain',
        volume: validatedConfig.volume || 50,
        blockedSites: Array.isArray(validatedConfig.blockedSites) ? validatedConfig.blockedSites : [],
        autoStartBreak: validatedConfig.autoStartBreak !== false,
        interruptions: 0,
        completed: false
    };

    console.log('Session initialized:', sessionState.sessionId);
    return { ...sessionState };
}

/**
 * Update session state with new values
 * @param {Object} updates - Object containing state updates
 * @returns {Object} Updated session state
 */
export function updateSessionState(updates) {
    if (!updates || typeof updates !== 'object') {
        console.error('Invalid session updates:', updates);
        return null;
    }

    // Apply updates to session state
    Object.keys(updates).forEach(key => {
        if (key in sessionState) {
            sessionState[key] = updates[key];
        }
    });

    console.log('Session state updated');
    return { ...sessionState };
}

/**
 * Get current session state
 * @returns {Object} Current session state
 */
export function getSessionState() {
    return { ...sessionState };
}

/**
 * Switch between work and break modes
 * @param {string} mode - 'work' or 'break'
 * @returns {boolean} Success status
 */
export function switchMode(mode) {
    if (mode !== 'work' && mode !== 'break') {
        console.error('Invalid mode:', mode);
        return false;
    }

    sessionState.mode = mode;
    console.log(`Switched to ${mode} mode`);
    return true;
}

/**
 * Generate a unique session ID
 * @returns {string} Unique session ID
 */
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// DATA PREPARATION FOR BACKEND
// ============================================================================

/**
 * Prepare session data for backend API
 * @param {Object} sessionInfo - Session information
 * @returns {Object} Formatted session data for backend
 */
export function prepareSessionData(sessionInfo) {
    if (!sessionInfo || typeof sessionInfo !== 'object') {
        console.error('Invalid session info:', sessionInfo);
        return null;
    }

    const currentState = sessionInfo.sessionState || sessionState;
    const currentTimer = sessionInfo.timerState || timerState;

    return {
        sessionId: currentState.sessionId || generateSessionId(),
        userId: currentState.userId || 'anonymous',
        startTime: currentState.startTime ? new Date(currentState.startTime).toISOString() : new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: currentTimer.elapsed || 0,
        mode: currentState.mode || 'work',
        completed: currentTimer.remaining === 0,
        interruptions: currentState.interruptions || 0,
        ritualUsed: currentState.ritualName || null,
        taskGoal: currentState.taskGoal || ''
    };
}

/**
 * Prepare focus time request for backend scheduling API
 * @param {Array} events - Calendar events
 * @param {Object} preferences - User preferences
 * @returns {Object} Formatted request for scheduling API
 */
export function prepareFocusTimeRequest(events, preferences) {
    if (!Array.isArray(events)) {
        console.error('Invalid events array:', events);
        return null;
    }

    if (!preferences || typeof preferences !== 'object') {
        console.error('Invalid preferences:', preferences);
        return null;
    }

    // Transform events to backend format
    const calendarEvents = events
        .filter(event => event && event.start && event.end)
        .map(event => ({
            id: event.id || `event_${Date.now()}`,
            startTime: event.start.dateTime || event.start.date,
            endTime: event.end.dateTime || event.end.date,
            title: (event.summary || 'Untitled Event').substring(0, 200)
        }));

    return {
        calendarEvents: calendarEvents,
        preferences: {
            preferredTime: preferences.preferredTime || 'afternoon',
            minimumDuration: preferences.minimumDuration || 75,
            bufferTime: preferences.bufferTime || 15
        }
    };
}

/**
 * Prepare ritual generation request for backend API
 * @param {Object} context - Context information for ritual generation
 * @returns {Object} Formatted request for ritual API
 */
export function prepareRitualRequest(context) {
    if (!context || typeof context !== 'object') {
        console.error('Invalid ritual context:', context);
        return null;
    }

    return {
        calendarEventTitle: (context.calendarEventTitle || 'Focus session').substring(0, 200),
        timeOfDay: context.timeOfDay || 'afternoon',
        calendarDensity: context.calendarDensity || 'moderate'
    };
}

// ============================================================================
// VALIDATION AND UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate session configuration
 * @param {Object} config - Session configuration to validate
 * @returns {Object|null} Validated config or null if invalid
 */
export function validateSessionConfig(config) {
    if (!config || typeof config !== 'object') {
        return null;
    }

    const validated = {};

    // Validate mode
    if (config.mode && (config.mode === 'work' || config.mode === 'break')) {
        validated.mode = config.mode;
    }

    // Validate durations (must be positive numbers)
    if (typeof config.workDuration === 'number' && config.workDuration > 0) {
        validated.workDuration = Math.floor(config.workDuration);
    }

    if (typeof config.breakDuration === 'number' && config.breakDuration > 0) {
        validated.breakDuration = Math.floor(config.breakDuration);
    }

    // Validate volume (0-100)
    if (typeof config.volume === 'number') {
        validated.volume = Math.max(0, Math.min(100, config.volume));
    }

    // Validate soundscape
    const validSoundscapes = ['rain', 'beach', 'calm', 'forest', 'silence'];
    if (config.soundscape && validSoundscapes.includes(config.soundscape)) {
        validated.soundscape = config.soundscape;
    }

    // Pass through other valid properties
    if (config.userId) validated.userId = config.userId;
    if (config.taskGoal) validated.taskGoal = String(config.taskGoal);
    if (config.ritualName) validated.ritualName = String(config.ritualName);
    if (Array.isArray(config.blockedSites)) validated.blockedSites = config.blockedSites;
    if (typeof config.autoStartBreak === 'boolean') validated.autoStartBreak = config.autoStartBreak;

    return validated;
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        return '00:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calculate progress percentage
 * @param {number} elapsed - Elapsed time in seconds
 * @param {number} total - Total duration in seconds
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(elapsed, total) {
    if (typeof elapsed !== 'number' || typeof total !== 'number' || total <= 0) {
        return 0;
    }

    const progress = (elapsed / total) * 100;
    return Math.max(0, Math.min(100, progress));
}

/**
 * Convert minutes to seconds
 * @param {number} minutes - Time in minutes
 * @returns {number} Time in seconds
 */
export function minutesToSeconds(minutes) {
    if (typeof minutes !== 'number' || minutes < 0) {
        return 0;
    }
    return Math.floor(minutes * 60);
}

/**
 * Convert seconds to minutes
 * @param {number} seconds - Time in seconds
 * @returns {number} Time in minutes
 */
export function secondsToMinutes(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        return 0;
    }
    return Math.floor(seconds / 60);
}

// ============================================================================
// EXPORTS
// ============================================================================

// All functions are already exported using ES6 export syntax above
// This module can be imported in both Chrome extension and web app contexts
