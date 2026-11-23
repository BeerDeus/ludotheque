import { Link, useNavigate } from 'react-router';
import Cover from '../components/Cover';
import Header from '../components/Header';
import Icon, { type IconName } from '../components/Icon';
import StarRating from '../components/StarRating';
import { useGames } from '../lib/context';
import { formatPrice } from '../lib/format';
import { MODE_ICON } from '../lib/icons';
import { LEVEL_STYLE, formatDay, lastPlayed, levelOf, playsCount, wantedOf } from '../lib/levels';
import { LEVELS, LEVEL_LABEL, MODES, MODE_LABEL, type Game } from '../lib/types';
import { cx } from '../lib/ui';

function Tile({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <div className="card flex flex-col items-center gap-0.5 px-2 py-3 text-center">
      <Icon name={icon} className="size-6 text-accent-600 dark:text-accent-400" />
      <span className="font-display text-xl font-bold">{value}</span>
      <span className="text-[11px] leading-tight text-slate-500">{label}</span>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; cls?: string; icon?: IconName }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-sm">
          <span className="flex w-28 shrink-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
            {r.icon && <Icon name={r.icon} className="size-4" />}
            {r.label}
          </span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <span className={cx('block h-full rounded-full', r.cls ?? 'bg-accent-500')} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="w-6 text-right font-medium tabular-nums">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

function MiniList({ games, extra }: { games: Game[]; extra: (g: Game) => React.ReactNode }) {
  return (
    <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
      {games.map((g) => (
        <li key={g.id}>
          <Link to={`/jeu/${g.id}`} className="flex items-center gap-3 py-2">
            <Cover name={g.name} url={g.thumbUrl || g.coverUrl} className="size-10 shrink-0 rounded-lg text-xs" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{g.name}</span>
            <span className="shrink-0 text-xs text-slate-500">{extra(g)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const LEVEL_BAR: Record<string, string> = { ambiance: 'bg-pink-500', familial: 'bg-emerald-500', initie: 'bg-sky-500', expert: 'bg-accent-500' };

export default function StatsPage() {
  const { games } = useGames();
  const navigate = useNavigate();
  const owned = games.filter((g) => g.status === 'owned');
  const wishlist = games.filter((g) => g.status === 'wishlist');
  const value = owned.reduce((s, g) => s + (g.priceBought ?? 0), 0);
  const budget = wishlist.reduce((s, g) => s + (g.priceTarget ?? 0), 0);
  const expOwned = games.reduce((s, g) => s + (g.expansions ?? []).filter((e) => e.owned).length, 0);
  const plays = owned.reduce((s, g) => s + playsCount(g), 0);
  const year = String(new Date().getFullYear());
  const playsYear = owned.reduce((s, g) => s + (g.plays ?? []).filter((p) => p.date.startsWith(year)).length, 0);
  const neverPlayed = owned.filter((g) => !playsCount(g));
  const mostPlayed = [...owned].filter((g) => playsCount(g)).sort((a, b) => playsCount(b) - playsCount(a)).slice(0, 5);
  const recent = [...owned].filter((g) => lastPlayed(g)).sort((a, b) => (lastPlayed(b) ?? '').localeCompare(lastPlayed(a) ?? '')).slice(0, 5);
  const favorites = [...games].filter((g) => g.myRating).sort((a, b) => (b.myRating ?? 0) - (a.myRating ?? 0)).slice(0, 5);
  const loaned = owned.filter((g) => g.loanedTo?.trim());

  const back = (
    <button className="btn-ghost p-2" onClick={() => navigate('/')} aria-label="Retour">
      <Icon name="back" />
    </button>
  );

  const card = (title: string, icon: IconName, children: React.ReactNode) => (
    <section className="card p-4">
      <h2 className="font-display mb-3 flex items-center gap-2 text-[15px] font-semibold">
        <Icon name={icon} className="size-5 text-accent-600 dark:text-accent-400" />
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <>
      <Header left={back} title="Statistiques" right={<span />} />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 pt-4 pb-16">
        <section className="grid grid-cols-3 gap-2">
          <Tile icon="shield" value={owned.length} label="jeux possédés" />
          <Tile icon="scroll" value={expOwned} label="boîtes & extensions" />
          <Tile icon="potion" value={wishlist.length + wantedOf(games).length} label="envies (jeux + ext.)" />
          <Tile icon="calendar" value={plays} label="parties jouées" />
          <Tile icon="crown" value={playsYear} label={`parties en ${year}`} />
          <Tile icon="cart" value={value ? formatPrice(value).replace(',00', '') : '—'} label="valeur de la collection" />
        </section>

        {budget > 0 && (
          <p className="card flex items-center gap-2 p-3 text-sm">
            <Icon name="potion" className="size-5 text-violet-500" />
            Budget wishlist (prix cibles) : <strong>{formatPrice(budget)}</strong>
          </p>
        )}

        {card(
          'Par niveau',
          'brain',
          <Bars rows={LEVELS.map((l) => ({ label: LEVEL_LABEL[l], value: owned.filter((g) => levelOf(g).level === l).length, cls: LEVEL_BAR[l] }))} />,
        )}

        {card('Par type de jeu', 'swords', <Bars rows={MODES.map((m) => ({ label: MODE_LABEL[m], value: owned.filter((g) => g.mode === m).length, icon: MODE_ICON[m] }))} />)}

        {mostPlayed.length > 0 && card('Les plus joués', 'crown', <MiniList games={mostPlayed} extra={(g) => `${playsCount(g)} partie${playsCount(g) > 1 ? 's' : ''}`} />)}
        {recent.length > 0 && card('Joués récemment', 'calendar', <MiniList games={recent} extra={(g) => formatDay(lastPlayed(g))} />)}
        {favorites.length > 0 && card('Coups de cœur', 'sparkle', <MiniList games={favorites} extra={(g) => <StarRating value={g.myRating} size="sm" />} />)}
        {loaned.length > 0 && card('Jeux prêtés', 'key', <MiniList games={loaned} extra={(g) => g.loanedTo} />)}
        {neverPlayed.length > 0 &&
          card(
            `Jamais joués (${neverPlayed.length})`,
            'candle',
            <>
              <p className="mb-2 text-xs text-slate-500">La « pile de la honte » : ils attendent leur première partie.</p>
              <MiniList
                games={neverPlayed}
                extra={(g) => {
                  const l = levelOf(g).level;
                  return l ? <span className={cx('chip', LEVEL_STYLE[l])}>{LEVEL_LABEL[l]}</span> : null;
                }}
              />
            </>,
          )}
      </main>
    </>
  );
}
