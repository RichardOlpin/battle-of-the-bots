/**
 * Request Validation Middleware
 * Uses express-validator to validate API request payloads
 */

const { body, validationResult } = require('express-validator');

/**
 * Validation rules for schedule suggestion requests
 * Validates calendar events array and user preferences
 */
const validateScheduleRequest = [
  body('calendarEvents')
    .isArray({ min: 0 })
    .withMessage('calendarEvents must be an array'),
  
  body('calendarEvents.*.id')
    .optional()
    .isString()
    .withMessage('Event id must be a string'),
  
  body('calendarEvents.*.startTime')
    .isISO8601()
    .withMessage('Event startTime must be in ISO 8601 format'),
  
  body('calendarEvents.*.endTime')
    .isISO8601()
    .withMessage('Event endTime must be in ISO 8601 format'),
  
  body('calendarEvents.*.title')
    .isString()
    .withMessage('Event title must be a string'),
  
  body('userPreferences')
    .optional()
    .isObject()
    .withMessage('userPreferences must be an object'),
  
  body('userPreferences.preferredTime')
    .optional()
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('preferredTime must be one of: morning, afternoon, evening'),
  
  body('userPreferences.minimumDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('minimumDuration must be an integer between 15 and 480 minutes'),
  
  body('userPreferences.bufferTime')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('bufferTime must be an integer between 0 and 60 minutes')
];

/**
 * Validation rules for ritual generation requests
 * Validates context object with calendar event title, time of day, and calendar density
 */
const validateRitualRequest = [
  body('context')
    .isObject()
    .withMessage('context must be an object'),
  
  body('context.calendarEventTitle')
    .optional()
    .isString()
    .withMessage('calendarEventTitle must be a string'),
  
  body('context.timeOfDay')
    .optional()
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('timeOfDay must be one of: morning, afternoon, evening'),
  
  body('context.calendarDensity')
    .optional()
    .isIn(['clear', 'moderate', 'busy'])
    .withMessage('calendarDensity must be one of: clear, moderate, busy')
];

/**
 * Validation rules for session summary requests
 * Validates session data with task goal and duration
 */
const validateSessionSummaryRequest = [
  body('sessionData')
    .isObject()
    .withMessage('sessionData must be an object'),
  
  body('sessionData.taskGoal')
    .optional()
    .isString()
    .withMessage('taskGoal must be a string'),
  
  body('sessionData.duration')
    .isInt({ min: 1 })
    .withMessage('duration must be a positive integer (minutes)'),
  
  body('sessionData.completedAt')
    .optional()
    .isISO8601()
    .withMessage('completedAt must be in ISO 8601 format'),
  
  body('sessionData.distractionCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('distractionCount must be a non-negative integer'),
  
  body('sessionData.ritualUsed')
    .optional()
    .isString()
    .withMessage('ritualUsed must be a string')
];

/**
 * Middleware to handle validation errors
 * Returns 400 status with descriptive error messages
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errorMessages,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
}

module.exports = {
  validateScheduleRequest,
  validateRitualRequest,
  validateSessionSummaryRequest,
  handleValidationErrors
};
