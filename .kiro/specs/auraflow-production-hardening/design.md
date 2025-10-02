# Design Document

## Overview

This design document outlines the production hardening approach for AuraFlow's AI services and the implementation of the Gentle Nudge notification system with Affirmation & Mindfulness breaks. The focus is on making existing services bulletproof against edge cases while adding compassionate user guidance through persistent Chrome Extension notifications.

### Key Goals

1. **Resilience**: Make all AI services handle any input gracefully without crashes
2. **User Guidance**: Implement persistent notifications that work even when popup is closed
3. **Compassion**: Integrate encouraging affirmations into the user experience
4. **Quality**: Comprehensive test coverage for all edge cases

### Technology Stack

**Backend Services:**
- Node.js/Express (existing)
- Jest for unit testing

**Chrome Extension:**
- Manifest V3 Service Worker
- chrome.alarms API (persistent timers)
- chrome.notifications API (system notifications)
- chrome.storage.local API (session state)

## Architecture

### High-Level Architecture for Gentle Nudge System

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension Popup                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  User starts focus session                          │    │
│  │  - workDuration: 50 minutes                         │    │
│  │  - breakDuration: 10 minutes                        │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │ sendMessage()                            │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Background Service Worker                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Message Handler: 'startSession'                    │    │
│  │  1. Clear existing alarms                           │    │
│  │  2. Create AURAFLOW_WORK_END alarm                  │    │
│  │  3. Create AURAFLOW_BREAK_END alarm                 │    │
│  │  4. Store session state                             │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  chrome.alarms.onAlarm Listener                     │    │
│  │  - Check alarm name                                 │    │
│  │  - Select random affirmation                        │    │
│  │  - Trigger chrome.notifications                     │    │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              System Notifications                            │
│  "AuraFlow: Time for a mindful break!"                      │
│  "A moment of rest is a moment of growth."                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Hardened Smart Scheduling Service

**Current State Analysis:**
The existing `scheduling.service.js` already has some validation but needs comprehensive edge case handling.

**Hardening Strategy:**

#### 1.1 Input Validation Layer

```javascript
/**
 * Validates and normalizes calendar events input
 * @param {any} calendarEvents - Raw input (could be anything)
 * @returns {Array} Normalized array of events
 */
function normalizeCalendarEventsInput(calendarEvents) {
  // Handle null/undefined - treat as empty array
  if (calendarEvents === null || calendarEvents === undefined) {
    return [];
  }
  
  // Handle non-array input - treat as empty array
  if (!Array.isArray(calendarEvents)) {
    console.warn('calendarEvents is not an array, treating as empty');
    return [];
  }
  
  return calendarEvents;
}
```

#### 1.2 Event Merging for Overlaps

```javascript
/**
 * Merges overlapping events into consolidated busy blocks
 * @param {Array} events - Validated events sorted by start time
 * @returns {Array} Merged events with no overlaps
 */
function mergeOverlappingEvents(events) {
  if (events.length === 0) return [];
  
  const merged = [];
  let current = { ...events[0] };
  
  for (let i = 1; i < events.length; i++) {
    const next = events[i];
    const currentEnd = parseISODate(current.endTime);
    const nextStart = parseISODate(next.startTime);
    const nextEnd = parseISODate(next.endTime);
    
    // Check if events overlap or are adjacent
    if (nextStart <= currentEnd) {
      // Merge: extend current event to cover both
      if (nextEnd > currentEnd) {
        current.endTime = next.endTime;
      }
    } else {
      // No overlap: save current and move to next
      merged.push(current);
      current = { ...next };
    }
  }
  
  merged.push(current);
  return merged;
}
```

#### 1.3 All-Day Event Handling

