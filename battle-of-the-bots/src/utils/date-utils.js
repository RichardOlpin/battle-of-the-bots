/**
 * Date and time utility functions
 * Provides functions for date parsing, time slot calculations, and ISO 8601 formatting
 */

/**
 * Parses ISO 8601 date string to Date object
 * @param {string} isoString - ISO 8601 formatted date string
 * @returns {Date} Parsed date object
 */
function parseISODate(isoString) {
  return new Date(isoString);
}

/**
 * Formats Date object to ISO 8601 string
 * @param {Date} date - Date object to format
 * @returns {string} ISO 8601 formatted string
 */
function formatToISO(date) {
  return date.toISOString();
}

/**
 * Calculates duration between two dates in minutes
 * @param {string|Date} startTime - Start time (ISO string or Date)
 * @param {string|Date} endTime - End time (ISO string or Date)
 * @returns {number} Duration in minutes
 */
function calculateDuration(startTime, endTime) {
  const start = typeof startTime === 'string' ? parseISODate(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISODate(endTime) : endTime;
  
  return Math.floor((end - start) / (1000 * 60));
}

/**
 * Adds minutes to a date
 * @param {string|Date} date - Base date (ISO string or Date)
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date with added minutes
 */
function addMinutes(date, minutes) {
  const baseDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  return new Date(baseDate.getTime() + minutes * 60 * 1000);
}

/**
 * Gets the hour of day from a date (0-23)
 * @param {string|Date} date - Date to extract hour from
 * @returns {number} Hour of day (0-23)
 */
function getHourOfDay(date) {
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;
  return dateObj.getHours();
}

/**
 * Checks if a time falls within a specific time range
 * @param {string|Date} time - Time to check
 * @param {number} startHour - Start hour (0-23)
 * @param {number} endHour - End hour (0-23)
 * @returns {boolean} True if time is within range
 */
function isTimeInRange(time, startHour, endHour) {
  const hour = getHourOfDay(time);
  return hour >= startHour && hour < endHour;
}

/**
 * Finds all time gaps between calendar events
 * @param {Array<Object>} events - Calendar events with startTime and endTime
 * @param {string} dayStart - Start of day (ISO string)
 * @param {string} dayEnd - End of day (ISO string)
 * @returns {Array<Object>} Array of gaps with startTime and endTime
 */
function findTimeGaps(events, dayStart, dayEnd) {
  if (!events || events.length === 0) {
    return [{
      startTime: dayStart,
      endTime: dayEnd
    }];
  }

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    parseISODate(a.startTime) - parseISODate(b.startTime)
  );

  const gaps = [];
  let currentTime = dayStart;

  for (const event of sortedEvents) {
    // If there's a gap before this event
    if (parseISODate(event.startTime) > parseISODate(currentTime)) {
      gaps.push({
        startTime: currentTime,
        endTime: event.startTime
      });
    }
    
    // Move current time to end of this event
    if (parseISODate(event.endTime) > parseISODate(currentTime)) {
      currentTime = event.endTime;
    }
  }

  // Check for gap after last event
  if (parseISODate(currentTime) < parseISODate(dayEnd)) {
    gaps.push({
      startTime: currentTime,
      endTime: dayEnd
    });
  }

  return gaps;
}

/**
 * Filters time slots by minimum duration
 * @param {Array<Object>} slots - Time slots with startTime and endTime
 * @param {number} minimumMinutes - Minimum duration in minutes
 * @returns {Array<Object>} Filtered slots meeting minimum duration
 */
function filterSlotsByDuration(slots, minimumMinutes) {
  return slots.filter(slot => {
    const duration = calculateDuration(slot.startTime, slot.endTime);
    return duration >= minimumMinutes;
  });
}

/**
 * Applies buffer time to a time slot
 * @param {Object} slot - Time slot with startTime and endTime
 * @param {number} bufferMinutes - Buffer time in minutes
 * @returns {Object} Slot with buffer applied
 */
function applyBuffer(slot, bufferMinutes) {
  return {
    startTime: formatToISO(addMinutes(slot.startTime, bufferMinutes)),
    endTime: formatToISO(addMinutes(slot.endTime, -bufferMinutes))
  };
}

/**
 * Gets time of day category for a given time
 * @param {string|Date} time - Time to categorize
 * @returns {string} 'morning', 'afternoon', or 'evening'
 */
function getTimeOfDay(time) {
  const hour = getHourOfDay(time);
  
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  
  return 'other';
}

/**
 * Creates a date string for start of day
 * @param {string|Date} date - Base date
 * @param {number} hour - Hour to set (default: 8)
 * @returns {string} ISO 8601 string for start of day
 */
function getStartOfDay(date, hour = 8) {
  const dateObj = typeof date === 'string' ? parseISODate(date) : new Date(date);
  dateObj.setHours(hour, 0, 0, 0);
  return formatToISO(dateObj);
}

/**
 * Creates a date string for end of day
 * @param {string|Date} date - Base date
 * @param {number} hour - Hour to set (default: 21)
 * @returns {string} ISO 8601 string for end of day
 */
function getEndOfDay(date, hour = 21) {
  const dateObj = typeof date === 'string' ? parseISODate(date) : new Date(date);
  dateObj.setHours(hour, 0, 0, 0);
  return formatToISO(dateObj);
}

module.exports = {
  parseISODate,
  formatToISO,
  calculateDuration,
  addMinutes,
  getHourOfDay,
  isTimeInRange,
  findTimeGaps,
  filterSlotsByDuration,
  applyBuffer,
  getTimeOfDay,
  getStartOfDay,
  getEndOfDay
};
