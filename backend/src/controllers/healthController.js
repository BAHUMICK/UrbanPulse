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
  const safeInfo = pool.safeDiagnostics || {};
  console.error('Database connection error in /api/health:', {
    name: err.name,
    code: err.code,
    message: err.message,
    detail: err.detail,
    severity: err.severity,
    nestedErrors: Array.isArray(err.errors)
      ? err.errors.map((e) => ({ code: e.code, address: e.address, port: e.port }))
      : undefined,
    connectionMode: safeInfo.connectionMode,
    targetHost: safeInfo.targetHost,
    targetPort: safeInfo.targetPort,
    targetDatabase: safeInfo.targetDatabase,
    sslEnabled: safeInfo.sslEnabled,
  });

  return res.status(503).json({
    status: 'DOWN',
    message: 'Backend server is running, but database connection failed',
    timestamp: new Date().toISOString()
  });
}

};

module.exports = { getHealth };
