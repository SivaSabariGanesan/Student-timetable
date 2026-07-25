import { getStore } from '../services/store.js';

const RESULT_CAP = 250;

// Valid days and time-slot pattern — reject anything that doesn't match
// before it touches any filtering logic.
const VALID_DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
// e.g. "08:00-09:00"
const TIME_SLOT_RE = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

function parseSlot(slot) {
  const [s, e] = slot.split('-');
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

// V7 [High]: Sanitize and bound every query parameter.
// Without this, a caller can send enormous strings or inject control characters
// that cause unexpected matches or put pressure on the filter loop.
function sanitizeStr(val, maxLen = 100) {
  if (val == null) return '';
  return String(val).trim().slice(0, maxLen);
}

export async function explore(req, res, next) {
  try {
    const store = await getStore();

    const q          = sanitizeStr(req.query.q, 100).toLowerCase();
    const day        = sanitizeStr(req.query.day, 20);
    const time       = sanitizeStr(req.query.time, 20);
    const room       = sanitizeStr(req.query.room, 50);
    const faculty    = sanitizeStr(req.query.faculty, 150);
    const semester   = sanitizeStr(req.query.semester, 10);
    const department = sanitizeStr(req.query.department, 150);
    const section    = sanitizeStr(req.query.section, 20);

    // Reject unknown day values outright
    if (day && !VALID_DAYS.has(day)) {
      return res.status(400).json({ error: 'Invalid day value' });
    }
    // Reject malformed time slots
    if (time && !TIME_SLOT_RE.test(time)) {
      return res.status(400).json({ error: 'Invalid time slot format. Expected HH:MM-HH:MM' });
    }

    const timeRange = time ? parseSlot(time) : null;

    const filtered = [];
    for (const s of store.flatSessions) {
      if (q && !s.reg.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) continue;
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
