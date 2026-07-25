import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function StudentCard({ student }) {
  return (
    <Link
      to={`/students/${student.reg}`}
      className="card p-4 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 flex items-center justify-center font-display font-semibold shrink-0">
          {student.name?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{student.name}</div>
          <div className="text-xs font-mono text-slate2-500 truncate">
            {student.reg} · {student.deptCode} · Sem {student.semester}{student.section ? ` · Sec ${student.section}` : ''}
          </div>
        </div>
      </div>
      <FiArrowRight className="shrink-0 text-slate2-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
