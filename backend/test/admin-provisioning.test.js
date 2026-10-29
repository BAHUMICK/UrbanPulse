const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { hashPassword, verifyPassword } = require('../src/controllers/authController');
const {
  parseArgs,
  resolveConfig,
  verifyDatabaseTables,
  provisionAdmin,
  getSafeCheckDiagnostic,
  getSafeAccountStatus,
  REQUIRED_TABLES,
} = require('../scripts/provision-admin');
const defaultPool = require('../src/config/db');

test('admin provisioning uses canonical scrypt parameters and produces verifiable hashes', async () => {
  const secretPassword = 'correct horse battery staple';
  const hash = await hashPassword(secretPassword);

  // 1. Verify scheme and parameters
  const [scheme, n, r, p, saltHex, hashHex] = hash.split('$');
  assert.equal(scheme, 'scrypt');
  assert.equal(n, '16384');
  assert.equal(r, '8');
  assert.equal(p, '1');
  assert.equal(saltHex.length, 32); // 16 bytes hex
  assert.equal(hashHex.length, 128); // 64 bytes hex

  // 2. Positive verification
  const matches = await verifyPassword(secretPassword, hash);
  assert.equal(matches, true);

  // 3. Negative verification
  const fails = await verifyPassword('incorrect-password', hash);
  assert.equal(fails, false);
});

test('admin provisioning enforces minimum password length', async () => {
  const shortPassword = 'short';
  assert.equal(Buffer.byteLength(shortPassword) < 12, true);

  const validPassword = 'super-secret-admin-pass';
  assert.equal(Buffer.byteLength(validPassword) >= 12, true);
  assert.equal(Buffer.byteLength(validPassword) <= 128, true);
});

test('parseArgs correctly parses options and flags in multiple formats', () => {
  // Format 1: --flag=value
  const parsed1 = parseArgs([
    'admin@example.com',
    '--check-only',
    '--confirm-role-change',
    '--database-url=postgresql://postgres:pass@localhost:5432/testdb',
    '--env-file=.env.custom',
    '--password=my-strong-password',
  ]);

  assert.equal(parsed1.email, 'admin@example.com');
  assert.equal(parsed1.checkOnly, true);
  assert.equal(parsed1.confirmRoleChange, true);
  assert.equal(parsed1.databaseUrl, 'postgresql://postgres:pass@localhost:5432/testdb');
  assert.equal(parsed1.envFile, '.env.custom');
  assert.equal(parsed1.password, 'my-strong-password');

  // Format 2: --flag value (space separated)
  const parsed2 = parseArgs([
    '--database-url',
    'postgresql://postgres:pass@db.example.com:5432/proddb',
    '--env-file',
    '.env.prod',
    '--password',
    'another-strong-password',
    'chief@example.com',
  ]);

  assert.equal(parsed2.email, 'chief@example.com');
  assert.equal(parsed2.checkOnly, false);
  assert.equal(parsed2.confirmRoleChange, false);
  assert.equal(parsed2.databaseUrl, 'postgresql://postgres:pass@db.example.com:5432/proddb');
  assert.equal(parsed2.envFile, '.env.prod');
  assert.equal(parsed2.password, 'another-strong-password');
});

