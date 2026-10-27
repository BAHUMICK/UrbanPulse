const PRODUCTION_FRONTEND_ORIGIN = (process.env.PRODUCTION_FRONTEND_ORIGIN || 'https://urbanpulse-three.vercel.app').replace(/\/+$/, '');

function cleanOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}

function parseAllowedOrigins(environment = process.env) {
  const defaultOrigin = cleanOrigin(environment.PRODUCTION_FRONTEND_ORIGIN || PRODUCTION_FRONTEND_ORIGIN);
  const fallbackOrigins = environment.NODE_ENV === 'production'
    ? [defaultOrigin]
    : ['http://localhost:5173', 'http://127.0.0.1:5173', defaultOrigin];

  const configured = typeof environment.CORS_ORIGINS === 'string'
    ? environment.CORS_ORIGINS
        .split(',')
        .map(cleanOrigin)
        .filter(Boolean)
    : [];

  const effectiveOrigins = (configured.length > 0 ? configured : fallbackOrigins).filter(Boolean);
  return effectiveOrigins;
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  const cleaned = cleanOrigin(origin);
  if (!cleaned) return true;
  return allowedOrigins.includes(cleaned);
}

module.exports = { PRODUCTION_FRONTEND_ORIGIN, parseAllowedOrigins, isAllowedOrigin, cleanOrigin };
