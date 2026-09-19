const express = require('express');

const router = express.Router();

const {
  getAllIssues,
  createIssue,
  updateIssueStatus
} = require('../controllers/issueController');

// GET /api/issues
router.get('/issues', getAllIssues);

// POST /api/issues
router.post('/issues', createIssue);

// PUT /api/issues/:id/status
router.put(
  '/issues/:id/status',
  updateIssueStatus
);

module.exports = router;