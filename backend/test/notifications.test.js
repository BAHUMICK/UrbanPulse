const test = require('node:test');
const assert = require('node:assert/strict');
process.env.AUTH_SECRET = 'notification-test-secret-at-least-32-bytes';
process.env.NODE_ENV = 'test';

const pool = require('../src/config/db');
const { hashToken } = require('../src/middleware/auth');
const { app } = require('../src/index');

const mockNotifications = new Map();
const mockSubscriptions = new Map();
let nextNotifId = 1;

// Override pool.query for notification tests
const originalQuery = pool.query;
pool.query = async (sql, values = []) => {
  const query = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  if (query.startsWith('select u.id, u.email, u.role from auth_sessions')) {
    if (values[0] === hashToken('user1-token')) {
      return { rows: [{ id: 101, email: 'user1@example.com', role: 'citizen' }] };
    }
    if (values[0] === hashToken('user2-token')) {
      return { rows: [{ id: 102, email: 'user2@example.com', role: 'citizen' }] };
    }
    return { rows: [] };
  }

  if (query.startsWith('select n.id, n.issue_id, n.notification_type, n.message, n.is_read')) {
    const userId = Number(values[0]);
    const items = [...mockNotifications.values()]
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: items };
  }

  if (query.startsWith('select count(*)::int as unread_count from user_notifications')) {
    const userId = Number(values[0]);
    const count = [...mockNotifications.values()].filter((n) => n.user_id === userId && !n.is_read).length;
    return { rows: [{ unread_count: count }] };
  }

  if (query.startsWith('update user_notifications set is_read = true where id = $1 and user_id = $2')) {
    const notifId = Number(values[0]);
    const userId = Number(values[1]);
    const item = mockNotifications.get(notifId);
    if (item && item.user_id === userId) {
      item.is_read = true;
      return { rows: [{ id: item.id, is_read: true }] };
    }
    return { rows: [] };
  }

  if (query.startsWith('update user_notifications set is_read = true where user_id = $1')) {
    const userId = Number(values[0]);
    for (const item of mockNotifications.values()) {
      if (item.user_id === userId) item.is_read = true;
    }
    return { rows: [] };
  }

  if (query.startsWith('select id from issues where id = $1')) {
    return { rows: Number(values[0]) === 42 ? [{ id: 42 }] : [] };
  }

  if (query.startsWith('insert into issue_subscriptions')) {
    const key = `${values[0]}:${values[1]}`;
    mockSubscriptions.set(key, { issue_id: values[0], user_id: values[1] });
    return { rows: [] };
  }

  if (query.startsWith('delete from issue_subscriptions')) {
    const key = `${values[0]}:${values[1]}`;
    mockSubscriptions.delete(key);
    return { rows: [] };
  }

  if (query.startsWith('select 1 from issue_subscriptions')) {
    const key = `${values[0]}:${values[1]}`;
    return { rows: mockSubscriptions.has(key) ? [{ 1: 1 }] : [] };
  }

  return originalQuery.call(pool, sql, values);
};

test('notification API enforces authentication and user isolation', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    pool.query = originalQuery;
  });

  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`).then((r) => r.json());
  const csrf = csrfRes.token;
  const csrfHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf };

  // 1. Unauthenticated requests are rejected
  const unauthGet = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(unauthGet.status, 401);

  // 2. Seed notification for user 101
  mockNotifications.set(1, {
    id: 1,
    user_id: 101,
    issue_id: 42,
    notification_type: 'issue_resolved',
    message: 'Your reported issue, "Main Road Pothole", has been marked as resolved.',
    is_read: false,
    created_at: new Date().toISOString()
  });

  // 3. User 101 can fetch their notifications
  const user1Cookie = 'urbanpulse_session=user1-token';
  const notifListRes = await fetch(`${baseUrl}/api/notifications`, { headers: { cookie: user1Cookie } });
  assert.equal(notifListRes.status, 200);
  const notifList = await notifListRes.json();
  assert.equal(notifList.data.length, 1);
  assert.equal(notifList.data[0].id, 1);
  assert.equal(notifList.data[0].is_read, false);

  // 4. Unread count endpoint
  const unreadRes = await fetch(`${baseUrl}/api/notifications/unread-count`, { headers: { cookie: user1Cookie } });
  assert.equal(unreadRes.status, 200);
  assert.equal((await unreadRes.json()).unreadCount, 1);

  // 5. Cross-user isolation: User 102 cannot see or mark user 101's notification
  const user2Cookie = 'urbanpulse_session=user2-token';
  const user2Notifs = await fetch(`${baseUrl}/api/notifications`, { headers: { cookie: user2Cookie } }).then((r) => r.json());
  assert.equal(user2Notifs.data.length, 0);

  const crossUserMark = await fetch(`${baseUrl}/api/notifications/1/read`, {
    method: 'PATCH',
    headers: { ...csrfHeaders, cookie: user2Cookie }
  });
  assert.equal(crossUserMark.status, 404);
  assert.equal(mockNotifications.get(1).is_read, false);

  // 6. User 101 marks their own notification as read
  const ownMark = await fetch(`${baseUrl}/api/notifications/1/read`, {
    method: 'PATCH',
    headers: { ...csrfHeaders, cookie: user1Cookie }
  });
  assert.equal(ownMark.status, 200);
  assert.equal(mockNotifications.get(1).is_read, true);

  const afterReadCount = await fetch(`${baseUrl}/api/notifications/unread-count`, { headers: { cookie: user1Cookie } }).then((r) => r.json());
  assert.equal(afterReadCount.unreadCount, 0);

  // 7. Issue Subscriptions (Following)
  const subRes = await fetch(`${baseUrl}/api/notifications/issues/42/subscribe`, {
    method: 'POST',
    headers: { ...csrfHeaders, cookie: user1Cookie }
  });
  assert.equal(subRes.status, 201);
  assert.equal((await subRes.json()).subscribed, true);

  const checkSub = await fetch(`${baseUrl}/api/notifications/issues/42/subscribe`, { headers: { cookie: user1Cookie } }).then((r) => r.json());
  assert.equal(checkSub.subscribed, true);

  const unsubRes = await fetch(`${baseUrl}/api/notifications/issues/42/subscribe`, {
    method: 'DELETE',
    headers: { ...csrfHeaders, cookie: user1Cookie }
  });
  assert.equal(unsubRes.status, 200);

  const afterUnsub = await fetch(`${baseUrl}/api/notifications/issues/42/subscribe`, { headers: { cookie: user1Cookie } }).then((r) => r.json());
  assert.equal(afterUnsub.subscribed, false);
});
