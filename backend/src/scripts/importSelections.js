import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../../../public/data/student_selections_all_depts.csv');

export async function importSelections() {
  console.log('Reading', CSV_PATH);

  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${rows.length} selection rows`);

  // Clear existing data
  await query('TRUNCATE TABLE student_selection');

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const placeholders = batch.map((_, j) =>
      `($${j * 14 + 1}, $${j * 14 + 2}, $${j * 14 + 3}, $${j * 14 + 4}, $${j * 14 + 5}, $${j * 14 + 6}, $${j * 14 + 7}, $${j * 14 + 8}, $${j * 14 + 9}, $${j * 14 + 10}, $${j * 14 + 11}, $${j * 14 + 12}, $${j * 14 + 13}, $${j * 14 + 14})`
    ).join(',');
    const params = batch.flatMap((r) => [
      (r.enrollment_number || '').trim(),
      (r.student_name || '').trim(),
      (r.email || '').trim(),
      (r.department_code || '').trim(),
      (r.department_name || '').trim(),
      (r.semester || '').trim(),
      (r.status || '').trim(),
      (r.bucket || '').trim(),
      (r.course_code || '').trim(),
      (r.course_name || '').trim(),
      (r.faculty || '').trim(),
      (r.rooms || '').trim(),
      (r.batch_number || '').trim(),
      (r.slots || '').trim(),
    ]);
    await query(
      `INSERT INTO student_selection (enrollment_number, student_name, email, department_code, department_name, semester, status, bucket, course_code, course_name, faculty, rooms, batch_number, slots) VALUES ${placeholders}`,
      params
    );
    inserted += batch.length;
    if (inserted % 5000 === 0) console.log(`Inserted ${inserted} rows`);
  }

  console.log(`Inserted ${inserted} selection rows total`);
  return inserted;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importSelections().then((n) => {
    console.log(`Imported ${n} selections`);
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
