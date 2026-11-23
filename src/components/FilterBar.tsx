import { useState, type ReactNode } from 'react';
import { DEFAULT_FILTERS, useGames, type Filters, type SortKey } from '../lib/context';
import { allTags } from '../lib/filter';
import { LEVELS, LEVEL_LABEL, MODES, MODE_LABEL } from '../lib/types';
import { cx } from '../lib/ui';
import { MODE_ICON } from '../lib/icons';
import Icon, { type IconName } from './Icon';
import Modal from './Modal';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nom' },
  { key: 'rating', label: 'Ma note' },
  { key: 'lastPlayed', label: 'Dernière partie' },
  { key: 'plays', label: 'Plus joués' },
  { key: 'recent', label: 'Ajout récent' },
  { key: 'duration', label: 'Durée' },
  { key: 'price', label: 'Prix' },
  { key: 'priority', label: 'Priorité' },
];
const PLAYERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DURATIONS = [30, 45, 60, 90, 120, 180];
const AGES = [4, 6, 8, 10, 12, 14];

const Chip = ({ on, onClick, children, icon }: { on: boolean; onClick: () => void; children: ReactNode; icon?: IconName }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={cx(
      'chip px-3 py-1.5 text-sm transition',
      on ? 'bg-accent-600 text-white dark:bg-accent-500 dark:text-slate-950' : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    )}
  >
    {icon && <Icon name={icon} className="size-4" />}
    {children}
  </button>
);

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function activeChips(f: Filters) {
  const out: { label: string; clear: Partial<Filters> }[] = [];
  if (f.players != null) out.push({ label: `${f.players} joueur${f.players > 1 ? 's' : ''}`, clear: { players: null } });
  if (f.maxDuration != null) out.push({ label: `≤ ${f.maxDuration} min`, clear: { maxDuration: null } });
  if (f.age != null) out.push({ label: `${f.age} ans`, clear: { age: null } });
  for (const l of f.levels ?? []) out.push({ label: LEVEL_LABEL[l], clear: { levels: f.levels.filter((x) => x !== l) } });
  for (const m of f.modes ?? []) out.push({ label: MODE_LABEL[m], clear: { modes: f.modes.filter((x) => x !== m) } });
  if (f.neverPlayed) out.push({ label: 'Jamais joués', clear: { neverPlayed: false } });
  if (f.loanedOnly) out.push({ label: 'Prêtés', clear: { loanedOnly: false } });
  if (f.pendingOnly) out.push({ label: 'À enrichir', clear: { pendingOnly: false } });
  if (f.incompleteOnly) out.push({ label: 'Incomplets', clear: { incompleteOnly: false } });
  for (const t of f.tags) out.push({ label: `#${t}`, clear: { tags: f.tags.filter((x) => x !== t) } });
  return out;
}

