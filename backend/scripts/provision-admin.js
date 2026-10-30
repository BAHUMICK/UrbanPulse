/**
 * UrbanPulse - Administrative Account Provisioning Utility
 *
 * Securely creates or verifies administrator accounts using the platform's
 * canonical scrypt password hashing mechanism without exposing credentials.
 *
 * Safe diagnostics display target host, port, database, SSL status, and table
 * presence without leaking credentials, passwords, or raw connection strings.
 *
 * Usage:
 *   node backend/scripts/provision-admin.js <email> --check-only
 *   node backend/scripts/provision-admin.js <email> --database-url="<postgresql-url>" --check-only
 *   ADMIN_PASSWORD="<secret>" node backend/scripts/provision-admin.js <email>
 *   node backend/scripts/provision-admin.js <email> --password="<secret>"
 *   node backend/scripts/provision-admin.js <email> --confirm-role-change --password="<secret>"
 *   node backend/scripts/provision-admin.js <email> --env-file=".env.production"
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const defaultPool = require('../src/config/db');
const { hashPassword } = require('../src/controllers/authController');

const { buildPoolConfig } = defaultPool;

const PASSWORD_BYTES_MIN = 12;
const PASSWORD_BYTES_MAX = 128;
const REQUIRED_TABLES = [
  'app_users',
  'auth_sessions',
  'issues',
  'alerts',
  'issue_evidence',
  'user_notifications',
  'issue_subscriptions',
];
const TLS_ERROR_CODES = new Set([
  'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID', 'ERR_TLS_CERT_ALTNAME_INVALID',
]);
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'EHOSTUNREACH',
  'EPIPE', 'EAI_AGAIN', '57P03', '28P01', '3D000',
  ...TLS_ERROR_CODES,
]);

function safeErrorCode(error) {
  const code = error?.code;
  return typeof code === 'string' && (TLS_ERROR_CODES.has(code) || /^[A-Z0-9]{5}$/.test(code) || /^E[A-Z0-9_]{1,32}$/.test(code))
    ? code
    : null;
}

function getSafeCheckDiagnostic(error) {
  const allowedCategories = new Set([
    'database_configuration', 'database_connection', 'missing_tables',
    'schema_inconclusive', 'unexpected',
  ]);
  const supplied = error?.provisioningDiagnostic;
  const category = allowedCategories.has(supplied?.category) ? supplied.category : null;
  const code = safeErrorCode(error) || safeErrorCode({ code: supplied?.code });

  if (category) {
    const diagnostic = { category };
    if (code) diagnostic.code = code;
    const stage = ['schema_inspection', 'account_lookup'].includes(supplied?.stage)
      ? supplied.stage
      : null;
    if (stage) diagnostic.stage = stage;
    if (category === 'missing_tables') {
      diagnostic.missingTables = Array.isArray(supplied.missingTables)
        ? supplied.missingTables.filter((table) => REQUIRED_TABLES.includes(table))
        : [];
    }
    return diagnostic;
  }

  if (code && (CONNECTION_ERROR_CODES.has(code) || code.startsWith('08'))) {
    return { category: 'database_connection', code };
  }
  if (code === '42P01') return { category: 'missing_tables', code, missingTables: [] };
  if (code && /^[A-Z0-9]{5}$/.test(code)) return { category: 'schema_inconclusive', code };
  return { category: 'unexpected' };
}

function getSafeAccountStatus(result) {
  const status = ['NOT_FOUND', 'EXISTS', 'EXISTS_ADMIN', 'ROLE_CHANGE_BLOCKED'].includes(result?.status)
    ? result.status
    : 'UNKNOWN';
  const role = ['admin', 'citizen'].includes(result?.user?.role) ? result.user.role : 'unknown';
  return { status, role };
}

function parseArgs(argv) {
  const flags = {
    email: null,
    checkOnly: false,
    confirmRoleChange: false,
    databaseUrl: null,
    envFile: null,
    password: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check-only') {
      flags.checkOnly = true;
    } else if (arg === '--confirm-role-change') {
      flags.confirmRoleChange = true;
    } else if (arg.startsWith('--database-url=')) {
      flags.databaseUrl = arg.slice('--database-url='.length);
    } else if (arg === '--database-url' && i + 1 < argv.length) {
      flags.databaseUrl = argv[++i];
    } else if (arg.startsWith('--env-file=')) {
      flags.envFile = arg.slice('--env-file='.length);
    } else if (arg === '--env-file' && i + 1 < argv.length) {
      flags.envFile = argv[++i];
    } else if (arg.startsWith('--password=')) {
      flags.password = arg.slice('--password='.length);
    } else if (arg === '--password' && i + 1 < argv.length) {
      flags.password = argv[++i];
    } else if (!arg.startsWith('--') && !flags.email) {
      flags.email = arg;
    }
  }

  return flags;
}

function resolveConfig(args, baseEnv = process.env) {
  const env = { ...baseEnv };
  let configSource = 'process.env';

  if (args.envFile) {
    const resolvedPath = path.isAbsolute(args.envFile)
      ? args.envFile
      : path.resolve(process.cwd(), args.envFile);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Specified environment file does not exist: ${args.envFile}`);
    }
    const envFileContent = fs.readFileSync(resolvedPath, 'utf8');
    const parsed = dotenv.parse(envFileContent);
    Object.assign(env, parsed);
    configSource = `--env-file (${args.envFile})`;
  } else {
    const defaultEnvPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(defaultEnvPath)) {
      const defaultEnvContent = fs.readFileSync(defaultEnvPath, 'utf8');
      const defaultParsed = dotenv.parse(defaultEnvContent);
      for (const [key, val] of Object.entries(defaultParsed)) {
        if (env[key] === undefined) {
          env[key] = val;
        }
      }
      configSource = 'backend/.env';
    }
  }

  if (args.databaseUrl) {
    env.DATABASE_URL = args.databaseUrl;
    configSource = '--database-url argument';
    if (env.DB_SSL === 'false') {
      delete env.DB_SSL;
    }
  } else if (baseEnv.DATABASE_URL) {
    env.DATABASE_URL = baseEnv.DATABASE_URL;
    configSource = 'DATABASE_URL environment variable';
    if (env.DB_SSL === 'false' && baseEnv.DB_SSL === undefined) {
      delete env.DB_SSL;
    }
  } else if (env.DATABASE_URL) {
    configSource = `${configSource} (DATABASE_URL)`;
    if (env.DB_SSL === 'false') {
      delete env.DB_SSL;
    }
  } else {
    configSource = `${configSource} (discrete parameters)`;
  }

  const password = args.password || baseEnv.ADMIN_PASSWORD || env.ADMIN_PASSWORD || '';

  return { env, configSource, password };
}

async function verifyDatabaseTables(queryable) {
  const result = await queryable.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );

  const existingSet = new Set(result.rows.map((r) => r.table_name));
  const tableStatus = {};
  for (const table of REQUIRED_TABLES) {
    tableStatus[table] = existingSet.has(table);
  }

  return {
    tableStatus,
    hasUsersTable: Boolean(tableStatus['app_users']),
    allTablesPresent: REQUIRED_TABLES.every((t) => tableStatus[t]),
  };
}

async function provisionAdmin(options = {}) {
  const {
    argv = process.argv.slice(2),
    baseEnv = process.env,
    injectedPool = null,
    logger = console,
    exitOnError = (require.main === module),
  } = options;

  const args = parseArgs(argv);

  const handleError = (message, code = 1, provisioningDiagnostic = null) => {
    logger.error(message);
    if (exitOnError) {
      process.exit(code);
    }
    const err = new Error(typeof message === 'string' ? message : message.message || 'Provisioning error');
    err.code = code;
    if (provisioningDiagnostic) err.provisioningDiagnostic = provisioningDiagnostic;
    throw err;
  };

  if (!args.email) {
    logger.error('Error: Administrator email address is required.');
    logger.error('Usage: node backend/scripts/provision-admin.js <email> [--check-only] [--confirm-role-change] [--database-url=<url>] [--env-file=<path>] [--password=<pass>]');
    if (exitOnError) process.exit(1);
    throw new Error('Administrator email address is required.');
  }

  const normalizedEmail = args.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return handleError('Error: Invalid email format.');
  }

  let poolConfig;
  let safeDiagnostics;
  let configSource = 'injected';
  let password = '';

  try {
    const resolved = resolveConfig(args, baseEnv);
    configSource = resolved.configSource;
    password = resolved.password;

    const built = buildPoolConfig(resolved.env);
    poolConfig = built.poolConfig;
    safeDiagnostics = built.safeDiagnostics;
  } catch (err) {
    return handleError('Database configuration is missing or invalid.', 1, { category: 'database_configuration' });
  }

  // Display safe, non-secret connection diagnostics
  logger.log('--- PostgreSQL Connection Diagnostics ---');
  logger.log(`Target Host:     ${safeDiagnostics.targetHost}`);
  logger.log(`Target Port:     ${safeDiagnostics.targetPort}`);
  logger.log(`Target Database: ${safeDiagnostics.targetDatabase}`);
  logger.log(`Connection Mode: ${safeDiagnostics.connectionMode}`);
  logger.log(`TLS / SSL:       ${safeDiagnostics.sslEnabled ? 'Enabled (verified)' : 'Disabled'}`);
  logger.log(`Config Source:   ${configSource}`);
  logger.log('-----------------------------------------');

  let pool = injectedPool;
  const shouldClosePool = !injectedPool;

  if (!pool) {
    pool = new Pool(poolConfig);
  }

  try {
    // 1. Verify schema tables in target database
    let schemaCheck;
    try {
      schemaCheck = await verifyDatabaseTables(pool);
    } catch (dbErr) {
      const diagnostic = getSafeCheckDiagnostic(dbErr);
      const category = diagnostic.category === 'database_connection' ? 'database_connection' : 'schema_inconclusive';
      return handleError('Could not inspect the required database schema.', 1, {
        category,
        code: diagnostic.code,
        stage: 'schema_inspection',
      });
    }

    logger.log('Database Schema Verification:');
    for (const [table, present] of Object.entries(schemaCheck.tableStatus)) {
      logger.log(`  - ${table.padEnd(24)}: ${present ? 'PRESENT' : 'MISSING'}`);
    }

    if (!schemaCheck.hasUsersTable) {
      logger.error(`\nError: Table "app_users" does not exist in target database (${safeDiagnostics.targetHost}:${safeDiagnostics.targetPort}/${safeDiagnostics.targetDatabase}).`);
      if (['localhost', '127.0.0.1', '::1'].includes(safeDiagnostics.targetHost)) {
        logger.error('Notice: You are currently connected to a LOCAL PostgreSQL instance.');
        logger.error('If you intended to target your Supabase hosted database, pass your connection string via:');
        logger.error(`  node backend/scripts/provision-admin.js ${normalizedEmail} --database-url="<SUPABASE_POSTGRES_URL>"${args.checkOnly ? ' --check-only' : ''}`);
        logger.error('or set the DATABASE_URL environment variable.');
        logger.error('If you intended to target this local instance, initialize the schema first using database/supabase_migration.sql.');
      } else {
        logger.error(`Ensure database migrations (database/supabase_migration.sql) have been executed on ${safeDiagnostics.targetHost}.`);
      }
      return handleError('Required authentication table is missing.', 1, { category: 'missing_tables', missingTables: ['app_users'] });
    }

    if (!schemaCheck.allTablesPresent) {
      const missingTables = Object.entries(schemaCheck.tableStatus)
        .filter(([, present]) => !present)
        .map(([table]) => table);
      return handleError('One or more required tables are missing.', 1, { category: 'missing_tables', missingTables });
    }

    // 2. Check existing account
    let existingResult;
    try {
      existingResult = await pool.query(
        'SELECT id, email, role, created_at FROM app_users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );
    } catch (dbErr) {
      const diagnostic = getSafeCheckDiagnostic(dbErr);
      const category = diagnostic.category === 'database_connection'
        ? 'database_connection'
        : diagnostic.category === 'missing_tables'
          ? 'missing_tables'
          : 'schema_inconclusive';
      return handleError('Could not look up the requested account.', 1, {
        category,
        code: diagnostic.code,
        stage: 'account_lookup',
        ...(category === 'missing_tables' ? { missingTables: ['app_users'] } : {}),
      });
    }
    const existingUser = existingResult.rows[0];

    if (args.checkOnly) {
      if (existingUser) {
        logger.log(`User status for ${normalizedEmail}: EXISTS (Role: ${existingUser.role}, ID: ${existingUser.id})`);
      } else {
        logger.log(`User status for ${normalizedEmail}: NOT_FOUND`);
      }
      return { status: existingUser ? 'EXISTS' : 'NOT_FOUND', user: existingUser || null, safeDiagnostics, schemaCheck };
    }

    if (existingUser) {
      if (existingUser.role === 'admin') {
        logger.log(`Administrator account already exists for ${normalizedEmail} (ID: ${existingUser.id}, Role: admin).`);
        logger.log('No modification made to existing administrator account.');
        return { status: 'EXISTS_ADMIN', user: existingUser, safeDiagnostics };
      }

      // Existing user has citizen role
      if (!args.confirmRoleChange) {
        logger.warn(`Warning: User ${normalizedEmail} already exists with role "${existingUser.role}".`);
        logger.warn('Safety protection: Will not automatically alter existing account role without --confirm-role-change.');
        return { status: 'ROLE_CHANGE_BLOCKED', user: existingUser, safeDiagnostics };
      }

      // Explicitly confirmed role upgrade
      if (!password) {
        return handleError('Error: Password is required to update administrator credentials.');
      }

      const byteLength = Buffer.byteLength(password);
      if (byteLength < PASSWORD_BYTES_MIN || byteLength > PASSWORD_BYTES_MAX) {
        return handleError(`Error: Password length must be between ${PASSWORD_BYTES_MIN} and ${PASSWORD_BYTES_MAX} bytes.`);
      }

      const newHash = await hashPassword(password);

      // Perform atomic upgrade & session revocation inside transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          'UPDATE app_users SET role = $1, password_hash = $2 WHERE id = $3',
          ['admin', newHash, existingUser.id]
        );
        await client.query('DELETE FROM auth_sessions WHERE user_id = $1', [existingUser.id]);
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK').catch(() => {});
        throw txErr;
      } finally {
        client.release();
      }

      logger.log(`Successfully upgraded ${normalizedEmail} to administrator (ID: ${existingUser.id}).`);
      return { status: 'UPGRADED', user: { id: existingUser.id, email: normalizedEmail, role: 'admin' }, safeDiagnostics };
    }

    // Account does not exist, proceed with creation
    if (!password) {
      logger.error('Error: Password is required to create a new administrator account.');
      logger.error('Supply via ADMIN_PASSWORD environment variable or --password parameter.');
      return handleError('Missing password');
    }

    const byteLength = Buffer.byteLength(password);
    if (byteLength < PASSWORD_BYTES_MIN || byteLength > PASSWORD_BYTES_MAX) {
      return handleError(`Error: Password length must be between ${PASSWORD_BYTES_MIN} and ${PASSWORD_BYTES_MAX} bytes.`);
    }

    const passwordHash = await hashPassword(password);
    const insertResult = await pool.query(
      'INSERT INTO app_users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [normalizedEmail, passwordHash, 'admin']
    );

    const newUser = insertResult.rows[0];
    logger.log(`Administrator account provisioned successfully for ${newUser.email} (ID: ${newUser.id}, Role: ${newUser.role}).`);
    return { status: 'PROVISIONED', user: newUser, safeDiagnostics };
  } catch (error) {
    if (error.code === '42P01') {
      logger.error('Error: Table "app_users" does not exist in target database.');
      logger.error('Apply database/migrations/001_authentication.sql or database/supabase_migration.sql first.');
    } else {
      logger.error('Provisioning failed:', safeErrorCode(error) || 'unexpected error');
    }
    if (exitOnError) {
      process.exit(1);
    }
    throw error;
  } finally {
    if (shouldClosePool && pool) {
      await pool.end().catch(() => {});
    }
    if (defaultPool && typeof defaultPool.end === 'function') {
      await defaultPool.end().catch(() => {});
    }
  }
}

if (require.main === module) {
  provisionAdmin().catch(() => {
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  resolveConfig,
  verifyDatabaseTables,
  provisionAdmin,
  getSafeCheckDiagnostic,
  getSafeAccountStatus,
  PASSWORD_BYTES_MIN,
  PASSWORD_BYTES_MAX,
  REQUIRED_TABLES,
};
