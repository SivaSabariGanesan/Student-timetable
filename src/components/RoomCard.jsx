import { FiMapPin } from 'react-icons/fi';

export default function RoomCard({ room, count, block, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`card p-4 text-left flex items-center justify-between gap-3 transition-colors ${
        active ? 'border-amber-500 ring-1 ring-amber-400/40' : 'hover:border-amber-500/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate2-500/15 text-slate2-600 dark:text-slate2-300 flex items-center justify-center shrink-0">
          <FiMapPin size={16} />
        </div>
        <div className="min-w-0">
          <div className="font-mono font-medium truncate">{room}</div>
          {block && <div className="text-xs text-slate2-500 truncate">{block}</div>}
        </div>
      </div>
      <span className="eyebrow shrink-0">{count} classes</span>
    </button>
  );
}
