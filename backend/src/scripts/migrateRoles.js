import { query } from '../config/db.js';

async function migrateRoles() {
  console.log('Dropping old users_role_check constraint (if it has stale values)...');

  await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
  console.log('  Dropped old constraint');

  // Check for invalid role values before adding the new constraint
  const invalid = await query(
    `SELECT DISTINCT role FROM users WHERE role NOT IN ('superuser', 'admin', 'user')`
  );

  if (invalid.rows.length > 0) {
    const badRoles = invalid.rows.map((r) => r.role).join(', ');
    console.log(`  Found ${invalid.rows.length} invalid role value(s): ${badRoles}`);

    // Update invalid roles to 'user'
    const result = await query(
      `UPDATE users SET role = 'user' WHERE role NOT IN ('superuser', 'admin', 'user')`
    );
    console.log(`  Updated ${result.rowCount} user(s) with invalid roles to 'user'`);
  } else {
    console.log('  All existing roles are valid');
  }

  await query(
    `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superuser', 'admin', 'user'))`
  );
  console.log('  Added new constraint (superuser, admin, user)');

  console.log('Role migration complete');
  process.exit(0);
}

migrateRoles();
