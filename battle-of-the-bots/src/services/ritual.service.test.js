/**
 * Unit tests for Ritual Generation Service
 */

const { generatePersonalizedRitual, RITUAL_TEMPLATES } = require('./ritual.service');

describe('Ritual Generation Service', () => {
  describe('generatePersonalizedRitual', () => {
    
    test('should return a valid default ritual when no keywords match', () => {
      // Test the default case with generic task
      const context = {
        calendarEventTitle: 'Misc task',
        timeOfDay: 'morning',
        calendarDensity: 'moderate'
      };
      
      const result = generatePersonalizedRitual(context);
      
      // Should return a complete ritual object
      expect(result).toBeDefined();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('workDuration');
      expect(result).toHaveProperty('breakDuration');
      expect(result).toHaveProperty('mindfulnessBreaks');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('suggestedSoundscape');
      
      // All properties should be defined (not undefined)
      expect(result.name).toBeDefined();
      expect(result.workDuration).toBeGreaterThan(0);
      expect(result.breakDuration).toBeGreaterThan(0);
      expect(typeof result.mindfulnessBreaks).toBe('boolean');
      expect(result.description).toBeDefined();
      expect(result.suggestedSoundscape).toBeDefined();
      
      // Should be the balanced ritual (default)
      expect(result.name).toBe('Balanced Flow');
    });
    
    test('should return short-burst ritual for planning tasks', () => {
      const context = {
        calendarEventTitle: 'Planning session',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Quick Focus Sprint');
      expect(result.workDuration).toBe(25);
      expect(result.breakDuration).toBe(5);
      expect(result.mindfulnessBreaks).toBe(false);
    });
    
    test('should return short-burst ritual for email tasks', () => {
      const context = {
        calendarEventTitle: 'Process emails',
        timeOfDay: 'afternoon',
        calendarDensity: 'moderate'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Quick Focus Sprint');
    });
    
    test('should return short-burst ritual for review tasks', () => {
      const context = {
        calendarEventTitle: 'Code review',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Quick Focus Sprint');
    });
    
    test('should return long-form ritual for writing tasks', () => {
      const context = {
        calendarEventTitle: 'Write documentation',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Creative Deep Work');
      expect(result.workDuration).toBe(50);
      expect(result.breakDuration).toBe(10);
      expect(result.mindfulnessBreaks).toBe(true);
    });
    
    test('should return long-form ritual for development tasks', () => {
      const context = {
        calendarEventTitle: 'Develop new feature',
        timeOfDay: 'afternoon',
        calendarDensity: 'moderate'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Creative Deep Work');
    });
    
    test('should return long-form ritual for research tasks', () => {
      const context = {
        calendarEventTitle: 'Research competitors',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Creative Deep Work');
    });
    
    test('should return recovery ritual for busy afternoon', () => {
      const context = {
        calendarEventTitle: 'General work',
        timeOfDay: 'afternoon',
        calendarDensity: 'busy'
      };
      
      const result = generatePersonalizedRitual(context);
      
      expect(result.name).toBe('Gentle Recovery Session');
      expect(result.workDuration).toBe(40);
      expect(result.breakDuration).toBe(15);
      expect(result.mindfulnessBreaks).toBe(true);
    });
    
    test('should be case-insensitive for keyword matching', () => {
      const context1 = {
        calendarEventTitle: 'WRITE REPORT',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const context2 = {
        calendarEventTitle: 'write report',
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result1 = generatePersonalizedRitual(context1);
      const result2 = generatePersonalizedRitual(context2);
      
      expect(result1.name).toBe(result2.name);
      expect(result1.name).toBe('Creative Deep Work');
    });
    
    test('should handle empty context gracefully', () => {
      const context = {};
      
      const result = generatePersonalizedRitual(context);
      
      // Should return default balanced ritual
      expect(result).toBeDefined();
      expect(result.name).toBe('Balanced Flow');
      expect(result.workDuration).toBe(45);
    });
    
    test('should handle missing calendarEventTitle', () => {
      const context = {
        timeOfDay: 'morning',
        calendarDensity: 'clear'
      };
      
      const result = generatePersonalizedRitual(context);
      
      // Should return default balanced ritual
      expect(result).toBeDefined();
      expect(result.name).toBe('Balanced Flow');
    });
    
    test('should prioritize keyword matching over calendar density', () => {
      // Even with busy afternoon, if keywords match, use that ritual
      const context = {
        calendarEventTitle: 'Write important document',
        timeOfDay: 'afternoon',
        calendarDensity: 'busy'
      };
      
      const result = generatePersonalizedRitual(context);
      
      // Should return long-form (keyword match) not recovery (busy afternoon)
      expect(result.name).toBe('Creative Deep Work');
    });
  });
});
