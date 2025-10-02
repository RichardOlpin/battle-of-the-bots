/**
 * Ritual Generation Service
 * Generates personalized focus ritual structures based on user context
 */

// Ritual template definitions
const RITUAL_TEMPLATES = {
  shortBurst: {
    name: 'Quick Focus Sprint',
    workDuration: 25,
    breakDuration: 5,
    mindfulnessBreaks: false,
    description: 'Perfect for administrative tasks and quick wins',
    suggestedSoundscape: 'ambient'
  },
  longForm: {
    name: 'Creative Deep Work',
    workDuration: 50,
    breakDuration: 10,
    mindfulnessBreaks: true,
    description: 'Ideal for complex, creative work requiring sustained focus',
    suggestedSoundscape: 'nature'
  },
  recovery: {
    name: 'Gentle Recovery Session',
    workDuration: 40,
    breakDuration: 15,
    mindfulnessBreaks: true,
    description: 'Balanced approach for busy days to prevent burnout',
    suggestedSoundscape: 'calm'
  },
  balanced: {
    name: 'Balanced Flow',
    workDuration: 45,
    breakDuration: 10,
    mindfulnessBreaks: true,
    description: 'Versatile ritual for general productivity',
    suggestedSoundscape: 'focus'
  }
};

// Keyword patterns for ritual selection
const KEYWORD_PATTERNS = {
  shortBurst: ['planning', 'review', 'emails', 'email', 'plan', 'meeting prep', 'admin'],
  longForm: ['write', 'develop', 'research', 'deep work', 'code', 'design', 'create', 'build'],
};

/**
 * Generates personalized ritual based on context
 * @param {Object} context - Current user context
 * @param {string} context.calendarEventTitle - Title of the calendar event
 * @param {string} context.timeOfDay - Time of day ('morning' | 'afternoon' | 'evening')
 * @param {string} context.calendarDensity - Calendar density ('clear' | 'moderate' | 'busy')
 * @returns {Object} Suggested ritual structure
 */
function generatePersonalizedRitual(context) {
  // Validate and sanitize input
  if (!context || typeof context !== 'object') {
    context = {};
  }
  
  // Extract and validate context properties
  let { calendarEventTitle = '', timeOfDay = '', calendarDensity = '' } = context;
  
  // Sanitize strings - handle null, undefined, non-strings
  calendarEventTitle = (typeof calendarEventTitle === 'string' ? calendarEventTitle : '').trim();
  timeOfDay = (typeof timeOfDay === 'string' ? timeOfDay : '').toLowerCase().trim();
  calendarDensity = (typeof calendarDensity === 'string' ? calendarDensity : '').toLowerCase().trim();
  
  // Validate timeOfDay
  const validTimesOfDay = ['morning', 'afternoon', 'evening'];
  if (!validTimesOfDay.includes(timeOfDay)) {
    timeOfDay = '';
  }
  
  // Validate calendarDensity
  const validDensities = ['clear', 'moderate', 'busy'];
  if (!validDensities.includes(calendarDensity)) {
    calendarDensity = '';
  }

  // Normalize title for case-insensitive matching
  const normalizedTitle = calendarEventTitle.toLowerCase();

  // Check for short-burst keywords
  if (containsKeywords(normalizedTitle, KEYWORD_PATTERNS.shortBurst)) {
    return RITUAL_TEMPLATES.shortBurst;
  }

  // Check for long-form keywords
  if (containsKeywords(normalizedTitle, KEYWORD_PATTERNS.longForm)) {
    return RITUAL_TEMPLATES.longForm;
  }

  // Check for busy afternoon scenario
  if (calendarDensity === 'busy' && timeOfDay === 'afternoon') {
    return RITUAL_TEMPLATES.recovery;
  }

  // Default to balanced ritual
  return RITUAL_TEMPLATES.balanced;
}

/**
 * Checks if text contains any of the specified keywords
 * @param {string} text - Text to search (should be lowercase)
 * @param {Array<string>} keywords - Array of keywords to match
 * @returns {boolean} True if any keyword is found
 */
function containsKeywords(text, keywords) {
  // Handle edge cases
  if (!text || typeof text !== 'string') return false;
  if (!Array.isArray(keywords) || keywords.length === 0) return false;
  
  return keywords.some(keyword => {
    if (typeof keyword !== 'string') return false;
    return text.includes(keyword);
  });
}

module.exports = {
  generatePersonalizedRitual,
  RITUAL_TEMPLATES // Export for testing
};
