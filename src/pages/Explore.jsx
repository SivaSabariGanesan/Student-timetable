import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import FilterPanel, { TIME_SLOTS } from '../components/FilterPanel';
import { colorForCode } from '../utils/colors';
import { formatMinutes } from '../utils/time';

const EMPTY = { q: '', day: '', time: '', room: '', faculty: '', semester: '', department: '', section: '' };
const RESULT_CAP = 250;

function parseSlot(slot) {
  const [s, e] = slot.split('-');
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

export default function Explore() {
  const { store } = useData();
  const [filters, setFilters] = useState(EMPTY);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearAll = () => setFilters(EMPTY);

  const timeRange = filters.time ? parseSlot(filters.time) : null;

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const out = [];
    for (const s of store.flatSessions) {
      if (q && !s.reg.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) continue;
      if (filters.day && s.day !== filters.day) continue;
      if (timeRange && !(s.start < timeRange.end && s.end > timeRange.start)) continue;
      if (filters.room && s.room !== filters.room) continue;
      if (filters.faculty && s.faculty !== filters.faculty) continue;
      if (filters.semester && String(s.semester) !== filters.semester) continue;
      if (filters.department && s.deptName !== filters.department) continue;
      if (filters.section && s.section !== filters.section) continue;
      out.push(s);
      if (out.length >= RESULT_CAP) break;
    }
    return out;
  }, [store, filters, timeRange]);

  const anyActive = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Explore the timetable</h1>
        <p className="text-sm text-slate2-500 mt-1">Combine filters — try Day + Time to see who's in class at a given hour.</p>
      </div>

      <FilterPanel filters={filters} setFilter={setFilter} clearAll={clearAll} facets={store.facets} />

      {!anyActive ? (
        <div className="text-center py-16 text-slate2-500 text-sm">Set at least one filter to see matching class sessions.</div>
      ) : (
        <div>
          <div className="eyebrow mb-2">
            {filtered.length >= RESULT_CAP ? `Showing first ${RESULT_CAP} matches` : `${filtered.length} matches`}
          </div>
          <div className="card divide-y rule overflow-hidden">
            {filtered.map((s, i) => {
              const c = colorForCode(s.code);
              return (
                <Link
                  key={`${s.reg}-${s.code}-${s.day}-${s.start}-${i}`}
                  to={`/students/${s.reg}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-ink-900/5 dark:hover:bg-paper-100/5 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <span className="font-mono text-xs text-slate2-500 w-28 shrink-0">{s.reg}</span>
                  <span className="font-medium min-w-[10rem] flex-1">{s.name}</span>
                  <span className="text-sm text-slate2-500 truncate min-w-[9rem] flex-1">{s.courseName}</span>
                  <span className="text-xs text-slate2-400 hidden sm:inline">{s.faculty}</span>
                  <span className="text-xs font-mono text-slate2-400 w-16 shrink-0">Rm {s.room}</span>
                  <span className="text-xs font-mono w-16 shrink-0 text-right">{s.day.slice(0, 3)}</span>
                  <span className="text-xs font-mono w-32 shrink-0 text-right">{formatMinutes(s.start)}–{formatMinutes(s.end)}</span>
                </Link>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-slate2-500 py-8 text-center">No sessions match these filters.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
