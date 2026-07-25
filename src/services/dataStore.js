import { parseRange, normalizeDay, parseStudentSlots } from '../utils/time';

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

/**
 * Picks the most useful room from a possibly multi-room string like
 * "A208/209-B (A Block); Classroom; TLFL1/2 (Techlounge)".
 * Returns the first non-generic value, or "Classroom" / "TBA" if nothing better.
 */
function pickBestRoom(roomsField) {
  if (!roomsField) return 'TBA';
  const parts = roomsField.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
  // Prefer first real room (not Classroom / TBA)
  const real = parts.find((p) => {
    const lower = p.toLowerCase();
    return lower !== 'classroom' && lower !== 'tba' && lower !== '';
  });
  return real || parts[0] || 'TBA';
}

/**
 * Returns true if the slot duration looks like a theory period (≤55 min).
 * Lab sessions are 90, 100, or 110 min. Theory slots are exactly 50 min.
 */
function isTheorySlot(start, end) {
  return (end - start) <= 55;
}

/**
 * Resolves the room for every flat session by looking up the master schedule
 * (theory_schedule or lab_schedule) using course code + day + time overlap.
 *
 * Key insight: the `rooms` field in student_selections is a semicolon-joined list
 * of ALL rooms for that course (theory classroom + all lab batch rooms). We cannot
 * simply pick the "best" one for the whole course — a theory slot must get the
 * theory classroom and a lab slot must get the lab room.
 *
 * Strategy:
 *  - Theory slot (≤55 min) → match against theory master rows only
 *  - Lab slot (>55 min)    → match against lab master rows only
 *  - Fallback: match against all master rows (type-agnostic)
 *  - If still unresolved, fall back to course name matching
 *
 * Also updates _courseRef so StudentProfile shows the correct room per slot.
 */
