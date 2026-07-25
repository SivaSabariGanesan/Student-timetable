import { getStore } from '../services/store.js';

// V7 [High]: Faculty names can contain unicode letters, spaces, dots and hyphens.
// Cap at 150 chars and strip leading/trailing whitespace.
function sanitizeFacultyName(raw) {
  return String(raw || '').trim().slice(0, 150);
}

export async function listFaculty(req, res, next) {
  try {
    const store = await getStore();
    const q = String(req.query.q || '').trim().slice(0, 100).toLowerCase();
    const faculty = Array.from(store.byFaculty, ([name, rows]) => ({ name, count: rows.length }));
    const filtered = q ? faculty.filter((f) => f.name.toLowerCase().includes(q)) : faculty;
    filtered.sort((a, b) => b.count - a.count);
    res.json({ faculty: filtered.slice(0, 60) });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyMember(req, res, next) {
  try {
    const name = sanitizeFacultyName(req.params.name);
    if (!name) return res.status(400).json({ error: 'Invalid faculty name' });

    const store = await getStore();
    const rows = store.byFaculty.get(name) || [];

    const schedule = [...rows].sort(
      (a, b) =>
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(a.day) -
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(b.day) ||
        a.start - b.start
    );

    const withAttendees = schedule.map((row) => {
      const key = `${row.code}|${row.semester}`;
      const attendees = store.attendeeIndex.get(key) || [];
      return { ...row, attendeeCount: attendees.length };
    });

    res.json({ faculty: name, schedule: withAttendees });
  } catch (err) {
    next(err);
  }
}
