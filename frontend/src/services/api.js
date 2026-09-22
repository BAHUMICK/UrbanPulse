
const API_URL = 'http://localhost:5000/api';

// =====================================================
// GENERIC API REQUEST
// =====================================================

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status})`
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.error ||
          `API request failed with status ${response.status}`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `UrbanPulse API error [${endpoint}]:`,
      error
    );

    throw error;
  }
}

// =====================================================
// ISSUES
// =====================================================

// Get all infrastructure issues
export async function getIssues() {
  const result = await request('/issues');

  console.log(
    'UrbanPulse getIssues response:',
    result
  );

  return Array.isArray(result?.data)
    ? result.data
    : [];
}

// Create a new infrastructure issue
export async function createIssue(issue) {
  return request('/issues', {
    method: 'POST',
    body: JSON.stringify(issue),
  });
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

// =====================================================
// INTELLIGENCE
// =====================================================

// Get infrastructure issues ranked by Priority Intelligence
export async function getPriorityIssues() {
  const result = await request(
    '/intelligence/priorities'
  );

  return Array.isArray(result?.data)
    ? result.data
    : [];
}

// Get infrastructure issues ranked by Impact Intelligence
export async function getImpactIssues() {
  const result = await request(
    '/intelligence/impact'
  );

  return Array.isArray(result?.data)
    ? result.data
    : [];
}

// =====================================================
// ALERTS
// =====================================================

// Get all alerts
export async function getAlerts() {
  const result = await request('/alerts');

  return Array.isArray(result?.data)
    ? result.data
    : [];
}

// Get active alerts
export async function getActiveAlerts() {
  const result = await request(
    '/alerts/active'
  );

  return Array.isArray(result?.data)
    ? result.data
    : [];
}

// Update alert status
export async function updateAlertStatus(
  alertId,
  status
) {
  return request(
    `/alerts/${alertId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({
        status,
      }),
    }
  );
}