/**
 * UrbanPulse - Administrative Account Provisioning Utility
 *
 * Securely creates or verifies administrator accounts using the platform's
 * canonical scrypt password hashing mechanism without exposing credentials.
 *
 * Usage:
 *   ADMIN_PASSWORD="<secret>" node backend/scripts/provision-admin.js <email>
 *   node backend/scripts/provision-admin.js <email> --password="<secret>"
 *   node backend/scripts/provision-admin.js <email> --check-only
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { promisify } = require('util');
const crypto = require('crypto');
const pool = require('../src/config/db');
const { hashPassword } = require('../src/controllers/authController');

const PASSWORD_BYTES_MIN = 12;
const PASSWORD_BYTES_MAX = 128;

async function provisionAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => !a.startsWith('--'));
  const checkOnly = args.includes('--check-only');
  const confirmRoleChange = args.includes('--confirm-role-change');

  let password = process.env.ADMIN_PASSWORD || '';
  const passwordArg = args.find((a) => a.startsWith('--password='));
  if (passwordArg) {
    password = passwordArg.split('=')[1];
  }

  if (!emailArg) {
    console.error('Error: Administrator email address is required.');
    console.error('Usage: node backend/scripts/provision-admin.js <email> [--check-only] [--confirm-role-change]');
    process.exit(1);
  }

  const normalizedEmail = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    console.error('Error: Invalid email format.');
    process.exit(1);
  }

  try {
    // 1. Check existing account
    const existingResult = await pool.query(
      'SELECT id, email, role, created_at FROM app_users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    const existingUser = existingResult.rows[0];

    if (checkOnly) {
      if (existingUser) {
        console.log(`User status for ${normalizedEmail}: EXISTS (Role: ${existingUser.role}, ID: ${existingUser.id})`);
      } else {
        console.log(`User status for ${normalizedEmail}: NOT_FOUND`);
      }
      return;
    }

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`Administrator account already exists for ${normalizedEmail} (ID: ${existingUser.id}, Role: admin).`);
        console.log('No modification made to existing administrator account.');
        return;
      }

      // Existing user has citizen role
      if (!confirmRoleChange) {
        console.warn(`Warning: User ${normalizedEmail} already exists with role "${existingUser.role}".`);
        console.warn('Safety protection: Will not automatically alter existing account role without --confirm-role-change.');
        return;
      }

      // Explicitly confirmed role upgrade
      if (!password) {
        console.error('Error: Password is required to update administrator credentials.');
        process.exit(1);
      }

      const byteLength = Buffer.byteLength(password);
      if (byteLength < PASSWORD_BYTES_MIN || byteLength > PASSWORD_BYTES_MAX) {
        console.error(`Error: Password length must be between ${PASSWORD_BYTES_MIN} and ${PASSWORD_BYTES_MAX} bytes.`);
        process.exit(1);
      }

      const newHash = await hashPassword(password);
      await pool.query(
        'UPDATE app_users SET role = $1, password_hash = $2 WHERE id = $3',
        ['admin', newHash, existingUser.id]
      );
      // Revoke any active citizen sessions
      await pool.query('DELETE FROM auth_sessions WHERE user_id = $1', [existingUser.id]);
      console.log(`Successfully upgraded ${normalizedEmail} to administrator (ID: ${existingUser.id}).`);
      return;
    }

    // Account does not exist, proceed with creation
    if (!password) {
      console.error('Error: Password is required to create a new administrator account.');
      console.error('Supply via ADMIN_PASSWORD environment variable or --password parameter.');
      process.exit(1);
    }

    const byteLength = Buffer.byteLength(password);
    if (byteLength < PASSWORD_BYTES_MIN || byteLength > PASSWORD_BYTES_MAX) {
      console.error(`Error: Password length must be between ${PASSWORD_BYTES_MIN} and ${PASSWORD_BYTES_MAX} bytes.`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const insertResult = await pool.query(
      'INSERT INTO app_users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
      [normalizedEmail, passwordHash, 'admin']
    );

    const newUser = insertResult.rows[0];
    console.log(`Administrator account provisioned successfully for ${newUser.email} (ID: ${newUser.id}, Role: ${newUser.role}).`);
  } catch (error) {
    if (error.code === '42P01') {
      console.error('Error: Table "app_users" does not exist in target database.');
      console.error('Apply database/migrations/001_authentication.sql or database/supabase_migration.sql first.');
    } else {
      console.error('Provisioning failed:', error.code || error.message);
    }
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

if (require.main === module) {
  provisionAdmin();
}

module.exports = { provisionAdmin };
