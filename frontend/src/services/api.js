const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const API_ORIGIN = API_URL.replace(/\/api$/, '');
export const getMediaUrl = (filePath) => filePath?.startsWith('http') ? filePath : `${API_ORIGIN}${filePath || ''}`;
let csrfToken = '';

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_URL}/auth/csrf`, { credentials: 'include' });
  const result = await response.json();
  if (!response.ok || !result?.token) throw new Error(result?.message || 'Unable to verify request.');
  csrfToken = result.token;
  return csrfToken;
}

// =====================================================
// URBANPULSE CIVIC SERVICE SECTORS
// =====================================================
export const CIVIC_SECTORS = [
  'Roads & Transportation',
  'Traffic & Road Safety',
  'Water Supply & Drainage',
  'Fire & Emergency Services',
  'Solid Waste Management',
  'Street Lighting',
  'Public Infrastructure',
  'Environment & Pollution',
  'Parks & Public Spaces',
  'Public Health & Sanitation',
  'Other Civic Services',
];

// Logical mapping from Civic Sector to available/recommended categories
export const SECTOR_CATEGORIES = {
  'Roads & Transportation': ['Road Damage', 'Other'],
  'Traffic & Road Safety': ['Road Safety', 'Other'],
  'Water Supply & Drainage': ['Waterlogging', 'Drainage', 'Other'],
  'Fire & Emergency Services': ['Road Safety', 'Other'],
  'Solid Waste Management': ['Garbage', 'Other'],
  'Street Lighting': ['Streetlight', 'Other'],
  'Public Infrastructure': ['Road Damage', 'Drainage', 'Streetlight', 'Other'],
  'Environment & Pollution': ['Waterlogging', 'Garbage', 'Other'],
  'Parks & Public Spaces': ['Garbage', 'Streetlight', 'Other'],
  'Public Health & Sanitation': ['Garbage', 'Drainage', 'Waterlogging', 'Other'],
  'Other Civic Services': [
    'Other',
    'Road Damage',
    'Road Safety',
    'Streetlight',
    'Waterlogging',
    'Garbage',
    'Drainage',
  ],
};

// Auto-mapping from legacy Category to Civic Sector
export const CATEGORY_TO_SECTOR = {
  'Road Damage': 'Roads & Transportation',
  'Road Safety': 'Traffic & Road Safety',
  'Streetlight': 'Street Lighting',
  'Waterlogging': 'Water Supply & Drainage',
  'Drainage': 'Water Supply & Drainage',
  'Garbage': 'Solid Waste Management',
  'Other': 'Other Civic Services',
};

// =====================================================
// GENERIC API REQUEST
// =====================================================

async function request(endpoint, options = {}) {
  const { quiet = false, ...fetchOptions } = options;
  try {
    const isFormData = fetchOptions.body instanceof FormData;
    const method = String(fetchOptions.method || 'GET').toUpperCase();
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(fetchOptions.headers || {}),
    };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await ensureCsrfToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
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
      const error = new Error(
        result?.message ||
          result?.error ||
          `API request failed with status ${response.status}`
      );
      error.status = response.status;
      if (response.status === 401 && !['/auth/me', '/auth/login', '/auth/register'].includes(endpoint)) {
        window.dispatchEvent(new Event('urbanpulse:session-expired'));
      }
      throw error;
    }

    return result;
  } catch (error) {
    if (!quiet) console.error(`UrbanPulse API error [${endpoint}]:`, error);

    throw error;
  }
}

export async function getCurrentUser() {
  const result = await request('/auth/me', { quiet: true });
  return result?.data || null;
}

export async function registerAccount(email, password) {
  const result = await request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  return result.data;
}

export async function loginAccount(email, password) {
  const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  return result.data;
}

export async function logoutAccount() {
  await request('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  return true;
}

// =====================================================
// ISSUES
// =====================================================

// Get all infrastructure issues (with optional query filter)
export async function getIssues(params = {}) {
  const queryParts = [];

  if (params.sector && params.sector !== 'All') {
    queryParts.push(`sector=${encodeURIComponent(params.sector)}`);
  }
  if (params.category && params.category !== 'All') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params.severity && params.severity !== 'All') {
    queryParts.push(`severity=${encodeURIComponent(params.severity)}`);
  }
  if (params.status && params.status !== 'All') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await request(`/issues${queryString}`);

  return Array.isArray(result?.data) ? result.data : [];
}

// Get single infrastructure issue with evidence
export async function getIssueById(issueId) {
  const result = await request(`/issues/${issueId}`);
  return result?.data || null;
}

// Create a new infrastructure issue (supports optional evidence media)
export async function createIssue(issueData, evidenceFiles = []) {
  if (evidenceFiles && evidenceFiles.length > 0) {
    const formData = new FormData();

    Object.entries(issueData).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val);
      }
    });

    evidenceFiles.forEach((file) => {
      formData.append('evidence', file);
    });

    return request('/issues', {
      method: 'POST',
      body: formData,
    });
  }

  // Pure JSON if no files attached
  return request('/issues', {
    method: 'POST',
    body: JSON.stringify(issueData),
  });
}

// Update the status of an infrastructure issue
export async function updateIssueStatus(issueId, status) {
  return request(`/issues/${issueId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// =====================================================
// INTELLIGENCE
// =====================================================

// Get infrastructure issues ranked by Priority Intelligence
export async function getPriorityIssues() {
  const result = await request('/intelligence/priorities');
  return Array.isArray(result?.data) ? result.data : [];
}

// Get infrastructure issues ranked by Impact Intelligence
export async function getImpactIssues() {
  const result = await request('/intelligence/impact');
  return Array.isArray(result?.data) ? result.data : [];
}

// =====================================================
// ALERTS
// =====================================================

// Get all alerts
export async function getAlerts() {
  const result = await request('/alerts');
  return Array.isArray(result?.data) ? result.data : [];
}

// Get active alerts
export async function getActiveAlerts() {
  const result = await request('/alerts/active');
  return Array.isArray(result?.data) ? result.data : [];
}

// Update alert status
export async function updateAlertStatus(alertId, status) {
  return request(`/alerts/${alertId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// Check backend and database health
export async function checkBackendHealth() {
  return request('/health');
}
