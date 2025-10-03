/**
 * Calendar routes for fetching Google Calendar events
 */

const express = require('express');
const router = express.Router();
const googleCalendar = require('../integrations/google-calendar');
const tokenManager = require('../utils/token-manager');

/**
 * Middleware to check authentication
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.authenticated || !req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  const userId = req.session.userId;
  const tokens = tokenManager.getTokens(userId);
  
  if (!tokens) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'No valid tokens found',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Attach userId to request for use in route handlers
  req.userId = userId;
  next();
}

/**
 * GET /api/calendar/events
 * Fetches today's calendar events from Google Calendar
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // Fetch events from Google Calendar
    const events = await googleCalendar.fetchCalendarEvents(
      userId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );
    
    // Convert to format expected by webapp
    const formattedEvents = events.map(event => ({
      id: event.id,
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime,
        date: event.startTime.includes('T') ? null : event.startTime
      },
      end: {
        dateTime: event.endTime,
        date: event.endTime.includes('T') ? null : event.endTime
      },
      status: 'confirmed'
    }));
    
    res.json({
      success: true,
      events: formattedEvents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    
    // Handle specific error cases
    if (error.message.includes('invalid_grant') || error.message.includes('Token expired') || error.message.includes('re-authenticate')) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token expired. Please log in again.',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'CALENDAR_FETCH_FAILED',
        message: 'Failed to fetch calendar events',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
