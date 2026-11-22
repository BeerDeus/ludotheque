import { useState, type FormEvent } from 'react';
import { useGames, useSession } from '../lib/context';
import { allTags } from '../lib/filter';
import { parseTags } from '../lib/format';
import { addGame, updateGame } from '../lib/games';
import { PRIORITY_LABEL, type Game, type GameBase, type Priority, type Status } from '../lib/types';
import Modal from './Modal';
import StatusControl from './StatusControl';

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));
const str = (n?: number) => (n == null || n === 0 ? '' : String(n));

export default function GameForm({
  game,
  initialStatus = 'wishlist',
  onClose,
  onSaved,
}: {
  game?: Game;
  initialStatus?: Status;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { family } = useSession();
  const { games } = useGames();
  const [f, setF] = useState({
    name: game?.name ?? '',
    status: game?.status ?? initialStatus,
    playersMin: str(game?.playersMin),
    playersMax: str(game?.playersMax),
    durationMin: str(game?.durationMin),
    ageMin: str(game?.ageMin),
    priceBought: str(game?.priceBought),
    priceTarget: str(game?.priceTarget),
    shop: game?.shop ?? '',
    url: game?.url ?? '',
    priority: (game?.priority ?? 2) as Priority,
    tags: (game?.tags ?? []).join(', '),
    notes: game?.notes ?? '',
    missingParts: game?.missingParts ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const tags = allTags(games);

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
      tags: parseTags(f.tags),
      notes: f.notes,
      missingParts: f.missingParts.trim(),
    };
    setBusy(true);
    try {
      // hors-ligne : la promesse ne se résout qu'à la synchro → on n'attend pas pour fermer
      if (game) {
        void updateGame(family.id, game.id, data).catch((err: Error) => alert(err.message));
        onSaved?.(game.id);
      } else {
        const { id, done } = addGame(family.id, data);
        void done.catch((err: Error) => alert(err.message));
        onSaved?.(id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={game ? 'Modifier le jeu' : 'Ajouter un jeu'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="gf-name">Nom *</label>
          <input id="gf-name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required autoFocus={!game} maxLength={200} />
        </div>

        <StatusControl value={f.status} onChange={(s) => set('status', s)} />

        <p className="-mb-2 text-xs text-slate-500 dark:text-slate-400">
          Champs vides = complétés automatiquement depuis BoardGameGeek (image, joueurs, durée, âge…) peu après l’enregistrement.
        </p>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="label" htmlFor="gf-pmin">J. min</label>
            <input id="gf-pmin" className="input" placeholder="auto" inputMode="numeric" type="number" min={1} max={99} value={f.playersMin} onChange={(e) => set('playersMin', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="gf-pmax">J. max</label>
            <input id="gf-pmax" className="input" placeholder="auto" inputMode="numeric" type="number" min={1} max={99} value={f.playersMax} onChange={(e) => set('playersMax', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="gf-dur">Minutes</label>
            <input id="gf-dur" className="input" placeholder="auto" inputMode="numeric" type="number" min={1} max={1440} value={f.durationMin} onChange={(e) => set('durationMin', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="gf-age">Âge</label>
            <input id="gf-age" className="input" placeholder="auto" inputMode="numeric" type="number" min={1} max={99} value={f.ageMin} onChange={(e) => set('ageMin', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="gf-pb">Prix payé (€)</label>
            <input id="gf-pb" className="input" inputMode="decimal" value={f.priceBought} onChange={(e) => set('priceBought', e.target.value)} pattern="[0-9]+([.,][0-9]{1,2})?" />
          </div>
          <div>
            <label className="label" htmlFor="gf-pt">Prix cible (€)</label>
            <input id="gf-pt" className="input" inputMode="decimal" value={f.priceTarget} onChange={(e) => set('priceTarget', e.target.value)} pattern="[0-9]+([.,][0-9]{1,2})?" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="gf-shop">Boutique</label>
            <input id="gf-shop" className="input" value={f.shop} onChange={(e) => set('shop', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="gf-prio">Priorité</label>
            <select id="gf-prio" className="input" value={f.priority} onChange={(e) => set('priority', Number(e.target.value) as Priority)}>
              {([1, 2, 3] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {p} – {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="gf-url">Lien d’achat</label>
          <input id="gf-url" className="input" type="url" placeholder="https://…" value={f.url} onChange={(e) => set('url', e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="gf-tags">Tags (séparés par des virgules)</label>
          <input id="gf-tags" className="input" list="gf-tags-list" placeholder="coop, famille, expert…" value={f.tags} onChange={(e) => set('tags', e.target.value)} />
          <datalist id="gf-tags-list">
            {tags.map((t) => (
              <option key={t} value={f.tags.includes(',') ? `${f.tags.replace(/[^,]*$/, '').trim()} ${t}` : t} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label" htmlFor="gf-notes">Notes</label>
          <textarea id="gf-notes" className="input min-h-20" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="gf-missing">Matériel manquant / abîmé</label>
          <textarea id="gf-missing" className="input min-h-16" placeholder="ex : 2 cartes Lac manquantes, 1 meeple rouge" value={f.missingParts} onChange={(e) => set('missingParts', e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" disabled={busy}>
            {game ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
