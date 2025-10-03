/**
 * Input validation middleware
 * Provides validation rules and middleware for request validation
 */

const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value
        })),
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
}

/**
 * Validation rules for schedule suggestion requests
 */
const validateScheduleRequest = [
  body('calendarEvents')
    .isArray({ min: 0 })
    .withMessage('calendarEvents must be an array'),
  
  body('calendarEvents.*.startTime')
    .optional()
    .isISO8601()
    .withMessage('Event startTime must be in ISO 8601 format'),
  
  body('calendarEvents.*.endTime')
    .optional()
    .isISO8601()
    .withMessage('Event endTime must be in ISO 8601 format'),
  
  body('calendarEvents.*.title')
    .optional()
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
    .withMessage('minimumDuration must be between 15 and 480 minutes'),
  
  body('userPreferences.bufferTime')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('bufferTime must be between 0 and 60 minutes'),
  
  handleValidationErrors
];

/**
 * Validation rules for ritual generation requests
 */
const validateRitualRequest = [
  body('context')
    .isObject()
    .withMessage('context is required and must be an object'),
  
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
    .withMessage('calendarDensity must be one of: clear, moderate, busy'),
  
  handleValidationErrors
];

/**
 * Validation rules for session summary requests
 */
const validateSessionSummaryRequest = [
  body('sessionData')
    .isObject()
    .withMessage('sessionData is required and must be an object'),
  
  body('sessionData.taskGoal')
    .optional()
    .isString()
    .withMessage('taskGoal must be a string'),
  
  body('sessionData.duration')
    .isInt({ min: 1 })
    .withMessage('duration is required and must be a positive integer'),
  
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
    .withMessage('ritualUsed must be a string'),
  
  handleValidationErrors
];

/**
 * Validation rules for calendar event creation
 */
const validateCreateEventRequest = [
  body('title')
    .notEmpty()
    .isString()
    .withMessage('title is required and must be a string'),
  
  body('startTime')
    .notEmpty()
    .isISO8601()
    .withMessage('startTime is required and must be in ISO 8601 format'),
  
  body('endTime')
    .notEmpty()
    .isISO8601()
    .withMessage('endTime is required and must be in ISO 8601 format'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),
  
  body('location')
    .optional()
    .isString()
    .withMessage('location must be a string'),
  
  body('timeZone')
    .optional()
    .isString()
    .withMessage('timeZone must be a string'),
  
  handleValidationErrors
];

/**
 * Validation rules for fetching calendar events
 */
const validateGetEventsRequest = [
  query('startDate')
    .notEmpty()
    .isISO8601()
    .withMessage('startDate is required and must be in ISO 8601 format'),
  
  query('endDate')
    .notEmpty()
    .isISO8601()
    .withMessage('endDate is required and must be in ISO 8601 format'),
  
  handleValidationErrors
];

/**
 * Validation rules for userId parameter
 */
const validateUserId = [
  query('userId')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('userId must be a non-empty string'),
  
  body('userId')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('userId must be a non-empty string'),
  
  handleValidationErrors
];

/**
 * Custom validator to check if end time is after start time
 */
function validateTimeRange(req, res, next) {
  const { startTime, endTime } = req.body;
  
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TIME_RANGE',
          message: 'endTime must be after startTime',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  next();
}

/**
 * Custom validator to check if date range is valid
 */
function validateDateRange(req, res, next) {
  const { startDate, endDate } = req.query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'endDate must be after startDate',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  
  next();
}

module.exports = {
  handleValidationErrors,
  validateScheduleRequest,
  validateRitualRequest,
  validateSessionSummaryRequest,
  validateCreateEventRequest,
  validateGetEventsRequest,
  validateUserId,
  validateTimeRange,
  validateDateRange
};
