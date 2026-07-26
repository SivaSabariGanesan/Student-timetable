import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-11 h-11 rounded-full flex items-center justify-center border rule text-ink-700 dark:text-paper-100 hover:bg-ink-900/5 dark:hover:bg-paper-100/10 transition-colors"
    >
      {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  );
}
