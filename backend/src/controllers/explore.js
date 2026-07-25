import { getStore } from '../services/store.js';

const RESULT_CAP = 250;

function parseSlot(slot) {
  const [s, e] = slot.split('-');
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

export async function explore(req, res, next) {
  try {
    const store = await getStore();
    const { q, day, time, room, faculty, semester, department, section } = req.query;

    const timeRange = time ? parseSlot(time) : null;
    const queryStr = (q || '').trim().toLowerCase();

    const filtered = [];
    for (const s of store.flatSessions) {
      if (queryStr && !s.reg.toLowerCase().includes(queryStr) && !s.name.toLowerCase().includes(queryStr)) continue;
      if (day && s.day !== day) continue;
      if (timeRange && !(s.start < timeRange.end && s.end > timeRange.start)) continue;
      if (room && s.room !== room) continue;
      if (faculty && s.faculty !== faculty) continue;
      if (semester && String(s.semester) !== semester) continue;
      if (department && s.deptName !== department) continue;
      if (section && s.section !== section) continue;
      filtered.push(s);
      if (filtered.length >= RESULT_CAP) break;
    }

    res.json({ results: filtered, total: filtered.length, capped: filtered.length >= RESULT_CAP });
  } catch (err) {
    next(err);
  }
}
