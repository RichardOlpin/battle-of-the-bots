/**
 * Smart Scheduling Service
 * Analyzes calendar events and user preferences to suggest optimal focus windows
 */

const {
  parseISODate,
  formatToISO,
  calculateDuration,
  addMinutes,
  getHourOfDay,
  filterSlotsByDuration,
  getTimeOfDay,
  getStartOfDay,
  getEndOfDay,
  findTimeGaps,
  applyBuffer
} = require('../utils/date-utils');

/**
 * Validates and normalizes calendar events input
 * Handles null, undefined, and non-array inputs gracefully
 * @param {any} calendarEvents - Raw input (could be anything)
 * @returns {Array} Normalized array of events
 */
function normalizeCalendarEventsInput(calendarEvents) {
  // Handle null/undefined - treat as empty array
  if (calendarEvents === null || calendarEvents === undefined) {
    console.warn('calendarEvents is null or undefined, treating as empty array');
    return [];
  }
  
  // Handle non-array input - treat as empty array
  if (!Array.isArray(calendarEvents)) {
    console.warn('calendarEvents is not an array, treating as empty array');
    return [];
  }
  
  return calendarEvents;
}

/**
 * Expands all-day events to block the entire workday
 * @param {Object} event - Calendar event
 * @returns {Object} Event with expanded time range if all-day
 */
