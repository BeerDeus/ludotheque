import { useMemo, useState, type FormEvent } from 'react';
import { normalize } from '../lib/format';
import type { Expansion, Game } from '../lib/types';
import { cx } from '../lib/ui';
import Icon from './Icon';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function Expansions({ game, onChange }: { game: Game; onChange: (list: Expansion[]) => void }) {
  const list = useMemo(() => game.expansions ?? [], [game.expansions]);
  const [name, setName] = useState('');
  const [owned, setOwned] = useState(true);
  const [showBgg, setShowBgg] = useState(false);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const known = new Set(list.map((e) => e.bggId).filter(Boolean));
  const suggestions = (game.bggExpansions ?? []).filter((x) => !known.has(x.bggId) && (!q || normalize(x.name).includes(normalize(q))));

  const update = (id: string, patch: Partial<Expansion>) => onChange(list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (e: Expansion) => confirm(`Retirer « ${e.name} » ?`) && onChange(list.filter((x) => x.id !== e.id));
  const add = (e: Omit<Expansion, 'id'>) => onChange([...list, { id: newId(), ...e }]);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return;
    add({ name: name.trim(), owned });
    setName('');
  };

  const sorted = [...list].sort((a, b) => Number(b.owned) - Number(a.owned) || a.name.localeCompare(b.name, 'fr'));
  const ownedCount = list.filter((e) => e.owned).length;

  return (
    <details className="card overflow-hidden" open={list.length > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold">
        <span>Extensions</span>
        <span className="chip bg-slate-500/10 text-xs font-normal text-slate-500">
          {ownedCount} possédée{ownedCount > 1 ? 's' : ''} / {list.length}
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        {sorted.length > 0 && (
          <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
            {sorted.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update(e.id, { owned: !e.owned })}
                    className={cx('chip shrink-0 px-2.5 py-1', e.owned ? 'bg-emerald-600 text-white' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300')}
                    title="Changer le statut"
                  >
                    {e.owned ? '✓ Possédée' : 'Non possédée'}
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm">{e.name}</span>
                  {e.bggId && (
                    <a className="text-xs text-orange-600" href={`https://boardgamegeek.com/boardgameexpansion/${e.bggId}`} target="_blank" rel="noreferrer">
                      BGG
                    </a>
                  )}
                  <button className="btn-ghost p-1.5" onClick={() => setEditing(editing === e.id ? null : e.id)} aria-label="Note">
                    <Icon name="edit" className="size-4" />
                  </button>
                  <button className="btn-ghost p-1.5 text-red-600" onClick={() => remove(e)} aria-label="Retirer">
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
                {editing === e.id ? (
                  <input
                    className="input py-1 text-sm"
                    autoFocus
                    placeholder="Note (matériel manquant, prix visé…)"
                    defaultValue={e.notes ?? ''}
                    onBlur={(ev) => {
                      if (ev.target.value.trim() !== (e.notes ?? '')) update(e.id, { notes: ev.target.value.trim() || undefined });
                      setEditing(null);
                    }}
                    onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()}
                  />
                ) : (
                  e.notes && <p className="pl-1 text-xs text-slate-500">{e.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <input className="input flex-1 py-1.5" placeholder="Ajouter une extension…" value={name} onChange={(e) => setName(e.target.value)} />
          <button
            type="button"
            className={cx('chip shrink-0 px-2.5', owned ? 'bg-emerald-600 text-white' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300')}
            onClick={() => setOwned((o) => !o)}
            title="Statut de l'extension ajoutée"
          >
            {owned ? '✓ Possédée' : 'Non possédée'}
          </button>
          <button className="btn-primary px-3" aria-label="Ajouter">
            <Icon name="plus" className="size-4" />
          </button>
        </form>

        {(game.bggExpansions?.length ?? 0) > 0 && (
          <div>
            <button className="btn-ghost px-0 text-xs text-indigo-600 dark:text-indigo-400" onClick={() => setShowBgg((s) => !s)}>
              {showBgg ? 'Masquer' : 'Voir'} les extensions connues sur BGG ({game.bggExpansions!.length})
            </button>
            {showBgg && (
              <div className="mt-2 flex flex-col gap-2">
                {game.bggExpansions!.length > 8 && <input className="input py-1 text-sm" placeholder="Filtrer…" value={q} onChange={(e) => setQ(e.target.value)} />}
                <ul className="flex max-h-72 flex-col overflow-y-auto">
                  {suggestions.map((x) => (
                    <li key={x.bggId} className="flex items-center gap-2 py-1 text-sm">
                      <span className="min-w-0 flex-1 truncate">{x.name}</span>
                      <button className="chip bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" onClick={() => add({ name: x.name, bggId: x.bggId, owned: true })}>
                        + possédée
                      </button>
                      <button className="chip bg-slate-500/15" onClick={() => add({ name: x.name, bggId: x.bggId, owned: false })}>
                        + suivie
                      </button>
                    </li>
                  ))}
                  {suggestions.length === 0 && <li className="py-1 text-xs text-slate-400">Aucune autre extension.</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
