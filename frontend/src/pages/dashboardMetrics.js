export function getDashboardMetrics(issues = []) {
  const total = issues.length;
  const resolved = issues.filter((issue) => issue.status === 'Resolved').length;
  const reported = issues.filter((issue) => issue.status === 'Reported').length;
  const inProgress = issues.filter((issue) => issue.status === 'In Progress').length;
  const activeIssues = issues.filter((issue) => issue.status !== 'Resolved');
  const critical = activeIssues.filter((issue) => issue.severity === 'Critical').length;
  const high = activeIssues.filter((issue) => issue.severity === 'High').length;
  return {
    total, resolved, reported, inProgress, critical, high,
    activeCount: reported + inProgress,
    highPriorityTotal: critical + high,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  };
}
