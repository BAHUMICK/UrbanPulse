const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToIssue,
  unsubscribeFromIssue,
  getSubscriptionStatus
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All notification and subscription operations require authentication
router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

// Explicit Issue Following (Subscriptions)
router.post('/issues/:issueId/subscribe', subscribeToIssue);
router.delete('/issues/:issueId/subscribe', unsubscribeFromIssue);
router.get('/issues/:issueId/subscribe', getSubscriptionStatus);

module.exports = router;
