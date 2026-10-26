const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { uploadDir } = require('./config/upload');

const healthRoutes = require('./routes/healthRoutes');
const issueRoutes = require('./routes/issueRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const { csrfProtection } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// Core Middlewares
const defaultOrigins = process.env.NODE_ENV === 'production'
  ? ['https://urbanpulse-three.vercel.app']
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://urbanpulse-three.vercel.app'];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads for evidence media (photos & videos)
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', csrfProtection, authRoutes);
app.use('/api', csrfProtection);
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
