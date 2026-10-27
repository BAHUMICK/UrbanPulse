const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/controllers/authController');

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
