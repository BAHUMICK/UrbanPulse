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
const { hashToken } = require('../src/middleware/auth');
const users = new Map();
const sessions = new Map();
const notifications = new Map();
let currentIssue = { id: 7, sector: 'Roads & Transportation', title: 'Test road damage', category: 'Road Damage', description: 'Road has a deep pothole', latitude: 22.5, longitude: 88.3, severity: 'High', status: 'Reported', reporter_user_id: 99, created_at: new Date().toISOString() };
let createdIssue;
const evidencePath = '/uploads/test-private-evidence.png';
let failNextUserInsert = false;
let failNextUserInsertCode = null;
let failNextSessionInsert = false;
let failNextSessionDelete = false;
const transactionStats = { clients: 0, commits: 0, rollbacks: 0, releases: 0, discarded: 0 };

pool.query = async (sql, values = []) => {
  const query = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  if (query.startsWith('select now() as current_time')) return { rows: [{ current_time: new Date().toISOString() }] };
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
  if (query.startsWith('select e.file_path from issue_evidence e')) {
    const authorized = values[1] || Number(currentIssue.reporter_user_id) === Number(values[2]);
    return { rows: authorized && values[0] === evidencePath ? [{ file_path: evidencePath }] : [] };
  }
  if (query.startsWith('select a.id, a.issue_id')) return { rows: [{ id: 11, issue_id: 7, title: 'Test alert', status: 'Active' }] };
  if (query.startsWith('select i.id, i.sector')) {
    const ownerParameter = query.match(/i\.reporter_user_id = \$(\d+)/);
    const ownerId = ownerParameter ? values[Number(ownerParameter[1]) - 1] : null;
    const rows = [currentIssue, createdIssue].filter(Boolean).filter((issue) => !ownerParameter || Number(issue.reporter_user_id) === Number(ownerId));
    const detail = query.includes('where i.id = $1');
    return { rows: detail ? rows.filter((issue) => Number(issue.id) === Number(values[0])) : rows };
  }
  if (query.startsWith('delete from auth_sessions where user_id')) return { rows: [] };
  if (query.startsWith('delete from auth_sessions where token_hash')) { if (failNextSessionDelete) { failNextSessionDelete = false; throw new Error('simulated session revocation failure'); } sessions.delete(values[0]); return { rows: [] }; }
  if (query.startsWith('insert into issues')) {
    const [sector, title, category, description, latitude, longitude, severity] = values;
    createdIssue = { id: 8, sector, title, category, description, latitude, longitude, severity, status: 'Reported', reporter_user_id: values[7], created_at: new Date().toISOString() };
    return { rows: [{ ...createdIssue }] };
  }
  if (query.startsWith('update issues set status')) { currentIssue = { ...currentIssue, status: values[0] }; return { rows: [{ ...currentIssue }] }; }
  if (query.startsWith("update alerts set status = 'acknowledged'")) return { rows: [] };
  if (query.startsWith("update alerts set status = 'resolved'")) return { rows: [] };
  if (query.startsWith('select id, file_name, file_path, file_type, file_size, created_at from issue_evidence')) return { rows: [] };
  if (query.startsWith('update alerts set status = $1')) return { rows: [{ id: Number(values[1]), issue_id: 7, alert_type: 'Road Infrastructure Alert', title: 'Test alert', message: 'Test', priority_score: 85, authority: 'Roads Department', status: values[0], created_at: new Date().toISOString() }] };
  if (query.startsWith('select n.id, n.issue_id, n.notification_type')) {
    const userNotifs = [...notifications.values()].filter((n) => Number(n.user_id) === Number(values[0]));
    return { rows: userNotifs };
  }
  if (query.startsWith('select count(*)::int as unread_count from user_notifications')) {
    const unread = [...notifications.values()].filter((n) => Number(n.user_id) === Number(values[0]) && !n.is_read).length;
    return { rows: [{ unread_count: unread }] };
  }
  if (query.startsWith('update user_notifications set is_read = true where id = $1 and user_id = $2')) {
    const notif = notifications.get(Number(values[0]));
    if (notif && Number(notif.user_id) === Number(values[1])) {
      notif.is_read = true;
      return { rows: [{ id: notif.id, is_read: true }] };
    }
    return { rows: [] };
  }
  if (query.startsWith('update user_notifications set is_read = true where user_id = $1')) {
    for (const notif of notifications.values()) {
      if (Number(notif.user_id) === Number(values[0])) notif.is_read = true;
    }
    return { rows: [] };
  }
  throw new Error(`Unexpected test query: ${query}`);
};
pool.connect = async () => {
  transactionStats.clients += 1;
  let insertedUserId = null;
  const insertedSessionTokens = [];
  return {
  query: async (sql, values = []) => {
    const query = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    if (query === 'commit') { transactionStats.commits += 1; return { rows: [] }; }
    if (query === 'begin' || query.startsWith('select pg_advisory_xact_lock')) return { rows: [] };
    if (query === 'rollback') {
      transactionStats.rollbacks += 1;
      if (insertedUserId !== null) users.delete(insertedUserId);
      for (const tokenHash of insertedSessionTokens) sessions.delete(tokenHash);
      return { rows: [] };
    }
    if (query.startsWith('insert into app_users')) {
      if (failNextUserInsert) {
        failNextUserInsert = false;
        const error = new Error('simulated user insert failure');
        if (failNextUserInsertCode) { error.code = failNextUserInsertCode; failNextUserInsertCode = null; }
        throw error;
      }
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
    if (query.startsWith('select id, title, status, reporter_user_id from issues')) {
      const target = Number(values[0]) === 7 ? currentIssue : (createdIssue && Number(createdIssue.id) === Number(values[0]) ? createdIssue : null);
      return { rows: target ? [{ id: target.id, title: target.title, status: target.status, reporter_user_id: target.reporter_user_id }] : [] };
    }
    if (query.startsWith('update issues set status')) {
      if (Number(values[1]) === 7) currentIssue = { ...currentIssue, status: values[0] };
      else if (createdIssue && Number(createdIssue.id) === Number(values[1])) createdIssue = { ...createdIssue, status: values[0] };
      const updated = Number(values[1]) === 7 ? currentIssue : createdIssue;
      return { rows: updated ? [{ ...updated }] : [] };
    }
    if (query.startsWith("update alerts set status = 'resolved'")) return { rows: [] };
    if (query.startsWith("update alerts set status = 'acknowledged'")) return { rows: [] };
    if (query.startsWith('select user_id from issue_subscriptions')) return { rows: [] };
    if (query.startsWith('insert into user_notifications')) {
      const id = notifications.size + 1;
      notifications.set(id, { id, user_id: values[0], issue_id: values[1], notification_type: values[2], message: values[3], is_read: false, created_at: new Date().toISOString() });
      return { rows: [] };
    }
    if (query.startsWith('insert into alerts')) return { rows: [{ id: 9, issue_id: values[0], alert_type: values[1], title: values[2], message: values[3], priority_score: values[4], authority: values[5], status: 'Active', created_at: new Date().toISOString() }] };
    throw new Error(`Unexpected test transaction query: ${query}`);
  },
  release(error) { transactionStats.releases += 1; if (error) transactionStats.discarded += 1; },
  };
};

const { app } = require('../src/index');
let server;
let baseUrl;

test('auth API enforces roles and supports citizen sign-in/out and admin workflow', async (t) => {
  app.set('trust proxy', 1);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); });

  const previewOrigin = 'https://urban-pulse-j58rsecnv-bahumick1-9202.vercel.app';
  const preflight = await fetch(`${baseUrl}/api/auth/csrf`, { method: 'OPTIONS', headers: { origin: previewOrigin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-csrf-token' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), previewOrigin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  const rejectedPreflight = await fetch(`${baseUrl}/api/auth/csrf`, { method: 'OPTIONS', headers: { origin: 'https://untrusted.example', 'access-control-request-method': 'POST' } });
  assert.equal(rejectedPreflight.status, 403);
  const rejectedOrigin = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'https://untrusted.example' } });
  assert.equal(rejectedOrigin.status, 403);
  const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
  assert.equal(health.status, 'UP');

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { headers: { origin: previewOrigin } });
  assert.equal(csrfResponse.status, 200);
  assert.equal(csrfResponse.headers.get('access-control-allow-origin'), previewOrigin);
  assert.equal(csrfResponse.headers.get('access-control-allow-credentials'), 'true');
  const csrfResult = await csrfResponse.json();
  const csrf = csrfResult.token;
  const csrfHeaders = { 'content-type': 'application/json', 'x-csrf-token': csrf };

  const missingCsrf = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'incorrect' }) });
  assert.equal(missingCsrf.status, 403);
  const invalidCsrf = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': 'tampered' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'incorrect' }) });
  assert.equal(invalidCsrf.status, 403);

  const shortPassword = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'short' }) });
  assert.equal(shortPassword.status, 400);
  const invalidEmail = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'not-an-email', password: 'correct horse battery staple' }) });
  assert.equal(invalidEmail.status, 400);

  const transactionStart = { ...transactionStats };
  const register = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple', role: 'admin' }) });
  assert.equal(register.status, 201);
  assert.equal(transactionStats.commits - transactionStart.commits, 1);
  assert.equal(transactionStats.releases - transactionStart.releases, 1);
  const userData = await register.json();
  assert.equal(userData.data.role, 'citizen');
  const citizenCookie = register.headers.get('set-cookie').split(';')[0];
  assert.match(register.headers.get('set-cookie'), /HttpOnly/);
  assert.match(register.headers.get('set-cookie'), /SameSite=Lax/);
  const registrationToken = decodeURIComponent(citizenCookie.split('=')[1]);
  assert.equal(sessions.has(hashToken(registrationToken)), true);
  const registrationSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: citizenCookie } });
  assert.equal(registrationSession.status, 200);
  assert.equal((await registrationSession.json()).data.role, 'citizen');

  const duplicate = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple' }) });
  assert.equal(duplicate.status, 409);

  const simultaneous = await Promise.all([
    fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'parallel@example.com', password: 'correct horse battery staple' }) }),
    fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'parallel@example.com', password: 'correct horse battery staple' }) }),
  ]);
  assert.deepEqual(simultaneous.map((response) => response.status).sort(), [201, 409]);
  assert.equal([...users.values()].filter((user) => user.email === 'parallel@example.com').length, 1);

  failNextSessionInsert = true;
  const failedSessionTransactionStart = { ...transactionStats };
  const sessionFailure = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'rollback@example.com', password: 'correct horse battery staple' }) });
  assert.equal(sessionFailure.status, 503);
  assert.equal(transactionStats.rollbacks - failedSessionTransactionStart.rollbacks, 1);
  assert.equal(transactionStats.commits - failedSessionTransactionStart.commits, 0);
  assert.equal(transactionStats.releases - failedSessionTransactionStart.releases, 1);
  assert.equal([...users.values()].some((user) => user.email === 'rollback@example.com'), false);
  assert.equal([...sessions.values()].some((session) => users.get(session.user_id)?.email === 'rollback@example.com'), false);

  failNextUserInsert = true;
  const userFailure = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'insert-failure@example.com', password: 'correct horse battery staple' }) });
  assert.equal(userFailure.status, 503);
  assert.equal([...users.values()].some((user) => user.email === 'insert-failure@example.com'), false);

  failNextUserInsert = true;
  failNextUserInsertCode = '42P01';
  const missingAuthSchema = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST', headers: { ...csrfHeaders, 'x-forwarded-for': '192.0.2.42' }, body: JSON.stringify({ email: 'missing-schema@example.com', password: 'correct horse battery staple' }) });
  assert.equal(missingAuthSchema.status, 503);
  assert.match((await missingAuthSchema.json()).message, /verify the intended database and apply database\/migrations\/001_authentication\.sql/i);

  const loginInvalid = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'wrong password' }) });
  assert.equal(loginInvalid.status, 401);
  const citizenAdminLogin = await fetch(`${baseUrl}/api/auth/admin/login`, { method: 'POST', headers: { ...csrfHeaders, 'x-forwarded-for': '192.0.2.43' }, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple' }) });
  assert.equal(citizenAdminLogin.status, 403);
  assert.equal((await citizenAdminLogin.json()).message, 'This account is not authorized for administrator access.');
  assert.equal(citizenAdminLogin.headers.get('set-cookie'), null);
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ email: 'citizen@example.com', password: 'correct horse battery staple' }) });
  assert.equal(login.status, 200);
  const sessionCookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: sessionCookie } }).then((response) => response.json())).data.role, 'citizen');

  const missingCookie = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(missingCookie.status, 401);
  const malformedCookie = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: 'urbanpulse_session=%E0%A4%A' } });
  assert.equal(malformedCookie.status, 401);
  const expiredToken = 'expired-session-token';
  sessions.set(hashToken(expiredToken), { user_id: 1, expires_at: new Date(Date.now() - 1000) });
  const expiredSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: `urbanpulse_session=${expiredToken}` } });
  assert.equal(expiredSession.status, 401);

  const anonymousReport = await fetch(`${baseUrl}/api/issues`, { method: 'POST', headers: csrfHeaders, body: JSON.stringify({ title: 'A pothole here', category: 'Road Damage', description: 'A large pothole creates a risk', latitude: 22.5, longitude: 88.3, severity: 'High' }) });
  assert.equal(anonymousReport.status, 401);
  assert.equal((await fetch(`${baseUrl}/api/issues`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/alerts/active`, { headers: { cookie: sessionCookie } })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/intelligence/priorities`, { headers: { cookie: sessionCookie } })).status, 403);

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
  assert.equal(createdIssue.reporter_user_id, 1);
  const ownReports = await fetch(`${baseUrl}/api/issues`, { headers: { cookie: sessionCookie } }).then((response) => response.json());
  assert.deepEqual(ownReports.data.map((issue) => issue.id), [8]);
  const ownIssue = await fetch(`${baseUrl}/api/issues/8`, { headers: { cookie: sessionCookie } });
  assert.equal(ownIssue.status, 200);
  assert.equal((await ownIssue.json()).data.id, 8);
  assert.equal((await fetch(`${baseUrl}/api/issues/7`, { headers: { cookie: sessionCookie } })).status, 404);

  fs.writeFileSync(path.join(testUploadDir, path.basename(evidencePath)), Buffer.from('test-only evidence'));
  assert.equal((await fetch(`${baseUrl}/api/uploads/${path.basename(evidencePath)}`, { headers: { cookie: sessionCookie } })).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/uploads/${path.basename(evidencePath)}`)).status, 401);

  const noSession = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: csrfHeaders, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(noSession.status, 401);
  const citizenStatus = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(citizenStatus.status, 403);
  const citizenAlert = await fetch(`${baseUrl}/api/alerts/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Resolved' }) });
  assert.equal(citizenAlert.status, 403);

  const user = [...users.values()][0];
  user.role = 'admin'; // Simulate the documented trusted operator provisioning step.
  const adminLogin = await fetch(`${baseUrl}/api/auth/admin/login`, { method: 'POST', headers: { ...csrfHeaders, 'x-forwarded-for': '192.0.2.44' }, body: JSON.stringify({ email: user.email, password: 'correct horse battery staple' }) });
  assert.equal(adminLogin.status, 200);
  assert.equal((await adminLogin.json()).data.role, 'admin');
  assert.equal((await fetch(`${baseUrl}/api/alerts`, { headers: { cookie: sessionCookie } })).status, 200);
  assert.equal((await fetch(`${baseUrl}/api/alerts/active`, { headers: { cookie: sessionCookie } })).status, 200);
  const allReports = await fetch(`${baseUrl}/api/issues`, { headers: { cookie: sessionCookie } }).then((response) => response.json());
  assert.deepEqual(new Set(allReports.data.map((issue) => issue.id)), new Set([7, 8]));
  const evidenceResponse = await fetch(`${baseUrl}/api/uploads/${path.basename(evidencePath)}`, { headers: { cookie: sessionCookie } });
  assert.equal(evidenceResponse.status, 200);
  assert.equal(evidenceResponse.headers.get('cache-control'), 'private, no-store');
  assert.equal(await evidenceResponse.text(), 'test-only evidence');
  const adminStatus = await fetch(`${baseUrl}/api/issues/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(adminStatus.status, 200);
  assert.equal((await adminStatus.json()).data.status, 'In Progress');
  const adminAlert = await fetch(`${baseUrl}/api/alerts/7/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Acknowledged' }) });
  assert.equal(adminAlert.status, 200);
  const resolvedIssue = await fetch(`${baseUrl}/api/issues/8/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Resolved' }) });
  assert.equal(resolvedIssue.status, 200);
  assert.equal((await resolvedIssue.json()).data.status, 'Resolved');

  // Resolution notifications: Verify reporter received notification and unread count
  const notifsResponse = await fetch(`${baseUrl}/api/notifications`, { headers: { cookie: sessionCookie } });
  assert.equal(notifsResponse.status, 200);
  const notifsData = await notifsResponse.json();
  assert.equal(notifsData.data.length, 1);
  assert.equal(notifsData.data[0].notification_type, 'issue_resolved');
  assert.match(notifsData.data[0].message, /marked as resolved/i);

  const unreadResponse = await fetch(`${baseUrl}/api/notifications/unread-count`, { headers: { cookie: sessionCookie } });
  assert.equal(unreadResponse.status, 200);
  assert.equal((await unreadResponse.json()).unreadCount, 1);

  const markReadResponse = await fetch(`${baseUrl}/api/notifications/${notifsData.data[0].id}/read`, { method: 'PATCH', headers: { ...csrfHeaders, cookie: sessionCookie } });
  assert.equal(markReadResponse.status, 200);
  assert.equal((await markReadResponse.json()).data.is_read, true);

  const afterReadUnread = await fetch(`${baseUrl}/api/notifications/unread-count`, { headers: { cookie: sessionCookie } });
  assert.equal((await afterReadUnread.json()).unreadCount, 0);

  // Updating an already-resolved issue does not produce duplicate notifications
  const repeatResolved = await fetch(`${baseUrl}/api/issues/8/status`, { method: 'PUT', headers: { ...csrfHeaders, cookie: sessionCookie }, body: JSON.stringify({ status: 'Resolved' }) });
  assert.equal(repeatResolved.status, 200);
  assert.equal([...notifications.values()].filter((n) => Number(n.issue_id) === 8).length, 1);

  failNextSessionDelete = true;
  const failedLogout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { ...csrfHeaders, cookie: sessionCookie }, body: '{}' });
  assert.equal(failedLogout.status, 503);
  assert.match(failedLogout.headers.get('set-cookie'), /urbanpulse_session=; Path=\/api/);
  assert.equal(sessions.has(hashToken(decodeURIComponent(sessionCookie.split('=')[1]))), true);
  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { ...csrfHeaders, cookie: sessionCookie }, body: '{}' });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /urbanpulse_session=; Path=\/api; HttpOnly; SameSite=Lax; Max-Age=0/);
  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: sessionCookie } });
  assert.equal(afterLogout.status, 401);
  const expiredLogout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { ...csrfHeaders, cookie: `urbanpulse_session=${expiredToken}` }, body: '{}' });
  assert.equal(expiredLogout.status, 200);
  assert.match(expiredLogout.headers.get('set-cookie'), /Max-Age=0/);
});

test.after(() => {
  fs.rmSync(testUploadDir, { recursive: true, force: true });
});
