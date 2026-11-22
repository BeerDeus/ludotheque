import { useState, type FormEvent } from 'react';
import { useGames, useSession } from '../lib/context';
import { allTags } from '../lib/filter';
import { parseTags } from '../lib/format';
import { updateGame } from '../lib/games';
import { toast } from '../lib/toast';
import { PRIORITY_LABEL, type Game, type GameBase, type Priority } from '../lib/types';
import { cx } from '../lib/ui';
import Modal from './Modal';
import StarRating from './StarRating';
import StatusControl from './StatusControl';

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));
const str = (n?: number) => (n == null || n === 0 ? '' : String(n));

/** Édition complète d'un jeu existant (l'ajout passe par QuickAdd) */
export default function GameForm({ game, onClose }: { game: Game; onClose: () => void }) {
  const { family } = useSession();
  const { games } = useGames();
  const [f, setF] = useState({
    name: game.name,
    status: game.status,
    playersMin: str(game.playersMin),
    playersMax: str(game.playersMax),
    durationMin: str(game.durationMin),
    ageMin: str(game.ageMin),
    priceBought: str(game.priceBought),
    priceTarget: str(game.priceTarget),
    shop: game.shop ?? '',
    url: game.url ?? '',
    priority: (game.priority ?? 2) as Priority,
    myRating: game.myRating,
    tags: (game.tags ?? []).join(', '),
    notes: game.notes ?? '',
    missingParts: game.missingParts ?? '',
  });
  const [error, setError] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const owned = f.status === 'owned';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const pMin = num(f.playersMin) ?? 0;
    const pMax = num(f.playersMax) ?? pMin;
    if (pMin && pMax && pMax < pMin) return setError('Joueurs max < min.');
    const data: Partial<GameBase> = {
      name: f.name.trim(),
      status: f.status,
      playersMin: pMin,
      playersMax: pMax,
      durationMin: num(f.durationMin) ?? 0,
      ageMin: num(f.ageMin),
      priceBought: num(f.priceBought),
      priceTarget: num(f.priceTarget),
      shop: f.shop.trim(),
      url: f.url.trim(),
      priority: f.priority,
      myRating: f.myRating,
      tags: parseTags(f.tags),
      notes: f.notes,
      missingParts: f.missingParts.trim(),
    };
    void updateGame(family.id, game.id, data).catch((err: Error) => toast(`Erreur : ${err.message}`));
    toast('Modifications enregistrées');
    onClose();
  };

  const field = (id: string, label: string, el: React.ReactNode, className?: string) => (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {el}
    </div>
  );
  const numInput = (id: string, k: 'playersMin' | 'playersMax' | 'durationMin' | 'ageMin', max: number) => (
    <input id={id} className="input" inputMode="numeric" type="number" min={1} max={max} placeholder="auto" value={f[k]} onChange={(e) => set(k, e.target.value)} />
  );

  return (
    <Modal title="Modifier le jeu" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {field('gf-name', 'Nom', <input id="gf-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required maxLength={200} />)}

        <StatusControl value={f.status} onChange={(s) => set('status', s)} />

        <div className="flex items-center justify-between">
          <span className="label mb-0">Ma note</span>
          <StarRating value={f.myRating} onChange={(v) => set('myRating', v)} size="lg" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {field('gf-pmin', 'J. min', numInput('gf-pmin', 'playersMin', 99))}
          {field('gf-pmax', 'J. max', numInput('gf-pmax', 'playersMax', 99))}
          {field('gf-dur', 'Minutes', numInput('gf-dur', 'durationMin', 1440))}
          {field('gf-age', 'Âge', numInput('gf-age', 'ageMin', 99))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {owned
            ? field('gf-pb', 'Prix payé (€)', <input id="gf-pb" className="input" inputMode="decimal" value={f.priceBought} onChange={(e) => set('priceBought', e.target.value)} pattern="[0-9]+([.,][0-9]{1,2})?" />)
            : field('gf-pt', 'Prix cible (€)', <input id="gf-pt" className="input" inputMode="decimal" value={f.priceTarget} onChange={(e) => set('priceTarget', e.target.value)} pattern="[0-9]+([.,][0-9]{1,2})?" />)}
          {field('gf-shop', 'Boutique', <input id="gf-shop" className="input" value={f.shop} onChange={(e) => set('shop', e.target.value)} />)}
        </div>

        {!owned && (
          <div>
            <span className="label">Priorité</span>
            <div className="grid grid-cols-3 gap-1">
              {([1, 2, 3] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={cx('rounded-xl py-1.5 text-sm', f.priority === p ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 dark:bg-slate-800')}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>
        )}

        {field('gf-url', 'Lien d’achat', <input id="gf-url" className="input" type="url" placeholder="https://…" value={f.url} onChange={(e) => set('url', e.target.value)} />)}

        {field(
          'gf-tags',
          'Tags (séparés par des virgules)',
          <>
            <input id="gf-tags" className="input" list="gf-tags-list" placeholder="coop, famille, expert…" value={f.tags} onChange={(e) => set('tags', e.target.value)} />
            <datalist id="gf-tags-list">
              {allTags(games).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </>,
        )}

        {owned &&
          field(
            'gf-missing',
            'Matériel manquant / abîmé',
            <textarea id="gf-missing" className="input min-h-16" placeholder="ex : 2 cartes manquantes, 1 meeple rouge" value={f.missingParts} onChange={(e) => set('missingParts', e.target.value)} />,
          )}

        {field('gf-notes', 'Notes', <textarea id="gf-notes" className="input min-h-20" value={f.notes} onChange={(e) => set('notes', e.target.value)} />)}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
