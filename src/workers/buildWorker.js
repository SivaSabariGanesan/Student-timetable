import { parseRange, normalizeDay, parseStudentSlots } from '../utils/time.js';

function parseSection(bucket) {
  if (!bucket) return '';
  const m = bucket.match(/Section\s+([A-Za-z0-9]+)/i);
  return m ? m[1] : '';
}

function normalizeMasterRow(row, type) {
  const rangeStr = type === 'theory' ? row.time_slot : row.time_range;
  const range = parseRange(rangeStr);
  const day = normalizeDay(row.day);
  if (!range || !day) return null;
  return {
    type,
    day,
    start: range.start,
    end: range.end,
    timeLabel: rangeStr,
    code: row.course_code || '',
    name: (type === 'theory' ? row.course_name : row.course_name) || '',
    faculty: row.teacher_name || 'TBA',
    room: row.room_number || 'TBA',
    block: row.block || '',
    department: row.department || '',
    semester: row.semester || '',
    group: row.group_name || '',
    capacity: Number(row.capacity || row.capacity_info?.split('/')?.[1] || 0) || null,
    studentCount: Number(row.student_count || row.total_students || 0) || null,
    session: type === 'theory' ? `${row.session_type || 'Lecture'} ${row.session_number || ''}`.trim() : row.session_name,
    isBatched: row.is_batched === 'True',
    batchLabel: row.batch_label || '',
  };
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

self.onmessage = async (ev) => {
  try {
    const { selections = [], theory = [], lab = [] } = ev.data || {};

  const studentsMap = Object.create(null);
  const flatSessions = [];
  const facultySet = new Set();
  const roomSetFromSelections = new Set();
  const deptSet = new Set();
  const semesterSet = new Set();
  const sectionSet = new Set();
  const courseCodeSet = new Set();

  const BATCH = 1000;
  let processed = 0;

  for (let i = 0; i < selections.length; i++) {
    const row = selections[i];
    const reg = (row.enrollment_number || '').trim();
    if (!reg) continue;
    let student = studentsMap[reg];
    if (!student) {
      student = {
        reg,
        name: row.student_name || '',
        email: row.email || '',
        deptCode: row.department_code || '',
        deptName: (row.department_name || '').replace(/^Department of\s+/i, ''),
        semester: row.semester || '',
        section: parseSection(row.bucket),
        status: row.status || '',
        courses: [],
      };
      studentsMap[reg] = student;
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
        _courseRef: course,
      });
    }

    processed++;
    if (processed % BATCH === 0) {
      // send progress
      self.postMessage({ type: 'progress', processed });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const studentsArray = Object.values(studentsMap);
  const studentIndex = studentsArray.map((s) => ({
    reg: s.reg,
    name: s.name,
    deptCode: s.deptCode,
    semester: s.semester,
    section: s.section,
  })).sort((a, b) => a.reg.localeCompare(b.reg));

  const theoryNorm = theory.map((r) => normalizeMasterRow(r, 'theory')).filter(Boolean);
  const labNorm = lab.map((r) => normalizeMasterRow(r, 'lab')).filter(Boolean);
  const master = [...theoryNorm, ...labNorm];

  // Resolve generic "Classroom" / "TBA" room labels using master schedule
  const byCodeForResolve = new Map();
  for (const m of master) {
    if (!m.code) continue;
    if (!byCodeForResolve.has(m.code)) byCodeForResolve.set(m.code, []);
    byCodeForResolve.get(m.code).push(m);
  }
  for (const s of flatSessions) {
    const r = (s.room || '').toLowerCase();
    if (r && r !== 'classroom' && r !== 'tba') continue;
    const candidates = byCodeForResolve.get(s.code) || [];
    for (const c of candidates) {
      if (c.day !== s.day) continue;
      if (!(s.end <= c.start || s.start >= c.end)) {
        const resolvedRoom = c.room || s.room;
        s.room = resolvedRoom;
        // Also update the student course object so it serializes with the real room
        if (s._courseRef) s._courseRef.room = resolvedRoom;
        break;
      }
    }
  }
  // Strip internal references before serialization
  for (const s of flatSessions) delete s._courseRef;

  const roomSet = new Set(roomSetFromSelections);
  const masterRoomSet = new Set();
  const masterFacultySet = new Set();
  const masterDeptSet = new Set();
  const masterSemesterSet = new Set();
  for (const r of master) {
    if (r.room) {
      roomSet.add(r.room);
      masterRoomSet.add(r.room);
    }
    if (r.faculty) masterFacultySet.add(r.faculty);
    if (r.department) masterDeptSet.add(r.department);
    if (r.semester) masterSemesterSet.add(r.semester);
  }

  const byRoom = new Map();
  const byFaculty = new Map();
  for (const r of master) {
    if (!byRoom.has(r.room)) byRoom.set(r.room, []);
    byRoom.get(r.room).push(r);
    if (!byFaculty.has(r.faculty)) byFaculty.set(r.faculty, []);
    byFaculty.get(r.faculty).push(r);
  }

  // serialize maps to arrays so they can be transferred
  const serializable = {
    studentsArray,
    studentIndex,
    flatSessions,
    theory: theoryNorm,
    lab: labNorm,
    master,
    byRoomEntries: Array.from(byRoom.entries()),
    byFacultyEntries: Array.from(byFaculty.entries()),
    facets: {
      faculty: Array.from(new Set([...facultySet, ...masterFacultySet])).sort(),
      rooms: Array.from(roomSet).sort(),
      departments: Array.from(deptSet).sort(),
      semesters: Array.from(new Set([...semesterSet, ...masterSemesterSet])).sort((a, b) => Number(a) - Number(b)),
      sections: Array.from(sectionSet).sort(),
    },
    counts: {
      students: studentsArray.length,
      faculty: new Set([...facultySet, ...masterFacultySet]).size,
      rooms: masterRoomSet.size,
      subjects: new Set([...master.map((m) => m.code), ...courseCodeSet]).size,
    },
  };

    self.postMessage({ type: 'done', store: serializable });
  } catch (err) {
    // send error back to main thread
    try {
      self.postMessage({ type: 'error', message: String(err), stack: err?.stack });
    } catch (e) {
      /* ignore */
    }
  }
};

export default null;
