import { useMemo, useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import { DAY_ORDER, formatMinutes } from '../utils/time';

const SLOT_PRESETS = [
  { label: '8:00 – 8:50', start: 480, end: 530 },
  { label: '9:00 – 9:50', start: 540, end: 590 },
  { label: '10:00 – 10:50', start: 600, end: 650 },
  { label: '11:00 – 11:50', start: 660, end: 710 },
  { label: '12:00 – 12:50', start: 720, end: 770 },
  { label: '1:00 – 1:50', start: 780, end: 830 },
  { label: '2:00 – 2:50', start: 840, end: 890 },
  { label: '3:00 – 3:50', start: 900, end: 950 },
  { label: '4:00 – 4:50', start: 960, end: 1010 },
];

export default function FreeRooms() {
  const { store } = useData();
  const [day, setDay] = useState(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 6 ? DAY_ORDER[today - 1] : 'Monday';
  });
  const [slot, setSlot] = useState(null);
  const [q, setQ] = useState('');

  const rooms = useMemo(() => {
    const list = Array.from(store.byRoom, ([name, sessions]) => {
      const daySessions = sessions.filter((s) => s.day === day);

      const busyIntervals = daySessions
        .map((s) => ({ start: s.start, end: s.end }))
        .sort((a, b) => a.start - b.start);

      const freeSlots = [];
      let cursor = 480;
      for (const b of busyIntervals) {
        if (cursor < b.start) {
          freeSlots.push({ start: cursor, end: b.start });
        }
        cursor = Math.max(cursor, b.end);
      }
      if (cursor < 1020) freeSlots.push({ start: cursor, end: 1020 });

      const free = slot
        ? !daySessions.some((s) => s.start < slot.end && s.end > slot.start)
        : null;

      return { name, block: sessions[0]?.block, freeSlots, free, daySessions };
    });

    const query = q.trim().toLowerCase();
    const filtered = query ? list.filter((r) => r.name.toLowerCase().includes(query)) : list;

    if (slot) {
      filtered.sort((a, b) => (a.free === b.free ? 0 : a.free ? -1 : 1));
    }

    return filtered;
  }, [store, day, slot, q]);

  const freeRooms = slot ? rooms.filter((r) => r.free) : null;

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Free Rooms</h1>
        <p className="text-sm text-slate2-500 mt-1">Find available rooms by day and time slot.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {DAY_ORDER.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              day === d
                ? 'bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950'
                : 'border rule hover:bg-ink-900/5 dark:hover:bg-paper-100/10'
            }`}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="eyebrow mr-1">Time slot:</span>
        <button
          onClick={() => setSlot(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !slot
              ? 'bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950'
              : 'border rule hover:bg-ink-900/5 dark:hover:bg-paper-100/10'
          }`}
        >
          All slots
        </button>
        {SLOT_PRESETS.map((s) => (
          <button
            key={s.label}
            onClick={() => setSlot(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              slot?.label === s.label
                ? 'bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950'
                : 'border rule hover:bg-ink-900/5 dark:hover:bg-paper-100/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search rooms…"
        className="w-full sm:max-w-sm px-4 py-3 rounded-xl border rule bg-white dark:bg-ink-800 outline-none focus:ring-2 focus:ring-amber-400/60 text-sm"
      />

      {slot && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">{day}</span>
          <span className="font-mono text-slate2-500">{slot.label}</span>
          <span className="text-slate2-400">—</span>
          <span className="text-good font-medium">{freeRooms?.length || 0} rooms free</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => (
          <div
            key={r.name}
            className={`card p-4 transition-shadow ${
              slot ? (r.free ? 'border-good/30' : 'opacity-50') : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono font-medium text-sm">{r.name}</div>
                {r.block && (
                  <div className="text-xs text-slate2-500 mt-0.5">{r.block}</div>
                )}
              </div>
              {slot && (
                <div className="shrink-0">
                  {r.free ? (
                    <FiCheckCircle className="text-good" size={18} />
                  ) : (
                    <FiXCircle className="text-bad/60" size={18} />
                  )}
                </div>
              )}
            </div>

            {!slot && (
              <div className="mt-3 space-y-1">
                {r.freeSlots.length === 0 ? (
                  <div className="text-xs text-slate2-400 italic">Occupied all day</div>
                ) : (
                  r.freeSlots.slice(0, 6).map((fs, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate2-500 font-mono"
                    >
                      <FiClock size={11} className="shrink-0 text-good" />
                      <span>
                        {formatMinutes(fs.start)} – {formatMinutes(fs.end)}
                      </span>
                    </div>
                  ))
                )}
                {r.freeSlots.length > 6 && (
                  <div className="text-xs text-slate2-400 pl-4">
                    +{r.freeSlots.length - 6} more
                  </div>
                )}
              </div>
            )}

            {slot && r.daySessions.length > 0 && (
              <div className="mt-2 text-xs text-slate2-400">
                {r.daySessions.length} session{r.daySessions.length > 1 ? 's' : ''} today
              </div>
            )}
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-slate2-500">
            No rooms match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
