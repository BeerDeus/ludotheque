import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useGames, useSession } from '../lib/context';
import { allTags } from '../lib/filter';
import { normalize, parseTags } from '../lib/format';
import { addGame } from '../lib/games';
import { toast } from '../lib/toast';
import { PRIORITY_LABEL, STATUS_LABEL, type GameBase, type Priority, type Status } from '../lib/types';
import { cx } from '../lib/ui';
import Icon from './Icon';
import Modal from './Modal';
import StatusControl from './StatusControl';

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

/** Ajout rapide : nom + statut suffisent, BGG/Claude complètent le reste */
export default function QuickAdd({ initialStatus, onClose }: { initialStatus: Status; onClose: () => void }) {
  const { family } = useSession();
  const { games } = useGames();
  const navigate = useNavigate();
  const nameRef = useRef<HTMLInputElement>(null);
  const [multi, setMulti] = useState(false);
  const [name, setName] = useState('');
  const [bulk, setBulk] = useState('');
  const [status, setStatus] = useState<Status>(initialStatus);
  const [more, setMore] = useState(false);
  const [price, setPrice] = useState('');
  const [shop, setShop] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>(2);
  const [added, setAdded] = useState<string[]>([]);

  const existing = useMemo(() => new Map(games.map((g) => [normalize(g.name), g])), [games]);
  const dup = name.trim() ? existing.get(normalize(name)) : undefined;
  const bulkNames = useMemo(
    () => Array.from(new Set(bulk.split('\n').map((l) => l.trim()).filter(Boolean))),
    [bulk],
  );
  const bulkDups = bulkNames.filter((n) => existing.has(normalize(n)));
  const tagList = allTags(games);

  const extra = (): Partial<GameBase> => {
    const owned = status === 'owned';
    return {
      ...(owned ? { priceBought: num(price) } : { priceTarget: num(price), priority }),
      shop: shop.trim(),
      url: url.trim(),
      tags: parseTags(tags),
      notes,
    };
  };

  const create = (n: string, data: Partial<GameBase> = {}) => {
    const { id, done } = addGame(family.id, { name: n, status, ...data });
    void done.catch((e: Error) => toast(`Erreur : ${e.message}`));
    return id;
  };

  const submitOne = (keepOpen: boolean) => (e?: FormEvent) => {
    e?.preventDefault();
    const n = name.trim();
    if (!n) return;
    const id = create(n, extra());
    if (keepOpen) {
      setAdded((a) => [n, ...a]);
      setName('');
      setPrice('');
      setNotes('');
      nameRef.current?.focus();
    } else {
      toast(`« ${n} » ajouté`, { label: 'Voir', run: () => navigate(`/jeu/${id}`) });
      onClose();
    }
  };

  const submitBulk = (e: FormEvent) => {
    e.preventDefault();
    const todo = bulkNames.filter((n) => !existing.has(normalize(n)));
    todo.forEach((n) => create(n));
    toast(`${todo.length} jeu${todo.length > 1 ? 'x' : ''} ajouté${todo.length > 1 ? 's' : ''}${bulkDups.length ? ` · ${bulkDups.length} doublon(s) ignoré(s)` : ''}`);
    onClose();
  };

  return (
    <Modal title="Ajouter des jeux" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 text-sm dark:bg-slate-800">
          {[
            [false, 'Un jeu'],
            [true, 'Plusieurs (liste)'],
          ].map(([m, label]) => (
            <button
              key={String(m)}
              type="button"
              onClick={() => setMulti(m as boolean)}
              className={cx('rounded-xl py-1.5 font-medium', multi === m ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500')}
            >
              {label as string}
            </button>
          ))}
        </div>

        <StatusControl value={status} onChange={setStatus} />

        {!multi ? (
          <form onSubmit={submitOne(false)} className="flex flex-col gap-3">
            <div>
              <input
                ref={nameRef}
                className="input py-3 text-lg"
                placeholder="Nom du jeu (ex : Destinies)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                enterKeyHint="done"
                autoCapitalize="words"
                maxLength={200}
                aria-label="Nom du jeu"
              />
              {dup && (
                <button type="button" className="mt-1.5 text-left text-xs text-amber-600 dark:text-amber-400" onClick={() => navigate(`/jeu/${dup.id}`)}>
                  ⚠ Déjà dans ta ludothèque ({STATUS_LABEL[dup.status]}) — voir la fiche
                </button>
              )}
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Image, joueurs, durée, âge et règles sont complétés automatiquement.
              </p>
            </div>

            <button type="button" className="flex items-center gap-1 self-start text-sm text-indigo-600 dark:text-indigo-400" onClick={() => setMore((m) => !m)}>
              <Icon name="back" className={cx('size-4 transition', more ? 'rotate-90' : '-rotate-90')} />
              {more ? 'Moins d’options' : 'Prix, boutique, tags, notes…'}
            </button>

            {more && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="qa-price">{status === 'owned' ? 'Prix payé (€)' : 'Prix cible (€)'}</label>
                    <input id="qa-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} pattern="[0-9]+([.,][0-9]{1,2})?" />
                  </div>
                  <div>
                    <label className="label" htmlFor="qa-shop">Boutique</label>
                    <input id="qa-shop" className="input" value={shop} onChange={(e) => setShop(e.target.value)} />
                  </div>
                </div>
                {status !== 'owned' && (
                  <div>
                    <span className="label">Priorité</span>
                    <div className="grid grid-cols-3 gap-1">
                      {([1, 2, 3] as Priority[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cx('rounded-xl py-1.5 text-sm', priority === p ? 'bg-indigo-600 text-white' : 'bg-slate-200/70 dark:bg-slate-800')}
                        >
                          {PRIORITY_LABEL[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="qa-url">Lien d’achat</label>
                  <input id="qa-url" className="input" type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="qa-tags">Tags</label>
                  <input id="qa-tags" className="input" list="qa-tags-list" placeholder="coop, famille…" value={tags} onChange={(e) => setTags(e.target.value)} />
                  <datalist id="qa-tags-list">
                    {tagList.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="label" htmlFor="qa-notes">Notes</label>
                  <textarea id="qa-notes" className="input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            )}

            {added.length > 0 && (
              <p className="rounded-xl bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                Ajoutés : {added.join(', ')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-soft py-3" disabled={!name.trim()} onClick={() => submitOne(true)()}>
                <Icon name="plus" className="size-4" /> Ajouter + autre
              </button>
              <button className="btn-primary py-3" disabled={!name.trim()}>
                <Icon name="check" className="size-4" /> Ajouter
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitBulk} className="flex flex-col gap-3">
            <textarea
              className="input min-h-48"
              placeholder={'Un jeu par ligne :\nDestinies\nCascadia\nLes Aventuriers du Rail'}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              autoFocus
              aria-label="Liste de jeux"
            />
            {bulkDups.length > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">Déjà présents (ignorés) : {bulkDups.join(', ')}</p>}
            <button className="btn-primary py-3" disabled={bulkNames.length - bulkDups.length === 0}>
              Ajouter {bulkNames.length - bulkDups.length || ''} jeu{bulkNames.length - bulkDups.length > 1 ? 'x' : ''} en « {STATUS_LABEL[status]} »
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
