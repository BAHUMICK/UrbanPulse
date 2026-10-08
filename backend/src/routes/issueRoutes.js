const express = require('express');

const router = express.Router();
const { upload } = require('../config/upload');

const {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssueStatus
} = require('../controllers/issueController');

// Multer upload wrapper with clean error responses
const handleEvidenceUpload = (req, res, next) => {
  upload.array('evidence', 5)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Evidence file is too large. Maximum allowed size is 50MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error processing uploaded evidence.'
      });
    }
    next();
  });
};

// GET /api/issues
router.get('/issues', getAllIssues);

// GET /api/issues/:id
router.get('/issues/:id', getIssueById);

// POST /api/issues (accepts JSON or multipart/form-data with optional evidence files)
router.post('/issues', handleEvidenceUpload, createIssue);

// PUT /api/issues/:id/status
router.put(
  '/issues/:id/status',
  updateIssueStatus
);

module.exports = router;