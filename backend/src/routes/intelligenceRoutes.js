const express = require('express');

const router = express.Router();

const {
  getPriorityIssuesController,
  getImpactIssuesController
} = require('../controllers/intelligenceController');

// GET /api/intelligence/priorities
router.get(
  '/intelligence/priorities',
  getPriorityIssuesController
);

// GET /api/intelligence/impact
router.get(
  '/intelligence/impact',
  getImpactIssuesController
);

module.exports = router;