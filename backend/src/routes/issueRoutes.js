const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const router = express.Router();
const { upload, uploadDir } = require('../config/upload');
const { authenticate, requireRole } = require('../middleware/auth');

async function hasValidSignature(file) {
  const handle = await fs.open(file.path, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const head = buffer.subarray(0, bytesRead);
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    if (ext === '.png') return head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (ext === '.webp') return head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
    if (['.mp4', '.mov'].includes(ext)) return head.length >= 8 && head.toString('ascii', 4, 8) === 'ftyp';
    if (ext === '.webm') return head.length >= 4 && head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    return false;
  } finally {
    await handle.close();
  }
}

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
      console.error('Evidence upload rejected:', err);
      return res.status(400).json({
        success: false,
        message: 'Evidence upload is invalid or could not be processed.'
      });
    }
    (async () => {
      try {
        const files = req.files || [];
        const valid = await Promise.all(files.map(hasValidSignature));
        if (valid.some((isValid) => !isValid)) {
          await Promise.all(files.map((file) => fs.unlink(path.join(uploadDir, path.basename(file.filename))).catch(() => {})));
          return res.status(400).json({ success: false, message: 'Evidence file content does not match its supported file type.' });
        }
        next();
      } catch (validationError) {
        console.error('Evidence validation failed:', validationError);
        await Promise.all((req.files || []).map((file) => fs.unlink(path.join(uploadDir, path.basename(file.filename))).catch(() => {})));
        return res.status(500).json({ success: false, message: 'Failed to validate evidence files.' });
      }
    })();
  });
};

// Issue reads require a session. Citizens receive only their owned reports;
// administrators receive the city-wide incident set.
router.get('/issues', authenticate, requireRole('citizen', 'admin'), getAllIssues);

router.get('/issues/:id', authenticate, requireRole('citizen', 'admin'), getIssueById);

// POST /api/issues (accepts JSON or multipart/form-data with optional evidence files)
router.post('/issues', authenticate, requireRole('citizen', 'admin'), handleEvidenceUpload, createIssue);

// PUT /api/issues/:id/status
router.put(
  '/issues/:id/status',
  authenticate,
  requireRole('admin'),
  updateIssueStatus
);

module.exports = router;
