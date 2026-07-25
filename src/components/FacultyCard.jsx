import { FiUser } from 'react-icons/fi';

export default function FacultyCard({ name, count, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`card p-4 text-left flex items-center justify-between gap-3 transition-colors ${
        active ? 'border-amber-500 ring-1 ring-amber-400/40' : 'hover:border-amber-500/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <FiUser size={16} />
        </div>
        <div className="min-w-0 font-medium truncate">{name}</div>
      </div>
      <span className="eyebrow shrink-0">{count} classes</span>
    </button>
  );
}
