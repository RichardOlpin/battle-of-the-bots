/**
 * Asana Integration Stub
 * 
 * This is a stub implementation for future Asana integration.
 * Returns mock data with the expected structure for testing purposes.
 */

/**
 * Fetches tasks from Asana (stub implementation)
 * @param {string} apiToken - Asana API token
 * @returns {Promise<Object>} Mock task data from Asana
 */
async function fetchTasksFromAsana(apiToken) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    tasks: [
      {
        gid: 'a1',
        name: 'Design mockups',
        completed: false,
        assignee: {
          gid: 'u1',
          name: 'Design Team'
        },
        due_on: '2025-10-07',
        projects: [
          {
            gid: 'p1',
            name: 'Product Launch'
          }
        ],
        tags: ['design', 'ui']
      },
      {
        gid: 'a2',
        name: 'Team sync',
        completed: false,
        assignee: {
          gid: 'u2',
          name: 'Project Manager'
        },
        due_on: '2025-10-03',
        projects: [
          {
            gid: 'p2',
            name: 'Team Operations'
          }
        ],
        tags: ['meeting']
      },
      {
        gid: 'a3',
        name: 'API integration testing',
        completed: false,
        assignee: {
          gid: 'u3',
          name: 'Engineering Team'
        },
        due_on: '2025-10-09',
        projects: [
          {
            gid: 'p1',
            name: 'Product Launch'
          }
        ],
        tags: ['development', 'testing']
      },
      {
        gid: 'a4',
        name: 'User research analysis',
        completed: true,
        assignee: {
          gid: 'u4',
          name: 'Research Team'
        },
        due_on: '2025-10-01',
        projects: [
          {
            gid: 'p3',
            name: 'User Experience'
          }
        ],
        tags: ['research', 'ux']
      }
    ],
    source: 'asana',
    mock: true,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchTasksFromAsana
};
