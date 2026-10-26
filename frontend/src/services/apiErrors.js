const SAFE_SERVER_MESSAGES = new Set([
  'Authentication is not configured on this server. Set AUTH_SECRET to a random value of at least 32 bytes.',
  'Authentication is temporarily unavailable.',
  'Authentication database tables are missing. Verify the intended database and apply database/migrations/001_authentication.sql.',
  'The database role cannot access authentication tables. Check its database permissions.',
  'Database authentication failed. Check the backend database credentials.',
  'The authentication database is unavailable. Check the backend database connection settings and service health.',
  'Could not create account. Check server authentication setup.',
  'Could not sign in. Check server authentication setup.',
  'Could not finish signing out. Please try again.',
  'Evidence service is temporarily unavailable.',
  'Backend server is running, but database connection failed',
]);

export function apiErrorMessage({ status, endpoint = '', error } = {}) {
  if (!status) {
    if (error?.name === 'AbortError') return 'The service is taking too long to respond. Please try again.';
    return 'Unable to connect to the service. Please try again.';
  }
  if (status === 400 || status === 422) return error?.message || 'Please check the information and try again.';
  if (status === 401) {
    return ['/auth/login', '/auth/admin/login'].includes(endpoint)
      ? 'Please check your email and password.'
      : 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    if (error?.message === 'This website is not authorized to access the API.') return error.message;
    if (error?.message === 'This account is not authorized for administrator access.') return error.message;
    return 'You do not have permission to perform this action.';
  }
  if (status === 409) return 'This email is already registered. Please sign in instead.';
  if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (status >= 500) {
    if (SAFE_SERVER_MESSAGES.has(error?.message)) return error.message;
    return 'The service is temporarily unavailable. Please try again shortly.';
  }
  return error?.message || 'The request could not be completed. Please try again.';
}
