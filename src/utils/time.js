// Converts "H:MM" or "HH:MM" college-clock strings (1-7 implicitly PM, 8-12 as-is) to minutes since midnight.
export function toMinutes(hStr) {
  const [h, m] = hStr.trim().split(':').map(Number);
  let hour = h;
  if (hour >= 1 && hour <= 7) hour += 12; // 1:xx - 7:xx are afternoon slots on this campus clock
  return hour * 60 + (m || 0);
}

export function formatMinutes(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// Parses a range like "10:00 - 11:40" -> { start, end } in minutes
export function parseRange(rangeStr) {
  if (!rangeStr) return null;
  const parts = rangeStr.split('-').map((s) => s.trim());
  if (parts.length !== 2) return null;
  return { start: toMinutes(parts[0]), end: toMinutes(parts[1]) };
}

const DAY_MAP = {
  mon: 'Monday', monday: 'Monday',
  tue: 'Tuesday', tuesday: 'Tuesday',
  wed: 'Wednesday', wednesday: 'Wednesday',
  thu: 'Thursday', thur: 'Thursday', thursday: 'Thursday',
  fri: 'Friday', friday: 'Friday',
  sat: 'Saturday', saturday: 'Saturday',
  sun: 'Sunday', sunday: 'Sunday',
};

export function normalizeDay(d) {
  if (!d) return null;
  const key = d.trim().toLowerCase();
  return DAY_MAP[key] || null;
}

export const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Parses a "slots" cell from student_selections.csv, e.g.
// "FRI 13:00-13:50; MON 10:00-10:50; THU 09:00-09:50"
// Note: these times are already in a plain 24h-ish HH:MM-HH:MM form (no PM ambiguity).
export function parseStudentSlots(slotsStr) {
  if (!slotsStr) return [];
  return slotsStr
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [dayRaw, range] = chunk.split(/\s+(.+)/);
      const day = normalizeDay(dayRaw);
      if (!day || !range) return null;
      const [startStr, endStr] = range.split('-').map((s) => s.trim());
      const start = parseSimpleTime(startStr);
      const end = parseSimpleTime(endStr);
      if (start == null || end == null) return null;
      return { day, start, end };
    })
    .filter(Boolean);
}

// Plain "HH:MM" 24-hour parser (used for the already-unambiguous student_selections slots)
function parseSimpleTime(str) {
  if (!str) return null;
  const [h, m] = str.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

export function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// Given a flat list of {day, start, end, ...} sessions, finds the one happening
// right now and the next one coming up (today, otherwise the next class day).
export function computeCurrentAndNext(sessions, now, today) {
  if (!today) return { current: null, next: null };
  const todays = sessions.filter((s) => s.day === today).sort((a, b) => a.start - b.start);
  const current = todays.find((s) => s.start <= now && now < s.end) || null;
  let next = todays.find((s) => s.start > now) || null;
  if (!next) {
    const idx = DAY_ORDER.indexOf(today);
    for (let i = 1; i <= DAY_ORDER.length; i++) {
      const day = DAY_ORDER[(idx + i) % DAY_ORDER.length];
      const found = sessions.filter((s) => s.day === day).sort((a, b) => a.start - b.start)[0];
      if (found) {
        next = found;
        break;
      }
    }
  }
  return { current, next };
}

export function todayName() {
  const dow = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  if (dow === 0) return null; // no classes modeled on Sunday
  return DAY_ORDER[dow - 1] || null;
}
