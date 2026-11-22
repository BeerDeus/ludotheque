import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import BggAttribution from '../components/BggAttribution';
import FilterBar from '../components/FilterBar';
import GameCard from '../components/GameCard';
import GameForm from '../components/GameForm';
import Header from '../components/Header';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import { useGames } from '../lib/context';
import { applyFilters } from '../lib/filter';

export default function ListPage() {
  const { games, loading, error, filters } = useGames();
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const list = useMemo(() => applyFilters(games, filters), [games, filters]);

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-3 pt-3 pb-28">
        <FilterBar />
        {loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {games.length === 0 ? (
              <>
                <p className="mb-3">Aucun jeu pour l’instant.</p>
                <button className="btn-primary" onClick={() => setAdding(true)}>
                  <Icon name="plus" className="size-4" /> Ajouter un jeu
                </button>
              </>
            ) : (
              <p>Aucun jeu ne correspond aux filtres.</p>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((g) => (
              <GameCard key={g.id} game={g} showStatus={filters.status === 'all'} />
            ))}
          </ul>
        )}
        <BggAttribution />
      </main>

      <button
        className="btn-primary fixed right-4 z-20 size-14 rounded-full p-0 shadow-lg shadow-indigo-600/30"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={() => setAdding(true)}
        aria-label="Ajouter un jeu"
      >
        <Icon name="plus" className="size-7" />
      </button>

      {adding && (
        <GameForm
          initialStatus={filters.status === 'all' ? 'wishlist' : filters.status}
          onClose={() => setAdding(false)}
          onSaved={(id) => navigate(`/jeu/${id}`)}
        />
      )}
    </>
  );
}