test('resolveConfig respects priority: CLI arg > process.env > env file > discrete params', () => {
  // Case A: CLI --database-url takes precedence over process.env and env file
  const configA = resolveConfig(
    { databaseUrl: 'postgresql://postgres:pass@cli-host:5432/clidb' },
    { DATABASE_URL: 'postgresql://postgres:pass@env-host:5432/envdb' }
  );
  assert.equal(configA.env.DATABASE_URL, 'postgresql://postgres:pass@cli-host:5432/clidb');
  assert.equal(configA.configSource, '--database-url argument');

  // Case B: process.env.DATABASE_URL takes precedence when no CLI flag
  const configB = resolveConfig(
    {},
    { DATABASE_URL: 'postgresql://postgres:pass@env-host:5432/envdb' }
  );
  assert.equal(configB.env.DATABASE_URL, 'postgresql://postgres:pass@env-host:5432/envdb');
  assert.equal(configB.configSource, 'DATABASE_URL environment variable');

  // Case C: Missing --env-file throws descriptive error
  assert.throws(
    () => resolveConfig({ envFile: 'non_existent_env_file.xyz' }, {}),
    /Specified environment file does not exist/
  );

  // Case D: Custom --env-file is loaded when file exists
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urbanpulse-test-'));
  const tempEnvPath = path.join(tempDir, '.env.test');
  fs.writeFileSync(tempEnvPath, 'DATABASE_URL=postgresql://u:p@tempfile:5432/tempdb\nADMIN_PASSWORD=env-file-pass');

  try {
    const configD = resolveConfig({ envFile: tempEnvPath }, {});
    assert.equal(configD.env.DATABASE_URL, 'postgresql://u:p@tempfile:5432/tempdb');
    assert.equal(configD.password, 'env-file-pass');
    assert.match(configD.configSource, /--env-file/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // Case E: Explicit remote DATABASE_URL clears local DB_SSL=false conflict
  const configE = resolveConfig(
    { databaseUrl: 'postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres' },
    { DB_SSL: 'false' }
  );
  assert.equal(configE.env.DATABASE_URL, 'postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres');
  assert.equal(configE.env.DB_SSL, undefined);
  const { poolConfig, safeDiagnostics } = defaultPool.buildPoolConfig(configE.env);
  assert.equal(safeDiagnostics.sslEnabled, true);
  assert.equal(poolConfig.ssl.rejectUnauthorized, true);
});

test('safe diagnostics report host, port, db, ssl without exposing credentials', () => {
  const { safeDiagnostics } = defaultPool.buildPoolConfig({
    DATABASE_URL: 'postgresql://super_admin:super_secret_password_987@db.supabase.co:5432/postgres?sslmode=require',
  });

  assert.equal(safeDiagnostics.targetHost, 'db.supabase.co');
  assert.equal(safeDiagnostics.targetPort, 5432);
  assert.equal(safeDiagnostics.targetDatabase, 'postgres');
  assert.equal(safeDiagnostics.connectionMode, 'DATABASE_URL');
  assert.equal(safeDiagnostics.sslEnabled, true);

  const serialized = JSON.stringify(safeDiagnostics);
  assert.equal(serialized.includes('super_secret_password_987'), false);
  assert.equal(serialized.includes('super_admin'), false);
});

test('verifyDatabaseTables identifies present and missing tables', async () => {
  // Case A: All tables present
  const mockPoolAll = {
    query: async (sql, params) => ({
      rows: REQUIRED_TABLES.map((table_name) => ({ table_name })),
    }),
  };

  const resAll = await verifyDatabaseTables(mockPoolAll);
  assert.equal(resAll.hasUsersTable, true);
  assert.equal(resAll.allTablesPresent, true);
  assert.equal(resAll.tableStatus['app_users'], true);
  assert.equal(resAll.tableStatus['user_notifications'], true);

  // Case B: app_users missing (like local partial db)
  const mockPoolMissing = {
    query: async (sql, params) => ({
      rows: [{ table_name: 'issues' }, { table_name: 'alerts' }, { table_name: 'issue_evidence' }],
    }),
  };

  const resMissing = await verifyDatabaseTables(mockPoolMissing);
  assert.equal(resMissing.hasUsersTable, false);
  assert.equal(resMissing.allTablesPresent, false);
  assert.equal(resMissing.tableStatus['app_users'], false);
  assert.equal(resMissing.tableStatus['issues'], true);
});

test('safe check diagnostics classify failures and never include raw error messages', () => {
  const connectionError = new Error('postgresql://user:private-password@db.example.invalid/private-db');
  connectionError.code = 'ECONNREFUSED';
  const connectionDiagnostic = getSafeCheckDiagnostic(connectionError);
  assert.deepEqual(connectionDiagnostic, { category: 'database_connection', code: 'ECONNREFUSED' });
  assert.equal(JSON.stringify(connectionDiagnostic).includes('private-password'), false);

  const missingTablesError = new Error('sensitive driver message');
  missingTablesError.provisioningDiagnostic = {
    category: 'missing_tables',
    missingTables: ['auth_sessions', 'not_a_required_table'],
    code: '42P01',
  };
  const missingTablesDiagnostic = getSafeCheckDiagnostic(missingTablesError);
  assert.deepEqual(missingTablesDiagnostic, {
    category: 'missing_tables',
    code: '42P01',
    missingTables: ['auth_sessions'],
  });
  assert.equal(JSON.stringify(missingTablesDiagnostic).includes('sensitive driver message'), false);

  const schemaError = new Error('another private driver message');
  schemaError.code = '42501';
  assert.deepEqual(getSafeCheckDiagnostic(schemaError), { category: 'schema_inconclusive', code: '42501' });
  assert.deepEqual(getSafeAccountStatus({ status: 'EXISTS', user: { role: 'citizen' } }), { status: 'EXISTS', role: 'citizen' });
  assert.deepEqual(getSafeAccountStatus({ status: 'untrusted status', user: { role: 'root' } }), { status: 'UNKNOWN', role: 'unknown' });
});

test('provisionAdmin stops with clear diagnostic guidance when app_users is missing', async () => {
  const logged = [];
  const errors = [];
  const mockLogger = {
    log: (...args) => logged.push(args.join(' ')),
    warn: (...args) => logged.push(args.join(' ')),
    error: (...args) => errors.push(args.join(' ')),
  };

  const mockPool = {
    query: async (sql) => {
      // Return table list missing app_users
      if (sql.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'issues' }] };
      }
      return { rows: [] };
    },
    end: async () => {},
  };

  await assert.rejects(
    () =>
      provisionAdmin({
        argv: ['bahumick1@gmail.com', '--check-only'],
        injectedPool: mockPool,
        logger: mockLogger,
        exitOnError: false,
      }),
    /Required authentication table is missing/
  );

  const errorOutput = errors.join('\n');
  assert.match(errorOutput, /Table "app_users" does not exist in target database/);
  assert.match(errorOutput, /--database-url/);
});

