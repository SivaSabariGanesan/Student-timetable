/**
 * CLI tool to create a superuser account.
 * Usage: node src/scripts/createSuperuser.js <email> <name> <password>
 * Example: node src/scripts/createSuperuser.js super@college.edu "Super Admin" mypassword
 *
 * Must be run from the backend directory (where .env lives).
 */

import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

async function createSuperuser() {
  const [, , email, name, password] = process.argv;

  if (!email || !name || !password) {
    console.error('Usage: node src/scripts/createSuperuser.js <email> <name> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'superuser')
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             name          = EXCLUDED.name,
             role          = 'superuser',
             updated_at    = NOW()
       RETURNING id, email, name, role`,
      [email.toLowerCase().trim(), hash, name.trim()]
    );

    const user = result.rows[0];
    console.log('\nSuperuser created / updated successfully:');
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.name}`);
    console.log(`  Role:  ${user.role}\n`);
  } catch (err) {
    console.error('Failed to create superuser:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

createSuperuser();