function resolveRooms(flatSessionsList, masterList) {
  const theoryByCode = new Map();
  const labByCode    = new Map();
  const theoryByName = new Map();
  const labByName    = new Map();
  const theoryByPrefix = new Map();
  const labByPrefix    = new Map();

  for (const m of masterList) {
    const codeKey = m.code;
    const nameKey = m.name ? m.name.trim().toLowerCase() : null;
    const isTheory = m.type === 'theory';

    if (codeKey) {
      const codeMap = isTheory ? theoryByCode : labByCode;
      if (!codeMap.has(codeKey)) codeMap.set(codeKey, []);
      codeMap.get(codeKey).push(m);

      const prefix = codeKey.slice(0, 6);
      if (prefix.length >= 4) {
        const prefixMap = isTheory ? theoryByPrefix : labByPrefix;
        if (!prefixMap.has(prefix)) prefixMap.set(prefix, []);
        prefixMap.get(prefix).push(m);
      }
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

  for (const s of flatSessionsList) {
    const isTheory = isTheorySlot(s.start, s.end);
    const nameKey = s.courseName ? s.courseName.trim().toLowerCase() : null;
    const byCode = isTheory ? theoryByCode : labByCode;
    const byName = isTheory ? theoryByName : labByName;
    const byPrefix = isTheory ? theoryByPrefix : labByPrefix;

    const codePrefix = s.code ? s.code.slice(0, 6) : null;

    const candidateSets = [
      byCode.get(s.code) || [],
      nameKey ? (byName.get(nameKey) || []) : [],
      codePrefix && codePrefix.length >= 4 ? (byPrefix.get(codePrefix) || []) : [],
    ];

    let resolved = null;
    for (const candidates of candidateSets) {
      resolved = findMatch(candidates, s);
      if (resolved) break;
    }

    if (resolved && resolved.room && resolved.room.toLowerCase() !== 'tba') {
      s.room = resolved.room;
      if (s._slotRef) s._slotRef.room = resolved.room;
      if (s._courseRef) {
        if (s._courseRef._roomResolved !== 'mixed') {
          if (!s._courseRef._roomResolved) {
            s._courseRef.room = resolved.room;
            s._courseRef._roomResolved = isTheory ? 'theory' : 'lab';
          } else if (s._courseRef._roomResolved !== (isTheory ? 'theory' : 'lab')) {
            s._courseRef._roomResolved = 'mixed';
          } else {
            s._courseRef.room = resolved.room;
          }
        }
      }
    }
  }

  for (const s of flatSessionsList) {
    delete s._courseRef;
    delete s._slotRef;
  }
}

/**
 * Builds a Map keyed by "code|semester" → unique student flat-session records.
 * Used by findAttendees for O(1) lookup instead of a full flatSessions scan.
 */
function buildAttendeeIndex(flatSessions) {
  const index = new Map();
  for (const s of flatSessions) {
    const key = `${s.code}|${s.semester}`;
    if (!index.has(key)) index.set(key, []);
    const bucket = index.get(key);
    // Deduplicate by reg — only keep first occurrence per student
    if (!bucket.some((e) => e.reg === s.reg)) bucket.push(s);
  }
  return index;
}

export function buildStore({ selections, theory, lab }) {
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
        section: parseSection(row.bucket),
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
        _courseRef: course,
        _slotRef: slot,
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

  const theoryNorm = theory.map((r) => normalizeMasterRow(r, 'theory')).filter(Boolean);
  const labNorm = lab.map((r) => normalizeMasterRow(r, 'lab')).filter(Boolean);
  const master = [...theoryNorm, ...labNorm];

  resolveRooms(flatSessions, master);

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

  return {
    studentsMap,
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
      semesters: Array.from(new Set([...semesterSet, ...masterSemesterSet])).sort((a, b) => Number(a) - Number(b)),
      sections: Array.from(sectionSet).sort(),
    },
    counts: {
      students: studentsMap.size,
      faculty: new Set([...facultySet, ...masterFacultySet]).size,
      rooms: masterRoomSet.size,
      subjects: new Set([...master.map((m) => m.code), ...courseCodeSet]).size,
    },
  };
}

export async function buildStoreAsync({ selections, theory, lab }, { onProgress } = {}) {
  const studentsMap = new Map();
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
    let student = studentsMap.get(reg);
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
        _courseRef: course,
        _slotRef: slot,
      });
    }

    processed++;
    if (onProgress && processed % BATCH === 0) {
      onProgress(processed);
      // yield to the event loop so UI can update
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 0));
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

  const theoryNorm = theory.map((r) => normalizeMasterRow(r, 'theory')).filter(Boolean);
  const labNorm = lab.map((r) => normalizeMasterRow(r, 'lab')).filter(Boolean);
  const master = [...theoryNorm, ...labNorm];

  resolveRooms(flatSessions, master);

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

  return {
    studentsMap,
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
      semesters: Array.from(new Set([...semesterSet, ...masterSemesterSet])).sort((a, b) => Number(a) - Number(b)),
      sections: Array.from(sectionSet).sort(),
    },
    counts: {
      students: studentsMap.size,
      faculty: new Set([...facultySet, ...masterFacultySet]).size,
      rooms: masterRoomSet.size,
      subjects: new Set([...master.map((m) => m.code), ...courseCodeSet]).size,
    },
  };
}

// Best-effort attendee lookup for a master-schedule row: matches by course code + semester.
// Uses a pre-built index (store.attendeeIndex) if available, else falls back to linear scan.
export function findAttendees(store, row) {
  // Fast path: use pre-built index keyed by "code|semester"
  if (store.attendeeIndex) {
    const key = `${row.code}|${row.semester}`;
    return store.attendeeIndex.get(key) || [];
  }
  // Fallback linear scan
  const sem = String(row.semester);
  const seen = new Set();
  const out = [];
  for (const s of store.flatSessions) {
    if (s.code !== row.code || String(s.semester) !== sem) continue;
    if (seen.has(s.reg)) continue;
    seen.add(s.reg);
    out.push(s);
  }
  return out;
}
