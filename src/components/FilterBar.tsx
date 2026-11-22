import { useState } from 'react';
import { DEFAULT_FILTERS, useGames, type SortKey } from '../lib/context';
import { allTags } from '../lib/filter';
import { STATUSES, STATUS_LABEL_PLURAL, type Status } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import Icon from './Icon';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nom' },
  { key: 'priority', label: 'Priorité' },
  { key: 'price', label: 'Prix' },
  { key: 'duration', label: 'Durée' },
  { key: 'recent', label: 'Ajout récent' },
];

const DURATIONS = [30, 45, 60, 90, 120, 180];

export default function FilterBar() {
  const { games, filters: f, setFilters } = useGames();
  const [open, setOpen] = useState(false);
  const tags = allTags(games);
  const count = (s: Status | 'all') => (s === 'all' ? games.length : games.filter((g) => g.status === s).length);
  const active = (f.tags.length ? 1 : 0) + (f.players != null ? 1 : 0) + (f.maxDuration != null ? 1 : 0) + (f.pendingOnly ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ status: s })}
            className={cx(
              'chip shrink-0 px-3 py-1.5 text-sm',
              f.status === s
                ? s === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : STATUS_STYLE[s].active
                : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {s === 'all' ? 'Tous' : STATUS_LABEL_PLURAL[s]}
            <span className="opacity-70">{count(s)}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <label className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            type="search"
            placeholder="Rechercher…"
            value={f.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            aria-label="Rechercher"
          />
        </label>
        <button className={cx('btn-soft relative px-3', open && 'ring-2 ring-indigo-500/40')} onClick={() => setOpen((o) => !o)} aria-label="Filtres">
          <Icon name="filter" />
          {active > 0 && <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-indigo-600 text-[10px] text-white">{active}</span>}
        </button>
      </div>

      {open && (
        <div className="card flex flex-col gap-3 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-players">Jouable à</label>
              <select id="f-players" className="input" value={f.players ?? ''} onChange={(e) => setFilters({ players: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Peu importe</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} joueur{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-dur">Durée max</label>
              <select id="f-dur" className="input" value={f.maxDuration ?? ''} onChange={(e) => setFilters({ maxDuration: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Peu importe</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    ≤ {d} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-sort">Tri</label>
              <select id="f-sort" className="input" value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as SortKey })}>
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="label">Ordre</span>
              <button className="btn-soft w-full" onClick={() => setFilters({ dir: f.dir === 'asc' ? 'desc' : 'asc' })}>
                <Icon name="sort" className="size-4" />
                {f.dir === 'asc' ? 'Croissant' : 'Décroissant'}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-indigo-600" checked={f.pendingOnly} onChange={(e) => setFilters({ pendingOnly: e.target.checked })} />
            Seulement les jeux non enrichis
          </label>

          {tags.length > 0 && (
            <div>
              <span className="label">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const on = f.tags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setFilters({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}
                      className={cx('chip px-2.5 py-1 text-sm', on ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300')}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            className="btn-ghost self-end text-xs"
            onClick={() => setFilters({ ...DEFAULT_FILTERS, status: f.status, q: f.q })}
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
