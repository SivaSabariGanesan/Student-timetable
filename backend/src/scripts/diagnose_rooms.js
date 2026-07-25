import { query } from '../config/db.js';
import { buildStore, invalidateStore } from '../services/store.js';

function toMinutes(hStr) {
  const [h, m] = hStr.trim().split(':').map(Number);
  let hour = h;
  if (hour >= 1 && hour <= 7) hour += 12;
  return hour * 60 + (m || 0);
}

function normalizeDay(d) {
  if (!d) return null;
  const map = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
  };
  return map[d.trim().toLowerCase()] || null;
}

async function diagnose() {
  invalidateStore();

  // Check a few specific students
  const students = ['2116250201001', '230701321'];
  for (const reg of students) {
    console.log(`\n=== Student: ${reg} ===`);
    const { rows: courses } = await query(
      `SELECT course_code, course_name, faculty, rooms, slots FROM student_selection WHERE enrollment_number = $1 LIMIT 10`,
      [reg]
    );
    console.log(`Found ${courses.length} course enrollments`);
    for (const c of courses) {
      console.log(`\n  Course: ${c.course_code} - ${c.course_name}`);
      console.log(`  Rooms in CSV: "${c.rooms}"`);
      console.log(`  Slots: "${c.slots}"`);

      // Parse first slot to check matching
      const slots = (c.slots || '').split(';').map(s => s.trim()).filter(Boolean);
      for (const slotStr of slots) {
        const [dayRaw, range] = slotStr.split(/\s+(.+)/);
        const day = normalizeDay(dayRaw);
        if (!day || !range) continue;
        const [startStr, endStr] = range.split('-').map(s => s.trim());
        const start = parseInt(startStr) * 60 + parseInt(startStr.split(':')[1] || '0');
        const end = parseInt(endStr) * 60 + parseInt(endStr.split(':')[1] || '0');
        const isTheory = (end - start) <= 55;

        console.log(`    Slot: ${day} ${startStr}-${endStr} (${isTheory ? 'theory' : 'lab'}, ${end-start}min)`);

        // Check timetable for matches
        const { rows: matches } = await query(
          `SELECT course_code, course_name, type, day, start_time, end_time, room_number
           FROM timetable
           WHERE course_code = $1
           ORDER BY type, day`,
          [c.course_code]
        );

        if (matches.length === 0) {
          console.log(`    → No timetable entries for course_code "${c.course_code}"`);

          // Try partial match (first 6 chars)
          const prefix = c.course_code.slice(0, 6);
          if (prefix.length >= 4) {
            const { rows: prefixMatches } = await query(
              `SELECT course_code, course_name, type, day, start_time, end_time, room_number
               FROM timetable
               WHERE course_code LIKE $1
               ORDER BY type, day`,
              [prefix + '%']
            );
            if (prefixMatches.length > 0) {
              console.log(`    → Found ${prefixMatches.length} by prefix "${prefix}":`);
              for (const pm of prefixMatches) {
                const mDay = normalizeDay(pm.day);
                const mStart = toMinutes(pm.start_time);
                const mEnd = toMinutes(pm.end_time);
                const overlap = !(end <= mStart || start >= mEnd);
                const sameDay = mDay === day;
                console.log(`      ${pm.course_code} | ${pm.type} | ${pm.day} ${pm.start_time}-${pm.end_time} | Room: ${pm.room_number} | SameDay:${sameDay} Overlap:${overlap}`);
              }
            } else {
              console.log(`    → No prefix matches either`);
            }
          }
        } else {
          console.log(`    → Found ${matches.length} timetable entries:`);
          for (const m of matches) {
            const mDay = normalizeDay(m.day);
            const mStart = toMinutes(m.start_time);
            const mEnd = toMinutes(m.end_time);
            const overlap = !(end <= mStart || start >= mEnd);
            const sameDay = mDay === day;
            console.log(`      ${m.type} | ${m.day} ${m.start_time}-${m.end_time} | Room: ${m.room_number} | SameDay:${sameDay} Overlap:${overlap}`);
          }
        }
      }
    }
  }

  // Check total counts
  const { rows: codeMatch } = await query(`
    SELECT COUNT(DISTINCT s.course_code) as selection_codes,
           COUNT(DISTINCT t.course_code) as timetable_codes,
           COUNT(DISTINCT s.course_code) FILTER (WHERE t.course_code IS NOT NULL) as matching_codes
    FROM (SELECT DISTINCT course_code FROM student_selection) s
    LEFT JOIN (SELECT DISTINCT course_code FROM timetable) t ON s.course_code = t.course_code
  `);
  console.log('\n=== Code Matching Stats ===');
  console.log(`Selection codes: ${codeMatch[0].selection_codes}`);
  console.log(`Timetable codes: ${codeMatch[0].timetable_codes}`);
  console.log(`Matching codes: ${codeMatch[0].matching_codes}`);

  process.exit(0);
}

diagnose().catch((err) => { console.error(err); process.exit(1); });
