import test from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardMetrics } from './dashboardMetrics.js';

test('dashboard critical and high counts only include active issues', () => {
  const metrics = getDashboardMetrics([
    { status: 'Resolved', severity: 'Critical' },
    { status: 'Reported', severity: 'Critical' },
    { status: 'In Progress', severity: 'High' },
    { status: 'Resolved', severity: 'High' },
  ]);
  assert.deepEqual({ activeCount: metrics.activeCount, critical: metrics.critical, high: metrics.high, highPriorityTotal: metrics.highPriorityTotal, resolved: metrics.resolved, resolutionRate: metrics.resolutionRate }, {
    activeCount: 2, critical: 1, high: 1, highPriorityTotal: 2, resolved: 2, resolutionRate: 50,
  });
});

test('empty dashboard metrics remain zero and do not divide by zero', () => {
  assert.deepEqual(getDashboardMetrics([]), { total: 0, resolved: 0, reported: 0, inProgress: 0, critical: 0, high: 0, activeCount: 0, highPriorityTotal: 0, resolutionRate: 0 });
});