```javascript
/**
 * Expands all-day events to block the entire workday
 * @param {Object} event - Calendar event
 * @returns {Object} Event with expanded time range
 */
function expandAllDayEvent(event) {
  // Check if event is all-day (has date but no dateTime)
  if (event.startTime && event.startTime.length === 10) {
    // Parse the date
    const date = new Date(event.startTime);
    
    // Set to workday hours (9 AM - 5 PM)
    const startOfWorkday = new Date(date);
    startOfWorkday.setHours(9, 0, 0, 0);
    
    const endOfWorkday = new Date(date);
    endOfWorkday.setHours(17, 0, 0, 0);
    
    return {
      ...event,
      startTime: formatToISO(startOfWorkday),
      endTime: formatToISO(endOfWorkday),
      isAllDay: true
    };
  }
  
  return event;
}
```

#### 1.4 Enhanced Main Function Flow

```javascript
function suggestOptimalFocusWindow(calendarEvents, userPreferences = {}) {
  // Step 1: Normalize input (handles null/undefined/non-array)
  const normalizedEvents = normalizeCalendarEventsInput(calendarEvents);
  
  // Step 2: Apply default preferences
  const prefs = {
    preferredTime: userPreferences.preferredTime || 'morning',
    minimumDuration: userPreferences.minimumDuration || 75,
    bufferTime: userPreferences.bufferTime || 15
  };
  
  // Step 3: Filter and validate events
  const validEvents = normalizedEvents
    .map(expandAllDayEvent)  // Expand all-day events first
    .filter(isValidEvent)     // Remove malformed events
    .sort(sortByStartTime);   // Sort chronologically
  
  // Step 4: Merge overlapping events
  const mergedEvents = mergeOverlappingEvents(validEvents);
  
  // Step 5: Continue with existing logic...
  // (find gaps, score slots, return optimal window)
}
```

### 2. Hardened Ritual Generation Service

**Current State Analysis:**
The existing `ritual.service.js` has basic validation but needs to handle all edge cases.

**Hardening Strategy:**

#### 2.1 Context Normalization

```javascript
/**
 * Normalizes and validates ritual context input
 * @param {any} context - Raw context input
 * @returns {Object} Normalized context with defaults
 */
function normalizeRitualContext(context) {
  // Handle null/undefined - return default context
  if (context === null || context === undefined) {
    return {
      calendarEventTitle: '',
      timeOfDay: 'morning',
      calendarDensity: 'moderate'
    };
  }
  
  // Handle non-object input
  if (typeof context !== 'object') {
    return {
      calendarEventTitle: '',
      timeOfDay: 'morning',
      calendarDensity: 'moderate'
    };
  }
  
  // Normalize individual properties
  return {
    calendarEventTitle: normalizeString(context.calendarEventTitle),
    timeOfDay: normalizeTimeOfDay(context.timeOfDay),
    calendarDensity: normalizeCalendarDensity(context.calendarDensity)
  };
}

function normalizeString(value) {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeTimeOfDay(value) {
  const valid = ['morning', 'afternoon', 'evening'];
  const normalized = String(value || '').toLowerCase().trim();
  return valid.includes(normalized) ? normalized : 'morning';
}

function normalizeCalendarDensity(value) {
  const valid = ['clear', 'moderate', 'busy'];
  const normalized = String(value || '').toLowerCase().trim();
  return valid.includes(normalized) ? normalized : 'moderate';
}
```

#### 2.2 Enhanced Main Function

```javascript
function generatePersonalizedRitual(context) {
  // Step 1: Normalize and validate input
  const normalizedContext = normalizeRitualContext(context);
  
  // Step 2: Extract normalized values
  const { calendarEventTitle, timeOfDay, calendarDensity } = normalizedContext;
  
  // Step 3: Apply decision tree logic (existing logic continues)
  const normalizedTitle = calendarEventTitle.toLowerCase();
  
  if (containsKeywords(normalizedTitle, KEYWORD_PATTERNS.shortBurst)) {
    return RITUAL_TEMPLATES.shortBurst;
  }
  
  // ... rest of existing logic
}
```

### 3. Gentle Nudge Notification System

**Purpose:** Provide persistent, compassionate notifications that guide users through focus sessions even when the extension popup is closed.

#### 3.1 Affirmations Collection

