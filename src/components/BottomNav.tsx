import { useGames } from '../lib/context';
import type { Status } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import Icon from './Icon';

const TABS: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'owned', label: 'Possédés' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'watch', label: 'Surveillés' },
];

/** Barre d'onglets du bas (statuts) + bouton d'ajout central */
export default function BottomNav({ onAdd }: { onAdd: () => void }) {
  const { games, filters, setFilters } = useGames();
  const count = (s: Status | 'all') => (s === 'all' ? games.length : games.filter((g) => g.status === s).length);

  const tab = (t: (typeof TABS)[number]) => {
    const active = filters.status === t.key;
    return (
      <button
        key={t.key}
        onClick={() => {
          setFilters({ status: t.key });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400')}
        aria-current={active ? 'page' : undefined}
      >
        <span className="flex items-center gap-1">
          {t.key !== 'all' && <span className={cx('size-2 rounded-full', STATUS_STYLE[t.key].dot)} />}
          <span className="text-base leading-none font-semibold">{count(t.key)}</span>
        </span>
        {t.label}
      </button>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl items-end px-2">
        {tab(TABS[0])}
        {tab(TABS[1])}
        <div className="flex flex-1 justify-center">
          <button
            className="btn-primary -mt-6 size-14 rounded-full p-0 shadow-lg shadow-indigo-600/30"
            onClick={onAdd}
            aria-label="Ajouter un jeu"
          >
            <Icon name="plus" className="size-7" />
          </button>
        </div>
        {tab(TABS[2])}
        {tab(TABS[3])}
      </div>
    </nav>
  );
}
