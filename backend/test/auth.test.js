const test = require('node:test');
const assert = require('node:assert/strict');
process.env.AUTH_SECRET = 'test-only-random-secret-with-at-least-32-bytes';

const { hashPassword, verifyPassword, authRateLimit } = require('../src/controllers/authController');
const { createCsrfToken, validCsrfToken, requireRole, cookieOptions } = require('../src/middleware/auth');
const { isAlertEligible } = require('../src/services/alertService');

test('scrypt password hashes verify the password but never equal it', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.notEqual(hash, 'correct horse battery staple');
  assert.match(hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('incorrect password', hash), false);
});

test('CSRF tokens validate and reject tampering', () => {
  const token = createCsrfToken();
  assert.equal(validCsrfToken(token), true);
  assert.equal(validCsrfToken(`${token.slice(0, -1)}0`), false);
  assert.equal(validCsrfToken(''), false);
});

test('production session cookies use HTTPS-only and cross-site-safe flags', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.match(cookieOptions(60), /HttpOnly/);
    assert.match(cookieOptions(60), /SameSite=None/);
    assert.match(cookieOptions(60), /Secure/);
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('authorization middleware distinguishes missing role and allowed role', () => {
  const responseFor = (user) => {
    let code; let body; let continued = false;
    const res = { status(value) { code = value; return this; }, json(value) { body = value; return this; } };
    requireRole('admin')({ user }, res, () => { continued = true; });
    return { code, body, continued };
  };
  assert.equal(responseFor(null).code, 401);
  assert.equal(responseFor({ role: 'citizen' }).code, 403);
  assert.equal(responseFor({ role: 'admin' }).continued, true);
});

test('authentication rate limit permits the initial attempts and then rejects', () => {
  const req = { ip: `test-${Date.now()}` };
  const response = { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  for (let i = 0; i < 10; i += 1) authRateLimit(req, response, () => {});
  authRateLimit(req, response, () => assert.fail('rate-limited request continued'));
  assert.equal(response.statusCode, 429);
});

test('alert eligibility preserves existing severity and resolved-status rules', () => {
  assert.equal(isAlertEligible({ status: 'Resolved', severity: 'Critical' }, 100), false);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Critical' }, 10), true);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Low' }, 54), false);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Medium' }, 55), true);
});
