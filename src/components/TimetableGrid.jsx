import { useMemo, useState } from 'react';
import { DAY_ORDER, formatMinutes } from '../utils/time';
import { colorForCode } from '../utils/colors';
import { FiMapPin, FiUser, FiClock } from 'react-icons/fi';

const DAY_START = 8 * 60;   // 8:00 AM
const DAY_END   = 17 * 60;  // 5:00 PM
const PX_PER_MIN = 1.6;
const HOUR_MARKS = Array.from({ length: 10 }, (_, i) => DAY_START + i * 60);

/**
 * Groups sessions into clusters of overlapping sessions and assigns each a lane.
 */
function assignLanes(sessions) {
  if (!sessions.length) return [];

  const sorted = [...sessions].map((s, originalIdx) => ({ s, originalIdx }))
    .sort((a, b) => a.s.start - b.s.start || a.s.end - b.s.end);

  const n = sorted.length;
  const overlaps = (a, b) => a.start < b.end && a.end > b.start;

  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(x, y) { parent[find(x)] = find(y); }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (overlaps(sorted[i].s, sorted[j].s)) union(i, j);
    }
  }

  const clusterLanes = new Map();

  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!clusterLanes.has(root)) clusterLanes.set(root, []);
    const lanes = clusterLanes.get(root);
    let lane = lanes.findIndex((endTime) => endTime <= sorted[i].s.start);
    if (lane === -1) { lane = lanes.length; lanes.push(0); }
    lanes[lane] = sorted[i].s.end;
    result[i] = { session: sorted[i].s, lane, clusterRoot: root };
  }

  const clusterWidth = new Map();
  for (let i = 0; i < n; i++) {
    const { clusterRoot, lane } = result[i];
    clusterWidth.set(clusterRoot, Math.max(clusterWidth.get(clusterRoot) || 1, lane + 1));
  }

  return result.map((r) => ({ ...r, totalLanes: clusterWidth.get(r.clusterRoot) }));
}

