import { useMemo, useState } from 'react';
import BggAttribution from '../components/BggAttribution';
import BottomNav from '../components/BottomNav';
import FilterBar from '../components/FilterBar';
import GameCard, { GameTile } from '../components/GameCard';
import Header from '../components/Header';
import Icon from '../components/Icon';
import QuickAdd from '../components/QuickAdd';
import Spinner from '../components/Spinner';
import WantedExpansions from '../components/WantedExpansions';
import { wantedOf } from '../lib/levels';
import { useGames } from '../lib/context';
import { applyFilters } from '../lib/filter';
import { STATUS_LABEL_PLURAL } from '../lib/types';

export default function ListPage() {
  const { games, loading, error, filters } = useGames();
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => applyFilters(games, filters), [games, filters]);
  const showStatus = filters.status === 'all';

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-3 pt-3" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <FilterBar />
        {filters.status === 'wishlist' && !filters.q && <WantedExpansions games={games} />}
        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : list.length === 0 && !(filters.status === 'wishlist' && wantedOf(games).length) ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
            <p>
              {games.length === 0
                ? 'Ta ludothèque est vide.'
                : filters.status !== 'all' && !games.some((g) => g.status === filters.status)
                  ? `Aucun jeu en « ${STATUS_LABEL_PLURAL[filters.status]} ».`
                  : 'Aucun jeu ne correspond à la recherche.'}
            </p>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              <Icon name="plus" className="size-4" /> Ajouter un jeu
            </button>
          </div>
        ) : filters.view === 'grid' ? (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 md:grid-cols-5">
            {list.map((g) => (
              <GameTile key={g.id} game={g} showStatus={showStatus} />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((g) => (
              <GameCard key={g.id} game={g} showStatus={showStatus} />
            ))}
          </ul>
        )}
        {list.length > 0 && <p className="text-center text-xs text-slate-400">{list.length} jeu{list.length > 1 ? 'x' : ''}</p>}
        <BggAttribution />
      </main>

      <BottomNav onAdd={() => setAdding(true)} wantedExpansions={wantedOf(games).length} />

      {adding && <QuickAdd initialStatus={filters.status === 'all' ? 'owned' : filters.status} onClose={() => setAdding(false)} />}
    </>
  );
}
