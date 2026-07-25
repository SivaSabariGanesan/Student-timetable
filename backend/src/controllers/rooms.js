import { getStore } from '../services/store.js';

// V7 [High]: Sanitize room name param — room names are alphanumeric with
// hyphens/spaces/slashes. Strip anything else before using as a Map key.
function sanitizeRoomName(raw) {
  return String(raw || '').trim().slice(0, 50);
}

export async function listRooms(req, res, next) {
  try {
    const store = await getStore();
    const q = String(req.query.q || '').trim().slice(0, 50).toLowerCase();
    const rooms = Array.from(store.byRoom, ([name, rows]) => ({
      name,
      count: rows.length,
      block: rows[0]?.block,
    }));
    const filtered = q ? rooms.filter((r) => r.name.toLowerCase().includes(q)) : rooms;
    filtered.sort((a, b) => b.count - a.count);
    res.json({ rooms: filtered.slice(0, 60) });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const name = sanitizeRoomName(req.params.name);
    if (!name) return res.status(400).json({ error: 'Invalid room name' });

    const store = await getStore();
    const rows = store.byRoom.get(name) || [];

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

    res.json({ room: name, schedule: withAttendees });
  } catch (err) {
    next(err);
  }
}