export default function TimetableGrid({ sessions, todayLabel }) {
  const [selected, setSelected] = useState(null);

  const daysPresent = useMemo(() => {
    const present = new Set(sessions.map((s) => s.day));
    return DAY_ORDER.filter((d) => (d === 'Saturday' ? present.has(d) : true));
  }, [sessions]);

  const byDay = useMemo(() => {
    const map = new Map(daysPresent.map((d) => [d, []]));
    for (const s of sessions) {
      if (map.has(s.day)) map.get(s.day).push(s);
    }
    return map;
  }, [sessions, daysPresent]);

  const lanesByDay = useMemo(() => {
    const map = new Map();
    for (const [day, daySessions] of byDay) {
      map.set(day, assignLanes(daySessions));
    }
    return map;
  }, [byDay]);

  const totalHeight = (DAY_END - DAY_START) * PX_PER_MIN;

  // ── Mobile: grouped list by day ──────────────────────────────────────────
  const mobileView = useMemo(() => {
    return daysPresent.map((day) => {
      const daySessions = (byDay.get(day) || []).slice().sort((a, b) => a.start - b.start);
      return { day, sessions: daySessions };
    });
  }, [daysPresent, byDay]);

  return (
    <div className="card overflow-hidden">

      {/* ── Mobile: day-by-day accordion list ─────────────────────────── */}
      <div className="sm:hidden divide-y divide-ink-900/10 dark:divide-paper-100/10">
        {mobileView.map(({ day, sessions: daySessions }) => (
          <MobileDaySection
            key={day}
            day={day}
            sessions={daySessions}
            isToday={day === todayLabel}
            selected={selected}
            setSelected={setSelected}
          />
        ))}
      </div>

      {/* ── Desktop: the full pixel-grid timetable ─────────────────────── */}
      <div className="hidden sm:block overflow-x-auto scrollbar-thin">
        <div className="min-w-[720px]">

          {/* Day header row */}
          <div
            className="grid border-b rule"
            style={{ gridTemplateColumns: `56px repeat(${daysPresent.length}, 1fr)` }}
          >
            <div />
            {daysPresent.map((d) => (
              <div
                key={d}
                className={`px-2 py-3 text-center border-l rule ${d === todayLabel ? 'bg-amber-400/10' : ''}`}
              >
                <div className={`font-display font-semibold text-sm ${d === todayLabel ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  {d.slice(0, 3)}
                  <span className="hidden sm:inline">{d.slice(3)}</span>
                </div>
                {d === todayLabel && (
                  <div className="eyebrow text-amber-600 dark:text-amber-400 text-[10px]">Today</div>
                )}
              </div>
            ))}
          </div>

          {/* Time axis + day columns */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${daysPresent.length}, 1fr)` }}>

            {/* Time labels column */}
            <div className="relative select-none" style={{ height: totalHeight }}>
              {HOUR_MARKS.map((m) => (
                <div
                  key={m}
                  className="absolute right-1.5 text-[10px] font-mono text-slate2-400 leading-none"
                  style={{ top: (m - DAY_START) * PX_PER_MIN - 5 }}
                >
                  {formatMinutes(m).replace(':00', '').replace(' ', '\u202F')}
                </div>
              ))}
            </div>

            {/* One column per day */}
            {daysPresent.map((day) => (
              <div key={day} className="relative border-l rule" style={{ height: totalHeight }}>

                {/* Hour grid lines */}
                {HOUR_MARKS.map((m) => (
                  <div
                    key={m}
                    className="absolute inset-x-0 border-t rule pointer-events-none"
                    style={{ top: (m - DAY_START) * PX_PER_MIN }}
                  />
                ))}

                {/* Session blocks */}
                {(lanesByDay.get(day) || []).map(({ session: s, lane, totalLanes }, idx) => {
                  const clampedStart = Math.max(s.start, DAY_START);
                  const clampedEnd   = Math.min(s.end,   DAY_END);
                  const top  = (clampedStart - DAY_START) * PX_PER_MIN;
                  const h    = Math.max((clampedEnd - clampedStart) * PX_PER_MIN, 44);
                  const c    = colorForCode(s.code);

                  const leftPct  = (lane / totalLanes) * 100;
                  const widthPct = (1 / totalLanes) * 100;
                  const GAP = totalLanes > 1 ? 1 : 2;

                  return (
                    <button
                      key={`${s.code}-${s.day}-${s.start}-${idx}`}
                      onClick={() => setSelected(selected?.code === s.code && selected?.start === s.start && selected?.day === s.day ? null : s)}
                      className={`absolute rounded-md border ${c.bg} ${c.border} px-1.5 py-0.5 text-left overflow-hidden hover:z-20 hover:shadow-lg transition-shadow focus:outline-none`}
                      style={{
                        top,
                        height: h,
                        left:  `calc(${leftPct}%  + ${GAP}px)`,
                        width: `calc(${widthPct}% - ${GAP * 2}px)`,
                        zIndex: selected?.code === s.code && selected?.start === s.start ? 10 : 1,
                      }}
                    >
                      <p className={`text-[11px] font-semibold leading-tight ${c.text} truncate`}>
                        {s.courseName || s.name}
                      </p>
                      <p className="text-[9px] font-mono text-ink-700/60 dark:text-paper-200/60 truncate mt-px">
                        {s.code}
                      </p>
                      {h >= 54 && (
                        <p className="text-[9px] text-ink-700/60 dark:text-paper-200/60 truncate flex items-center gap-0.5 mt-0.5">
                          <FiMapPin size={8} className="shrink-0" />
                          {s.room}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel — shown on desktop when a block is tapped */}
      {selected && (
        <div className="hidden sm:flex border-t rule p-4 flex-wrap items-start gap-x-6 gap-y-2 bg-paper-100/60 dark:bg-ink-900/60">
          <div className="min-w-0">
            <div className="font-display font-semibold leading-tight">{selected.courseName || selected.name}</div>
            <div className="eyebrow mt-0.5">{selected.code}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-700 dark:text-paper-200">
            <FiUser size={13} className="shrink-0" />
            <span className="truncate">{selected.faculty}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-700 dark:text-paper-200">
            <FiMapPin size={13} className="shrink-0" />
            <span className="truncate">{selected.room}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono text-slate2-500">
            <FiClock size={13} className="shrink-0" />
            {formatMinutes(selected.start)} – {formatMinutes(selected.end)}
          </div>
          <button
            onClick={() => setSelected(null)}
            className="ml-auto text-xs text-slate2-400 hover:text-ink-900 dark:hover:text-paper-100 px-3 py-2 rounded-lg"
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mobile day section ────────────────────────────────────────────────────────
function MobileDaySection({ day, sessions, isToday, selected, setSelected }) {
  const [open, setOpen] = useState(isToday);
  const c_today = isToday
    ? 'bg-amber-400/10 text-amber-600 dark:text-amber-400'
    : 'text-ink-700 dark:text-paper-200';

  return (
    <div>
      {/* Day header — tap to expand/collapse */}
      <button
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${c_today}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-display font-semibold text-sm">
          {day}
          {isToday && <span className="ml-2 eyebrow text-amber-500 dark:text-amber-400">Today</span>}
        </span>
        <span className="flex items-center gap-2">
          <span className="eyebrow">{sessions.length} class{sessions.length !== 1 ? 'es' : ''}</span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate2-400 text-center py-3">No classes</p>
          ) : (
            sessions.map((s, idx) => {
              const c = colorForCode(s.code);
              const isSelected = selected?.code === s.code && selected?.start === s.start && selected?.day === s.day;
              return (
                <button
                  key={`${s.code}-${s.start}-${idx}`}
                  onClick={() => setSelected(isSelected ? null : s)}
                  className={`w-full text-left rounded-xl border-l-4 ${c.border} ${c.bg} px-3 py-2.5 focus:outline-none`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-tight ${c.text} flex-1 min-w-0`}>
                      {s.courseName || s.name}
                    </p>
                    <span className="font-mono text-[10px] text-ink-700/60 dark:text-paper-200/60 shrink-0 whitespace-nowrap">
                      {formatMinutes(s.start)}–{formatMinutes(s.end)}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-ink-700/60 dark:text-paper-200/60 mt-0.5">{s.code}</p>

                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-ink-900/10 dark:border-paper-100/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-paper-200">
                        <FiUser size={11} className="shrink-0" />{s.faculty}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-paper-200">
                        <FiMapPin size={11} className="shrink-0" />Room {s.room}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
