const express = require('express');
const path = require('path');
const pool = require('../config/db');
const { uploadDir } = require('../config/upload');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/uploads/:fileName', authenticate, async (req, res) => {
  const { fileName } = req.params;
  const allowedExtension = /\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i;
  if (!fileName || path.basename(fileName) !== fileName || !allowedExtension.test(fileName)) {
    return res.status(404).json({ success: false, message: 'Evidence file not found.' });
  }

  try {
    const isAdmin = req.user.role === 'admin';
    const query = `
      SELECT e.file_path
      FROM issue_evidence e
      INNER JOIN issues i ON i.id = e.issue_id
      WHERE e.file_path = $1
        AND ($2::boolean OR i.reporter_user_id = $3)
      LIMIT 1;
    `;
    const result = await pool.query(query, [`/uploads/${fileName}`, isAdmin, req.user.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Evidence file not found.' });

    return res.sendFile(fileName, {
      root: uploadDir,
      headers: {
        'Cache-Control': 'private, no-store',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode === 404 ? 404 : 500).json({ success: false, message: 'Evidence file could not be served.' });
    });
  } catch (error) {
    console.error('Evidence authorization failed:', error.code || error.name);
    return res.status(503).json({ success: false, message: 'Evidence service is temporarily unavailable.' });
  }
});

module.exports = router;