export default function FilterBar() {
  const { games, filters: f, setFilters } = useGames();
  const [open, setOpen] = useState(false);
  const tags = allTags(games);
  const chips = activeChips(f);
  const sortLabel = SORTS.find((s) => s.key === f.sort)?.label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" type="search" placeholder="Rechercher un jeu, un tag…" value={f.q} onChange={(e) => setFilters({ q: e.target.value })} aria-label="Rechercher" />
        </label>
        <button className="btn-soft relative px-3" onClick={() => setOpen(true)} aria-label="Filtres et tri">
          <Icon name="filter" />
          {chips.length > 0 && (
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-accent-600 text-[10px] text-white">{chips.length}</span>
          )}
        </button>
        <button className="btn-soft px-3" onClick={() => setFilters({ view: f.view === 'list' ? 'grid' : 'list' })} aria-label={f.view === 'list' ? 'Vue grille' : 'Vue liste'}>
          <Icon name={f.view === 'list' ? 'grid' : 'list'} />
        </button>
      </div>

      <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 text-xs">
        <button className="chip shrink-0 bg-slate-200/70 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300" onClick={() => setOpen(true)}>
          <Icon name="sort" className="size-3.5" /> {sortLabel}
          <Icon name={f.dir === 'asc' ? 'up' : 'down'} className="size-3" />
        </button>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilters({ levels: toggle(f.levels ?? [], l) })}
            className={cx(
              'chip shrink-0 px-2.5 py-1',
              f.levels?.includes(l) ? 'bg-accent-600 text-white dark:bg-accent-500 dark:text-slate-950' : 'bg-slate-200/50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400',
            )}
          >
            {LEVEL_LABEL[l]}
          </button>
        ))}
        {chips
          .filter((c) => !LEVELS.some((l) => LEVEL_LABEL[l] === c.label))
          .map((c) => (
            <button key={c.label} className="chip shrink-0 bg-accent-600/10 px-2.5 py-1 text-accent-700 dark:text-accent-300" onClick={() => setFilters(c.clear)}>
              {c.label} <Icon name="close" className="size-3" />
            </button>
          ))}
      </div>

      {open && (
        <Modal title="Filtres et tri" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-5">
            <section>
              <span className="label">Trier par</span>
              <div className="flex flex-wrap gap-1.5">
                {SORTS.map((s) => (
                  <Chip key={s.key} on={f.sort === s.key} onClick={() => setFilters({ sort: s.key })}>
                    {s.label}
                  </Chip>
                ))}
                <Chip on={false} icon={f.dir === 'asc' ? 'up' : 'down'} onClick={() => setFilters({ dir: f.dir === 'asc' ? 'desc' : 'asc' })}>
                  {f.dir === 'asc' ? 'Croissant' : 'Décroissant'}
                </Chip>
              </div>
            </section>
            <section>
              <span className="label">Niveau</span>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map((l) => (
                  <Chip key={l} on={!!f.levels?.includes(l)} onClick={() => setFilters({ levels: toggle(f.levels ?? [], l) })}>
                    {LEVEL_LABEL[l]}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <span className="label">Type de jeu</span>
              <div className="flex flex-wrap gap-1.5">
                {MODES.map((m) => (
                  <Chip key={m} icon={MODE_ICON[m]} on={!!f.modes?.includes(m)} onClick={() => setFilters({ modes: toggle(f.modes ?? [], m) })}>
                    {MODE_LABEL[m]}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <span className="label">Nombre de joueurs</span>
              <div className="flex flex-wrap gap-1.5">
                {PLAYERS.map((n) => (
                  <Chip key={n} on={f.players === n} onClick={() => setFilters({ players: f.players === n ? null : n })}>
                    {n}
                    {n === 8 ? '+' : ''}
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <span className="label">Durée max</span>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <Chip key={d} on={f.maxDuration === d} onClick={() => setFilters({ maxDuration: f.maxDuration === d ? null : d })}>
                    {d} min
                  </Chip>
                ))}
              </div>
            </section>
            <section>
              <span className="label">Âge du plus jeune joueur</span>
              <div className="flex flex-wrap gap-1.5">
                {AGES.map((a) => (
                  <Chip key={a} on={f.age === a} onClick={() => setFilters({ age: f.age === a ? null : a })}>
                    {a} ans
                  </Chip>
                ))}
              </div>
            </section>
            {tags.length > 0 && (
              <section>
                <span className="label">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Chip key={t} on={f.tags.includes(t)} onClick={() => setFilters({ tags: toggle(f.tags, t) })}>
                      #{t}
                    </Chip>
                  ))}
                </div>
              </section>
            )}
            <section className="flex flex-wrap gap-1.5">
              <Chip icon="calendar" on={!!f.neverPlayed} onClick={() => setFilters({ neverPlayed: !f.neverPlayed })}>
                Jamais joués
              </Chip>
              <Chip icon="key" on={!!f.loanedOnly} onClick={() => setFilters({ loanedOnly: !f.loanedOnly })}>
                Prêtés
              </Chip>
              <Chip icon="warning" on={f.incompleteOnly} onClick={() => setFilters({ incompleteOnly: !f.incompleteOnly })}>
                Matériel manquant
              </Chip>
              <Chip icon="sparkle" on={f.pendingOnly} onClick={() => setFilters({ pendingOnly: !f.pendingOnly })}>
                À enrichir
              </Chip>
            </section>
            <div className="flex justify-between gap-2">
              <button className="btn-ghost" onClick={() => setFilters({ ...DEFAULT_FILTERS, status: f.status, q: f.q, view: f.view })}>
                Réinitialiser
              </button>
              <button className="btn-primary" onClick={() => setOpen(false)}>
                Voir les résultats
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
