const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.AUTH_SECRET = 'integration-test-secret-with-at-least-32-bytes';
process.env.NODE_ENV = 'test';
const testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urbanpulse-auth-test-'));
process.env.UPLOAD_DIR = testUploadDir;

const pool = require('../src/config/db');
const users = new Map();
const sessions = new Map();
let currentIssue = { id: 7, sector: 'Roads & Transportation', title: 'Test road damage', category: 'Road Damage', description: 'Road has a deep pothole', latitude: 22.5, longitude: 88.3, severity: 'High', status: 'Reported', created_at: new Date().toISOString() };
let createdIssue;
let failNextUserInsert = false;
let failNextSessionInsert = false;

pool.query = async (sql, values = []) => {
  const query = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  if (query.startsWith('insert into app_users')) {
    const [email, password_hash] = values;
    if ([...users.values()].some((user) => user.email === email)) { const error = new Error('duplicate'); error.code = '23505'; throw error; }
    const user = { id: users.size + 1, email, role: 'citizen', password_hash };
    users.set(user.id, user);
    return { rows: [{ id: user.id, email, role: user.role }] };
  }
  if (query.startsWith('select id, email, role, password_hash from app_users')) {
    const user = [...users.values()].find((item) => item.email === values[0]);
    return { rows: user ? [{ ...user }] : [] };
  }
  if (query.startsWith('insert into auth_sessions')) {
    sessions.set(values[1], { user_id: values[0], expires_at: values[2] });
    return { rows: [] };
  }
  if (query.startsWith('select u.id, u.email, u.role from auth_sessions')) {
    const session = sessions.get(values[0]);
    const user = session && session.expires_at > new Date() ? users.get(session.user_id) : null;
    return { rows: user ? [{ id: user.id, email: user.email, role: user.role }] : [] };
  }
  if (query.startsWith('delete from auth_sessions where user_id')) return { rows: [] };
  if (query.startsWith('delete from auth_sessions where token_hash')) { sessions.delete(values[0]); return { rows: [] }; }
  if (query.startsWith('insert into issues')) {
    const [sector, title, category, description, latitude, longitude, severity] = values;
    createdIssue = { id: 8, sector, title, category, description, latitude, longitude, severity, status: 'Reported', created_at: new Date().toISOString() };
    return { rows: [{ ...createdIssue }] };
  }
  if (query.startsWith('update issues set status')) { currentIssue = { ...currentIssue, status: values[0] }; return { rows: [{ ...currentIssue }] }; }
  if (query.startsWith("update alerts set status = 'acknowledged'")) return { rows: [] };
  if (query.startsWith("update alerts set status = 'resolved'")) return { rows: [] };
  if (query.startsWith('select id, file_name, file_path, file_type, file_size, created_at from issue_evidence')) return { rows: [] };
  if (query.startsWith('update alerts set status = $1')) return { rows: [{ id: Number(values[1]), issue_id: 7, alert_type: 'Road Infrastructure Alert', title: 'Test alert', message: 'Test', priority_score: 85, authority: 'Roads Department', status: values[0], created_at: new Date().toISOString() }] };
  throw new Error(`Unexpected test query: ${query}`);
};
pool.connect = async () => {
  let insertedUserId = null;
  const insertedSessionTokens = [];
  return {
  query: async (sql, values = []) => {
    const query = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    if (query === 'begin' || query === 'commit' || query.startsWith('select pg_advisory_xact_lock')) return { rows: [] };
    if (query === 'rollback') {
      if (insertedUserId !== null) users.delete(insertedUserId);
      for (const tokenHash of insertedSessionTokens) sessions.delete(tokenHash);
      return { rows: [] };
    }
    if (query.startsWith('insert into app_users')) {
      if (failNextUserInsert) { failNextUserInsert = false; throw new Error('simulated user insert failure'); }
      const [email, password_hash] = values;
      if ([...users.values()].some((user) => user.email.toLowerCase() === email.toLowerCase())) { const error = new Error('duplicate'); error.code = '23505'; throw error; }
      const user = { id: users.size + 1, email, role: 'citizen', password_hash };
      users.set(user.id, user);
      insertedUserId = user.id;
      return { rows: [{ id: user.id, email, role: user.role }] };
    }
    if (query.startsWith('insert into auth_sessions')) {
      if (failNextSessionInsert) { failNextSessionInsert = false; throw new Error('simulated session insert failure'); }
      sessions.set(values[1], { user_id: values[0], expires_at: values[2] });
      insertedSessionTokens.push(values[1]);
      return { rows: [] };
    }
    if (query.includes('from alerts where issue_id')) return { rows: [] };
    if (query.startsWith('select id, latitude, longitude, severity, status, category from issues')) return { rows: createdIssue ? [{ ...createdIssue }] : [] };
    if (query.startsWith('insert into alerts')) return { rows: [{ id: 9, issue_id: values[0], alert_type: values[1], title: values[2], message: values[3], priority_score: values[4], authority: values[5], status: 'Active', created_at: new Date().toISOString() }] };
    throw new Error(`Unexpected test transaction query: ${query}`);
  },
  release() {},
  };
};

const { app } = require('../src/index');
let server;
let baseUrl;

