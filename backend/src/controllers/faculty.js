import { getStore } from '../services/store.js';

export async function listFaculty(req, res, next) {
  try {
    const store = await getStore();
    const q = (req.query.q || '').trim().toLowerCase();
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
    const { name } = req.params;
    const store = await getStore();
    const rows = store.byFaculty.get(name) || [];

    const schedule = [...rows].sort(
      (a, b) => ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(a.day) -
                ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(b.day) ||
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
