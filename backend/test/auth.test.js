const test = require('node:test');
const assert = require('node:assert/strict');
process.env.AUTH_SECRET = 'test-only-random-secret-with-at-least-32-bytes';

const { hashPassword, verifyPassword, createAuthRateLimiter, csrf } = require('../src/controllers/authController');
const { createCsrfToken, validCsrfToken, authDatabaseErrorMessage, requireRole, cookieOptions } = require('../src/middleware/auth');
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
  const tampered = token.endsWith('0') ? `${token.slice(0, -1)}1` : `${token.slice(0, -1)}0`;
  assert.equal(validCsrfToken(tampered), false);
  assert.equal(validCsrfToken(''), false);
});

test('CSRF setup reports the AUTH_SECRET requirement without exposing its value', () => {
  const original = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = 'too-short';
  let status;
  let body;
  const res = {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; },
  };
  try {
    csrf({}, res);
    assert.equal(status, 503);
    assert.equal(body.message, 'Authentication is not configured on this server. Set AUTH_SECRET to a random value of at least 32 bytes.');
    assert.equal(body.message.includes(process.env.AUTH_SECRET), false);
  } finally {
    process.env.AUTH_SECRET = original;
  }
});

test('authentication database failures return safe and distinct setup guidance', () => {
  assert.match(authDatabaseErrorMessage({ code: '42P01' }, 'fallback'), /Verify the intended database and apply database\/migrations\/001_authentication\.sql/);
  assert.match(authDatabaseErrorMessage({ code: '28P01' }, 'fallback'), /database credentials/);
  assert.equal(authDatabaseErrorMessage({ code: 'ECONNREFUSED' }, 'fallback').includes('connection settings'), true);
  assert.equal(authDatabaseErrorMessage({ code: 'XX000', detail: 'sensitive internal detail' }, 'fallback'), 'fallback');
});

test('production session cookies support cross-site fetch credentials securely', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.match(cookieOptions(60), /HttpOnly/);
    assert.match(cookieOptions(60), /Path=\/api/);
    assert.match(cookieOptions(60), /SameSite=None/);
    assert.match(cookieOptions(60), /Secure/);
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
