const test = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCTION_FRONTEND_ORIGIN, parseAllowedOrigins, isAllowedOrigin, cleanOrigin } = require('../src/config/corsPolicy');

test('production CORS fallback is exact and never admits Vercel preview subdomains', () => {
  const allowed = parseAllowedOrigins({ NODE_ENV: 'production' });
  assert.deepEqual(allowed, [PRODUCTION_FRONTEND_ORIGIN]);
  assert.equal(isAllowedOrigin(PRODUCTION_FRONTEND_ORIGIN, allowed), true);
  assert.equal(isAllowedOrigin('https://urbanpulse-git-feature.vercel.app', allowed), false);
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

test('whitespace-only CORS_ORIGINS falls back safely to default production origin', () => {
  const allowed = parseAllowedOrigins({ NODE_ENV: 'production', CORS_ORIGINS: '    ' });
  assert.deepEqual(allowed, [PRODUCTION_FRONTEND_ORIGIN]);
  assert.equal(isAllowedOrigin(PRODUCTION_FRONTEND_ORIGIN, allowed), true);
});
