const pool = require('../config/db');

/**
 * GET /api/health
 * Verifies backend health and active connectivity to the PostgreSQL database.
 */
const getHealth = async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() AS current_time');
    return res.status(200).json({
      status: 'UP',
      message: 'UrbanPulse API is active and connected to PostgreSQL',
      databaseTime: dbResult.rows[0].current_time,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Database connection error in /api/health:', err.message);
    return res.status(503).json({
      status: 'DOWN',
      message: 'Backend server is running, but database connection failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { getHealth };
