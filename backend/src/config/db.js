const { Pool } = require('pg');
require('dotenv').config();

// Determine SSL requirement safely:
// Enabled if DB_SSL is true, or if connecting to a remote host (via DATABASE_URL or DB_HOST) unless DB_SSL is explicitly 'false'.
const isExplicitlyDisabled = process.env.DB_SSL === 'false';
const isExplicitlyEnabled = process.env.DB_SSL === 'true';

let isRemoteHost = false;
let safeTargetHost = 'localhost';
let safeTargetPort = 5432;
let safeTargetDb = 'urbanpulse';
let connectionMode = 'DISCRETE_PARAMS';

if (process.env.DATABASE_URL) {
  connectionMode = 'DATABASE_URL';
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    safeTargetHost = parsed.hostname || 'unknown';
    safeTargetPort = parseInt(parsed.port, 10) || 5432;
    safeTargetDb = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'postgres';
    isRemoteHost = !['localhost', '127.0.0.1'].includes(safeTargetHost);
  } catch {
    isRemoteHost = !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');
  }
} else {
  safeTargetHost = process.env.DB_HOST || 'localhost';
  safeTargetPort = parseInt(process.env.DB_PORT, 10) || 5432;
  safeTargetDb = process.env.DB_NAME || 'urbanpulse';
  isRemoteHost = Boolean(process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));
}

const useSsl = !isExplicitlyDisabled && (isExplicitlyEnabled || isRemoteHost);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    }
  : {
      host: safeTargetHost,
      port: safeTargetPort,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
      database: safeTargetDb,
      ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    };

// Initialize PostgreSQL Connection Pool using environment variables
const pool = new Pool(poolConfig);

// Safe, non-secret diagnostic metadata (no credentials or passwords)
const safeDiagnostics = {
  connectionMode,
  targetHost: safeTargetHost,
  targetPort: safeTargetPort,
  targetDatabase: safeTargetDb,
  sslEnabled: useSsl,
};

// Log any unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', {
    name: err.name,
    code: err.code,
    message: err.message,
    ...safeDiagnostics,
  });
});

module.exports = pool;
module.exports.safeDiagnostics = safeDiagnostics;
