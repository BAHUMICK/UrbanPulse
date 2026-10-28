const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PRODUCTION_FRONTEND_ORIGIN,
  DEFAULT_PRODUCTION_ORIGINS,
  parseAllowedOrigins,
  isAllowedOrigin,
  cleanOrigin,
  matchesPattern,
} = require('../src/config/corsPolicy');

test('production CORS fallback admits project domains and vercel previews while rejecting arbitrary subdomains', () => {
  const allowed = parseAllowedOrigins({ NODE_ENV: 'production' });
  assert.deepEqual(allowed, DEFAULT_PRODUCTION_ORIGINS);
  assert.equal(isAllowedOrigin(PRODUCTION_FRONTEND_ORIGIN, allowed), true);
  assert.equal(isAllowedOrigin('https://urban-pulse-bahumick1-9202.vercel.app', allowed), true);
  assert.equal(isAllowedOrigin('https://urban-pulse-1jj70e19w-bahumick1-9202.vercel.app', allowed), true);
  assert.equal(isAllowedOrigin('https://urban-pulse-git-main-bahumick1-9202.vercel.app', allowed), true);
  assert.equal(isAllowedOrigin('https://urbanpulse-three.vercel.app', allowed), true);
  assert.equal(isAllowedOrigin('https://urbanpulse-git-feature.vercel.app', allowed), false);
  assert.equal(isAllowedOrigin('https://evil-attacker.vercel.app', allowed), false);
  assert.equal(isAllowedOrigin('https://urban-pulse-bahumick1-9202.vercel.app.attacker.com', allowed), false);
});

test('matchesPattern accurately matches wildcard segments without escaping or injection', () => {
  assert.equal(matchesPattern('https://urban-pulse-*-bahumick1-9202.vercel.app', 'https://urban-pulse-1jj70e19w-bahumick1-9202.vercel.app'), true);
  assert.equal(matchesPattern('https://urban-pulse-*-bahumick1-9202.vercel.app', 'https://urban-pulse-abc-123-bahumick1-9202.vercel.app'), true);
  assert.equal(matchesPattern('https://urban-pulse-*-bahumick1-9202.vercel.app', 'https://other-pulse-1jj70e19w-bahumick1-9202.vercel.app'), false);
  assert.equal(matchesPattern('https://urbanpulse-three.vercel.app', 'https://urbanpulse-three.vercel.app'), true);
  assert.equal(matchesPattern('https://urbanpulse-three.vercel.app', 'https://urbanpulse-three.vercel.app/sub'), false);
});

test('configured CORS origins are split, trimmed, and matched exactly', () => {
  const allowed = parseAllowedOrigins({ CORS_ORIGINS: ' https://app.example , https://preview.example ' });
  assert.deepEqual(allowed, ['https://app.example', 'https://preview.example']);
  assert.equal(isAllowedOrigin('https://preview.example', allowed), true);
  assert.equal(isAllowedOrigin('https://sub.preview.example', allowed), false);
  assert.equal(isAllowedOrigin(undefined, allowed), true);
});

test('CORS origins with trailing slashes or quotes are cleaned and matched resiliently', () => {
  assert.equal(cleanOrigin(' "https://app.example/" '), 'https://app.example');
  assert.equal(cleanOrigin(" 'https://app.example///' "), 'https://app.example');

  const allowed = parseAllowedOrigins({
    CORS_ORIGINS: ' "https://app.example/" , \'https://preview.example/\' ',
  });
  assert.deepEqual(allowed, ['https://app.example', 'https://preview.example']);

  // Incoming origin with trailing slash should match cleaned origin
  assert.equal(isAllowedOrigin('https://app.example/', allowed), true);
  assert.equal(isAllowedOrigin('https://app.example', allowed), true);
});

test('whitespace-only CORS_ORIGINS falls back safely to default production origins', () => {
  const allowed = parseAllowedOrigins({ NODE_ENV: 'production', CORS_ORIGINS: '    ' });
  assert.deepEqual(allowed, DEFAULT_PRODUCTION_ORIGINS);
  assert.equal(isAllowedOrigin(PRODUCTION_FRONTEND_ORIGIN, allowed), true);
});