function expandAllDayEvent(event) {
  try {
    // Check if event is all-day (has date but no time component)
    // All-day events are typically in format YYYY-MM-DD (10 characters)
    if (event.startTime && event.startTime.length === 10 && !event.startTime.includes('T')) {
      // Parse the date
      const date = new Date(event.startTime + 'T00:00:00');
      
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
  } catch (error) {
    console.warn('Error expanding all-day event:', error);
  }
  
  return event;
}

/**
 * Merges overlapping events into consolidated busy blocks
 * @param {Array} events - Validated events sorted by start time
 * @returns {Array} Merged events with no overlaps
 */
function mergeOverlappingEvents(events) {
  if (events.length === 0) return [];
  if (events.length === 1) return events;
  
  const merged = [];
  let current = { ...events[0] };
  
  for (let i = 1; i < events.length; i++) {
    const next = events[i];
    
    try {
      const currentEnd = parseISODate(current.endTime);
      const nextStart = parseISODate(next.startTime);
      const nextEnd = parseISODate(next.endTime);
      
      // Check if events overlap or are adjacent
      if (nextStart <= currentEnd) {
        // Merge: extend current event to cover both
        if (nextEnd > currentEnd) {
          current.endTime = next.endTime;
          current.title = `${current.title} / ${next.title}`;
        }
      } else {
        // No overlap: save current and move to next
        merged.push(current);
        current = { ...next };
      }
    } catch (error) {
      console.warn('Error merging events, skipping:', error);
      // If there's an error, just add current and move to next
      merged.push(current);
      current = { ...next };
    }
  }
  
  // Don't forget to add the last event
  merged.push(current);
  return merged;
}

// Helper function to create day range
function createDayRange(date) {
  return {
    dayStart: getStartOfDay(date, 8),
    dayEnd: getEndOfDay(date, 21)
  };
}

// Helper function to find available slots
function findAvailableSlots(calendarEvents, dayStart, dayEnd) {
  return findTimeGaps(calendarEvents, dayStart, dayEnd);
}

// Scoring weights for different factors
const SCORING_WEIGHTS = {
  duration: 0.3,           // Longer slots score higher
  timePreference: 0.4,     // Match user's preferred time
  bufferCompliance: 0.2,   // Adequate buffers
  timeOfDay: 0.1          // Avoid late evening
};

// Time preference definitions
const TIME_PREFERENCES = {
  morning: { start: 8, end: 12, peak: 10 },
  afternoon: { start: 12, end: 17, peak: 14 },
  evening: { start: 17, end: 21, peak: 18 }
};

/**
 * Calculates a score for a time slot based on duration
 * @param {number} duration - Duration in minutes
 * @param {number} minimumDuration - Minimum required duration
 * @returns {number} Score between 0 and 1
 */
function scoreDuration(duration, minimumDuration) {
  if (duration < minimumDuration) return 0;
  
  // Optimal duration is around 90-120 minutes
  const optimalDuration = 105;
  const difference = Math.abs(duration - optimalDuration);
  
  // Score decreases as we move away from optimal
  return Math.max(0, 1 - (difference / 120));
}

/**
 * Calculates a score based on time preference match
 * @param {string} slotStartTime - ISO 8601 start time
 * @param {string} preferredTime - 'morning', 'afternoon', or 'evening'
 * @returns {number} Score between 0 and 1
 */
function scoreTimePreference(slotStartTime, preferredTime) {
  if (!preferredTime || !TIME_PREFERENCES[preferredTime]) {
    return 0.5; // Neutral score if no preference
  }
  
  const preference = TIME_PREFERENCES[preferredTime];
  const hour = getHourOfDay(slotStartTime);
  
  // Check if hour is within preferred range
  if (hour >= preference.start && hour < preference.end) {
    // Higher score if closer to peak hour
    const distanceFromPeak = Math.abs(hour - preference.peak);
    return Math.max(0.5, 1 - (distanceFromPeak / 4));
  }
  
  // Lower score if outside preferred range
  return 0.2;
}

/**
 * Calculates a score based on buffer compliance
 * @param {Object} slot - Time slot object
 * @param {number} bufferTime - Required buffer in minutes
 * @returns {number} Score between 0 and 1
 */
function scoreBufferCompliance(slot, bufferTime) {
  // Since we already enforce buffers in filtering, slots that pass have full compliance
  return 1.0;
}

/**
 * Calculates a score based on time of day (penalize late evening)
 * @param {string} slotStartTime - ISO 8601 start time
 * @returns {number} Score between 0 and 1
 */
function scoreTimeOfDay(slotStartTime) {
  const hour = getHourOfDay(slotStartTime);
  
  // Exclude slots after 9 PM (21:00)
  if (hour >= 21) {
    return 0;
  }
  
  // Optimal hours: 8 AM - 6 PM
  if (hour >= 8 && hour < 18) {
    return 1.0;
  }
  
  // Evening hours (6 PM - 9 PM) get lower score
  if (hour >= 18 && hour < 21) {
    return 0.5;
  }
  
  // Very early morning gets lower score
  return 0.3;
}

/**
 * Calculates overall score for a time slot
 * @param {Object} slot - Time slot with startTime and endTime
 * @param {Object} userPreferences - User preferences object
 * @returns {number} Overall score between 0 and 100
 */
function calculateSlotScore(slot, userPreferences) {
  const duration = calculateDuration(slot.startTime, slot.endTime);
  const minimumDuration = userPreferences.minimumDuration || 75;
  const bufferTime = userPreferences.bufferTime || 15;
  
  // Calculate individual scores
  const durationScore = scoreDuration(duration, minimumDuration);
  const timePreferenceScore = scoreTimePreference(slot.startTime, userPreferences.preferredTime);
  const bufferScore = scoreBufferCompliance(slot, bufferTime);
  const timeOfDayScore = scoreTimeOfDay(slot.startTime);
  
  // If time of day score is 0 (after 9 PM), return 0
  if (timeOfDayScore === 0) {
    return 0;
  }
  
  // Calculate weighted score
  const weightedScore = (
    durationScore * SCORING_WEIGHTS.duration +
    timePreferenceScore * SCORING_WEIGHTS.timePreference +
    bufferScore * SCORING_WEIGHTS.bufferCompliance +
    timeOfDayScore * SCORING_WEIGHTS.timeOfDay
  );
  
  // Convert to 0-100 scale
  return Math.round(weightedScore * 100);
}

/**
 * Generates reasoning text for why a slot was selected
 * @param {Object} slot - Selected time slot
 * @param {number} score - Calculated score
 * @param {Object} userPreferences - User preferences
 * @returns {string} Human-readable reasoning
 */
function generateReasoning(slot, score, userPreferences) {
  const duration = calculateDuration(slot.startTime, slot.endTime);
  const timeOfDay = getTimeOfDay(slot.startTime);
  const preferredTime = userPreferences.preferredTime || 'any time';
  
  let reasoning = `This ${duration}-minute slot `;
  
  if (preferredTime !== 'any time' && timeOfDay === preferredTime) {
    reasoning += `aligns with your ${preferredTime} preference `;
  } else {
    reasoning += `is available during the ${timeOfDay} `;
  }
  
  reasoning += `and provides adequate buffer time around your other commitments.`;
  
  return reasoning;
}

/**
 * Suggests optimal focus window based on calendar and preferences
 * @param {Array<Object>} calendarEvents - User's calendar events
 * @param {Object} userPreferences - User's focus preferences
 * @returns {Object|null} Optimal time block or null if none found
 */
function suggestOptimalFocusWindow(calendarEvents, userPreferences = {}) {
  // Step 1: Normalize input (handles null/undefined/non-array)
  const normalizedEvents = normalizeCalendarEventsInput(calendarEvents);
  
  // Step 2: Validate and sanitize user preferences with defaults
  const minimumDuration = Math.max(15, Math.min(480, userPreferences.minimumDuration || 75));
  const bufferTime = Math.max(0, Math.min(60, userPreferences.bufferTime || 15));
  const preferredTime = ['morning', 'afternoon', 'evening'].includes(userPreferences.preferredTime) 
    ? userPreferences.preferredTime 
    : null;
  
  // Step 3: Expand all-day events and filter out invalid events
  const validEvents = normalizedEvents
    .map(expandAllDayEvent)  // Expand all-day events first
    .filter(event => {
      if (!event || typeof event !== 'object') return false;
      if (!event.startTime || !event.endTime) return false;
      
      try {
        const start = parseISODate(event.startTime);
        const end = parseISODate(event.endTime);
        
        // Check for valid dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        
        // Check that end is after start
        if (end <= start) return false;
        
        return true;
      } catch (error) {
        return false;
      }
    });
  
  // Step 4: Sort events by start time
  const sortedEvents = [...validEvents].sort((a, b) => {
    try {
      return parseISODate(a.startTime).getTime() - parseISODate(b.startTime).getTime();
    } catch (error) {
      return 0;
    }
  });
  
  // Step 5: Merge overlapping events
  const mergedEvents = mergeOverlappingEvents(sortedEvents);
  
  // Step 6: Determine day range
  let dayStart, dayEnd;
  
  try {
    if (mergedEvents.length === 0) {
      // No events - use today as default
      const today = new Date();
      const range = createDayRange(today);
      dayStart = range.dayStart;
      dayEnd = range.dayEnd;
    } else {
      const firstEvent = parseISODate(mergedEvents[0].startTime);
      const range = createDayRange(firstEvent);
      dayStart = range.dayStart;
      dayEnd = range.dayEnd;
    }
  } catch (error) {
    // Fallback to today if date parsing fails
    const today = new Date();
    const range = createDayRange(today);
    dayStart = range.dayStart;
    dayEnd = range.dayEnd;
  }
  
  // Step 7: Find available time slots using merged events
  const availableSlots = findAvailableSlots(mergedEvents, dayStart, dayEnd);
  
  // Apply buffer to each slot and filter by minimum duration
  const validSlots = availableSlots
    .map(slot => {
      const slotDuration = calculateDuration(slot.startTime, slot.endTime);
      // Only apply buffer if slot is large enough (needs buffer*2 + minimumDuration)
      if (slotDuration >= minimumDuration + (bufferTime * 2)) {
        return applyBuffer(slot, bufferTime);
      }
      // If slot is too small for buffer, return as-is
      return slot;
    })
    .filter(slot => {
      const duration = calculateDuration(slot.startTime, slot.endTime);
      return duration >= minimumDuration;
    });
  
  // Filter out slots after 9 PM
  const daytimeSlots = validSlots.filter(slot => {
    const hour = getHourOfDay(slot.startTime);
    return hour < 21;
  });
  
  // If no valid slots found
  if (daytimeSlots.length === 0) {
    return null;
  }
  
  // For very large slots (> 3 hours), carve out optimal windows based on preference
  const optimalWindows = [];
  for (const slot of daytimeSlots) {
    const slotDuration = calculateDuration(slot.startTime, slot.endTime);
    
    if (slotDuration > 180) {
      // Large slot - create multiple candidate windows
      const preferredTime = userPreferences.preferredTime || 'morning';
      const preference = TIME_PREFERENCES[preferredTime] || TIME_PREFERENCES.morning;
      
      // Create a window at the peak hour of preference
      const slotStart = parseISODate(slot.startTime);
      const slotEnd = parseISODate(slot.endTime);
      
      // Try to place a 90-minute window at the peak hour
      const targetHour = preference.peak;
      const windowStart = new Date(slotStart);
      windowStart.setHours(targetHour, 0, 0, 0);
      
      // Make sure window is within the slot
      if (windowStart >= slotStart && windowStart < slotEnd) {
        const windowEnd = addMinutes(windowStart, 90);
        if (windowEnd <= slotEnd) {
          optimalWindows.push({
            startTime: formatToISO(windowStart),
            endTime: formatToISO(windowEnd)
          });
        }
      }
      
      // Also add the original slot as a fallback
      optimalWindows.push(slot);
    } else {
      // Small slot - use as-is
      optimalWindows.push(slot);
    }
  }
  
  // Score each window
  const scoredSlots = optimalWindows.map(slot => {
    const duration = calculateDuration(slot.startTime, slot.endTime);
    const score = calculateSlotScore(slot, userPreferences);
    return {
      ...slot,
      duration,
      score
    };
  });
  
  // Filter out slots with score of 0
  const viableSlots = scoredSlots.filter(slot => slot.score > 0);
  
  if (viableSlots.length === 0) {
    return null;
  }
  
  // Find highest scoring slot
  const optimalSlot = viableSlots.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });
  
  // Generate reasoning
  const reasoning = generateReasoning(optimalSlot, optimalSlot.score, userPreferences);
  
  return {
    startTime: optimalSlot.startTime,
    endTime: optimalSlot.endTime,
    duration: optimalSlot.duration,
    score: optimalSlot.score,
    reasoning
  };
}

module.exports = {
  suggestOptimalFocusWindow,
  // Export for testing
  scoreDuration,
  scoreTimePreference,
  scoreTimeOfDay,
  calculateSlotScore
};
