import { query } from '../config/db.js';

async function migrateRoles() {
  console.log('Dropping old users_role_check constraint (if it has stale values)...');

  try {
    await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    console.log('  Dropped old constraint');
  } catch (err) {
    console.log('  No old constraint to drop:', err.message);
  }

  try {
    await query(
      `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superuser', 'admin', 'user'))`
    );
    console.log('  Added new constraint (superuser, admin, user)');
  } catch (err) {
    console.log('  Constraint already exists or could not be added:', err.message);
  }

  console.log('Role migration complete');
  process.exit(0);
}

migrateRoles();
