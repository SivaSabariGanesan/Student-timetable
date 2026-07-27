import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiUser, FiMapPin, FiUsers, FiSliders, FiMenu, FiX, FiLogOut, FiShield, FiClock, FiLock } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const BASE_LINKS = [
  { to: '/',          label: 'Dashboard',    icon: FiGrid,    end: true },
  { to: '/students',  label: 'Find Student', icon: FiUser },
  { to: '/explore',   label: 'Explore',      icon: FiSliders },
  { to: '/rooms',     label: 'Rooms',        icon: FiMapPin,    end: true },
  { to: '/rooms/free',label: 'Free Rooms',   icon: FiClock },
  { to: '/faculty',   label: 'Faculty',      icon: FiUsers },
];

const ROLE_LABEL = {
  superuser: { text: 'Superuser', cls: 'text-purple-500 dark:text-purple-400' },
  admin:     { text: 'Admin',     cls: 'text-amber-500 dark:text-amber-400' },
  user:      { text: 'User',      cls: 'text-slate2-400' },
};

const USER_ONLY = ['/students', '/explore'];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const links = isAdmin
    ? [...BASE_LINKS, { to: '/users', label: 'Users', icon: FiShield }, { to: '/password', label: 'Password', icon: FiLock }]
    : user?.role === 'user'
      ? BASE_LINKS.filter((l) => USER_ONLY.includes(l.to))
      : BASE_LINKS;

  const roleInfo = user ? (ROLE_LABEL[user.role] ?? ROLE_LABEL.user) : null;

  return (
    <header className="sticky top-0 z-40 bg-paper-50/90 dark:bg-ink-900/90 backdrop-blur border-b rule" style={{ WebkitBackdropFilter: 'blur(12px)' }}>
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
          {links.map(({ to, label, icon: Icon, end }) => (
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
          {user && (
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-700 dark:text-paper-200 hover:bg-ink-900/5 dark:hover:bg-paper-100/10 transition-colors"
              title="Sign out"
            >
              <span className="hidden lg:inline leading-tight text-right">
                <span className="block">{user.name}</span>
                {roleInfo && (
                  <span className={`block text-xs ${roleInfo.cls}`}>{roleInfo.text}</span>
                )}
              </span>
              <FiLogOut size={15} />
            </button>
          )}
          <ThemeToggle />
          <button
            className="md:hidden w-11 h-11 rounded-full flex items-center justify-center border rule"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <>
          {/* Backdrop — tap outside to close */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-ink-950/20 dark:bg-ink-950/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer — fixed below the header, doesn't push page content */}
          <nav className="md:hidden fixed top-16 left-0 right-0 z-40 border-t rule px-4 py-3 flex flex-col gap-1 bg-paper-50 dark:bg-ink-900 shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto">
            {/* User identity */}
            {user && roleInfo && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 border-b rule">
                <div className="w-8 h-8 rounded-full bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 flex items-center justify-center font-display font-semibold text-sm shrink-0">
                  {user.name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{user.name}</div>
                  <div className={`text-xs ${roleInfo.cls}`}>{roleInfo.text}</div>
                </div>
              </div>
            )}
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-ink-900 text-amber-400 dark:bg-amber-500 dark:text-ink-950'
                      : 'text-ink-700 dark:text-paper-200 hover:bg-ink-900/5 dark:hover:bg-paper-100/10'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            {user && (
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium text-ink-700 dark:text-paper-200 hover:bg-ink-900/5 dark:hover:bg-paper-100/10 mt-1 border-t rule pt-3 transition-colors"
              >
                <FiLogOut size={18} />
                Sign out
              </button>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
