export default function LoadingSkeleton({ progress }) {
  const rows = [
    ['Student selections', progress.selections, 61773],
    ['Theory schedule', progress.theory, 3030],
    ['Lab schedule', progress.lab, 1136],
  ];
  const building = progress.building || 0;
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-display font-semibold text-ink-950">R</div>
          <div>
            <div className="font-display text-lg text-paper-50 leading-none">Rajalakshmi</div>
            <div className="eyebrow text-slate2-400">Timetable Portal</div>
          </div>
        </div>
        <div className="space-y-4">
          {rows.map(([label, n, total]) => (
            <div key={label}>
              <div className="flex justify-between text-xs font-mono text-slate2-400 mb-1.5">
                <span>{label}</span>
                <span>{Math.min(n, total).toLocaleString()} rows</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (n / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {building > 0 && (
            <div>
              <div className="flex justify-between text-xs font-mono text-slate2-400 mb-1.5">
                <span>Building index</span>
                <span>{building.toLocaleString()} rows</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (progress.selections ? (building / progress.selections) : 0) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <p className="mt-8 text-xs text-slate2-400 font-mono animate-pulse">Parsing timetable data in your browser…</p>
      </div>
    </div>
  );
}
