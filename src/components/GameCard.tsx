import { Link } from 'react-router';
import { useSession } from '../lib/context';
import { formatPlayers, formatPrice, isEnriched, relevantPrice } from '../lib/format';
import { setStatus } from '../lib/games';
import { LEVEL_STYLE, levelOf, playsCount } from '../lib/levels';
import { toast } from '../lib/toast';
import { LEVEL_LABEL, MODE_LABEL, STATUS_LABEL, type Game } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import Cover from './Cover';
import { MODE_ICON, STATUS_ICON } from '../lib/icons';
import Icon, { type IconName } from './Icon';
import StarRating from './StarRating';

function useMarkOwned(game: Game) {
  const { family } = useSession();
  return () => {
    const prev = game.status;
    void setStatus(family.id, game.id, 'owned');
    toast(`« ${game.name} » marqué possédé`, { label: 'Annuler', run: () => void setStatus(family.id, game.id, prev) });
  };
}

const coverOf = (g: Game) => (g.customCover ? g.coverUrl : g.thumbUrl || g.coverUrl);

function Meta({ game }: { game: Game }) {
  const items: { icon: IconName; text: string }[] = [];
  const p = formatPlayers(game).replace(' j.', '');
  if (p) items.push({ icon: 'users', text: p });
  if (game.durationMin) items.push({ icon: 'clock', text: `${game.durationMin}′` });
  if (game.ageMin) items.push({ icon: 'sparkle', text: `${game.ageMin}+` });
  if (!items.length) return <span className="text-xs text-slate-400">Infos à venir</span>;
  return (
    <span className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
      {items.map((i) => (
        <span key={i.icon} className="inline-flex items-center gap-0.5">
          <Icon name={i.icon} className="size-3.5 opacity-70" />
          {i.text}
        </span>
      ))}
    </span>
  );
}

function Badges({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const price = relevantPrice(game);
  const exps = game.expansions ?? [];
  const { level, auto } = levelOf(game);
  const plays = playsCount(game);
  const wanted = exps.filter((e) => e.wanted && !e.owned).length;
  return (
    <>
      {showStatus && (
        <span className={cx('chip', STATUS_STYLE[game.status].chip)}>
          <Icon name={STATUS_ICON[game.status]} className="size-3" />
          {STATUS_LABEL[game.status]}
        </span>
      )}
      {level && (
        <span className={cx('chip', LEVEL_STYLE[level])} title={auto ? 'Déduit de la complexité' : undefined}>
          {LEVEL_LABEL[level]}
        </span>
      )}
      {game.mode && (
        <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300" title={MODE_LABEL[game.mode]}>
          <Icon name={MODE_ICON[game.mode]} className="size-3.5" />
          {game.mode === 'coop' ? 'Coop' : game.mode === 'solo' ? 'Solo' : game.mode === 'equipe' ? 'Équipes' : 'Versus'}
        </span>
      )}
      {game.status !== 'owned' && game.priority === 1 && (
        <span className="chip bg-red-500/10 text-red-700 dark:text-red-300">
          <Icon name="torch" className="size-3.5" />
          Prioritaire
        </span>
      )}
      {price != null && <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300">{formatPrice(price)}</span>}
      {game.loanedTo?.trim() && (
        <span className="chip bg-gold-400/20 text-gold-600 dark:text-gold-300">
          <Icon name="key" className="size-3.5" />
          {game.loanedTo}
        </span>
      )}
      {game.missingParts?.trim() && (
        <span className="chip bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Icon name="warning" className="size-3.5" />
          incomplet
        </span>
      )}
      {exps.length > 0 && (
        <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300" title="Boîtes et extensions possédées / suivies">
          <Icon name="scroll" className="size-3.5" />
          {exps.filter((e) => e.owned).length}/{exps.length}
          {wanted > 0 && <span className="text-violet-600 dark:text-violet-300">· {wanted} souhaitée{wanted > 1 ? 's' : ''}</span>}
        </span>
      )}
      {plays > 0 && (
        <span className="chip bg-slate-500/10 text-slate-600 dark:text-slate-300">
          <Icon name="calendar" className="size-3.5" />
          {plays} partie{plays > 1 ? 's' : ''}
        </span>
      )}
      {!isEnriched(game) && <span className="chip bg-sky-500/10 text-sky-700 dark:text-sky-300">à enrichir</span>}
    </>
  );
}

export default function GameCard({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const markOwned = useMarkOwned(game);

  return (
    <li className="card flex items-stretch gap-3 p-2.5 transition active:scale-[.99]">
      <Link to={`/jeu/${game.id}`} className="flex min-w-0 flex-1 items-start gap-3">
        <Cover name={game.name} url={coverOf(game)} className="size-[72px] shrink-0 rounded-xl text-lg ring-1 ring-slate-900/5 dark:ring-white/5" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 leading-snug font-semibold">{game.name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            {game.myRating ? <StarRating value={game.myRating} size="sm" /> : null}
            <Meta game={game} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badges game={game} showStatus={showStatus} />
          </div>
        </div>
      </Link>
      {game.status !== 'owned' && (
        <button className="btn-soft shrink-0 flex-col self-center px-2.5 text-[11px] leading-tight" onClick={markOwned} title="Marquer comme possédé">
          <Icon name="shield" className="size-5" />
          Acheté
        </button>
      )}
    </li>
  );
}

export function GameTile({ game, showStatus }: { game: Game; showStatus: boolean }) {
  const { level } = levelOf(game);
  return (
    <li>
      <Link to={`/jeu/${game.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/5">
          <Cover name={game.name} url={game.coverUrl || game.thumbUrl} className="aspect-square w-full text-3xl transition group-active:scale-[.98]" />
          {showStatus && (
            <span className={cx('absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-full shadow', STATUS_STYLE[game.status].active)} title={STATUS_LABEL[game.status]}>
              <Icon name={STATUS_ICON[game.status]} className="size-3.5" />
            </span>
          )}
          {game.missingParts?.trim() && (
            <span className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-amber-500 text-white shadow">
              <Icon name="warning" className="size-3.5" />
            </span>
          )}
          {level && <span className={cx('chip absolute bottom-1.5 left-1.5 bg-slate-50/90 text-[10px] dark:bg-slate-900/90', LEVEL_STYLE[level])}>{LEVEL_LABEL[level]}</span>}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-sm leading-tight font-medium">{game.name}</h3>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          {game.myRating ? <StarRating value={game.myRating} size="sm" /> : <span>{formatPlayers(game) || '—'}</span>}
        </div>
      </Link>
    </li>
  );
}
