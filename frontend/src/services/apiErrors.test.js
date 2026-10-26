import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage } from './apiErrors.js';

test('API errors map connection and status failures to safe user messages', () => {
  assert.match(apiErrorMessage({ error: new TypeError('fetch failed') }), /Unable to connect/);
  assert.match(apiErrorMessage({ error: { name: 'AbortError' } }), /taking too long/);
  assert.match(apiErrorMessage({ status: 401, endpoint: '/auth/login' }), /check your email and password/);
  assert.match(apiErrorMessage({ status: 401, endpoint: '/auth/admin/login' }), /check your email and password/);
  assert.match(apiErrorMessage({ status: 401 }), /session has expired/);
  assert.match(apiErrorMessage({ status: 403 }), /permission/);
  assert.equal(apiErrorMessage({ status: 403, error: { message: 'This website is not authorized to access the API.' } }), 'This website is not authorized to access the API.');
  assert.equal(apiErrorMessage({ status: 403, error: { message: 'This account is not authorized for administrator access.' } }), 'This account is not authorized for administrator access.');
  assert.match(apiErrorMessage({ status: 409 }), /already registered/);
  assert.equal(apiErrorMessage({ status: 503, error: { message: 'Authentication is not configured on this server. Set AUTH_SECRET to a random value of at least 32 bytes.' } }), 'Authentication is not configured on this server. Set AUTH_SECRET to a random value of at least 32 bytes.');
  assert.equal(apiErrorMessage({ status: 503, error: { message: 'Could not create account. Check server authentication setup.' } }), 'Could not create account. Check server authentication setup.');
  assert.match(apiErrorMessage({ status: 503, error: { message: 'Authentication database tables are missing. Verify the intended database and apply database/migrations/001_authentication.sql.' } }), /authentication database tables are missing/i);
  assert.match(apiErrorMessage({ status: 503, error: { message: 'database password leaked' } }), /temporarily unavailable/);
});
