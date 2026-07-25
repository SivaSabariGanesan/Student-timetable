import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiUser, FiMapPin, FiUsers, FiSliders, FiMenu, FiX } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/students', label: 'Find Student', icon: FiUser },
  { to: '/explore', label: 'Explore', icon: FiSliders },
  { to: '/rooms', label: 'Rooms', icon: FiMapPin },
  { to: '/faculty', label: 'Faculty', icon: FiUsers },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper-50/90 dark:bg-ink-900/90 backdrop-blur border-b rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-ink-900 dark:bg-amber-500 flex items-center justify-center">
            <span className="font-display font-semibold text-amber-400 dark:text-ink-950 text-sm">R</span>
          </div>
          <div>
            <div className="font-display font-semibold text-[15px] leading-tight">Rajalakshmi</div>
            <div className="eyebrow">Timetable</div>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-900 text-amber-400 dark:bg-amber-500 dark:text-ink-950'
                    : 'text-ink-700 dark:text-paper-200 hover:bg-ink-900/5 dark:hover:bg-paper-100/10'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center border rule"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t rule px-4 py-2 flex flex-col gap-1 bg-paper-50 dark:bg-ink-900">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-ink-900 text-amber-400 dark:bg-amber-500 dark:text-ink-950' : ''
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
