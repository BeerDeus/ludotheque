import { useGames } from '../lib/context';
import type { Status } from '../lib/types';
import { cx } from '../lib/ui';
import Icon, { type IconName } from './Icon';

const TABS: { key: Status | 'all'; label: string; icon: IconName }[] = [
  { key: 'all', label: 'Tous', icon: 'tower' },
  { key: 'owned', label: 'Possédés', icon: 'shield' },
  { key: 'wishlist', label: 'Wishlist', icon: 'potion' },
  { key: 'watch', label: 'Surveillés', icon: 'spyglass' },
];

/** Barre d'onglets du bas (statuts) + bouton d'ajout central */
export default function BottomNav({ onAdd, wantedExpansions = 0 }: { onAdd: () => void; wantedExpansions?: number }) {
  const { games, filters, setFilters } = useGames();
  const count = (s: Status | 'all') => (s === 'all' ? games.length : games.filter((g) => g.status === s).length);

  const tab = (t: (typeof TABS)[number]) => {
    const active = filters.status === t.key;
    const n = count(t.key) + (t.key === 'wishlist' ? wantedExpansions : 0);
    return (
      <button
        key={t.key}
        onClick={() => {
          setFilters({ status: t.key });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={cx(
          'relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition',
          active ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-slate-400',
        )}
        aria-current={active ? 'page' : undefined}
      >
        {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent-500" />}
        <span className="relative">
          <Icon name={t.icon} className="size-6" />
          {n > 0 && (
            <span
              className={cx(
                'absolute -top-1.5 -right-3 min-w-[1.15rem] rounded-full px-1 text-center text-[10px] leading-[1.15rem] font-semibold',
                active ? 'bg-accent-500 text-white dark:text-slate-950' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
              )}
            >
              {n}
            </span>
          )}
        </span>
        {t.label}
      </button>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl items-end px-2">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <div className="flex flex-1 justify-center">
          <button
            className="-mt-6 grid size-14 place-items-center rounded-2xl bg-accent-600 text-white shadow-lg ring-4 shadow-accent-900/30 ring-slate-100 transition active:scale-95 dark:bg-accent-500 dark:text-slate-950 dark:ring-slate-950"
            style={{ transform: 'rotate(45deg)' }}
            onClick={onAdd}
            aria-label="Ajouter un jeu"
          >
            <Icon name="plus" className="size-7 -rotate-45" />
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