```javascript
// At the top of background.js
const AFFIRMATIONS = [
  "A moment of rest is a moment of growth.",
  "You are doing great. Take a deep breath.",
  "Stay hydrated and stretch for a moment.",
  "Your focus is a gift to yourself.",
  "Progress, not perfection. You're on the right path.",
  "This break is part of your productivity.",
  "Mindful rest fuels mindful work.",
  "You've earned this pause. Enjoy it.",
  "Small breaks lead to big breakthroughs.",
  "Be kind to yourself. You're doing enough.",
  "Breathe in calm, breathe out tension.",
  "Your well-being matters more than any task."
];

/**
 * Selects a random affirmation from the collection
 * @returns {string} Random affirmation message
 */
function getRandomAffirmation() {
  const index = Math.floor(Math.random() * AFFIRMATIONS.length);
  return AFFIRMATIONS[index];
}
```

#### 3.2 Session State Management

```javascript
/**
 * Stores current session state for alarm handling
 */
const SessionState = {
  async saveSession(sessionData) {
    await chrome.storage.local.set({
      'auraflow_active_session': {
        workDuration: sessionData.workDuration,
        breakDuration: sessionData.breakDuration,
        startTime: Date.now(),
        taskGoal: sessionData.taskGoal || 'Focus session'
      }
    });
  },
  
  async getSession() {
    const result = await chrome.storage.local.get(['auraflow_active_session']);
    return result.auraflow_active_session || null;
  },
  
  async clearSession() {
    await chrome.storage.local.remove(['auraflow_active_session']);
  }
};
```

#### 3.3 Alarm Management

```javascript
/**
 * Manages chrome.alarms for focus session timing
 */
const AlarmManager = {
  WORK_END_ALARM: 'AURAFLOW_WORK_END',
  BREAK_END_ALARM: 'AURAFLOW_BREAK_END',
  
  /**
   * Clears all existing AuraFlow alarms
   */
  async clearAllAlarms() {
    await chrome.alarms.clear(this.WORK_END_ALARM);
    await chrome.alarms.clear(this.BREAK_END_ALARM);
    console.log('All AuraFlow alarms cleared');
  },
  
  /**
   * Creates alarms for a focus session
   * @param {number} workDuration - Work duration in minutes
   * @param {number} breakDuration - Break duration in minutes
   */
  async createSessionAlarms(workDuration, breakDuration) {
    // Clear any existing alarms first
    await this.clearAllAlarms();
    
    // Create work end alarm
    await chrome.alarms.create(this.WORK_END_ALARM, {
      delayInMinutes: workDuration
    });
    
    // Create break end alarm
    await chrome.alarms.create(this.BREAK_END_ALARM, {
      delayInMinutes: workDuration + breakDuration
    });
    
    console.log(`Alarms created: work ends in ${workDuration}min, break ends in ${workDuration + breakDuration}min`);
  }
};
```

#### 3.4 Notification Handler

```javascript
/**
 * Handles alarm events and triggers notifications
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm fired:', alarm.name);
  
  try {
    const session = await SessionState.getSession();
    
    if (!session) {
      console.warn('No active session found for alarm');
      return;
    }
    
    if (alarm.name === AlarmManager.WORK_END_ALARM) {
      // Work period ended - time for break
      const affirmation = getRandomAffirmation();
      
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Time for a mindful break!',
        message: affirmation,
        priority: 2,
        requireInteraction: false
      });
      
      console.log('Work end notification sent with affirmation:', affirmation);
      
    } else if (alarm.name === AlarmManager.BREAK_END_ALARM) {
      // Break period ended - time to resume or finish
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AuraFlow: Break complete!',
        message: 'Ready to continue your focused work?',
        priority: 1,
        requireInteraction: false
      });
      
      console.log('Break end notification sent');
      
      // Clear session state
      await SessionState.clearSession();
    }
    
  } catch (error) {
    console.error('Error handling alarm:', error);
  }
});
```

#### 3.5 Message Handler for Session Control

