import { query } from '../config/db.js';

async function diagnose() {
  const result = await query('SELECT * FROM student_selection LIMIT 3');
  console.log('Row count:', result.rows.length);

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    console.log(`\n--- Row ${i} ---`);
    console.log('Keys:', Object.keys(row));
    console.log('Values:', Object.values(row));
    console.log('enrollment_number:', JSON.stringify(row.enrollment_number));
    console.log('enrollment_number type:', typeof row.enrollment_number);
    console.log('Has enrollment_number?', 'enrollment_number' in row);

    // Try accessing by index
    const vals = Object.values(row);
    for (let j = 0; j < vals.length; j++) {
      console.log(`  [${j}]: ${JSON.stringify(vals[j])}`);
    }
  }

  // Also check theory/lab timetable
  const theoryResult = await query("SELECT * FROM timetable WHERE type = 'theory' LIMIT 1");
  if (theoryResult.rows.length > 0) {
    console.log('\n--- Theory row keys ---');
    console.log(Object.keys(theoryResult.rows[0]));
  }

  await query('SELECT 1');
  console.log('\nDone');
  process.exit(0);
}

diagnose().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
