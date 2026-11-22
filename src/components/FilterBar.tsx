import { useState } from 'react';
import { DEFAULT_FILTERS, useGames, type Filters, type SortKey } from '../lib/context';
import { allTags } from '../lib/filter';
import { cx } from '../lib/ui';
import Icon from './Icon';
import Modal from './Modal';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nom' },
  { key: 'rating', label: 'Ma note' },
  { key: 'recent', label: 'Ajout récent' },
  { key: 'duration', label: 'Durée' },
  { key: 'price', label: 'Prix' },
  { key: 'priority', label: 'Priorité' },
];
const PLAYERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DURATIONS = [30, 45, 60, 90, 120, 180];
const AGES = [4, 6, 8, 10, 12, 14];

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx('chip px-3 py-1.5 text-sm transition', on ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}
  >
    {children}
  </button>
);

function activeChips(f: Filters) {
  const out: { label: string; clear: Partial<Filters> }[] = [];
  if (f.players != null) out.push({ label: `${f.players} joueur${f.players > 1 ? 's' : ''}`, clear: { players: null } });
  if (f.maxDuration != null) out.push({ label: `≤ ${f.maxDuration} min`, clear: { maxDuration: null } });
  if (f.age != null) out.push({ label: `${f.age} ans`, clear: { age: null } });
  if (f.pendingOnly) out.push({ label: 'Non enrichis', clear: { pendingOnly: false } });
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
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" type="search" placeholder="Rechercher un jeu, un tag…" value={f.q} onChange={(e) => setFilters({ q: e.target.value })} aria-label="Rechercher" />
        </label>
        <button className="btn-soft relative px-3" onClick={() => setOpen(true)} aria-label="Filtres et tri">
          <Icon name="filter" />
          {chips.length > 0 && <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-indigo-600 text-[10px] text-white">{chips.length}</span>}
        </button>
        <button className="btn-soft px-3" onClick={() => setFilters({ view: f.view === 'list' ? 'grid' : 'list' })} aria-label={f.view === 'list' ? 'Vue grille' : 'Vue liste'}>
          {f.view === 'list' ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          ) : (
            <Icon name="menu" />
          )}
        </button>
      </div>

      <div className="no-scrollbar -mx-3 flex items-center gap-1.5 overflow-x-auto px-3 text-xs">
        <button className="chip shrink-0 bg-slate-200/70 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300" onClick={() => setOpen(true)}>
          <Icon name="sort" className="size-3.5" /> {sortLabel} {f.dir === 'asc' ? '↑' : '↓'}
        </button>
        {chips.map((c) => (
          <button key={c.label} className="chip shrink-0 bg-indigo-600/10 px-2.5 py-1 text-indigo-700 dark:text-indigo-300" onClick={() => setFilters(c.clear)}>
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
                <Chip on={false} onClick={() => setFilters({ dir: f.dir === 'asc' ? 'desc' : 'asc' })}>
                  {f.dir === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
                </Chip>
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
                  {tags.map((t) => {
                    const on = f.tags.includes(t);
                    return (
                      <Chip key={t} on={on} onClick={() => setFilters({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}>
                        #{t}
                      </Chip>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="flex flex-wrap gap-1.5">
              <Chip on={f.incompleteOnly} onClick={() => setFilters({ incompleteOnly: !f.incompleteOnly })}>
                ⚠ Matériel manquant
              </Chip>
              <Chip on={f.pendingOnly} onClick={() => setFilters({ pendingOnly: !f.pendingOnly })}>
                Non enrichis
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