```javascript
// Add to existing chrome.runtime.onMessage.addListener in background.js

case 'startSession':
  console.log('Starting focus session');
  const { workDuration, breakDuration, taskGoal } = message.data;
  
  // Validate input
  if (!workDuration || !breakDuration) {
    sendResponse({ 
      success: false, 
      error: 'Missing session duration parameters' 
    });
    break;
  }
  
  // Save session state
  await SessionState.saveSession({
    workDuration,
    breakDuration,
    taskGoal
  });
  
  // Create alarms
  await AlarmManager.createSessionAlarms(workDuration, breakDuration);
  
  sendResponse({ 
    success: true, 
    data: { message: 'Session started successfully' } 
  });
  break;

case 'endSession':
  console.log('Ending focus session early');
  
  // Clear all alarms
  await AlarmManager.clearAllAlarms();
  
  // Clear session state
  await SessionState.clearSession();
  
  sendResponse({ 
    success: true, 
    data: { message: 'Session ended successfully' } 
  });
  break;
```

#### 3.6 Popup Integration

```javascript
// Add to popup.js

/**
 * Starts a focus session with notifications
 * @param {number} workDuration - Work duration in minutes
 * @param {number} breakDuration - Break duration in minutes
 * @param {string} taskGoal - User's task goal
 */
async function startFocusSession(workDuration, breakDuration, taskGoal) {
  try {
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
      // Update UI to show active session
      showActiveSessionUI(workDuration, breakDuration);
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
    const response = await sendMessageToServiceWorker({
      action: 'endSession'
    });
    
    if (response.success) {
      console.log('Focus session ended');
      // Update UI to show session ended
      showSessionEndedUI();
    } else {
      throw new Error(response.error || 'Failed to end session');
    }
  } catch (error) {
    console.error('Failed to end focus session:', error);
    showError('Failed to end focus session. Please try again.');
  }
}
```

## Testing Strategy

### 1. Unit Tests for Hardened Scheduling Service

**File:** `battle-of-the-bots/src/services/scheduling.service.test.js`

```javascript
describe('Hardened Scheduling Service', () => {
  describe('Null/Undefined Input Handling', () => {
    test('should handle null calendarEvents', () => {
      const result = suggestOptimalFocusWindow(null, {});
      expect(result).not.toBeNull();
      // Should suggest a slot for the entire day
    });
    
    test('should handle undefined calendarEvents', () => {
      const result = suggestOptimalFocusWindow(undefined, {});
      expect(result).not.toBeNull();
    });
    
    test('should handle missing userPreferences', () => {
      const result = suggestOptimalFocusWindow([]);
      expect(result).not.toBeNull();
    });
  });
  
  describe('Malformed Event Handling', () => {
    test('should ignore events without startTime', () => {
      const events = [
        { endTime: '2025-10-03T10:00:00Z', title: 'Bad Event' },
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Good Event' }
      ];
      const result = suggestOptimalFocusWindow(events, {});
      expect(result).not.toBeNull();
    });
    
    test('should ignore events with endTime before startTime', () => {
      const events = [
        { startTime: '2025-10-03T15:00:00Z', endTime: '2025-10-03T14:00:00Z', title: 'Backwards Event' }
      ];
      const result = suggestOptimalFocusWindow(events, {});
      expect(result).not.toBeNull();
    });
  });
  
  describe('Overlapping Event Handling', () => {
    test('should merge overlapping events', () => {
      const events = [
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Event 1' },
        { startTime: '2025-10-03T14:30:00Z', endTime: '2025-10-03T15:30:00Z', title: 'Event 2' }
      ];
      const result = suggestOptimalFocusWindow(events, {});
      // Should treat as single busy block from 14:00 to 15:30
      expect(result).not.toBeNull();
      expect(result.startTime).not.toMatch(/T14:/);
    });
  });
  
  describe('All-Day Event Handling', () => {
    test('should block workday for all-day events', () => {
      const events = [
        { startTime: '2025-10-03', endTime: '2025-10-04', title: 'All Day Event' }
      ];
      const result = suggestOptimalFocusWindow(events, {});
      // Should return null or suggest time outside 9-5
      expect(result).toBeDefined();
    });
  });
});
```

### 2. Unit Tests for Hardened Ritual Service

**File:** `battle-of-the-bots/src/services/ritual.service.test.js`

