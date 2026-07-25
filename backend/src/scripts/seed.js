import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import { importSelections } from './importSelections.js';
import { importTimetable } from './importTimetable.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const statements = schema.split(';').map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await query(stmt);
  }
  console.log('Schema created');
}

async function seedUsers() {
  // Create default superuser
  const superPassword = await bcrypt.hash('Nammadhan@123', 12);
  await query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
    ['superuser@rajalakshmi.edu.in', superPassword, 'Superuser', 'superuser']
  );

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await query(
    `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
    ['admin@rajalakshmi.edu.in', adminPassword, 'Admin', 'admin']
  );

  console.log('Seed users created');
  console.log('  Superuser: superuser@rajalakshmi.edu.in / Nammadhan@123');
  console.log('  Admin:     admin@rajalakshmi.edu.in / admin123');
}

async function seed() {
  console.log('=== Starting database seed ===\n');

  try {
    await runSchema();
    await seedUsers();
    console.log('');
    await importSelections();
    console.log('');
    await importTimetable();
    console.log('\n=== Seed complete ===');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
