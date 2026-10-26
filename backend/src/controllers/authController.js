const crypto = require('crypto');
const { promisify } = require('util');
const pool = require('../config/db');
const { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, cookieOptions, hashToken, readCookie, createCsrfToken } = require('../middleware/auth');

const scrypt = promisify(crypto.scrypt);
const attempts = new Map();
const PASSWORD_BYTES_MIN = 12;
const PASSWORD_BYTES_MAX = 128;

function authRateLimit(req, res, next) {
  const now = Date.now();
  if (attempts.size > 1000) {
    for (const [address, attempt] of attempts) if (attempt.until <= now) attempts.delete(address);
  }
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = attempts.get(key);
  if (!current || current.until <= now) {
    attempts.set(key, { count: 1, until: now + 15 * 60 * 1000 });
    return next();
  }
  if (current.count >= 10) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Try again in 15 minutes.' });
  current.count += 1;
  return next();
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('hex')}$${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [scheme, n, r, p, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || n !== '16384' || r !== '8' || p !== '1' || !/^[a-f0-9]{32}$/.test(saltHex || '') || !/^[a-f0-9]{128}$/.test(hashHex || '')) return false;
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return crypto.timingSafeEqual(actual, Buffer.from(hashHex, 'hex'));
}

const dummyPasswordHash = hashPassword(crypto.randomBytes(32).toString('hex'));

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(SESSION_MAX_AGE_SECONDS)}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${cookieOptions(0)}`);
}

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await pool.query('INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, hashToken(token), expiresAt]);
  setSessionCookie(res, token);
}

function csrf(req, res) {
  try { return res.json({ success: true, token: createCsrfToken() }); }
  catch { return res.status(503).json({ success: false, message: 'Authentication is not configured on this server.' }); }
}

async function register(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  if (Buffer.byteLength(password) < PASSWORD_BYTES_MIN || Buffer.byteLength(password) > PASSWORD_BYTES_MAX) return res.status(400).json({ success: false, message: 'Password must be 12 to 128 bytes long.' });
  try {
    const passwordHash = await hashPassword(password);
    const result = await pool.query('INSERT INTO app_users (email, password_hash, role) VALUES ($1, $2, \'citizen\') RETURNING id, email, role', [email, passwordHash]);
    await createSession(result.rows[0].id, res);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    console.error('Registration failed:', error.code || error.name);
    return res.status(503).json({ success: false, message: 'Could not create account. Check server authentication setup.' });
  }
}

async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || email.length > 254 || !password || Buffer.byteLength(password) > PASSWORD_BYTES_MAX) return res.status(400).json({ success: false, message: 'Enter your email and password.' });
  try {
    const result = await pool.query('SELECT id, email, role, password_hash FROM app_users WHERE LOWER(email) = $1', [email]);
    const user = result.rows[0];
    const candidateHash = user ? user.password_hash : await dummyPasswordHash;
    const passwordMatches = await verifyPassword(password, candidateHash);
    if (!user || !passwordMatches) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    await pool.query('DELETE FROM auth_sessions WHERE user_id = $1 AND expires_at <= NOW()', [user.id]);
    await createSession(user.id, res);
    return res.json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login failed:', error.code || error.name);
    return res.status(503).json({ success: false, message: 'Could not sign in. Check server authentication setup.' });
  }
}

async function me(req, res) { return res.json({ success: true, data: req.user }); }

async function logout(req, res) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    try { await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashToken(token)]); }
    catch (error) { console.error('Session revocation failed:', error.code || error.name); }
  }
  clearSessionCookie(res);
  return res.json({ success: true });
}

module.exports = { authRateLimit, hashPassword, verifyPassword, csrf, register, login, me, logout };
