/**
 * Scheduling API Routes
 * Endpoints for smart scheduling and focus window suggestions
 */

const express = require('express');
const router = express.Router();
const { suggestOptimalFocusWindow } = require('../services/scheduling.service');
const {
  validateScheduleRequest,
  handleValidationErrors
} = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * POST /api/schedule/suggest
 * Suggests optimal focus window based on calendar events and user preferences
 * 
 * Request body:
 * {
 *   calendarEvents: Array<{id, startTime, endTime, title}>,
 *   userPreferences: {preferredTime, minimumDuration, bufferTime}
 * }
 * 
 * Response:
 * {
 *   startTime: string (ISO 8601),
 *   endTime: string (ISO 8601),
 *   duration: number (minutes),
 *   score: number (0-100),
 *   reasoning: string
 * }
 */
router.post(
  '/suggest',
  validateScheduleRequest,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { calendarEvents, userPreferences } = req.body;
    
    // Call scheduling service
    const focusWindow = suggestOptimalFocusWindow(calendarEvents, userPreferences || {});
    
    // Handle case where no suitable window is found
    if (!focusWindow) {
      return res.status(200).json(null);
    }
    
    // Return successful suggestion directly (not wrapped)
    res.status(200).json(focusWindow);
  })
);

module.exports = router;
