export function resolveApiUrl(configuredApiUrl = '') {
  return (configuredApiUrl || '/api').replace(/\/$/, '');
}

export function resolveApiOrigin(apiUrl) {
  return apiUrl.replace(/\/api$/, '');
}

export function resolveEvidenceUrl(filePath, apiUrl = '/api') {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const apiPath = filePath.startsWith('/api/uploads/')
    ? filePath
    : filePath.replace(/^\/uploads\//, '/api/uploads/');
  return `${resolveApiOrigin(apiUrl)}${apiPath}`;
}
