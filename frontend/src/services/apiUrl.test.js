import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiOrigin, resolveApiUrl, resolveEvidenceUrl } from './apiUrl.js';

test('API defaults to same-origin rewrite and normalizes configured trailing slashes', () => {
  assert.equal(resolveApiUrl(''), '/api');
  assert.equal(resolveApiUrl('https://api.example/api/'), 'https://api.example/api');
  assert.equal(resolveApiOrigin('/api'), '');
  assert.equal(resolveApiOrigin('https://api.example/api'), 'https://api.example');
});

test('stored upload paths resolve through the authenticated API route', () => {
  assert.equal(resolveEvidenceUrl('/uploads/photo.png'), '/api/uploads/photo.png');
  assert.equal(resolveEvidenceUrl('/uploads/photo.png', 'https://api.example/api'), 'https://api.example/api/uploads/photo.png');
  assert.equal(resolveEvidenceUrl('https://cdn.example/photo.png'), 'https://cdn.example/photo.png');
});
