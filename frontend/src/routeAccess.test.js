import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationForRole, pageForRole } from './routeAccess.js';

test('citizens are routed away from administration pages', () => {
  for (const page of ['map', 'alerts', 'analytics']) assert.equal(pageForRole(page, 'citizen'), 'dashboard');
  assert.deepEqual(new Set(navigationForRole('citizen')), new Set(['dashboard', 'issues', 'report']));
});

test('unknown roles receive the restricted route set', () => {
  assert.equal(pageForRole('analytics', 'unexpected'), 'dashboard');
  assert.deepEqual(new Set(navigationForRole('unexpected')), new Set(['dashboard', 'issues', 'report']));
});

test('administrators retain the full portal and unknown pages fall back safely', () => {
  assert.deepEqual(new Set(navigationForRole('admin')), new Set(['dashboard', 'map', 'issues', 'report', 'alerts', 'analytics']));
  assert.equal(pageForRole('not-a-page', 'admin'), 'dashboard');
});
