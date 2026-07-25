import { getStore } from '../services/store.js';

export async function listRooms(req, res, next) {
  try {
    const store = await getStore();
    const q = (req.query.q || '').trim().toLowerCase();
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
    const { name } = req.params;
    const store = await getStore();
    const rows = store.byRoom.get(name) || [];

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

    res.json({ room: name, schedule: withAttendees });
  } catch (err) {
    next(err);
  }
}
