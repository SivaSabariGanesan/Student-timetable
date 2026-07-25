const PALETTE = [
  { bg: 'bg-amber-400/20', border: 'border-amber-500/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-slate2-500/15', border: 'border-slate2-500/40', text: 'text-slate2-600 dark:text-slate2-300', dot: 'bg-slate2-500' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-sky-500/15', border: 'border-sky-500/40', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-teal-500/15', border: 'border-teal-500/40', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
];

export function colorForCode(code) {
  if (!code) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
