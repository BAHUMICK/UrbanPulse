const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { getSafeCheckDiagnostic, PASSWORD_BYTES_MIN, PASSWORD_BYTES_MAX } = require('../scripts/provision-admin');

const workflow = fs.readFileSync(path.join(__dirname, '../../.github/workflows/provision-production-admin.yml'), 'utf8');
const step = workflow.split('- name: Create the missing admin with the existing provisioning script')[1].split('- name: Verify the new admin role')[0];
const script = step.match(/node <<'NODE'\r?\n([\s\S]*?)\r?\n\s*NODE/)[1].replace(/^          /gm, '');

async function runCreationStep(password, provisionAdmin) {
  const output = [];
  const processMock = { env: { ADMIN_PASSWORD: password } };
  await vm.runInNewContext(script, {
    Buffer,
    process: processMock,
    console: { log: (text) => output.push(text), error: (text) => output.push(text) },
    require: (name) => {
      assert.equal(name, './backend/scripts/provision-admin');
      return { provisionAdmin, getSafeCheckDiagnostic, PASSWORD_BYTES_MIN, PASSWORD_BYTES_MAX };
    },
  });
  return { output: output.join('\n'), exitCode: processMock.exitCode };
}

test('workflow rejects absent or invalid password secrets before provisioning', async () => {
  for (const password of [undefined, '', 'short', 'x'.repeat(129)]) {
    let calls = 0;
    const result = await runCreationStep(password, async () => { calls++; });
    assert.equal(calls, 0);
    assert.equal(result.exitCode, 1);
    assert.match(result.output, /URBANPULSE_ADMIN_PASSWORD/);
    if (password) assert.equal(result.output.includes(password), false);
  }
});

test('workflow reports safe database codes and fails without leaking raw errors', async () => {
  const password = 'fixture-password-not-for-production';
  const privateDetails = 'private driver message containing connection and account details';
  for (const code of ['42501', '23505', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNRECOGNIZED_PRIVATE_DETAILS']) {
    const result = await runCreationStep(password, async () => {
      throw Object.assign(new Error(privateDetails), { code });
    });
    assert.equal(result.exitCode, 1);
    assert.equal(result.output.includes(password), false);
    assert.equal(result.output.includes(privateDetails), false);
    if (code === 'UNRECOGNIZED_PRIVATE_DETAILS') assert.equal(result.output.includes(code), false);
    else assert.ok(result.output.includes(`(code ${code})`));
    assert.match(result.output, /Do not retry creation/);
  }
});

test('workflow keeps exact admin identity and never passes role-change or password arguments', async () => {
  const result = await runCreationStep('fixture-password-not-for-production', async (options) => {
    assert.deepEqual(Array.from(options.argv), ['bahumick2009@gmail.com']);
    assert.equal(options.exitOnError, false);
    return { status: 'PROVISIONED', user: { email: 'bahumick2009@gmail.com', role: 'admin' } };
  });
  assert.equal(result.exitCode, undefined);
  assert.match(result.output, /"status":"PROVISIONED"/);
});

test('workflow rejects an unexpected existing-account result', async () => {
  const result = await runCreationStep('fixture-password-not-for-production', async () => ({
    status: 'ROLE_CHANGE_BLOCKED', user: { email: 'bahumick2009@gmail.com', role: 'citizen' },
  }));
  assert.equal(result.exitCode, 1);
  assert.doesNotMatch(result.output, /"status":"PROVISIONED"/);
});
