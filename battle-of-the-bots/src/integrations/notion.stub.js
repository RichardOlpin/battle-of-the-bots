/**
 * Notion Integration Stub
 * 
 * This is a stub implementation for future Notion integration.
 * Returns mock data with the expected structure for testing purposes.
 */

/**
 * Fetches tasks from Notion (stub implementation)
 * @param {string} apiToken - Notion API token
 * @returns {Promise<Object>} Mock task data from Notion
 */
async function fetchTasksFromNotion(apiToken) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    tasks: [
      {
        id: '1',
        title: 'Review Q4 roadmap',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-10-15',
        project: 'Product Planning'
      },
      {
        id: '2',
        title: 'Update documentation',
        status: 'todo',
        priority: 'medium',
        dueDate: '2025-10-10',
        project: 'Engineering'
      },
      {
        id: '3',
        title: 'Design system updates',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-10-08',
        project: 'Design'
      },
      {
        id: '4',
        title: 'Team retrospective notes',
        status: 'completed',
        priority: 'low',
        dueDate: '2025-10-02',
        project: 'Team Operations'
      }
    ],
    source: 'notion',
    mock: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchTasksFromNotion
};
