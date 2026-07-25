import { useMemo, useState } from 'react';
import { DAY_ORDER, formatMinutes } from '../utils/time';
import { colorForCode } from '../utils/colors';
import { FiMapPin, FiUser } from 'react-icons/fi';

const DAY_START = 8 * 60; // 8:00
const DAY_END = 17 * 60; // 17:00
const PX_PER_MIN = 1.15;
const HOUR_MARKS = Array.from({ length: 10 }, (_, i) => DAY_START + i * 60);

export default function TimetableGrid({ sessions, activeDay, todayLabel }) {
  const [selected, setSelected] = useState(null);

  const daysPresent = useMemo(() => {
    const present = new Set(sessions.map((s) => s.day));
    return DAY_ORDER.filter((d) => d === 'Saturday' ? present.has(d) : true);
  }, [sessions]);

  const byDay = useMemo(() => {
    const map = new Map(daysPresent.map((d) => [d, []]));
    for (const s of sessions) {
      if (!map.has(s.day)) map.set(s.day, []);
      map.get(s.day).push(s);
    }
    return map;
  }, [sessions, daysPresent]);

  const height = (DAY_END - DAY_START) * PX_PER_MIN;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[720px]">
          <div
            className="grid sticky top-16 z-10 bg-white dark:bg-ink-800 border-b rule"
            style={{ gridTemplateColumns: `64px repeat(${daysPresent.length}, 1fr)` }}
          >
            <div />
            {daysPresent.map((d) => (
              <div
                key={d}
                className={`px-3 py-3 text-center border-l rule ${d === todayLabel ? 'bg-amber-400/10' : ''}`}
              >
                <div className={`font-display font-semibold text-sm ${d === todayLabel ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  {d}
                </div>
                {d === todayLabel && <div className="eyebrow text-amber-600 dark:text-amber-400">Today</div>}
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: `64px repeat(${daysPresent.length}, 1fr)` }}>
            <div className="relative" style={{ height }}>
              {HOUR_MARKS.map((m) => (
                <div
                  key={m}
                  className="absolute right-2 -translate-y-2 text-[11px] font-mono text-slate2-400"
                  style={{ top: (m - DAY_START) * PX_PER_MIN }}
                >
                  {formatMinutes(m).replace(':00', '')}
                </div>
              ))}
            </div>
            {daysPresent.map((day) => (
              <div key={day} className="relative border-l rule" style={{ height }}>
                {HOUR_MARKS.map((m) => (
                  <div
                    key={m}
                    className="absolute w-full border-t rule"
                    style={{ top: (m - DAY_START) * PX_PER_MIN }}
                  />
                ))}
                {(byDay.get(day) || []).map((s, idx) => {
                  const top = (Math.max(s.start, DAY_START) - DAY_START) * PX_PER_MIN;
                  const h = Math.max((s.end - s.start) * PX_PER_MIN, 34);
                  const c = colorForCode(s.code);
                  return (
                    <button
                      key={`${s.code}-${s.day}-${s.start}-${idx}`}
                      onClick={() => setSelected(s)}
                      className={`absolute left-0.5 right-0.5 rounded-lg border ${c.bg} ${c.border} px-2 py-1 text-left overflow-hidden hover:z-20 hover:shadow-card transition-shadow`}
                      style={{ top, height: h }}
                    >
                      <div className={`text-[11px] font-semibold leading-tight ${c.text} truncate`}>{s.courseName || s.name}</div>
                      <div className="text-[10px] font-mono text-ink-700/70 dark:text-paper-200/70 truncate">{s.code}</div>
                      {h > 46 && (
                        <div className="text-[10px] text-ink-700/70 dark:text-paper-200/70 truncate flex items-center gap-1 mt-0.5">
                          <FiMapPin size={9} /> {s.room}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="border-t rule p-4 flex flex-wrap items-center gap-x-6 gap-y-2 bg-paper-100/60 dark:bg-ink-900/60">
          <div>
            <div className="font-display font-semibold">{selected.courseName || selected.name}</div>
            <div className="eyebrow">{selected.code}</div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-700 dark:text-paper-200">
            <FiUser size={14} /> {selected.faculty}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-700 dark:text-paper-200">
            <FiMapPin size={14} /> {selected.room}
          </div>
          <div className="text-sm font-mono text-slate2-500">
            {formatMinutes(selected.start)} – {formatMinutes(selected.end)}
          </div>
          <button onClick={() => setSelected(null)} className="ml-auto text-xs text-slate2-500 hover:text-ink-900 dark:hover:text-paper-100">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
