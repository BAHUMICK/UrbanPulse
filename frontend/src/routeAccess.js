const ADMIN_PAGES = new Set(['map', 'alerts', 'analytics']);

export function pageForRole(path, role) {
  const page = ['dashboard', 'map', 'issues', 'report', 'alerts', 'analytics'].includes(path) ? path : 'dashboard';
  return role !== 'admin' && ADMIN_PAGES.has(page) ? 'dashboard' : page;
}

export function navigationForRole(role) {
  const citizenPages = new Set(['dashboard', 'issues', 'report']);
  return role === 'admin'
    ? ['dashboard', 'map', 'issues', 'report', 'alerts', 'analytics']
    : ['dashboard', 'report', 'issues'].filter((page) => citizenPages.has(page));
}