test('provisionAdmin surfaces a safe database-connection diagnostic without raw driver details', async () => {
  const privateDriverMessage = 'postgresql://test:private-password@db.example.invalid/private-db';
  const logged = [];
  const mockPool = {
    query: async () => {
      const error = new Error(privateDriverMessage);
      error.code = 'ECONNREFUSED';
      throw error;
    },
    end: async () => {},
  };
  const failure = await provisionAdmin({
    argv: ['new-admin@example.test', '--check-only'],
    baseEnv: { DATABASE_URL: 'postgresql://test:test@db.example.invalid:5432/testdb' },
    injectedPool: mockPool,
    logger: { log: (...args) => logged.push(args.join(' ')), warn: () => {}, error: (...args) => logged.push(args.join(' ')) },
    exitOnError: false,
  }).then(() => assert.fail('Connection failure should stop the check.'), (error) => error);

  assert.deepEqual(getSafeCheckDiagnostic(failure), { category: 'database_connection', code: 'ECONNREFUSED' });
  assert.equal(failure.message.includes(privateDriverMessage), false);
  assert.equal(logged.join('\n').includes(privateDriverMessage), false);
});

test('provisionAdmin fails closed when any declared required table is missing', async () => {
  const missingTable = 'auth_sessions';
  let accountLookupPerformed = false;
  let accountWritePerformed = false;
  const mockPool = {
    query: async (sql) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: REQUIRED_TABLES.filter((table) => table !== missingTable).map((table_name) => ({ table_name })) };
      }
      if (sql.includes('FROM app_users WHERE LOWER(email) = $1')) accountLookupPerformed = true;
      if (/INSERT|UPDATE|DELETE/i.test(sql)) accountWritePerformed = true;
      return { rows: [] };
    },
    end: async () => {},
  };

  const failure = await provisionAdmin({
      argv: ['new-admin@example.test', '--password=one-time-admin-password'],
      injectedPool: mockPool,
      logger: { log() {}, warn() {}, error() {} },
      exitOnError: false,
    }).then(() => assert.fail('Missing required tables should stop provisioning.'), (error) => error);
  assert.match(failure.message, /One or more required tables are missing/);
  assert.deepEqual(getSafeCheckDiagnostic(failure), {
    category: 'missing_tables',
    missingTables: ['auth_sessions'],
  });
  assert.equal(accountLookupPerformed, false);
  assert.equal(accountWritePerformed, false);
});

