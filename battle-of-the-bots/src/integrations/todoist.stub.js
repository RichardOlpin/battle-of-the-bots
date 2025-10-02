/**
 * Todoist Integration Stub
 * 
 * This is a stub implementation for future Todoist integration.
 * Returns mock data with the expected structure for testing purposes.
 */

/**
 * Fetches tasks from Todoist (stub implementation)
 * @param {string} apiToken - Todoist API token
 * @returns {Promise<Object>} Mock task data from Todoist
 */
async function fetchTasksFromTodoist(apiToken) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    tasks: [
      {
        id: '101',
        content: 'Finalize presentation',
        priority: 4,
        due: {
          date: '2025-10-05',
          string: 'Oct 5'
        },
        projectId: '2301',
        labels: ['work', 'urgent']
      },
      {
        id: '102',
        content: 'Code review',
        priority: 3,
        due: {
          date: '2025-10-04',
          string: 'Oct 4'
        },
        projectId: '2301',
        labels: ['work', 'development']
      },
      {
        id: '103',
        content: 'Write blog post',
        priority: 2,
        due: {
          date: '2025-10-12',
          string: 'Oct 12'
        },
        projectId: '2302',
        labels: ['content', 'marketing']
      },
      {
        id: '104',
        content: 'Schedule team meeting',
        priority: 3,
        due: {
          date: '2025-10-03',
          string: 'Oct 3'
        },
        projectId: '2303',
        labels: ['admin']
      }
    ],
    source: 'todoist',
    mock: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchTasksFromTodoist
};
