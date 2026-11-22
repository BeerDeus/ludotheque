import type { Status } from './types';

export const STATUS_STYLE: Record<Status, { chip: string; active: string; dot: string }> = {
  owned: {
    chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    active: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
  },
  wishlist: {
    chip: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    active: 'bg-violet-600 text-white',
    dot: 'bg-violet-500',
  },
  watch: {
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    active: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
  },
};

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
