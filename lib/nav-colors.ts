export type NavAccent =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'yellow'
  | 'blue'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'teal'
  | 'sky'
  | 'fuchsia'
  | 'cyan'
  | 'purple'
  | 'slate'
  | 'lime'
  | 'pink';

type Classes = {
  icon: string;
  bgSoft: string;
  border: string;
  dot: string;
  text: string;
};

export const ACCENT_CLASSES: Record<NavAccent, Classes> = {
  indigo:  { icon: 'text-indigo-500',  bgSoft: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  dot: 'bg-indigo-500',  text: 'text-indigo-600' },
  emerald: { icon: 'text-emerald-500', bgSoft: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  amber:   { icon: 'text-amber-500',   bgSoft: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-500',   text: 'text-amber-600' },
  yellow:  { icon: 'text-yellow-500',  bgSoft: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  dot: 'bg-yellow-500',  text: 'text-yellow-600' },
  blue:    { icon: 'text-blue-500',    bgSoft: 'bg-blue-500/10',    border: 'border-blue-500/30',    dot: 'bg-blue-500',    text: 'text-blue-600' },
  violet:  { icon: 'text-violet-500',  bgSoft: 'bg-violet-500/10',  border: 'border-violet-500/30',  dot: 'bg-violet-500',  text: 'text-violet-600' },
  rose:    { icon: 'text-rose-500',    bgSoft: 'bg-rose-500/10',    border: 'border-rose-500/30',    dot: 'bg-rose-500',    text: 'text-rose-600' },
  orange:  { icon: 'text-orange-500',  bgSoft: 'bg-orange-500/10',  border: 'border-orange-500/30',  dot: 'bg-orange-500',  text: 'text-orange-600' },
  teal:    { icon: 'text-teal-500',    bgSoft: 'bg-teal-500/10',    border: 'border-teal-500/30',    dot: 'bg-teal-500',    text: 'text-teal-600' },
  sky:     { icon: 'text-sky-500',     bgSoft: 'bg-sky-500/10',     border: 'border-sky-500/30',     dot: 'bg-sky-500',     text: 'text-sky-600' },
  fuchsia: { icon: 'text-fuchsia-500', bgSoft: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', dot: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
  cyan:    { icon: 'text-cyan-500',    bgSoft: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    dot: 'bg-cyan-500',    text: 'text-cyan-600' },
  purple:  { icon: 'text-purple-500',  bgSoft: 'bg-purple-500/10',  border: 'border-purple-500/30',  dot: 'bg-purple-500',  text: 'text-purple-600' },
  slate:   { icon: 'text-slate-500',   bgSoft: 'bg-slate-500/10',   border: 'border-slate-500/30',   dot: 'bg-slate-500',   text: 'text-slate-600' },
  lime:    { icon: 'text-lime-500',    bgSoft: 'bg-lime-500/10',    border: 'border-lime-500/30',    dot: 'bg-lime-500',    text: 'text-lime-600' },
  pink:    { icon: 'text-pink-500',    bgSoft: 'bg-pink-500/10',    border: 'border-pink-500/30',    dot: 'bg-pink-500',    text: 'text-pink-600' },
};

export const ROUTE_ACCENTS: Record<string, NavAccent> = {
  '/dashboard': 'indigo',
  '/tasks': 'emerald',
  '/calendar': 'amber',
  '/favorites': 'yellow',
  '/projects': 'blue',
  '/boards': 'violet',
  '/sprints': 'rose',
  '/notes': 'orange',
  '/daily-reports': 'teal',
  '/organizations': 'sky',
  '/spaces': 'sky',
  '/team': 'fuchsia',
  '/reports': 'cyan',
  '/dashboards': 'indigo',
  '/saved-filters': 'purple',
  '/activity-logs': 'slate',
  '/labels': 'lime',
  '/issue-types': 'pink',
  '/workflows': 'blue',
  '/automations': 'yellow',
  '/integrations': 'teal',
};

export function getAccent(path: string): NavAccent {
  const match = Object.keys(ROUTE_ACCENTS)
    .filter((p) => path === p || path.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return (match && ROUTE_ACCENTS[match]) || 'indigo';
}
