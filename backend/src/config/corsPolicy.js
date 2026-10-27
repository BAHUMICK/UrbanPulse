const PRODUCTION_FRONTEND_ORIGIN = process.env.PRODUCTION_FRONTEND_ORIGIN || 'https://urbanpulse-three.vercel.app';

function parseAllowedOrigins(environment = process.env) {
  const fallbackOrigins = environment.NODE_ENV === 'production'
    ? [PRODUCTION_FRONTEND_ORIGIN]
    : ['http://localhost:5173', 'http://127.0.0.1:5173', PRODUCTION_FRONTEND_ORIGIN];
  return (environment.CORS_ORIGINS || fallbackOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins) {
  return !origin || allowedOrigins.includes(origin);
}

module.exports = { PRODUCTION_FRONTEND_ORIGIN, parseAllowedOrigins, isAllowedOrigin };
