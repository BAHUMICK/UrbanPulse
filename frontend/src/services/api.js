const API_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || 'API request failed'
    );
  }

  return result;
}

// Get all infrastructure issues
export async function getIssues() {
  const result = await request('/issues');

  return result.data;
}

// Create a new infrastructure issue
export async function createIssue(issue) {
  return request('/issues', {
    method: 'POST',
    body: JSON.stringify(issue),
  });
}

// Get infrastructure issues ranked by Priority Intelligence
export async function getPriorityIssues() {
  const result = await request(
    '/intelligence/priorities'
  );

  return result.data;
}

// Get infrastructure issues ranked by Impact Intelligence
export async function getImpactIssues() {
  const result = await request(
    '/intelligence/impact'
  );

  return result.data;
}

// Update the status of an infrastructure issue
export async function updateIssueStatus(
  issueId,
  status
) {
  return request(
    `/issues/${issueId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({
        status,
      }),
    }
  );
}