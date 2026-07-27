import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiHash, FiBookOpen } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import CurrentClassBoard from '../components/CurrentClassBoard';
import TimetableGrid from '../components/TimetableGrid';
import { colorForCode } from '../utils/colors';
import { formatMinutes, todayName, DAY_ORDER } from '../utils/time';

export default function StudentProfile() {
  const { reg } = useParams();
  const { store } = useData();
  const student = store.studentsMap.get(reg);
  const today = todayName();

  const sessions = useMemo(() => {
    if (!student) return [];
    const out = [];
    for (const course of student.courses) {
      for (const slot of course.slots) {
        const room = slot.room || course.room;
        out.push({ ...slot, code: course.code, courseName: course.name, faculty: course.faculty, room });
      }
    }
    // Sort: day order first, then ascending start time
    out.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start - b.start);
    return out;
  }, [student]);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.day === today).sort((a, b) => a.start - b.start),
    [sessions, today]
  );

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate2-500">No student found for register number <span className="font-mono">{reg}</span>.</p>
        <Link to="/students" className="text-amber-600 dark:text-amber-400 text-sm mt-3 inline-block">Back to search</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-1.5 px-3 py-2 -ml-3 text-sm text-slate2-500 hover:text-ink-900 dark:hover:text-paper-100 rounded-lg hover:bg-ink-900/5 dark:hover:bg-paper-100/10">
        <FiArrowLeft size={14} /> Back to search
      </Link>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 flex items-center justify-center font-display text-xl sm:text-2xl font-semibold shrink-0">
              {student.name?.[0] || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg sm:text-xl font-semibold truncate">{student.name}</h1>
              <div className="font-mono text-xs text-slate2-500 mt-0.5 truncate">{student.reg}</div>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-start justify-between border-b rule pb-3 gap-2">
              <dt className="text-slate2-500 shrink-0">Department</dt>
              <dd className="font-medium text-right break-words max-w-[60%]">{student.deptName}</dd>
            </div>
            <div className="flex items-center justify-between border-b rule pb-3 gap-2">
              <dt className="text-slate2-500 shrink-0">Year / Semester</dt>
              <dd className="font-medium">Semester {student.semester}</dd>
            </div>
            <div className="flex items-center justify-between border-b rule pb-3 gap-2">
              <dt className="text-slate2-500 shrink-0">Section</dt>
              <dd className="font-medium">{student.section || '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="text-slate2-500 flex items-center gap-1.5 shrink-0 pt-0.5"><FiMail size={13} /> Email</dt>
              <dd className="font-medium text-right break-all text-xs max-w-[65%]">{student.email}</dd>
            </div>
          </dl>

          <div className="mt-5 pt-4 border-t rule">
            <div className="eyebrow mb-2 flex items-center gap-1.5"><FiBookOpen size={12} /> Selected courses</div>
            <ul className="space-y-2">
              {[...student.courses]
                .sort((a, b) => {
                  const aFirst = a.slots.reduce((min, s) => Math.min(min, DAY_ORDER.indexOf(s.day) * 1440 + s.start), Infinity);
                  const bFirst = b.slots.reduce((min, s) => Math.min(min, DAY_ORDER.indexOf(s.day) * 1440 + s.start), Infinity);
                  return aFirst - bFirst;
                })
                .map((c, i) => {
                const col = colorForCode(c.code);
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                    <span className="font-mono text-xs text-slate2-500 shrink-0">{c.code}</span>
                    <span className="truncate text-sm">{c.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <CurrentClassBoard sessions={sessions} />

          <div>
            <div className="eyebrow mb-2 flex items-center gap-1.5"><FiHash size={12} /> Today's classes</div>
            {todaySessions.length === 0 ? (
              <div className="card p-5 text-sm text-slate2-500">No classes scheduled today.</div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((s, i) => {
                  const col = colorForCode(s.code);
                  return (
                    <div key={i} className={`card p-3.5 sm:p-4 flex items-start gap-3 border-l-4 ${col.border}`}>
                      <div className="font-mono text-[11px] sm:text-xs text-slate2-500 shrink-0 whitespace-nowrap pt-0.5 w-[68px] sm:w-auto">
                        {formatMinutes(s.start)}–{formatMinutes(s.end)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base break-words">{s.courseName}</div>
                        <div className="text-xs text-slate2-500 truncate">{s.faculty} · Room {s.room}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Weekly timetable</h2>
        <TimetableGrid sessions={sessions} todayLabel={today} />
      </div>
    </div>
  );
}
