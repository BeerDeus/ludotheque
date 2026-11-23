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
    chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    active: 'bg-sky-600 text-white',
    dot: 'bg-sky-500',
  },
};

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
