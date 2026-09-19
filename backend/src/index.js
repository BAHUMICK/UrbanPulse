const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/healthRoutes');
const issueRoutes = require('./routes/issueRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api', issueRoutes);
app.use('/api', intelligenceRoutes);

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