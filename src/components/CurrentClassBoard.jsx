import { useEffect, useState } from 'react';
import { computeCurrentAndNext, formatMinutes, minutesNow, todayName } from '../utils/time';

function Flap({ text, size = 'base' }) {
  const chars = text.toUpperCase().split('');
  const sizing = size === 'lg' ? 'w-6 h-8 text-lg sm:w-7 sm:h-9 sm:text-xl' : 'w-4 h-6 text-xs';
  return (
    <span className="flap inline-flex gap-0.5">
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
    <div className="rounded-2xl bg-ink-950 border border-ink-800 p-5 sm:p-6 text-paper-50 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow text-amber-400">Right now · {today || 'Weekend'}</span>
        <span className="font-mono text-xs text-slate2-400">{formatMinutes(now)}</span>
      </div>

      {current ? (
        <div>
          <Flap text={current.courseName || current.name} size="lg" />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-paper-200">
            <span className="font-mono text-amber-400">{current.code}</span>
            <span>{current.faculty}</span>
            <span>Room {current.room}</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.max(4, 100 - (remaining / (current.end - current.start)) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs text-slate2-400 whitespace-nowrap">{remaining} min left</span>
          </div>
        </div>
      ) : (
        <div className="text-paper-300 font-display text-lg">No class in session</div>
      )}

      <div className="mt-5 pt-4 border-t border-ink-800 flex items-center justify-between">
        <span className="eyebrow">Next up</span>
        {next ? (
          <span className="text-sm text-paper-200 text-right">
            <span className="font-medium">{next.courseName || next.name}</span>{' '}
            <span className="text-slate2-400 font-mono">{next.day !== today ? `${next.day.slice(0, 3)} ` : ''}{formatMinutes(next.start)}</span>
          </span>
        ) : (
          <span className="text-sm text-slate2-400">Nothing scheduled</span>
        )}
      </div>
    </div>
  );
}
