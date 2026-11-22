import { Link } from 'react-router';
import { useSession } from '../lib/context';
import { formatDuration, formatPlayers, formatPrice, isEnriched, relevantPrice } from '../lib/format';
import { setStatus } from '../lib/games';
import { STATUS_LABEL, type Game } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import Cover from './Cover';
import Icon from './Icon';

const PRIO_DOTS = { 1: '●●●', 2: '●●', 3: '●' } as const;

export default function GameCard({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const { family } = useSession();
  const price = relevantPrice(game);
  const meta = [formatPlayers(game), formatDuration(game.durationMin), game.complexity ? `${game.complexity}/5` : ''].filter(Boolean);

  return (
    <li className="card flex items-stretch gap-3 p-2.5">
      <Link to={`/jeu/${game.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Cover name={game.name} url={game.coverUrl} className="size-16 shrink-0 rounded-xl text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold">{game.name}</h3>
          </div>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{meta.join(' · ') || '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {showStatus && <span className={cx('chip', STATUS_STYLE[game.status].chip)}>{STATUS_LABEL[game.status]}</span>}
            {game.status !== 'owned' && (
              <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300" title={`Priorité ${game.priority}`}>
                {PRIO_DOTS[game.priority] ?? ''}
              </span>
            )}
            {price != null && <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300">{formatPrice(price)}</span>}
            {!isEnriched(game) && <span className="chip bg-sky-500/15 text-sky-700 dark:text-sky-300">non enrichi</span>}
            {game.tags.slice(0, 3).map((t) => (
              <span key={t} className="chip text-slate-500 dark:text-slate-400">#{t}</span>
            ))}
          </div>
        </div>
      </Link>
      {game.status !== 'owned' && (
        <button
          className="btn-soft shrink-0 flex-col self-center px-2.5 text-[11px] leading-tight"
          onClick={() => void setStatus(family.id, game.id, 'owned')}
          title="Marquer comme possédé"
        >
          <Icon name="check" className="size-4" />
          Acheté
        </button>
      )}
    </li>
  );
}
