const crypto = require('crypto');
const pool = require('../config/db');

const SESSION_COOKIE = 'urbanpulse_session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('AUTH_SECRET must contain at least 32 bytes.');
  return secret;
}

function cookieOptions(maxAge) {
  const secure = process.env.NODE_ENV === 'production';
  return `Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const pair = raw.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  if (!pair) return '';
  try { return decodeURIComponent(pair.slice(name.length + 1)); }
  catch { return ''; }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createCsrfToken() {
  const nonce = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', authSecret()).update(nonce).digest('hex');
  return `${nonce}.${signature}`;
}

function validCsrfToken(token) {
  if (typeof token !== 'string') return false;
  const [nonce, signature, extra] = token.split('.');
  if (!nonce || !signature || extra || !/^[a-f0-9]{64}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = crypto.createHmac('sha256', authSecret()).update(nonce).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  try {
    if (!validCsrfToken(req.get('x-csrf-token'))) {
      return res.status(403).json({ success: false, message: 'Request verification failed. Refresh and try again.' });
    }
    return next();
  } catch {
    return res.status(503).json({ success: false, message: 'Authentication is not configured on this server.' });
  }
}

async function authenticate(req, res, next) {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token || token.length > 128) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    const result = await pool.query(
      `SELECT u.id, u.email, u.role FROM auth_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
      [hashToken(token)]
    );
    if (!result.rows[0]) return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    req.user = result.rows[0];
    return next();
  } catch (error) {
    console.error('Authentication lookup failed:', error.code || error.name);
    return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    return next();
  };
}

module.exports = { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, authSecret, cookieOptions, readCookie, hashToken, createCsrfToken, validCsrfToken, csrfProtection, authenticate, requireRole };
