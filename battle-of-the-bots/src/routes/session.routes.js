/**
 * Session Summary API Routes
 * Endpoints for generating intelligent session summaries
 */

const express = require('express');
const router = express.Router();
const { createIntelligentSummary } = require('../services/summary.service');
const {
  validateSessionSummaryRequest,
  handleValidationErrors
} = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * POST /api/session/summary
 * Creates an intelligent summary of a completed focus session
 * 
 * Request body:
 * {
 *   sessionData: {
 *     taskGoal: string,
 *     duration: number (minutes),
 *     completedAt: string (ISO 8601),
 *     distractionCount: number (optional),
 *     ritualUsed: string (optional)
 *   }
 * }
 * 
 * Response:
 * {
 *   summary: string
 * }
 */
router.post(
  '/summary',
  validateSessionSummaryRequest,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { sessionData } = req.body;
    
    // Call summary generation service
    const summary = createIntelligentSummary(sessionData);
    
    // Return formatted summary
    res.status(200).json({
      summary
    });
  })
);

module.exports = router;
