import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import SearchBar from '../components/SearchBar';
import StudentCard from '../components/StudentCard';

export default function StudentSearch() {
  const { store } = useData();
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.trim().toLowerCase();
    const isRegLookup = /^\d/.test(query); // starts with digit → sort by reg, else by name
    const matched = store.studentIndex.filter(
      (s) => s.reg.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    );
    if (!isRegLookup) {
      matched.sort((a, b) => a.name.localeCompare(b.name) || a.reg.localeCompare(b.reg));
    }
    return matched;
  }, [q, store]);

  const results = suggestions.slice(0, 40);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Find a student</h1>
        <p className="text-sm text-slate2-500 mt-1">Search by register number or name to open their personal timetable.</p>
      </div>

      <SearchBar
        value={q}
        onChange={setQ}
        onSelect={(item) => navigate(`/students/${item.reg}`)}
        suggestions={suggestions}
        placeholder="e.g. 230701321 or student name"
        autoFocus
        renderSuggestion={(item) => (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{item.name}</span>
            <span className="font-mono text-xs text-slate2-500">{item.reg}</span>
          </div>
        )}
      />

      {q.trim() ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((s) => (
            <StudentCard key={s.reg} student={store.studentsMap.get(s.reg)} />
          ))}
          {results.length === 0 && (
            <p className="text-sm text-slate2-500 col-span-full py-8 text-center">No students match "{q}".</p>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-slate2-500">
          <p className="text-sm">Start typing a register number like <span className="font-mono text-ink-700 dark:text-paper-200">230701321</span> to begin.</p>
        </div>
      )}
    </div>
  );
}