test('auth API enforces roles and supports citizen sign-in/out and admin workflow', async (t) => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); });

  const csrfResult = await fetch(`${baseUrl}/api/auth/csrf`).then((response) => response.json());
  const csrf = csrfResult.token;
  const csrfHeaders = { 'content-type': 'application/json', 'x-csrf-token': csrf };

  const missingCsrf = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'incorrect' }) });
  assert.equal(missingCsrf.status, 403);
  const invalidCsrf = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': 'tampered' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'incorrect' }) });
  assert.equal(invalidCsrf.status, 403);

  const shortPassword = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'short' }) });
  assert.equal(shortPassword.status, 400);

  const register = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple', role: 'admin' }) });
  assert.equal(register.status, 201);
  const userData = await register.json();
  assert.equal(userData.data.role, 'citizen');
  const citizenCookie = register.headers.get('set-cookie').split(';')[0];
  assert.match(register.headers.get('set-cookie'), /HttpOnly/);
  assert.match(register.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(sessions.has(decodeURIComponent(citizenCookie.split('=')[1])), false);

  const duplicate = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple' }) });
  assert.equal(duplicate.status, 409);

  const simultaneous = await Promise.all([
    fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'parallel@example.com', password: 'correct horse battery staple' }) }),
    fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'parallel@example.com', password: 'correct horse battery staple' }) }),
  ]);
  assert.deepEqual(simultaneous.map((response) => response.status).sort(), [201, 409]);
  assert.equal([...users.values()].filter((user) => user.email === 'parallel@example.com').length, 1);

  failNextSessionInsert = true;
  const sessionFailure = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'rollback@example.com', password: 'correct horse battery staple' }) });
  assert.equal(sessionFailure.status, 503);
  assert.equal([...users.values()].some((user) => user.email === 'rollback@example.com'), false);
  assert.equal([...sessions.values()].some((session) => users.get(session.user_id)?.email === 'rollback@example.com'), false);

  failNextUserInsert = true;
  const userFailure = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'insert-failure@example.com', password: 'correct horse battery staple' }) });
  assert.equal(userFailure.status, 503);
  assert.equal([...users.values()].some((user) => user.email === 'insert-failure@example.com'), false);

  const loginInvalid = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'wrong password' }) });
  assert.equal(loginInvalid.status, 401);
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple' }) });
  assert.equal(login.status, 200);
  const sessionCookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: sessionCookie } }).then((response) => response.json())).data.role, 'citizen');

  const missingCookie = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(missingCookie.status, 401);
  const malformedCookie = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: 'urbanpulse_session=%E0%A4%A' } });
  assert.equal(malformedCookie.status, 401);
  const { hashToken } = require('../src/middleware/auth');
  const expiredToken = 'expired-session-token';
  sessions.set(hashToken(expiredToken), { user_id: 1, expires_at: new Date(Date.now() - 1000) });
  const expiredSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: `urbanpulse_session=${expiredToken}` } });
  assert.equal(expiredSession.status, 401);

  const anonymousReport = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ title: 'A pothole here', category: 'Road Damage', description: 'A large pothole creates a risk', latitude: 22.5, longitude: 88.3, severity: 'High' }) });
  assert.equal(anonymousReport.status, 401);

  const unauthorizedForm = new FormData();
  unauthorizedForm.append('evidence', new Blob(['not a real image'], { type: 'image/png' }), 'bad.png');
  const unauthorizedUpload = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: { 'x-csrf-token': csrf }, body: unauthorizedForm });
  assert.equal(unauthorizedUpload.status, 401);

  const invalidForm = new FormData();
  invalidForm.append('evidence', new Blob(['not an image'], { type: 'image/png' }), 'bad.png');
  const invalidUpload = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: { 'x-csrf-token': csrf, cookie: sessionCookie }, body: invalidForm });
  assert.equal(invalidUpload.status, 400);
  assert.equal(fs.readdirSync(testUploadDir).length, 0);
  const invalidCoordinates = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ title: 'A pothole here', category: 'Road Damage', description: 'A large pothole creates a risk', latitude: 91, longitude: 88.3, severity: 'High' }) });
  assert.equal(invalidCoordinates.status, 400);
  assert.match((await invalidCoordinates.json()).message, /Latitude must be between/);
  const mapSelectedLatitude = 22.572725;
  const mapSelectedLongitude = 88.361320;
  const created = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ sector: 'Roads & Transportation', title: 'Map selected pothole', category: 'Road Damage', description: 'A large pothole creates a risk to road users.', latitude: mapSelectedLatitude, longitude: mapSelectedLongitude, severity: 'High', status: 'Resolved' }) });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(Number(createdBody.data.issue.latitude), mapSelectedLatitude);
  assert.equal(Number(createdBody.data.issue.longitude), mapSelectedLongitude);
  assert.equal(createdBody.data.issue.status, 'Reported');
  assert.equal(createdBody.data.alert.status, 'Active');

  const noSession = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: csrfHeaders, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(noSession.status, 401);
  const citizenStatus = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(citizenStatus.status, 403);
  const citizenAlert = await fetch(`${baseUrl}/api/alerts/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Resolved' }) });
  assert.equal(citizenAlert.status, 403);

  const user = [...users.values()][0];
  user.role = 'admin'; // Simulate the documented trusted operator provisioning step.
  const adminStatus = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(adminStatus.status, 200);
  assert.equal((await adminStatus.json()).data.status, 'In Progress');
  const adminAlert = await fetch(`${baseUrl}/api/alerts/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Acknowledged' }) });
  assert.equal(adminAlert.status, 200);
  const resolvedIssue = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Resolved' }) });
  assert.equal(resolvedIssue.status, 200);
  assert.equal((await resolvedIssue.json()).data.status, 'Resolved');

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { ...csrfHeaders, cookie: sessionCookie }, body: '{}' });
  assert.equal(logout.status, 200);
  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: sessionCookie } });
  assert.equal(afterLogout.status, 401);
});

test.after(() => {
  fs.rmSync(testUploadDir, { recursive: true, force: true });
});
