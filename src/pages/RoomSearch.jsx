import { useMemo, useState } from 'react';
import { FiMapPin, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import { findAttendees } from '../services/dataStore';
import RoomCard from '../components/RoomCard';
import { DAY_ORDER, formatMinutes } from '../utils/time';

export default function RoomSearch() {
  const { store } = useData();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const rooms = useMemo(() => {
    const list = Array.from(store.byRoom, ([name, rows]) => ({
      name,
      count: rows.length,
      block: rows[0]?.block,
    }));
    const query = q.trim().toLowerCase();
    const filtered = query ? list.filter((r) => r.name.toLowerCase().includes(query)) : list;
    return filtered.sort((a, b) => b.count - a.count);
  }, [store, q]);

  const schedule = useMemo(() => {
    if (!selected) return [];
    const rows = store.byRoom.get(selected) || [];
    return [...rows].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start - b.start
    );
  }, [store, selected]);

  const attendeeCounts = useMemo(
    () => schedule.map((row) => findAttendees(store, row).length),
    [store, schedule]
  );

  // On mobile we show either the list OR the detail panel, not both at once
  const showDetail = selected !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Room search</h1>
        <p className="text-sm text-slate2-500 mt-1">Look up any room to see its full weekly occupancy.</p>
      </div>

      {/* Search — hidden on mobile when viewing detail */}
      {!showDetail && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. B-302 or A Block"
          className="w-full sm:max-w-sm px-4 py-3 rounded-xl border rule bg-white dark:bg-ink-800 outline-none focus:ring-2 focus:ring-amber-400/60"
        />
      )}

      {/* ── Mobile: drill-down (list → detail) ── */}
      <div className="lg:hidden">
        {!showDetail ? (
          <div className="space-y-2">
            {rooms.slice(0, 60).map((r) => (
              <RoomCard
                key={r.name}
                room={r.name}
                count={r.count}
                block={r.block}
                active={false}
                onClick={() => setSelected(r.name)}
              />
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-slate2-500 py-6 text-center">No rooms match "{q}".</p>
            )}
          </div>
        ) : (
          <div className="card p-4">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate2-500 hover:text-ink-900 dark:hover:text-paper-100 mb-4 rounded-lg hover:bg-ink-900/5 dark:hover:bg-paper-100/10"
            >
              <FiArrowLeft size={14} /> Back to rooms
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FiMapPin className="text-amber-500 shrink-0" />
              <h2 className="font-display text-lg font-semibold">{selected}</h2>
            </div>
            <DetailSchedule schedule={schedule} attendeeCounts={attendeeCounts} />
          </div>
        )}
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
          {rooms.slice(0, 60).map((r) => (
            <RoomCard
              key={r.name}
              room={r.name}
              count={r.count}
              block={r.block}
              active={selected === r.name}
              onClick={() => setSelected(r.name)}
            />
          ))}
          {rooms.length === 0 && (
            <p className="text-sm text-slate2-500 py-6 text-center">No rooms match "{q}".</p>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card p-8 text-center text-slate2-500 h-full flex items-center justify-center">
              <p className="text-sm">Pick a room on the left to see its timetable.</p>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="text-amber-500 shrink-0" />
                <h2 className="font-display text-lg font-semibold">{selected}</h2>
              </div>
              <DetailSchedule schedule={schedule} attendeeCounts={attendeeCounts} scrollable />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSchedule({ schedule, attendeeCounts, scrollable = false }) {
  return (
    <div className={`space-y-2 ${scrollable ? 'max-h-[60vh] overflow-y-auto scrollbar-thin' : ''}`}>
      {schedule.map((row, i) => (
        <div key={i} className="border rule rounded-xl p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="eyebrow font-bold">{row.day}</span>
              <div className="font-medium mt-0.5 break-words">{row.name}</div>
              <div className="text-xs text-slate2-500 font-mono mt-0.5 break-all">
                {row.code} · {row.faculty}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-sm font-bold text-slate2-600 dark:text-slate2-300 whitespace-nowrap">
                {formatMinutes(row.start)}–{formatMinutes(row.end)}
              </div>
              <div className="text-xs text-slate2-400 flex items-center gap-1 justify-end mt-0.5">
                <FiUsers size={11} /> ~{attendeeCounts[i] || row.studentCount || '—'}
              </div>
            </div>
          </div>
        </div>
      ))}
      {schedule.length === 0 && (
        <p className="text-sm text-slate2-500 py-6 text-center">No sessions found.</p>
      )}
    </div>
  );
}
