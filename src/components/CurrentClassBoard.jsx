import { useEffect, useState } from 'react';
import { computeCurrentAndNext, formatMinutes, minutesNow, todayName } from '../utils/time';

function Flap({ text, size = 'base' }) {
  // Truncate very long names so the chars don't overflow on narrow screens
  const MAX_CHARS = 24;
  const display = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS - 1) + '…' : text;
  const chars = display.toUpperCase().split('');
  const sizing = size === 'lg'
    ? 'w-5 h-7 text-base sm:w-6 sm:h-8 sm:text-lg'
    : 'w-3.5 h-5 text-[11px]';
  return (
    <span className="flap inline-flex flex-wrap gap-0.5">
      {chars.map((c, i) => (
        <span
          key={i}
          className={`flap-char flap-anim flex items-center justify-center font-mono font-semibold ${sizing}`}
        >
          {c === ' ' ? '\u00A0' : c}
        </span>
      ))}
    </span>
  );
}

export default function CurrentClassBoard({ sessions }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const now = minutesNow();
  const today = todayName();
  const { current, next } = computeCurrentAndNext(sessions, now, today);

  const remaining = current ? current.end - now : null;

  return (
    <div className="rounded-2xl bg-ink-950 border border-ink-800 p-4 sm:p-5 text-paper-50 shadow-card">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow text-amber-400 text-[10px] sm:text-[11px]">
          Right now · {today || 'Weekend'}
        </span>
        <span className="font-mono text-xs font-bold text-slate2-300">{formatMinutes(now)}</span>
      </div>

      {current ? (
        <div>
          {/* Course name as flap board — wraps on mobile */}
          <div className="overflow-hidden">
            <Flap text={current.courseName || current.name} size="lg" />
          </div>

          {/* Meta row — stacks on very narrow screens */}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper-200">
            <span className="font-mono text-amber-400">{current.code}</span>
            <span className="truncate max-w-[140px] sm:max-w-none">{current.faculty}</span>
            <span className="font-mono">Rm {current.room}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.max(4, 100 - (remaining / (current.end - current.start)) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold text-slate2-300 whitespace-nowrap shrink-0">
              {remaining} min left
            </span>
          </div>
        </div>
      ) : (
        <div className="text-paper-300 font-display text-base sm:text-lg py-1">
          No class in session
        </div>
      )}

      {/* Next up */}
      <div className="mt-4 pt-3 border-t border-ink-800 flex items-center justify-between gap-3">
        <span className="eyebrow shrink-0">Next up</span>
        {next ? (
          <span className="text-xs text-paper-200 text-right min-w-0">
            <span className="font-medium line-clamp-1">{next.courseName || next.name}</span>
            <span className="font-mono text-[10px] block">
              {next.day !== today && (
                <span className="font-bold text-slate2-300">{next.day.slice(0, 3)} · </span>
              )}
              <span className="font-bold text-slate2-300">{formatMinutes(next.start)}</span>
            </span>
          </span>
        ) : (
          <span className="text-xs text-slate2-400">Nothing scheduled</span>
        )}
      </div>
    </div>
  );
}
