const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const {
  getPriorityIssuesController,
  getImpactIssuesController
} = require('../controllers/intelligenceController');

// GET /api/intelligence/priorities
router.get(
  '/intelligence/priorities',
  authenticate,
  requireRole('admin'),
  getPriorityIssuesController
);

// GET /api/intelligence/impact
router.get(
  '/intelligence/impact',
  authenticate,
  requireRole('admin'),
  getImpactIssuesController
);

module.exports = router;
