import { getStore } from '../services/store.js';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start - b.start
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

function parseTimeParam(val) {
  if (val == null) return null;
  const n = Number(val);
  if (!Number.isNaN(n)) return n;
  const parts = String(val).split(':').map(Number);
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

function generateSlots(daySessions, dayStart, dayEnd, slotDuration) {
  dayStart = dayStart ?? 480;
  dayEnd = dayEnd ?? 1020;
  slotDuration = slotDuration ?? 50;

  const busy = daySessions
    .filter((s) => s.start < dayEnd && s.end > dayStart)
    .map((s) => ({ start: Math.max(s.start, dayStart), end: Math.min(s.end, dayEnd) }))
    .sort((a, b) => a.start - b.start);

  const free = [];
  let cursor = dayStart;
  for (const b of busy) {
    if (cursor < b.start) {
      free.push({ start: cursor, end: b.start });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < dayEnd) {
    free.push({ start: cursor, end: dayEnd });
  }

  return free;
}

export async function freeRooms(req, res, next) {
  try {
    const store = await getStore();

    const dayNames = req.query.day
      ? req.query.day.split(',').map((d) => d.trim()).filter(Boolean)
      : DAY_ORDER;
    const q = String(req.query.q || '').trim().slice(0, 50).toLowerCase();
    const start = parseTimeParam(req.query.start);
    const end = parseTimeParam(req.query.end);

    const result = [];

    for (const day of dayNames) {
      const allRooms = Array.from(store.byRoom.entries());

      const dayRooms = allRooms
        .map(([name, sessions]) => {
          const daySessions = sessions.filter((s) => s.day === day);

          if (start != null && end != null) {
            const occupied = daySessions.some((s) => s.start < end && s.end > start);
            return { name, occupied, freeSlots: null };
          }

          const freeSlots = generateSlots(daySessions);
          return { name, occupied: null, freeSlots };
        })
        .filter((r) => {
          if (q && !r.name.toLowerCase().includes(q)) return false;
          return true;
        });

      const freeRooms = dayRooms.filter((r) => !r.occupied);
      const occupiedRooms = dayRooms.filter((r) => r.occupied);

      result.push({
        day,
        freeCount: start != null ? freeRooms.length : null,
        totalRooms: dayRooms.length,
        freeRooms: start != null ? freeRooms.map((r) => ({ name: r.name })) : undefined,
        rooms: start == null ? dayRooms.map((r) => ({
          name: r.name,
          freeSlots: r.freeSlots,
        })) : undefined,
      });
    }

    res.json({ days: result, query: { start, end, q } });
  } catch (err) {
    next(err);
  }
}
