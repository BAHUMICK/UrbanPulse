const pool = require('../config/db');

/**
 * GET /api/notifications
 * Returns authenticated user's in-app notifications (newest first).
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT n.id, n.issue_id, n.notification_type, n.message, n.is_read, n.created_at,
              i.title AS issue_title, i.category AS issue_category, i.status AS issue_status, i.severity AS issue_severity
       FROM user_notifications n
       LEFT JOIN issues i ON i.id = n.issue_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    // If migration hasn't run yet, fail gracefully with an empty list
    if (error.code === '42P01') {
      return res.status(200).json({ success: true, data: [] });
    }
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
}

/**
 * GET /api/notifications/unread-count
 * Fast endpoint for badge rendering in header and telemetry.
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT count(*)::int AS unread_count
       FROM user_notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: result.rows[0]?.unread_count || 0
    });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(200).json({ success: true, unreadCount: 0 });
    }
    console.error('Error fetching unread notification count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to count unread notifications.'
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read. Enforces user ownership.
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const result = await pool.query(
      `UPDATE user_notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification state.'
    });
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Marks all notifications for the authenticated user as read.
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await pool.query(
      `UPDATE user_notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.'
    });
  }
}

/**
 * POST /api/notifications/issues/:issueId/subscribe
 * Explicitly follows an infrastructure issue.
 */
async function subscribeToIssue(req, res) {
  try {
    const userId = req.user.id;
    const issueId = Number(req.params.issueId);

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid issue ID.' });
    }

    // Verify issue exists
    const issueCheck = await pool.query('SELECT id FROM issues WHERE id = $1', [issueId]);
    if (issueCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Infrastructure issue not found.' });
    }

    await pool.query(
      `INSERT INTO issue_subscriptions (issue_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (issue_id, user_id) DO NOTHING`,
      [issueId, userId]
    );

    return res.status(201).json({
      success: true,
      subscribed: true,
      message: 'Successfully subscribed to issue resolution updates.'
    });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(503).json({ success: false, message: 'Subscription system is not initialized.' });
    }
    console.error('Error subscribing to issue:', error);
    return res.status(500).json({ success: false, message: 'Failed to subscribe to issue.' });
  }
}

/**
 * DELETE /api/notifications/issues/:issueId/subscribe
 * Unsubscribes from an issue's updates.
 */
async function unsubscribeFromIssue(req, res) {
  try {
    const userId = req.user.id;
    const issueId = Number(req.params.issueId);

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid issue ID.' });
    }

    await pool.query(
      'DELETE FROM issue_subscriptions WHERE issue_id = $1 AND user_id = $2',
      [issueId, userId]
    );

    return res.status(200).json({
      success: true,
      subscribed: false,
      message: 'Successfully unsubscribed from issue updates.'
    });
  } catch (error) {
    console.error('Error unsubscribing from issue:', error);
    return res.status(500).json({ success: false, message: 'Failed to unsubscribe from issue.' });
  }
}

/**
 * GET /api/notifications/issues/:issueId/subscribe
 * Checks whether the current user is subscribed to an issue.
 */
async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.user.id;
    const issueId = Number(req.params.issueId);

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid issue ID.' });
    }

    const result = await pool.query(
      'SELECT 1 FROM issue_subscriptions WHERE issue_id = $1 AND user_id = $2',
      [issueId, userId]
    );

    return res.status(200).json({
      success: true,
      subscribed: result.rows.length > 0
    });
  } catch (error) {
    if (error.code === '42P01') {
      return res.status(200).json({ success: true, subscribed: false });
    }
    console.error('Error checking subscription status:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify subscription status.' });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToIssue,
  unsubscribeFromIssue,
  getSubscriptionStatus
};
