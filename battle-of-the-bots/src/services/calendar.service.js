/**
 * Calendar service
 * Business logic layer for calendar operations
 */

const googleCalendar = require('../integrations/google-calendar');
const dateUtils = require('../utils/date-utils');

/**
 * Gets calendar events for a user within date range
 * @param {string} userId - User identifier
 * @param {string} startDate - Start date (ISO 8601)
 * @param {string} endDate - End date (ISO 8601)
 * @returns {Promise<Array<Object>>} Array of calendar events
 */
async function getCalendarEvents(userId, startDate, endDate) {
  try {
    // Validate date range
    const start = dateUtils.parseISODate(startDate);
    const end = dateUtils.parseISODate(endDate);
    
    if (end <= start) {
      throw new Error('End date must be after start date');
    }
    
    // Fetch events from Google Calendar
    const events = await googleCalendar.fetchCalendarEvents(userId, startDate, endDate);
    
    // Add calculated duration to each event
    const eventsWithDuration = events.map(event => ({
      ...event,
      duration: dateUtils.calculateDuration(event.startTime, event.endTime)
    }));
    
    return eventsWithDuration;
  } catch (error) {
    throw new Error(`Failed to get calendar events: ${error.message}`);
  }
}

/**
 * Creates a calendar event for a user
 * @param {string} userId - User identifier
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
async function createCalendarEvent(userId, eventData) {
  try {
    // Validate required fields
    if (!eventData.title) {
      throw new Error('Event title is required');
    }
    
    if (!eventData.startTime || !eventData.endTime) {
      throw new Error('Event start and end times are required');
    }
    
    // Validate date range
    const start = dateUtils.parseISODate(eventData.startTime);
    const end = dateUtils.parseISODate(eventData.endTime);
    
    if (end <= start) {
      throw new Error('End time must be after start time');
    }
    
    // Create event in Google Calendar
    const createdEvent = await googleCalendar.createCalendarEvent(userId, eventData);
    
    return {
      ...createdEvent,
      duration: dateUtils.calculateDuration(createdEvent.startTime, createdEvent.endTime)
    };
  } catch (error) {
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Gets calendar events for today
 * @param {string} userId - User identifier
 * @returns {Promise<Array<Object>>} Array of today's calendar events
 */
async function getTodayEvents(userId) {
  const now = new Date();
  const startOfDay = dateUtils.getStartOfDay(now);
  const endOfDay = dateUtils.getEndOfDay(now);
  
  return getCalendarEvents(userId, startOfDay, endOfDay);
}

/**
 * Checks if a time slot is available (no conflicts with existing events)
 * @param {string} userId - User identifier
 * @param {string} startTime - Proposed start time (ISO 8601)
 * @param {string} endTime - Proposed end time (ISO 8601)
 * @returns {Promise<boolean>} True if slot is available
 */
async function isTimeSlotAvailable(userId, startTime, endTime) {
  try {
    const events = await getCalendarEvents(userId, startTime, endTime);
    
    // Check for any overlapping events
    const proposedStart = dateUtils.parseISODate(startTime);
    const proposedEnd = dateUtils.parseISODate(endTime);
    
    for (const event of events) {
      const eventStart = dateUtils.parseISODate(event.startTime);
      const eventEnd = dateUtils.parseISODate(event.endTime);
      
      // Check for overlap
      if (proposedStart < eventEnd && proposedEnd > eventStart) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    throw new Error(`Failed to check time slot availability: ${error.message}`);
  }
}

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
  getTodayEvents,
  isTimeSlotAvailable
};
