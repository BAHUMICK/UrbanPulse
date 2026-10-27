import { resolveApiUrl, resolveApiOrigin, resolveEvidenceUrl } from './apiUrl';
import { apiErrorMessage } from './apiErrors';

export const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL);
export const API_ORIGIN = resolveApiOrigin(API_URL);
export const getMediaUrl = (filePath) => resolveEvidenceUrl(filePath, API_URL);
let csrfToken = '';

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, { ...options, signal: options.signal || controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJsonResponse(response, endpoint) {
  let result;
  try { result = await response.json(); }
  catch {
    if (!response.ok) throw Object.assign(new Error(apiErrorMessage({ status: response.status, endpoint })), { status: response.status });
    throw new Error(apiErrorMessage({ status: 503, endpoint }));
  }
  if (!response.ok) {
    const error = new Error(apiErrorMessage({ status: response.status, endpoint, error: result }));
    error.status = response.status;
    throw error;
  }
  return result;
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/csrf`, { credentials: 'include' });
    const result = await readJsonResponse(response, '/auth/csrf');
    if (!result?.token) throw new Error('Unable to verify this request. Please try again.');
    csrfToken = result.token;
    return csrfToken;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(apiErrorMessage({ error }));
  }
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

    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    });
    return await readJsonResponse(response, endpoint);
  } catch (error) {
    if (!quiet) console.error(`UrbanPulse API error [${endpoint}]:`, error.message);
    if (error.status) {
      if (error.status === 403 && (error.message?.includes('verification failed') || error.message?.includes('CSRF'))) {
        csrfToken = '';
      }
      if (error.status === 401 && !['/auth/me', '/auth/login', '/auth/admin/login', '/auth/register'].includes(endpoint)) {
        window.dispatchEvent(new Event('urbanpulse:session-expired'));
      }
      throw error;
    }
    if (error.message?.startsWith('Unable to connect') || error.message?.startsWith('The service is taking')) throw error;
    throw new Error(apiErrorMessage({ error }));
  }
}

export async function getCurrentUser() {
  try {
    const result = await request('/auth/me', { quiet: true });
    return result?.data || null;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function registerAccount(email, password) {
  const result = await request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  return result.data;
}

export async function loginAccount(email, password, { admin = false } = {}) {
  const endpoint = admin ? '/auth/admin/login' : '/auth/login';
  const result = await request(endpoint, { method: 'POST', body: JSON.stringify({ email, password }) });
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

// =====================================================
// IN-APP NOTIFICATIONS & ISSUE SUBSCRIPTIONS
// =====================================================

export async function getNotifications() {
  try {
    const result = await request('/notifications', { quiet: true });
    return Array.isArray(result?.data) ? result.data : [];
  } catch {
    return [];
  }
}

export async function getUnreadNotificationCount() {
  try {
    const result = await request('/notifications/unread-count', { quiet: true });
    return typeof result?.unreadCount === 'number' ? result.unreadCount : 0;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: 'PATCH'
  });
}

export async function markAllNotificationsAsRead() {
  return request('/notifications/mark-all-read', {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function subscribeToIssue(issueId) {
  return request(`/notifications/issues/${issueId}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}

export async function unsubscribeFromIssue(issueId) {
  return request(`/notifications/issues/${issueId}/subscribe`, {
    method: 'DELETE'
  });
}

export async function getIssueSubscriptionStatus(issueId) {
  try {
    const result = await request(`/notifications/issues/${issueId}/subscribe`, { quiet: true });
    return Boolean(result?.subscribed);
  } catch {
    return false;
  }
}
