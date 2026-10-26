const test = require('node:test');
const assert = require('node:assert/strict');
process.env.AUTH_SECRET = 'test-only-random-secret-with-at-least-32-bytes';

const { hashPassword, verifyPassword, createAuthRateLimiter } = require('../src/controllers/authController');
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

test('production session cookies use HTTPS-only and same-origin-safe flags', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.match(cookieOptions(60), /HttpOnly/);
    assert.match(cookieOptions(60), /SameSite=Lax/);
    assert.match(cookieOptions(60), /Secure/);
    assert.match(cookieOptions(60), /HttpOnly/);
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('development session cookies retain Lax without requiring HTTPS', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    assert.match(cookieOptions(60), /SameSite=Lax/);
    assert.doesNotMatch(cookieOptions(60), /; Secure/);
    assert.match(cookieOptions(60), /HttpOnly/);
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

test('authentication rate limit enforces the limit and resets after its window', () => {
  let now = 1000;
  const limit = createAuthRateLimiter({ limit: 2, windowMs: 100, now: () => now });
  const req = { ip: 'rate-limit-test' };
  const responseFor = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
  const response1 = responseFor();
  limit(req, response1, () => {});
  const response2 = responseFor();
  limit(req, response2, () => {});
  const blocked = responseFor();
  limit(req, blocked, () => assert.fail('rate-limited request continued'));
  assert.equal(blocked.statusCode, 429);

  now += 101;
  const afterWindow = responseFor();
  let continued = false;
  limit(req, afterWindow, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(afterWindow.statusCode, 200);
});

test('alert eligibility preserves existing severity and resolved-status rules', () => {
  assert.equal(isAlertEligible({ status: 'Resolved', severity: 'Critical' }, 100), false);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Critical' }, 10), true);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Low' }, 54), false);
  assert.equal(isAlertEligible({ status: 'Reported', severity: 'Medium' }, 55), true);
});
