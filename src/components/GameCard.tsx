import { Link } from 'react-router';
import { useSession } from '../lib/context';
import { formatAge, formatDuration, formatPlayers, formatPrice, isEnriched, relevantPrice } from '../lib/format';
import { setStatus } from '../lib/games';
import { toast } from '../lib/toast';
import { STATUS_LABEL, type Game } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import Cover from './Cover';
import Icon from './Icon';
import StarRating from './StarRating';

const PRIO_LABEL = { 1: '🔥 Prioritaire', 2: '', 3: '' } as const;

function useMarkOwned(game: Game) {
  const { family } = useSession();
  return () => {
    const prev = game.status;
    void setStatus(family.id, game.id, 'owned');
    toast(`« ${game.name} » → Possédé`, { label: 'Annuler', run: () => void setStatus(family.id, game.id, prev) });
  };
}

function Badges({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const price = relevantPrice(game);
  const exps = game.expansions ?? [];
  return (
    <>
      {showStatus && <span className={cx('chip', STATUS_STYLE[game.status].chip)}>{STATUS_LABEL[game.status]}</span>}
      {game.status !== 'owned' && PRIO_LABEL[game.priority] && <span className="chip bg-red-500/10 text-red-700 dark:text-red-300">{PRIO_LABEL[game.priority]}</span>}
      {price != null && <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300">{formatPrice(price)}</span>}
      {game.missingParts?.trim() && <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300">⚠ incomplet</span>}
      {exps.length > 0 && (
        <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300" title="Extensions possédées / suivies">
          +{exps.filter((e) => e.owned).length}/{exps.length} ext.
        </span>
      )}
      {!isEnriched(game) && <span className="chip bg-sky-500/15 text-sky-700 dark:text-sky-300">non enrichi</span>}
    </>
  );
}

export default function GameCard({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const markOwned = useMarkOwned(game);
  const meta = [formatPlayers(game), formatDuration(game.durationMin), formatAge(game.ageMin)].filter(Boolean);

  return (
    <li className="card flex items-stretch gap-3 p-2.5 transition active:scale-[.99]">
      <Link to={`/jeu/${game.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Cover name={game.name} url={game.thumbUrl || game.coverUrl} className="size-16 shrink-0 rounded-xl text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{game.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {game.myRating ? <StarRating value={game.myRating} size="sm" /> : null}
            <span className="truncate">{meta.join(' · ') || 'Infos à venir'}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badges game={game} showStatus={showStatus} />
          </div>
        </div>
      </Link>
      {game.status !== 'owned' && (
        <button className="btn-soft shrink-0 flex-col self-center px-2.5 text-[11px] leading-tight" onClick={markOwned} title="Marquer comme possédé">
          <Icon name="check" className="size-4" />
          Acheté
        </button>
      )}
    </li>
  );
}

export function GameTile({ game, showStatus }: { game: Game; showStatus: boolean }) {
  return (
    <li>
      <Link to={`/jeu/${game.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl shadow-sm">
          <Cover name={game.name} url={game.coverUrl || game.thumbUrl} className="aspect-square w-full text-3xl transition group-active:scale-[.98]" />
          {showStatus && <span className={cx('absolute top-2 left-2 size-3 rounded-full ring-2 ring-white dark:ring-slate-900', STATUS_STYLE[game.status].dot)} title={STATUS_LABEL[game.status]} />}
          {game.missingParts?.trim() && <span className="absolute top-1.5 right-1.5 rounded-full bg-amber-500 px-1.5 text-xs text-white">⚠</span>}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-sm leading-tight font-medium">{game.name}</h3>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          {game.myRating ? <StarRating value={game.myRating} size="sm" /> : <span>{formatPlayers(game) || '—'}</span>}
        </div>
      </Link>
    </li>
  );
}
