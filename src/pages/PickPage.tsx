import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import Cover from '../components/Cover';
import Header from '../components/Header';
import Icon from '../components/Icon';
import { useGames } from '../lib/context';
import { MODE_ICON } from '../lib/icons';
import { LEVEL_STYLE, formatDay, lastPlayed, levelOf, playsCount } from '../lib/levels';
import { LEVELS, LEVEL_LABEL, MODES, MODE_LABEL, type Game, type Level, type PlayMode } from '../lib/types';
import { cx } from '../lib/ui';

const PLAYERS = [1, 2, 3, 4, 5, 6];
const TIMES = [30, 45, 60, 90, 120, 180];
const AGES = [6, 8, 10, 12, 14];

const toggle = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        'chip px-3 py-1.5 text-sm transition',
        on ? 'bg-accent-600 text-white dark:bg-accent-500 dark:text-slate-950' : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {children}
    </button>
  );
}

/** « Que jouer ce soir ? » : filtre les jeux possédés disponibles et tire au sort */
export default function PickPage() {
  const { games } = useGames();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [modes, setModes] = useState<PlayMode[]>([]);
  const [fresh, setFresh] = useState(true);
  const [pick, setPick] = useState<Game | null>(null);
  const [rolling, setRolling] = useState(false);

  const candidates = useMemo(
    () =>
      games.filter((g) => {
        if (g.status !== 'owned' || g.loanedTo?.trim()) return false;
        if (players != null) {
          const min = g.playersMin || 1;
          const max = g.playersMax || min;
          if (players < min || players > max) return false;
        }
        if (time != null && g.durationMin && g.durationMin > time) return false;
        if (age != null && g.ageMin && g.ageMin > age) return false;
        if (levels.length) {
          const l = levelOf(g).level;
          if (!l || !levels.includes(l)) return false;
        }
        if (modes.length && (!g.mode || !modes.includes(g.mode))) return false;
        return true;
      }),
    [games, players, time, age, levels, modes],
  );

  const roll = () => {
    if (!candidates.length) return;
    setRolling(true);
    setPick(null);
    // pondération : les jeux peu joués ont plus de chances
    const weights = candidates.map((g) => (fresh ? 1 / (1 + playsCount(g)) : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    const chosen = candidates.find((_, i) => (r -= weights[i]) <= 0) ?? candidates[candidates.length - 1];
    setTimeout(() => {
      setPick(chosen);
      setRolling(false);
    }, 650);
  };

  const back = (
    <button className="btn-ghost p-2" onClick={() => navigate('/')} aria-label="Retour">
      <Icon name="back" />
    </button>
  );

  return (
    <>
      <Header left={back} title="Que jouer ce soir ?" right={<span />} />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 pt-4 pb-16">
        <section className="card flex flex-col gap-4 p-4">
          <div>
            <span className="label">Combien de joueurs ?</span>
            <div className="flex flex-wrap gap-1.5">
              {PLAYERS.map((n) => (
                <Pill key={n} on={players === n} onClick={() => setPlayers(players === n ? null : n)}>
                  {n}
                  {n === 6 ? '+' : ''}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Temps disponible</span>
            <div className="flex flex-wrap gap-1.5">
              {TIMES.map((t) => (
                <Pill key={t} on={time === t} onClick={() => setTime(time === t ? null : t)}>
                  {t < 60 ? `${t} min` : t % 60 ? `${Math.floor(t / 60)} h ${t % 60}` : `${t / 60} h`}
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Âge du plus jeune</span>
            <div className="flex flex-wrap gap-1.5">
              {AGES.map((a) => (
                <Pill key={a} on={age === a} onClick={() => setAge(age === a ? null : a)}>
                  {a} ans
                </Pill>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Envie de…</span>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <Pill key={l} on={levels.includes(l)} onClick={() => setLevels(toggle(levels, l))}>
                  {LEVEL_LABEL[l]}
                </Pill>
              ))}
              {MODES.map((m) => (
                <Pill key={m} on={modes.includes(m)} onClick={() => setModes(toggle(modes, m))}>
                  <Icon name={MODE_ICON[m]} className="size-4" />
                  {MODE_LABEL[m]}
                </Pill>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-accent-600" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />
            Favoriser les jeux peu joués
          </label>
        </section>

        <button className="btn-primary py-3.5 text-base" onClick={roll} disabled={!candidates.length || rolling}>
          <Icon name="dice" className={cx('size-6', rolling && 'animate-spin')} />
          {candidates.length ? `Tirer au sort parmi ${candidates.length} jeu${candidates.length > 1 ? 'x' : ''}` : 'Aucun jeu ne correspond'}
        </button>

        {pick && (
          <Link to={`/jeu/${pick.id}`} className="card flex items-center gap-4 border-accent-500/50 p-3 ring-2 ring-accent-500/30">
            <Cover name={pick.name} url={pick.coverUrl || pick.thumbUrl} className="size-28 shrink-0 rounded-xl text-2xl" />
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-accent-700 uppercase dark:text-accent-300">Ce soir, on joue à</p>
              <h2 className="font-display text-xl leading-tight font-bold">{pick.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {lastPlayed(pick) ? `Dernière partie : ${formatDay(lastPlayed(pick))}` : 'Jamais joué — c’est le moment !'}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm text-accent-700 dark:text-accent-300">
                Voir les règles <Icon name="arrowRight" className="size-4" />
              </span>
            </div>
          </Link>
        )}

        {candidates.length > 0 && (
          <section>
            <h2 className="label">Jeux possibles</h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {candidates.map((g) => {
                const l = levelOf(g).level;
                return (
                  <li key={g.id}>
                    <Link to={`/jeu/${g.id}`} className={cx('block', pick?.id === g.id && 'rounded-2xl ring-2 ring-accent-500')}>
                      <Cover name={g.name} url={g.coverUrl || g.thumbUrl} className="aspect-square w-full rounded-2xl text-2xl" />
                      <p className="mt-1 line-clamp-2 text-xs leading-tight font-medium">{g.name}</p>
                      {l && <span className={cx('chip mt-0.5 text-[10px]', LEVEL_STYLE[l])}>{LEVEL_LABEL[l]}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
