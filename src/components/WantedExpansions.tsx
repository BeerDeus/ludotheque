import { Link } from 'react-router';
import { useSession } from '../lib/context';
import { updateGame } from '../lib/games';
import { toast } from '../lib/toast';
import { wantedOf } from '../lib/levels';
import type { Expansion, Game } from '../lib/types';
import Icon from './Icon';


/** Extensions / boîtes souhaitées (affichées dans l'onglet Wishlist) */
export default function WantedExpansions({ games }: { games: Game[] }) {
  const { family } = useSession();
  const items = wantedOf(games);
  if (!items.length) return null;

  const setOwned = (g: Game, e: Expansion) => {
    const list = (g.expansions ?? []).map((x) => (x.id === e.id ? { ...x, owned: true, wanted: undefined } : x));
    void updateGame(family.id, g.id, { expansions: list });
    toast(`« ${e.name} » marquée possédée`, {
      label: 'Annuler',
      run: () => void updateGame(family.id, g.id, { expansions: g.expansions ?? [] }),
    });
  };

  return (
    <section className="card overflow-hidden">
      <h2 className="font-display flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 text-sm font-semibold dark:border-slate-800">
        <Icon name="scroll" className="size-4 text-violet-600 dark:text-violet-400" />
        Extensions souhaitées
        <span className="ml-auto text-xs font-normal text-slate-500">{items.length}</span>
      </h2>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {items.map(({ game, exp }) => (
          <li key={`${game.id}-${exp.id}`} className="flex items-center gap-3 px-3 py-2">
            <Link to={`/jeu/${game.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-500/10">
                {exp.thumb ? <img src={exp.thumb} alt="" className="size-full object-cover" /> : <Icon name={exp.kind === 'standalone' ? 'chest' : 'scroll'} className="size-5 opacity-50" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-snug font-medium break-words">{exp.name}</span>
                <span className="block truncate text-xs text-slate-500">{game.name}</span>
              </span>
            </Link>
            <button className="btn-soft shrink-0 flex-col px-2.5 text-[11px] leading-tight" onClick={() => setOwned(game, exp)} title="Marquer comme possédée">
              <Icon name="shield" className="size-5" />
              Achetée
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
