import { FiX, FiChevronDown } from 'react-icons/fi';
import { DAY_ORDER } from '../utils/time';

const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00',
];

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function FilterPanel({ filters, setFilter, clearAll, facets }) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Filters {activeCount > 0 && `· ${activeCount} active`}</span>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs flex items-center gap-1 text-slate2-500 hover:text-bad">
            <FiX size={13} /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Register / Name spans full width on mobile, 2 cols on sm+ */}
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
          <span className="eyebrow">Register / Name</span>
          <input
            value={filters.q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="e.g. 230701321 or name"
            className="w-full px-3 py-2 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
          />
        </label>

        <Select label="Day"        value={filters.day}        onChange={(v) => setFilter('day', v)}        options={DAY_ORDER} />
        <Select label="Time slot"  value={filters.time}       onChange={(v) => setFilter('time', v)}       options={TIME_SLOTS} />
        <Select label="Room"       value={filters.room}       onChange={(v) => setFilter('room', v)}       options={facets.rooms} />
        <Select label="Faculty"    value={filters.faculty}    onChange={(v) => setFilter('faculty', v)}    options={facets.faculty} />
        <Select label="Semester"   value={filters.semester}   onChange={(v) => setFilter('semester', v)}   options={facets.semesters} />
        <Select label="Department" value={filters.department} onChange={(v) => setFilter('department', v)} options={facets.departments} />
        <Select label="Section"    value={filters.section}    onChange={(v) => setFilter('section', v)}    options={facets.sections} />
      </div>
    </div>
  );
}

export { TIME_SLOTS };
