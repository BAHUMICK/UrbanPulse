const express = require('express');

const {
  getAllAlerts,
  getActiveAlerts,
  updateAlertStatus
} = require('../controllers/alertController');

const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/alerts
 */
router.get('/', authenticate, requireRole('admin'), getAllAlerts);

/**
 * GET /api/alerts/active
 */
router.get('/active', authenticate, requireRole('admin'), getActiveAlerts);

/**
 * PUT /api/alerts/:id/status
 */
router.put('/:id/status', authenticate, requireRole('admin'), updateAlertStatus);

module.exports = router;
