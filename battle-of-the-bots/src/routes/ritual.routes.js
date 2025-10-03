/**
 * Ritual Generation API Routes
 * Endpoints for personalized focus ritual suggestions
 */

const express = require('express');
const router = express.Router();
const { generatePersonalizedRitual } = require('../services/ritual.service');
const {
  validateRitualRequest,
  handleValidationErrors
} = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

/**
 * POST /api/ritual/generate
 * Generates personalized ritual based on user context
 * 
 * Request body:
 * {
 *   context: {
 *     calendarEventTitle: string,
 *     timeOfDay: 'morning' | 'afternoon' | 'evening',
 *     calendarDensity: 'clear' | 'moderate' | 'busy'
 *   }
 * }
 * 
 * Response:
 * {
 *   name: string,
 *   workDuration: number (minutes),
 *   breakDuration: number (minutes),
 *   mindfulnessBreaks: boolean,
 *   description: string,
 *   suggestedSoundscape: string
 * }
 */
router.post(
  '/generate',
  validateRitualRequest,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { context } = req.body;
    
    // Call ritual generation service
    const ritual = generatePersonalizedRitual(context);
    
    // Return ritual suggestion directly (not wrapped)
    res.status(200).json(ritual);
  })
);

module.exports = router;
