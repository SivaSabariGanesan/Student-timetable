import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THEORY_CSV = path.resolve(__dirname, '../../../public/data/theory_schedule.csv');
const LAB_CSV = path.resolve(__dirname, '../../../public/data/lab_schedule.csv');

function parseTimeRange(rangeStr) {
  if (!rangeStr) return { start: '', end: '' };
  const parts = rangeStr.split('-').map((s) => s.trim());
  if (parts.length === 2) {
    return { start: parts[0], end: parts[1] };
  }
  return { start: '', end: '' };
}

export async function importTimetable() {
  // Clear existing data
  await query("TRUNCATE TABLE timetable");

  let total = 0;

  // Import theory schedule
  const theoryRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(THEORY_CSV, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (row) => theoryRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${theoryRows.length} theory rows`);

  for (let i = 0; i < theoryRows.length; i += 500) {
    const batch = theoryRows.slice(i, i + 500);
    const placeholders = batch.map((_, j) => {
      const base = j * 18;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16}, $${base + 17}, $${base + 18})`;
    }).join(',');
    const params = batch.flatMap((r) => {
      const { start, end } = parseTimeRange(r.time_slot);
      const capacity = r.capacity_info ? parseInt(r.capacity_info.split('/')[1], 10) : null;
      return [
        'theory',
        (r.day || '').trim(),
        start,
        end,
        (r.course_code || '').trim(),
        (r.course_name || '').trim(),
        (r.teacher_name || '').trim(),
        (r.room_number || '').trim(),
        (r.block || '').trim(),
        (r.department || '').trim(),
        (r.semester || '').trim(),
        (r.group_name || '').trim(),
        capacity,
        r.student_count ? parseInt(r.student_count, 10) : null,
        `${r.session_type || ''} ${r.session_number || ''}`.trim(),
        false,
        null,
        JSON.stringify(r),
      ];
    });
    await query(
      `INSERT INTO timetable (type, day, start_time, end_time, course_code, course_name, teacher_name, room_number, block, department, semester, group_name, capacity, student_count, session_name, is_batched, batch_label, source_data) VALUES ${placeholders}`,
      params
    );
    total += batch.length;
  }

  console.log(`Inserted ${total} theory rows`);

  // Import lab schedule
  const labRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(LAB_CSV, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (row) => labRows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${labRows.length} lab rows`);

  for (let i = 0; i < labRows.length; i += 500) {
    const batch = labRows.slice(i, i + 500);
    const placeholders = batch.map((_, j) => {
      const base = j * 18;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16}, $${base + 17}, $${base + 18})`;
    }).join(',');
    const params = batch.flatMap((r) => {
      const { start, end } = parseTimeRange(r.time_range || r.time_slot);
      return [
        'lab',
        (r.day || '').trim(),
        start,
        end,
        (r.course_code || '').trim(),
        (r.course_name || '').trim(),
        (r.teacher_name || '').trim(),
        (r.room_number || '').trim(),
        (r.block || '').trim(),
        (r.department || '').trim(),
        (r.semester || '').trim(),
        (r.group_name || '').trim(),
        r.capacity ? parseInt(r.capacity, 10) : null,
        r.student_count ? parseInt(r.student_count, 10) : null,
        (r.session_name || '').trim(),
        r.is_batched === 'True',
        (r.batch_label || '').trim(),
        JSON.stringify(r),
      ];
    });
    await query(
      `INSERT INTO timetable (type, day, start_time, end_time, course_code, course_name, teacher_name, room_number, block, department, semester, group_name, capacity, student_count, session_name, is_batched, batch_label, source_data) VALUES ${placeholders}`,
      params
    );
    total += batch.length;
  }

  console.log(`Inserted ${labRows.length} lab rows`);
  console.log(`Total timetable rows: ${total}`);
  return total;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importTimetable().then((n) => {
    console.log(`Imported ${n} timetable rows`);
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
