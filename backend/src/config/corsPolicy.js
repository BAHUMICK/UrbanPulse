const DEFAULT_PRODUCTION_ORIGINS = [
  'https://urban-pulse-bahumick1-9202.vercel.app',
  'https://urban-pulse-git-main-bahumick1-9202.vercel.app',
  'https://urban-pulse-*-bahumick1-9202.vercel.app',
  'https://urbanpulse-three.vercel.app',
];

const PRODUCTION_FRONTEND_ORIGIN = (process.env.PRODUCTION_FRONTEND_ORIGIN || DEFAULT_PRODUCTION_ORIGINS[0]).replace(/\/+$/, '');

function cleanOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}

function matchesPattern(pattern, origin) {
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;
  const escaped = pattern.split('*').map((s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('[a-z0-9-]+');
  return new RegExp('^' + escaped + '$', 'i').test(origin);
}

function parseAllowedOrigins(environment = process.env) {
  const configuredOrigin = cleanOrigin(environment.PRODUCTION_FRONTEND_ORIGIN);
  const primaryOrigin = configuredOrigin || PRODUCTION_FRONTEND_ORIGIN;

  const fallbackOrigins = environment.NODE_ENV === 'production'
    ? [primaryOrigin, ...DEFAULT_PRODUCTION_ORIGINS.filter((o) => o !== primaryOrigin)]
    : ['http://localhost:5173', 'http://127.0.0.1:5173', primaryOrigin, ...DEFAULT_PRODUCTION_ORIGINS.filter((o) => o !== primaryOrigin)];

  const configured = typeof environment.CORS_ORIGINS === 'string'
    ? environment.CORS_ORIGINS
        .split(',')
        .map(cleanOrigin)
        .filter(Boolean)
    : [];

  const raw = configured.length > 0 ? configured : fallbackOrigins;
  return Array.from(new Set(raw.filter(Boolean)));
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  const cleaned = cleanOrigin(origin);
  if (!cleaned) return true;
  return allowedOrigins.some((pattern) => matchesPattern(pattern, cleaned));
}

module.exports = {
  PRODUCTION_FRONTEND_ORIGIN,
  DEFAULT_PRODUCTION_ORIGINS,
  parseAllowedOrigins,
  isAllowedOrigin,
  cleanOrigin,
  matchesPattern,
};
