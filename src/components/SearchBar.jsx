import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchBar({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = 'Search register number or name…',
  renderSuggestion,
  autoFocus,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const list = useMemo(() => suggestions.slice(0, 8), [suggestions]);

  function handleKeyDown(e) {
    if (!open || list.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % list.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + list.length) % list.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSelect(list[highlight]);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate2-500" size={18} />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3.5 rounded-xl border rule bg-white dark:bg-ink-800 text-base focus:ring-2 focus:ring-amber-400/60 outline-none placeholder:text-slate2-400"
        />
        {value && (
          <button
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate2-400 hover:text-ink-900 dark:hover:text-paper-100"
            aria-label="Clear"
          >
            <FiX size={16} />
          </button>
        )}
      </div>
      {open && value && list.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full card overflow-hidden py-1 max-h-80 overflow-y-auto scrollbar-thin">
          {list.map((item, i) => (
            <li key={item.reg || item}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm ${
                  i === highlight ? 'bg-amber-400/15' : 'hover:bg-ink-900/5 dark:hover:bg-paper-100/5'
                }`}
              >
                {renderSuggestion ? renderSuggestion(item) : item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
