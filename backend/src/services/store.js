import { query } from '../config/db.js';

let cached = null;

function parseSection(bucket) {
  if (!bucket) return '';
  const m = bucket.match(/Section\s+([A-Za-z0-9]+)/i);
  return m ? m[1] : '';
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

function toMinutes(hStr) {
  const [h, m] = hStr.trim().split(':').map(Number);
  let hour = h;
  if (hour >= 1 && hour <= 7) hour += 12;
  return hour * 60 + (m || 0);
}

function parseRange(rangeStr) {
  if (!rangeStr) return null;
  const parts = rangeStr.split('-').map((s) => s.trim());
  if (parts.length !== 2) return null;
  return { start: toMinutes(parts[0]), end: toMinutes(parts[1]) };
}

function parseStudentSlots(slotsStr) {
  if (!slotsStr) return [];
  return slotsStr.split(';').map((c) => c.trim()).filter(Boolean).map((chunk) => {
    const [dayRaw, range] = chunk.split(/\s+(.+)/);
    const day = normalizeDay(dayRaw);
    if (!day || !range) return null;
    const [startStr, endStr] = range.split('-').map((s) => s.trim());
    const start = parseSimpleTime(startStr);
    const end = parseSimpleTime(endStr);
    if (start == null || end == null) return null;
    return { day, start, end };
  }).filter(Boolean);
}

function parseSimpleTime(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

function pickBestRoom(roomsField) {
  if (!roomsField) return 'TBA';
  const parts = roomsField.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  const real = parts.find((p) => {
    const lower = p.toLowerCase();
    return lower !== 'classroom' && lower !== 'tba' && lower !== '';
  });
  return real || parts[0] || 'TBA';
}

function isTheorySlot(start, end) {
  return (end - start) <= 55;
}

function resolveRooms(flatSessions, master) {
  const theoryByCode = new Map();
  const labByCode = new Map();
  const theoryByName = new Map();
  const labByName = new Map();
  const allByCode = new Map();

  for (const m of master) {
    const codeKey = m.code;
    const nameKey = m.name ? m.name.trim().toLowerCase() : null;
    const isTheory = m.type === 'theory';

    if (codeKey) {
      const codeMap = isTheory ? theoryByCode : labByCode;
      if (!codeMap.has(codeKey)) codeMap.set(codeKey, []);
      codeMap.get(codeKey).push(m);
      if (!allByCode.has(codeKey)) allByCode.set(codeKey, []);
      allByCode.get(codeKey).push(m);
    }
    if (nameKey) {
      const nameMap = isTheory ? theoryByName : labByName;
      if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
      nameMap.get(nameKey).push(m);
    }
  }

  const findMatch = (candidates, s) => {
    for (const c of candidates) {
      if (c.day !== s.day) continue;
      if (!(s.end <= c.start || s.start >= c.end)) return c;
    }
    return null;
  };

  const roomUpdates = [];

  for (const s of flatSessions) {
    const theory = isTheorySlot(s.start, s.end);
    const nameKey = s.courseName ? s.courseName.trim().toLowerCase() : null;
    const byCodePrimary = theory ? theoryByCode : labByCode;
    const byNamePrimary = theory ? theoryByName : labByName;

    const candidateSets = [
      byCodePrimary.get(s.code) || [],
      nameKey ? (byNamePrimary.get(nameKey) || []) : [],
      allByCode.get(s.code) || [],
    ];

    let resolved = null;
    for (const candidates of candidateSets) {
      resolved = findMatch(candidates, s);
      if (resolved) break;
    }

    if (resolved && resolved.room && resolved.room.toLowerCase() !== 'tba') {
      s.room = resolved.room;
      roomUpdates.push(s);
    }
  }

  return roomUpdates;
}

function buildAttendeeIndex(flatSessions) {
  const index = new Map();
  for (const s of flatSessions) {
    const key = `${s.code}|${s.semester}`;
    if (!index.has(key)) index.set(key, []);
    const bucket = index.get(key);
    if (!bucket.some((e) => e.reg === s.reg)) bucket.push(s);
  }
  return index;
}

export async function buildStore() {
  const selResult = await query('SELECT COUNT(*) AS cnt FROM student_selection');
  console.log('student_selection count:', selResult.rows[0]?.cnt);

  const { rows: selections } = await query(
    'SELECT * FROM student_selection ORDER BY enrollment_number'
  );
  if (selections.length > 0) {
    console.log('First row keys:', Object.keys(selections[0]));
    console.log('First row enrollment_number:', JSON.stringify(selections[0].enrollment_number));
    console.log('Row values array:', JSON.stringify(Object.values(selections[0])).slice(0, 300));
    console.log('First row sample:', JSON.stringify(selections[0]).slice(0, 400));
  }
  const { rows: theory } = await query("SELECT * FROM timetable WHERE type = 'theory' ORDER BY id");
  const { rows: lab } = await query("SELECT * FROM timetable WHERE type = 'lab' ORDER BY id");

  const studentsMap = new Map();
  const flatSessions = [];
  const facultySet = new Set();
  const roomSetFromSelections = new Set();
  const deptSet = new Set();
  const semesterSet = new Set();
  const sectionSet = new Set();
  const courseCodeSet = new Set();

  for (const row of selections) {
    const reg = (row.enrollment_number || '').trim();
    if (!reg) continue;

    let student = studentsMap.get(reg);
    if (!student) {
      student = {
        reg,
        name: row.student_name || '',
        email: row.email || '',
        deptCode: row.department_code || '',
        deptName: (row.department_name || '').replace(/^Department of\s+/i, ''),
        semester: row.semester || '',
        section: row.section || '',
        status: row.status || '',
        courses: [],
      };
      studentsMap.set(reg, student);
    }

    const slots = parseStudentSlots(row.slots);
    const course = {
      code: row.course_code || '',
      name: row.course_name || '',
      faculty: row.faculty || 'TBA',
      room: pickBestRoom(row.rooms),
      batch: row.batch_number || '',
      slots,
    };
    student.courses.push(course);

    if (course.code) courseCodeSet.add(course.code);
    if (course.faculty) facultySet.add(course.faculty);
    if (course.room) roomSetFromSelections.add(course.room);
    if (student.deptName) deptSet.add(student.deptName);
    if (student.semester) semesterSet.add(student.semester);
    if (student.section) sectionSet.add(student.section);

    for (const slot of slots) {
      flatSessions.push({
        reg,
        name: student.name,
        deptName: student.deptName,
        deptCode: student.deptCode,
        semester: student.semester,
        section: student.section,
        code: course.code,
        courseName: course.name,
        faculty: course.faculty,
        room: course.room,
        day: slot.day,
        start: slot.start,
        end: slot.end,
      });
    }
  }

  const studentIndex = Array.from(studentsMap.values()).map((s) => ({
    reg: s.reg,
    name: s.name,
    deptCode: s.deptCode,
    semester: s.semester,
    section: s.section,
  }));
  studentIndex.sort((a, b) => a.reg.localeCompare(b.reg));

  const theoryNorm = theory.map((r) => ({
    type: 'theory',
    day: normalizeDay(r.day),
    start: toMinutes(r.start_time),
    end: toMinutes(r.end_time),
    timeLabel: `${r.start_time} - ${r.end_time}`,
    code: r.course_code || '',
    name: r.course_name || '',
    faculty: r.teacher_name || 'TBA',
    room: r.room_number || 'TBA',
    block: r.block || '',
    department: r.department || '',
    semester: r.semester || '',
    group: r.group_name || '',
    capacity: r.capacity || null,
    studentCount: r.student_count || null,
    session: r.session_name || '',
    isBatched: r.is_batched || false,
    batchLabel: r.batch_label || '',
  })).filter(Boolean);

  const labNorm = lab.map((r) => ({
    type: 'lab',
    day: normalizeDay(r.day),
    start: toMinutes(r.start_time),
    end: toMinutes(r.end_time),
    timeLabel: `${r.start_time} - ${r.end_time}`,
    code: r.course_code || '',
    name: r.course_name || '',
    faculty: r.teacher_name || 'TBA',
    room: r.room_number || 'TBA',
    block: r.block || '',
    department: r.department || '',
    semester: r.semester || '',
    group: r.group_name || '',
    capacity: r.capacity || null,
    studentCount: r.student_count || null,
    session: r.session_name || '',
    isBatched: r.is_batched || false,
    batchLabel: r.batch_label || '',
  })).filter(Boolean);

  const master = [...theoryNorm, ...labNorm];

  resolveRooms(flatSessions, master);

  const roomSet = new Set(roomSetFromSelections);
  const masterRoomSet = new Set();
  const masterFacultySet = new Set();
  for (const r of master) {
    if (r.room) {
      roomSet.add(r.room);
      masterRoomSet.add(r.room);
    }
    if (r.faculty) masterFacultySet.add(r.faculty);
  }

  const byRoom = new Map();
  const byFaculty = new Map();
  for (const r of master) {
    if (!byRoom.has(r.room)) byRoom.set(r.room, []);
    byRoom.get(r.room).push(r);
    if (!byFaculty.has(r.faculty)) byFaculty.set(r.faculty, []);
    byFaculty.get(r.faculty).push(r);
  }

  console.log('Processed', selections.length, 'selection rows, studentsMap.size:', studentsMap.size);
  if (studentsMap.size === 0 && selections.length > 0) {
    console.log('DEBUG: First row enrollment_number type:', typeof selections[0].enrollment_number);
    console.log('DEBUG: enrollment_number in row:', 'enrollment_number' in selections[0]);
    // Try column at index 1 (based on schema: id=0, enrollment_number=1)
    const vals = Object.values(selections[0]);
    console.log('DEBUG: value at index 1:', vals[1]);
  }

  const store = {
    studentIndex,
    flatSessions,
    theory: theoryNorm,
    lab: labNorm,
    master,
    byRoom,
    byFaculty,
    attendeeIndex: buildAttendeeIndex(flatSessions),
    facets: {
      faculty: Array.from(new Set([...facultySet, ...masterFacultySet])).sort(),
      rooms: Array.from(roomSet).sort(),
      departments: Array.from(deptSet).sort(),
      semesters: Array.from(semesterSet).sort((a, b) => Number(a) - Number(b)),
      sections: Array.from(sectionSet).sort(),
    },
    counts: {
      students: studentsMap.size,
      faculty: new Set([...facultySet, ...masterFacultySet]).size,
      rooms: masterRoomSet.size,
      subjects: new Set([...master.map((m) => m.code), ...courseCodeSet]).size,
    },
    studentsArray: Array.from(studentsMap.values()),
  };

  return store;
}

export async function getStore({ forceRebuild } = {}) {
  if (!cached || forceRebuild) {
    console.log('Building store from database...');
    cached = await buildStore();
    console.log('Store built with', cached.studentsArray.length, 'students,', cached.master.length, 'master rows');
  }
  return cached;
}

export function invalidateStore() {
  cached = null;
}
