const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');

const healthRoutes = require('./routes/healthRoutes');
const issueRoutes = require('./routes/issueRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for evidence media (photos & videos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', healthRoutes);
app.use('/api', issueRoutes);
app.use('/api', intelligenceRoutes);
app.use('/api/alerts', alertRoutes);

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Evidence file is too large. Maximum allowed size is 50MB.',
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(
    `UrbanPulse backend server is running on http://localhost:${PORT}`
  );
});

module.exports = { app, server };