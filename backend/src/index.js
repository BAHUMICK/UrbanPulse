const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const healthRoutes = require('./routes/healthRoutes');
const issueRoutes = require('./routes/issueRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const { csrfProtection } = require('./middleware/auth');
const evidenceRoutes = require('./routes/evidenceRoutes');
const { parseAllowedOrigins, isAllowedOrigin } = require('./config/corsPolicy');

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Core Middlewares
const allowedOrigins = parseAllowedOrigins();
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for evidence media (photos & videos)
// Evidence now requires a session and an owner/admin authorization check at /api/uploads/:fileName.
// Keep the former public path unavailable so older URLs cannot bypass authorization.
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Evidence file '${path.basename(req.path)}' not found on server storage.`
  });
});

// API Routes
app.use('/api/auth', csrfProtection, authRoutes);
app.use('/api', csrfProtection);
app.use('/api', healthRoutes);
app.use('/api', issueRoutes);
app.use('/api', intelligenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api', evidenceRoutes);

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'This website is not authorized to access the API.' });
  }

  console.error('Unhandled server error:', err.code || err.name);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Evidence file is too large. Maximum allowed size is 50MB.',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start the HTTP server only when launched directly; tests can import the app.
const server = require.main === module
  ? app.listen(PORT, () => {
    console.log(`UrbanPulse backend server is running on http://localhost:${PORT}`);
  })
  : null;

module.exports = { app, server };
