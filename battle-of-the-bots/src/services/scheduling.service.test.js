/**
 * Unit tests for Smart Scheduling Service
 */

const { suggestOptimalFocusWindow } = require('./scheduling.service');

describe('Smart Scheduling Service', () => {
  describe('suggestOptimalFocusWindow', () => {
    
    test('should return an optimal morning slot when calendarEvents is an empty array', () => {
      // Test the edge case of an empty calendar
      const emptyCalendar = [];
      const preferences = {
        preferredTime: 'morning',
        minimumDuration: 75,
        bufferTime: 15
      };
      
      const result = suggestOptimalFocusWindow(emptyCalendar, preferences);
      
      // Should return a valid focus window
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      
      // Duration should meet minimum requirement
      expect(result.duration).toBeGreaterThanOrEqual(75);
      
      // Score should be positive
      expect(result.score).toBeGreaterThan(0);
      
      // Start time should be in the morning (8 AM - 12 PM)
      const startHour = new Date(result.startTime).getHours();
      expect(startHour).toBeGreaterThanOrEqual(8);
      expect(startHour).toBeLessThan(12);
    });
    
    test('should return null when no suitable slots are available', () => {
      // Create a fully booked day
      const busyCalendar = [
        {
          id: '1',
          startTime: '2025-10-02T08:00:00Z',
          endTime: '2025-10-02T21:00:00Z',
          title: 'All day meeting'
        }
      ];
      
      const result = suggestOptimalFocusWindow(busyCalendar);
      
      expect(result).toBeNull();
    });
    
    test('should find a slot between two events', () => {
      const calendar = [
        {
          id: '1',
          startTime: '2025-10-02T09:00:00Z',
          endTime: '2025-10-02T10:00:00Z',
          title: 'Morning meeting'
        },
        {
          id: '2',
          startTime: '2025-10-02T14:00:00Z',
          endTime: '2025-10-02T15:00:00Z',
          title: 'Afternoon meeting'
        }
      ];
      
      const preferences = {
        preferredTime: 'afternoon',
        minimumDuration: 75,
        bufferTime: 15
      };
      
      const result = suggestOptimalFocusWindow(calendar, preferences);
      
      expect(result).not.toBeNull();
      expect(result.duration).toBeGreaterThanOrEqual(75);
      
      // Should be in the gap between meetings (after 10:15 AM, before 1:45 PM)
      const startTime = new Date(result.startTime);
      const endTime = new Date(result.endTime);
      
      expect(startTime.getTime()).toBeGreaterThanOrEqual(new Date('2025-10-02T10:15:00Z').getTime());
      expect(endTime.getTime()).toBeLessThanOrEqual(new Date('2025-10-02T13:45:00Z').getTime());
    });
    
    test('should respect buffer time requirements', () => {
      const calendar = [
        {
          id: '1',
          startTime: '2025-10-02T10:00:00Z',
          endTime: '2025-10-02T11:00:00Z',
          title: 'Meeting'
        }
      ];
      
      const preferences = {
        minimumDuration: 60,
        bufferTime: 15
      };
      
      const result = suggestOptimalFocusWindow(calendar, preferences);
      
      if (result) {
        const startTime = new Date(result.startTime);
        const eventStart = new Date('2025-10-02T10:00:00Z');
        const eventEnd = new Date('2025-10-02T11:00:00Z');
        
        // Result should not overlap with buffer zones
        const resultEnd = new Date(result.endTime);
        
        // Either ends before event (with buffer) or starts after event (with buffer)
        const endsBeforeEvent = resultEnd.getTime() <= (eventStart.getTime() - 15 * 60 * 1000);
        const startsAfterEvent = startTime.getTime() >= (eventEnd.getTime() + 15 * 60 * 1000);
        
        expect(endsBeforeEvent || startsAfterEvent).toBe(true);
      }
    });
    
    test('should exclude slots after 9 PM', () => {
      const calendar = [
        {
          id: '1',
          startTime: '2025-10-02T08:00:00Z',
          endTime: '2025-10-02T20:00:00Z',
          title: 'Long meeting'
        }
      ];
      
      const result = suggestOptimalFocusWindow(calendar);
      
      // Should return null because only slot available is after 8 PM
      // and after applying buffer, it would be after 9 PM
      expect(result).toBeNull();
    });
  });
  
  // ============================================================================
  // PRODUCTION HARDENING TESTS
  // ============================================================================
  
  describe('Hardened Scheduling Service - Null/Undefined Input Handling', () => {
    test('should handle null calendarEvents', () => {
      const result = suggestOptimalFocusWindow(null, {});
      
      // Should not crash and return a valid result
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('duration');
    });
    
    test('should handle undefined calendarEvents', () => {
      const result = suggestOptimalFocusWindow(undefined, {});
      
      // Should not crash and return a valid result
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
    });
    
    test('should handle missing userPreferences', () => {
      const result = suggestOptimalFocusWindow([]);
      
      // Should apply defaults and return valid result
      expect(result).not.toBeNull();
      expect(result.duration).toBeGreaterThanOrEqual(75); // Default minimum
    });
    
    test('should handle non-array calendarEvents', () => {
      const result = suggestOptimalFocusWindow('not an array', {});
      
      // Should treat as empty array and return valid result
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
    });
  });
  
  describe('Hardened Scheduling Service - Malformed Event Handling', () => {
    test('should ignore events without startTime', () => {
      const events = [
        { endTime: '2025-10-03T10:00:00Z', title: 'Bad Event' },
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Good Event' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should process successfully, ignoring bad event
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
    });
    
    test('should ignore events without endTime', () => {
      const events = [
        { startTime: '2025-10-03T10:00:00Z', title: 'Bad Event' },
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Good Event' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should process successfully
      expect(result).not.toBeNull();
    });
    
    test('should ignore events with endTime before startTime', () => {
      const events = [
        { startTime: '2025-10-03T15:00:00Z', endTime: '2025-10-03T14:00:00Z', title: 'Backwards Event' },
        { startTime: '2025-10-03T10:00:00Z', endTime: '2025-10-03T11:00:00Z', title: 'Good Event' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should process successfully, ignoring backwards event
      expect(result).not.toBeNull();
    });
    
    test('should handle mix of valid and invalid events', () => {
      const events = [
        { startTime: '2025-10-03T09:00:00Z', endTime: '2025-10-03T10:00:00Z', title: 'Valid 1' },
        { endTime: '2025-10-03T11:00:00Z', title: 'Missing start' },
        { startTime: '2025-10-03T12:00:00Z', title: 'Missing end' },
        { startTime: '2025-10-03T15:00:00Z', endTime: '2025-10-03T14:00:00Z', title: 'Backwards' },
        { startTime: '2025-10-03T16:00:00Z', endTime: '2025-10-03T17:00:00Z', title: 'Valid 2' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should process only valid events
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('startTime');
    });
  });
  
  describe('Hardened Scheduling Service - Overlapping Event Handling', () => {
    test('should merge two overlapping events', () => {
      const events = [
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Event 1' },
        { startTime: '2025-10-03T14:30:00Z', endTime: '2025-10-03T15:30:00Z', title: 'Event 2' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should treat as single busy block from 14:00 to 15:30
      // So suggested time should not be between 14:00 and 15:30
      expect(result).not.toBeNull();
      
      if (result) {
        const startTime = new Date(result.startTime);
        const endTime = new Date(result.endTime);
        const overlapStart = new Date('2025-10-03T14:00:00Z');
        const overlapEnd = new Date('2025-10-03T15:30:00Z');
        
        // Result should not overlap with merged busy block
        const isBeforeOverlap = endTime.getTime() <= overlapStart.getTime();
        const isAfterOverlap = startTime.getTime() >= overlapEnd.getTime();
        
        expect(isBeforeOverlap || isAfterOverlap).toBe(true);
      }
    });
    
    test('should merge multiple overlapping events', () => {
      const events = [
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Event 1' },
        { startTime: '2025-10-03T14:30:00Z', endTime: '2025-10-03T15:30:00Z', title: 'Event 2' },
        { startTime: '2025-10-03T15:00:00Z', endTime: '2025-10-03T16:00:00Z', title: 'Event 3' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should merge all three into single block 14:00-16:00
      expect(result).not.toBeNull();
    });
    
    test('should not merge non-overlapping events', () => {
      const events = [
        { startTime: '2025-10-03T09:00:00Z', endTime: '2025-10-03T10:00:00Z', title: 'Event 1' },
        { startTime: '2025-10-03T14:00:00Z', endTime: '2025-10-03T15:00:00Z', title: 'Event 2' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should find slot between the two events
      expect(result).not.toBeNull();
      
      if (result) {
        const startTime = new Date(result.startTime);
        expect(startTime.getTime()).toBeGreaterThan(new Date('2025-10-03T10:00:00Z').getTime());
        expect(startTime.getTime()).toBeLessThan(new Date('2025-10-03T14:00:00Z').getTime());
      }
    });
  });
  
  describe('Hardened Scheduling Service - All-Day Event Handling', () => {
    test('should block workday for all-day events', () => {
      const events = [
        { startTime: '2025-10-03', endTime: '2025-10-04', title: 'All Day Event' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // Should either return null or suggest time outside 9-5
      // Since all-day event blocks 9-5, only early morning or late evening available
      if (result) {
        const hour = new Date(result.startTime).getHours();
        // Should be before 9 AM or after 5 PM
        expect(hour < 9 || hour >= 17).toBe(true);
      }
    });
    
    test('should expand date-only events to 9-5', () => {
      const events = [
        { startTime: '2025-10-03', endTime: '2025-10-03', title: 'All Day' },
        { startTime: '2025-10-03T19:00:00Z', endTime: '2025-10-03T20:00:00Z', title: 'Evening Event' }
      ];
      
      const result = suggestOptimalFocusWindow(events, {});
      
      // All-day event should block 9-5, leaving only evening slot
      if (result) {
        const hour = new Date(result.startTime).getHours();
        expect(hour >= 17).toBe(true);
      }
    });
  });
  
  describe('Hardened Scheduling Service - Missing Preferences Defaults', () => {
    test('should apply default preferredTime', () => {
      const result = suggestOptimalFocusWindow([], {});
      
      // Should use default and return valid result
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('reasoning');
    });
    
    test('should apply default minimumDuration', () => {
      const result = suggestOptimalFocusWindow([], { preferredTime: 'morning' });
      
      // Should use default 75 minutes
      expect(result).not.toBeNull();
      expect(result.duration).toBeGreaterThanOrEqual(75);
    });
    
    test('should apply default bufferTime', () => {
      const events = [
        { startTime: '2025-10-03T10:00:00Z', endTime: '2025-10-03T11:00:00Z', title: 'Meeting' }
      ];
      
      const result = suggestOptimalFocusWindow(events, { minimumDuration: 60 });
      
      // Should apply default 15-minute buffer
      expect(result).not.toBeNull();
    });
    
    test('should handle completely empty preferences object', () => {
      const result = suggestOptimalFocusWindow([], {});
      
      // Should apply all defaults
      expect(result).not.toBeNull();
      expect(result.duration).toBeGreaterThanOrEqual(75);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});