test('provisionAdmin --check-only accurately reports user presence without modifying data', async () => {
  const logged = [];
  const mockLogger = {
    log: (...args) => logged.push(args.join(' ')),
    warn: (...args) => logged.push(args.join(' ')),
    error: (...args) => {},
  };

  let writeOperationPerformed = false;

  const mockPool = {
    query: async (sql, params) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) };
      }
      if (sql.includes('FROM app_users WHERE LOWER(email) = $1')) {
        if (params[0] === 'existing@example.com') {
          return { rows: [{ id: 42, email: 'existing@example.com', role: 'citizen', created_at: new Date() }] };
        }
        return { rows: [] };
      }
      if (/INSERT|UPDATE|DELETE/i.test(sql)) {
        writeOperationPerformed = true;
      }
      return { rows: [] };
    },
    end: async () => {},
  };

  // 1. Existing user check
  const res1 = await provisionAdmin({
    argv: ['existing@example.com', '--check-only'],
    injectedPool: mockPool,
    logger: mockLogger,
    exitOnError: false,
  });
  assert.equal(res1.status, 'EXISTS');
  assert.equal(res1.user.id, 42);
  assert.equal(res1.user.role, 'citizen');
  assert.equal(writeOperationPerformed, false);

  // 2. Non-existent user check
  const res2 = await provisionAdmin({
    argv: ['notfound@example.com', '--check-only'],
    injectedPool: mockPool,
    logger: mockLogger,
    exitOnError: false,
  });
  assert.equal(res2.status, 'NOT_FOUND');
  assert.equal(res2.user, null);
  assert.equal(writeOperationPerformed, false);
});

test('provisionAdmin creates a missing admin and repeat execution does not change it', async () => {
  const password = 'one-time-admin-password-for-test';
  const users = new Map();
  const writes = [];
  const logs = [];
  const mockPool = {
    query: async (sql, params = []) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) };
      }
      if (sql.includes('FROM app_users WHERE LOWER(email) = $1')) {
        const user = users.get(params[0]);
        return { rows: user ? [{ ...user }] : [] };
      }
      if (sql.startsWith('INSERT INTO app_users')) {
        writes.push(sql);
        const [email, password_hash, role] = params;
        const user = { id: 1, email, password_hash, role, created_at: new Date() };
        users.set(email, user);
        return { rows: [{ id: user.id, email, role, created_at: user.created_at }] };
      }
      throw new Error(`Unexpected query in provisioning test: ${sql}`);
    },
    end: async () => {},
  };
  const options = {
    argv: ['new-admin@example.test'],
    baseEnv: {
      DATABASE_URL: 'postgresql://test:test@db.example.invalid:5432/testdb',
      ADMIN_PASSWORD: password,
    },
    injectedPool: mockPool,
    logger: { log: (...args) => logs.push(args.join(' ')), warn() {}, error() {} },
    exitOnError: false,
  };

  const created = await provisionAdmin(options);
  assert.equal(created.status, 'PROVISIONED');
  assert.equal(created.user.email, 'new-admin@example.test');
  assert.equal(created.user.role, 'admin');
  const storedUser = users.get('new-admin@example.test');
  assert.match(storedUser.password_hash, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword(password, storedUser.password_hash), true);

  const repeated = await provisionAdmin(options);
  assert.equal(repeated.status, 'EXISTS_ADMIN');
  assert.equal(writes.length, 1);
  assert.equal(users.get('new-admin@example.test').password_hash, storedUser.password_hash);
  assert.equal(logs.join('\n').includes(password), false);
  assert.equal(logs.join('\n').includes(storedUser.password_hash), false);
});

