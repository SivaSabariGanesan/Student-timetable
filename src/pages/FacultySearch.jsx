import { useMemo, useState } from 'react';
import { FiUser, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import { findAttendees } from '../services/dataStore';
import FacultyCard from '../components/FacultyCard';
import { DAY_ORDER, formatMinutes } from '../utils/time';

export default function FacultySearch() {
  const { store } = useData();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const faculty = useMemo(() => {
    const list = Array.from(store.byFaculty, ([name, rows]) => ({ name, count: rows.length }));
    const query = q.trim().toLowerCase();
    const filtered = query ? list.filter((f) => f.name.toLowerCase().includes(query)) : list;
    return filtered.sort((a, b) => b.count - a.count);
  }, [store, q]);

  const schedule = useMemo(() => {
    if (!selected) return [];
    const rows = store.byFaculty.get(selected) || [];
    return [...rows].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start - b.start
    );
  }, [store, selected]);

  const showDetail = selected !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Faculty search</h1>
        <p className="text-sm text-slate2-500 mt-1">Find a faculty member to see their weekly teaching load.</p>
      </div>

      {!showDetail && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Dr Kumar"
          className="w-full sm:max-w-sm px-4 py-3 rounded-xl border rule bg-white dark:bg-ink-800 outline-none focus:ring-2 focus:ring-amber-400/60"
        />
      )}

      {/* ── Mobile: drill-down ── */}
      <div className="lg:hidden">
        {!showDetail ? (
          <div className="space-y-2">
            {faculty.slice(0, 60).map((f) => (
              <FacultyCard
                key={f.name}
                name={f.name}
                count={f.count}
                active={false}
                onClick={() => setSelected(f.name)}
              />
            ))}
            {faculty.length === 0 && (
              <p className="text-sm text-slate2-500 py-6 text-center">No faculty match "{q}".</p>
            )}
          </div>
        ) : (
          <div className="card p-4">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-slate2-500 hover:text-ink-900 dark:hover:text-paper-100 mb-4"
            >
              <FiArrowLeft size={14} /> Back to faculty
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="text-amber-500 shrink-0" />
              <h2 className="font-display text-lg font-semibold">{selected}</h2>
            </div>
            <FacultySchedule schedule={schedule} store={store} />
          </div>
        )}
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
          {faculty.slice(0, 60).map((f) => (
            <FacultyCard
              key={f.name}
              name={f.name}
              count={f.count}
              active={selected === f.name}
              onClick={() => setSelected(f.name)}
            />
          ))}
          {faculty.length === 0 && (
            <p className="text-sm text-slate2-500 py-6 text-center">No faculty match "{q}".</p>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card p-8 text-center text-slate2-500 h-full flex items-center justify-center">
              <p className="text-sm">Pick a faculty member on the left to see their timetable.</p>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="text-amber-500 shrink-0" />
                <h2 className="font-display text-lg font-semibold">{selected}</h2>
              </div>
              <FacultySchedule schedule={schedule} store={store} scrollable />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FacultySchedule({ schedule, store, scrollable = false }) {
  return (
    <div className={`space-y-2 ${scrollable ? 'max-h-[60vh] overflow-y-auto scrollbar-thin' : ''}`}>
      {schedule.map((row, i) => {
        const attendees = findAttendees(store, row);
        return (
          <div key={i} className="border rule rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="eyebrow">{row.day}</span>
                <div className="font-medium mt-0.5 break-words">{row.name}</div>
                <div className="text-xs text-slate2-500 font-mono mt-0.5">
                  {row.code} · Room {row.room}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm text-slate2-500 whitespace-nowrap">
                  {formatMinutes(row.start)}–{formatMinutes(row.end)}
                </div>
                <div className="text-xs text-slate2-400 flex items-center gap-1 justify-end mt-0.5">
                  <FiUsers size={11} /> ~{attendees.length || row.studentCount || '—'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {schedule.length === 0 && (
        <p className="text-sm text-slate2-500 py-6 text-center">No sessions found.</p>
      )}
    </div>
  );
}
