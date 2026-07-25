export default function LoadingSkeleton({ progress }) {
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
        <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden mb-6">
          <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-xs text-slate2-400 font-mono animate-pulse">{progress?.loading || 'Loading timetable data…'}</p>
      </div>
    </div>
  );
}