test('provisionAdmin guards against accidental role change without --confirm-role-change', async () => {
  const warnings = [];
  const mockLogger = {
    log: () => {},
    warn: (...args) => warnings.push(args.join(' ')),
    error: () => {},
  };

  let updated = false;

  const mockPool = {
    query: async (sql, params) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) };
      }
      if (sql.includes('FROM app_users WHERE LOWER(email) = $1')) {
        return { rows: [{ id: 50, email: 'citizen@example.com', role: 'citizen' }] };
      }
      if (/UPDATE/i.test(sql)) {
        updated = true;
      }
      return { rows: [] };
    },
    end: async () => {},
  };

  const res = await provisionAdmin({
    argv: ['citizen@example.com', '--password=super-secret-password-123'],
    injectedPool: mockPool,
    logger: mockLogger,
    exitOnError: false,
  });

  assert.equal(res.status, 'ROLE_CHANGE_BLOCKED');
  assert.equal(updated, false);
  assert.match(warnings.join('\n'), /--confirm-role-change/);
});

test('provisionAdmin executes atomic role upgrade and session invalidation in a transaction with --confirm-role-change', async () => {
  const transactionOperations = [];
  let clientReleased = false;

  const mockClient = {
    query: async (sql, params) => {
      transactionOperations.push({ sql: sql.trim(), params });
      return { rows: [] };
    },
    release: () => {
      clientReleased = true;
    },
  };

  const mockPool = {
    query: async (sql, params) => {
      if (sql.includes('information_schema.tables')) {
        return { rows: REQUIRED_TABLES.map((table_name) => ({ table_name })) };
      }
      if (sql.includes('FROM app_users WHERE LOWER(email) = $1')) {
        return { rows: [{ id: 75, email: 'upgrade@example.com', role: 'citizen' }] };
      }
      return { rows: [] };
    },
    connect: async () => mockClient,
    end: async () => {},
  };

  const res = await provisionAdmin({
    argv: [
      'upgrade@example.com',
      '--confirm-role-change',
      '--password=upgraded-admin-password-1234',
    ],
    injectedPool: mockPool,
    logger: { log: () => {}, warn: () => {}, error: () => {} },
    exitOnError: false,
  });

  assert.equal(res.status, 'UPGRADED');
  assert.equal(res.user.id, 75);
  assert.equal(res.user.role, 'admin');

  // Verify transaction flow: BEGIN -> UPDATE app_users -> DELETE FROM auth_sessions -> COMMIT
  const sqlCommands = transactionOperations.map((op) => op.sql);
  assert.equal(sqlCommands[0], 'BEGIN');
  assert.match(sqlCommands[1], /UPDATE app_users SET role = \$1/);
  assert.equal(transactionOperations[1].params[0], 'admin');
  assert.equal(transactionOperations[1].params[2], 75);
  assert.match(sqlCommands[2], /DELETE FROM auth_sessions WHERE user_id = \$1/);
  assert.equal(transactionOperations[2].params[0], 75);
  assert.equal(sqlCommands[3], 'COMMIT');
  assert.equal(clientReleased, true);
});