```javascript
describe('Hardened Ritual Service', () => {
  describe('Null/Undefined Context Handling', () => {
    test('should return balanced ritual for null context', () => {
      const result = generatePersonalizedRitual(null);
      expect(result).toEqual(RITUAL_TEMPLATES.balanced);
    });
    
    test('should return balanced ritual for undefined context', () => {
      const result = generatePersonalizedRitual(undefined);
      expect(result).toEqual(RITUAL_TEMPLATES.balanced);
    });
  });
  
  describe('Empty/Null Title Handling', () => {
    test('should handle empty string title', () => {
      const result = generatePersonalizedRitual({
        calendarEventTitle: '',
        timeOfDay: 'afternoon',
        calendarDensity: 'busy'
      });
      expect(result).toEqual(RITUAL_TEMPLATES.recovery);
    });
    
    test('should handle null title', () => {
      const result = generatePersonalizedRitual({
        calendarEventTitle: null,
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      });
      expect(result).toBeDefined();
    });
  });
  
  describe('Invalid Context Properties', () => {
    test('should handle invalid timeOfDay', () => {
      const result = generatePersonalizedRitual({
        calendarEventTitle: 'Meeting',
        timeOfDay: 'midnight',
        calendarDensity: 'moderate'
      });
      expect(result).toBeDefined();
    });
    
    test('should handle invalid calendarDensity', () => {
      const result = generatePersonalizedRitual({
        calendarEventTitle: 'Write code',
        timeOfDay: 'morning',
        calendarDensity: 'extremely-busy'
      });
      expect(result).toEqual(RITUAL_TEMPLATES.longForm);
    });
  });
});
```

### 3. Manual Testing for Gentle Nudge System

**Test Case E1: Verify Session Notifications**

1. Open Chrome Extension popup
2. Start a 1-minute focus session (for testing purposes)
3. Close the popup window
4. Wait 1 minute
5. **Expected:** System notification appears with title "AuraFlow: Time for a mindful break!" and a random affirmation
6. Wait additional break duration
7. **Expected:** Second notification appears indicating break is complete

**Test Case E2: Verify Early Session End**

1. Open Chrome Extension popup
2. Start a 5-minute focus session
3. Immediately click "End Session" button
4. Close popup
5. Wait 5+ minutes
6. **Expected:** No notifications appear

## Error Handling

### Scheduling Service Error Handling

```javascript
try {
  const result = suggestOptimalFocusWindow(calendarEvents, userPreferences);
  return result;
} catch (error) {
  console.error('Scheduling service error:', error);
  // Never throw - return null instead
  return null;
}
```

### Ritual Service Error Handling

```javascript
try {
  const result = generatePersonalizedRitual(context);
  return result;
} catch (error) {
  console.error('Ritual service error:', error);
  // Never throw - return default ritual
  return RITUAL_TEMPLATES.balanced;
}
```

### Notification Error Handling

```javascript
try {
  await chrome.notifications.create({...});
} catch (error) {
  console.error('Failed to create notification:', error);
  // Log but don't crash - notifications are non-critical
}
```

## Security Considerations

### Notification Permissions

The extension must request notification permissions in `manifest.json`:

```json
{
  "permissions": [
    "alarms",
    "notifications",
    "storage"
  ]
}
```

### Input Sanitization

All user inputs (task goals, event titles) must be sanitized before display in notifications to prevent injection attacks.

## Performance Considerations

### Alarm Efficiency

- chrome.alarms API is battery-efficient and persists across browser restarts
- Minimum alarm interval is 1 minute (Chrome limitation)
- Alarms are automatically cleared when extension is uninstalled

### Storage Efficiency

- Session state is minimal (<1KB)
- Cleared automatically after session completion
- No long-term storage accumulation

## Deployment Checklist

- [ ] All unit tests pass for hardened services
- [ ] Manual testing completed for all edge cases
- [ ] Notification permissions added to manifest
- [ ] Affirmations reviewed for tone and compassion
- [ ] Error handling tested with malformed inputs
- [ ] Chrome.alarms tested with popup closed
- [ ] Early session termination tested
- [ ] Documentation updated with new test cases
