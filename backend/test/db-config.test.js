const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');

const CA = '-----BEGIN CERTIFICATE-----\\ntrusted-ca\\n-----END CERTIFICATE-----';

test('remote PostgreSQL URLs enforce verified TLS and accept a trusted CA', () => {
  const { poolConfig, safeDiagnostics } = pool.buildPoolConfig({
    DATABASE_URL: 'postgresql://user:password@db.example.test:5432/urbanpulse?sslmode=require&application_name=urbanpulse',
    DB_SSL_CA: CA,
  });

  assert.equal(poolConfig.ssl.rejectUnauthorized, true);
  assert.equal(poolConfig.ssl.ca, CA.replace(/\\n/g, '\n'));
  assert.equal(new URL(poolConfig.connectionString).searchParams.has('sslmode'), false);
  assert.equal(new URL(poolConfig.connectionString).searchParams.get('application_name'), 'urbanpulse');
  assert.equal(safeDiagnostics.sslEnabled, true);
});

test('remote PostgreSQL connections verify TLS by default', () => {
  const { poolConfig } = pool.buildPoolConfig({ DB_HOST: 'db.example.test' });
  assert.equal(poolConfig.ssl.rejectUnauthorized, true);
});

test('local PostgreSQL can explicitly use a non-TLS connection', () => {
  const { poolConfig, safeDiagnostics } = pool.buildPoolConfig({ DB_HOST: 'localhost', DB_SSL: 'false' });
  assert.equal(poolConfig.ssl, undefined);
  assert.equal(safeDiagnostics.sslEnabled, false);
});

test('remote PostgreSQL cannot disable TLS or certificate verification', () => {
  assert.throws(() => pool.buildPoolConfig({ DB_HOST: 'db.example.test', DB_SSL: 'false' }), /DB_SSL=false/);
  assert.throws(() => pool.buildPoolConfig({ DATABASE_URL: 'postgres://u:p@db.example.test/db?sslmode=disable' }), /TLS settings conflict/);
  assert.throws(() => pool.buildPoolConfig({ DATABASE_URL: 'postgres://u:p@db.example.test/db?sslmode=no-verify' }), /no-verify/);
});

test('TLS configuration rejects conflicting CA sources', () => {
  assert.throws(() => pool.buildPoolConfig({ DB_HOST: 'db.example.test', DB_SSL_CA: CA, DB_SSL_CA_PATH: 'ca.pem' }), /only one/);
});
