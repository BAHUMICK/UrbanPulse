const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const SECURE_SSL_MODES = new Set(['prefer', 'require', 'verify-ca', 'verify-full']);

function readPemFile(filePath, description) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    throw new Error(`Unable to read the configured PostgreSQL ${description} file.`);
  }
}

function normalizePem(pem) {
  return pem.replace(/\\n/g, '\n').trim();
}

function buildPoolConfig(environment = process.env) {
  const isExplicitlyDisabled = environment.DB_SSL === 'false';
  const isExplicitlyEnabled = environment.DB_SSL === 'true';
  const databaseUrl = environment.DATABASE_URL || '';
  const caFromEnvironment = environment.DB_SSL_CA || '';
  const caFileFromEnvironment = environment.DB_SSL_CA_PATH || '';

  if (caFromEnvironment && caFileFromEnvironment) {
    throw new Error('Set only one of DB_SSL_CA or DB_SSL_CA_PATH.');
  }

  let isRemoteHost = false;
  let safeTargetHost = 'localhost';
  let safeTargetPort = 5432;
  let safeTargetDb = 'urbanpulse';
  let connectionMode = 'DISCRETE_PARAMS';
  let normalizedDatabaseUrl = '';
  let sslModeFromUrl = '';
  let sslFlagFromUrl = '';
  let caFromUrl = '';
  let clientCertificate = '';
  let clientKey = '';
  let clientKeyPassphrase = '';
  let usesUrlTlsFileOptions = false;

  if (databaseUrl) {
    connectionMode = 'DATABASE_URL';
    let parsedUrl;
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
    }

    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
      throw new Error('DATABASE_URL must use the postgres or postgresql protocol.');
    }

    safeTargetHost = parsedUrl.hostname || 'unknown';
    safeTargetPort = parseInt(parsedUrl.port, 10) || 5432;
    safeTargetDb = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'postgres';
    isRemoteHost = !['localhost', '127.0.0.1', '::1'].includes(safeTargetHost);

    sslModeFromUrl = (parsedUrl.searchParams.get('sslmode') || '').toLowerCase();
    sslFlagFromUrl = (parsedUrl.searchParams.get('ssl') || '').toLowerCase();
    const supportedSslFlags = new Set(['', 'true', '1', 'false', '0']);
    if (!supportedSslFlags.has(sslFlagFromUrl)) {
      throw new Error('DATABASE_URL has an unsupported ssl parameter.');
    }
    if (sslModeFromUrl === 'no-verify') {
      throw new Error('DATABASE_URL sslmode=no-verify is not allowed.');
    }
    if (sslModeFromUrl && !['disable', ...SECURE_SSL_MODES].includes(sslModeFromUrl)) {
      throw new Error('DATABASE_URL has an unsupported sslmode.');
    }

    const urlDisablesSsl = sslModeFromUrl === 'disable' || ['false', '0'].includes(sslFlagFromUrl);
    const urlEnablesSsl = SECURE_SSL_MODES.has(sslModeFromUrl) || ['true', '1'].includes(sslFlagFromUrl);
    if ((isRemoteHost && (isExplicitlyDisabled || urlDisablesSsl)) || (isExplicitlyEnabled && urlDisablesSsl) || (isExplicitlyDisabled && urlEnablesSsl)) {
      throw new Error('PostgreSQL TLS settings conflict or disable TLS for a remote database.');
    }

    caFromUrl = parsedUrl.searchParams.get('sslrootcert') || '';
    const clientCertificatePath = parsedUrl.searchParams.get('sslcert') || '';
    const clientKeyPath = parsedUrl.searchParams.get('sslkey') || '';
    clientKeyPassphrase = parsedUrl.searchParams.get('sslpassword') || '';
    usesUrlTlsFileOptions = Boolean(caFromUrl || clientCertificatePath || clientKeyPath || clientKeyPassphrase);

    if (isExplicitlyDisabled && usesUrlTlsFileOptions) {
      throw new Error('DATABASE_URL TLS certificate options conflict with DB_SSL=false.');
    }

    if ((caFromEnvironment || caFileFromEnvironment) && usesUrlTlsFileOptions) {
      throw new Error('Use DB_SSL_CA or DB_SSL_CA_PATH instead of TLS certificate file options in DATABASE_URL.');
    }

    if (caFromUrl) caFromUrl = readPemFile(caFromUrl, 'root CA');
    if (clientCertificatePath) clientCertificate = readPemFile(clientCertificatePath, 'client certificate');
    if (clientKeyPath) clientKey = readPemFile(clientKeyPath, 'client key');

    // pg parses sslmode after pool options and can replace the ssl object. Remove
    // these transport flags after validating them so only our strict TLS config
    // controls certificate verification.
    for (const key of ['sslmode', 'ssl', 'uselibpqcompat', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword']) {
      parsedUrl.searchParams.delete(key);
    }
    normalizedDatabaseUrl = parsedUrl.toString();
  } else {
    safeTargetHost = environment.DB_HOST || 'localhost';
    safeTargetPort = parseInt(environment.DB_PORT, 10) || 5432;
    safeTargetDb = environment.DB_NAME || 'urbanpulse';
    isRemoteHost = Boolean(environment.DB_HOST && !['localhost', '127.0.0.1', '::1'].includes(environment.DB_HOST));
    if (isRemoteHost && isExplicitlyDisabled) {
      throw new Error('DB_SSL=false is not allowed for a remote PostgreSQL database.');
    }
  }

  const caFromEnv = caFromEnvironment
    ? normalizePem(caFromEnvironment)
    : caFileFromEnvironment
      ? readPemFile(caFileFromEnvironment, 'CA')
      : '';
  const hasCustomCa = Boolean(caFromEnv || caFromUrl);
  const useSsl = !isExplicitlyDisabled && (isExplicitlyEnabled || isRemoteHost || Boolean(sslModeFromUrl && SECURE_SSL_MODES.has(sslModeFromUrl)) || ['true', '1'].includes(sslFlagFromUrl) || hasCustomCa || usesUrlTlsFileOptions);

  if ((caFromEnvironment || caFileFromEnvironment) && !useSsl) {
    throw new Error('PostgreSQL CA configuration requires TLS; do not set DB_SSL=false.');
  }

  const ssl = useSsl
    ? {
        rejectUnauthorized: true,
        ...(hasCustomCa ? { ca: [caFromEnv, caFromUrl].filter(Boolean).join('\n') } : {}),
        ...(clientCertificate ? { cert: clientCertificate } : {}),
        ...(clientKey ? { key: clientKey } : {}),
        ...(clientKeyPassphrase ? { passphrase: clientKeyPassphrase } : {}),
      }
    : undefined;

  const poolConfig = normalizedDatabaseUrl
    ? {
        connectionString: normalizedDatabaseUrl,
        ...(ssl ? { ssl } : {}),
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10,
      }
    : {
        host: safeTargetHost,
        port: safeTargetPort,
        user: environment.DB_USER || 'postgres',
        password: environment.DB_PASSWORD || environment.PGPASSWORD,
        database: safeTargetDb,
        ...(ssl ? { ssl } : {}),
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10,
      };

  return {
    poolConfig,
    safeDiagnostics: {
      connectionMode,
      targetHost: safeTargetHost,
      targetPort: safeTargetPort,
      targetDatabase: safeTargetDb,
      sslEnabled: useSsl,
    },
  };
}

const { poolConfig, safeDiagnostics } = buildPoolConfig();
const pool = new Pool(poolConfig);

// Safe, non-secret diagnostic metadata (no credentials or passwords)
pool.safeDiagnostics = safeDiagnostics;
pool.buildPoolConfig = buildPoolConfig;

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
