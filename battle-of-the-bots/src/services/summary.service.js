/**
 * Intelligent Session Summary Service
 * Generates compassionate, human-like summaries of completed focus sessions
 */

/**
 * Regex patterns to extract core actions/verbs from task goals
 * Note: Order matters - more specific patterns should come before general ones
 */
const ACTION_PATTERNS = [
  { pattern: /^(finalize|complete|finish|wrap up)/i, action: 'finalize' },
  { pattern: /^(write|draft|compose)/i, action: 'write' },
  { pattern: /^(review|analyze|evaluate|assess)/i, action: 'review' },
  { pattern: /^(develop|build|create|design|implement)/i, action: 'develop' },
  { pattern: /^(plan|organize|structure|outline)/i, action: 'plan' },
  { pattern: /^(learn|practice|study)/i, action: 'learn' },
  { pattern: /^(research|investigate|explore)/i, action: 'research' },
  { pattern: /^(fix|debug|troubleshoot|resolve)/i, action: 'fix' },
  { pattern: /^(update|modify|refactor|improve)/i, action: 'update' },
  { pattern: /^(test|validate|verify)/i, action: 'test' }
];

/**
 * Compassionate summary templates with dynamic placeholders
 * Templates are non-judgmental and supportive
 */
const SUMMARY_TEMPLATES = [
  "You dedicated {duration} minutes to '{goal}'. That's a great step forward.",
  "Nice work! You focused for {duration} minutes on '{goal}'.",
  "You spent {duration} minutes working on '{goal}'. Every session counts.",
  "{duration} minutes of focused time on '{goal}'. You're building momentum.",
  "You gave {duration} minutes to '{goal}'. That's progress worth celebrating.",
  "Great focus! You invested {duration} minutes in '{goal}'.",
  "You committed {duration} minutes to '{goal}'. That's meaningful progress.",
  "{duration} minutes well spent on '{goal}'. Keep up the good work.",
  "You showed up for {duration} minutes to work on '{goal}'. That matters.",
  "Solid session! {duration} minutes of attention on '{goal}'."
];

/**
 * Generic encouraging templates for empty or undefined task goals
 */
const GENERIC_TEMPLATES = [
  "You dedicated {duration} minutes to focused work. That's a great step forward.",
  "Nice work! You focused for {duration} minutes. Every session counts.",
  "You spent {duration} minutes in focused work. You're building momentum.",
  "{duration} minutes of focused time. That's progress worth celebrating.",
  "You gave {duration} minutes to your work. Keep up the good work.",
  "Great focus! You invested {duration} minutes in your session.",
  "You committed {duration} minutes to focused work. That matters.",
  "{duration} minutes well spent. You showed up and that's what counts.",
  "Solid session! {duration} minutes of dedicated focus.",
  "You completed {duration} minutes of focused work. That's meaningful progress."
];

/**
 * Extracts the core action/verb from a task goal
 * @param {string} taskGoal - The task goal to analyze
 * @returns {string|null} The extracted action or null if no match
 */
function extractAction(taskGoal) {
  if (!taskGoal || typeof taskGoal !== 'string') {
    return null;
  }

  for (const { pattern, action } of ACTION_PATTERNS) {
    if (pattern.test(taskGoal)) {
      return action;
    }
  }

  return null;
}

/**
 * Selects a random template from an array
 * @param {Array<string>} templates - Array of template strings
 * @returns {string} Randomly selected template
 */
function selectRandomTemplate(templates) {
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Replaces placeholders in a template with actual values
 * @param {string} template - Template string with placeholders
 * @param {Object} values - Object containing placeholder values
 * @returns {string} Template with placeholders replaced
 */
function replacePlaceholders(template, values) {
  let result = template;
  
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

/**
 * Creates an intelligent summary of a focus session
 * @param {Object} sessionData - Completed session data
 * @param {string} sessionData.taskGoal - The goal of the session
 * @param {number} sessionData.duration - Duration in minutes
 * @param {string} [sessionData.completedAt] - ISO 8601 timestamp
 * @param {number} [sessionData.distractionCount] - Number of distractions
 * @param {string} [sessionData.ritualUsed] - Name of ritual used
 * @returns {string} Formatted summary text
 */
function createIntelligentSummary(sessionData) {
  // Validate input
  if (!sessionData || typeof sessionData !== 'object') {
    throw new Error('Session data is required');
  }

  const { taskGoal, duration } = sessionData;

  // Validate duration
  if (typeof duration !== 'number' || duration <= 0) {
    throw new Error('Valid duration is required');
  }

  // Handle empty or undefined task goals
  if (!taskGoal || taskGoal.trim() === '') {
    const template = selectRandomTemplate(GENERIC_TEMPLATES);
    return replacePlaceholders(template, { duration });
  }

  // Extract action (optional, for potential future use)
  const action = extractAction(taskGoal);

  // Select random template for variety
  const template = selectRandomTemplate(SUMMARY_TEMPLATES);

  // Replace placeholders with actual values
  const summary = replacePlaceholders(template, {
    duration,
    goal: taskGoal.trim()
  });

  return summary;
}

module.exports = {
  createIntelligentSummary,
  // Export for testing
  extractAction,
  selectRandomTemplate,
  replacePlaceholders
};
