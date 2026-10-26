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
router.get('/', getAllAlerts);

/**
 * GET /api/alerts/active
 */
router.get('/active', getActiveAlerts);

/**
 * PUT /api/alerts/:id/status
 */
router.put('/:id/status', authenticate, requireRole('admin'), updateAlertStatus);

module.exports = router;
