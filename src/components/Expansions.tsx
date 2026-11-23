import { useMemo, useRef, useState, type FormEvent } from 'react';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { useSession } from '../lib/context';
import { db } from '../lib/firebase';
import { fileToCompactDataUrl } from '../lib/image';
import { toast } from '../lib/toast';
import Lightbox from './Lightbox';
import { normalize } from '../lib/format';
import type { Expansion, ExpansionKind, Game } from '../lib/types';
import { cx } from '../lib/ui';
import Icon from './Icon';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const kindOf = (e: Expansion): ExpansionKind => e.kind ?? 'expansion';

const GROUPS: { kind: ExpansionKind; title: string; hint: string; icon: string; box: string }[] = [
  { kind: 'standalone', title: 'Boîtes autonomes', hint: 'jouables seules', icon: '📦', box: 'border-indigo-500/25 bg-indigo-500/5' },
  { kind: 'expansion', title: 'Extensions', hint: 'nécessitent le jeu de base', icon: '🧩', box: 'border-slate-500/20 bg-slate-500/5' },
];

function Row({ e, gameId, onUpdate, onRemove }: { e: Expansion; gameId: string; onUpdate: (p: Partial<Expansion>) => void; onRemove: () => void }) {
  const { family } = useSession();
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<{ src?: string; loading: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = doc(db, 'families', family.id, 'games', gameId, 'images', e.id);

  const open = async () => {
    if (!e.thumb) return fileRef.current?.click();
    setView({ src: e.thumb, loading: true });
    try {
      const snap = await getDoc(imgRef);
      setView({ src: (snap.data()?.dataUrl as string | undefined) ?? e.thumb, loading: false });
    } catch {
      setView({ src: e.thumb, loading: false });
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const [full, thumb] = await Promise.all([fileToCompactDataUrl(f, 800, 220_000), fileToCompactDataUrl(f, 128, 12_000)]);
      void setDoc(imgRef, { dataUrl: full, source: 'photo' }).catch((err: Error) => toast(`Erreur : ${err.message}`));
      onUpdate({ thumb });
      toast('Photo enregistrée');
    } catch {
      toast('Image illisible');
    }
  };

  const removePhoto = () => {
    void deleteDoc(imgRef);
    onUpdate({ thumb: undefined });
  };

  return (
    <li className="flex flex-col gap-1 py-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(ev) => void onFile(ev.target.files?.[0])} />
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => void open()}
          className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-500/10 text-lg"
          aria-label={e.thumb ? `Voir l'image de ${e.name}` : `Ajouter une photo de ${e.name}`}
        >
          {e.thumb ? <img src={e.thumb} alt="" className="size-full object-cover" /> : <span className="opacity-60">{kindOf(e) === 'standalone' ? '📦' : '🧩'}</span>}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cx('text-sm leading-snug break-words', e.owned ? 'font-medium' : 'text-slate-600 dark:text-slate-400')}>{e.name}</p>
          {e.notes && !editing && <p className="mt-0.5 text-xs text-slate-500">{e.notes}</p>}
          <div className="mt-1 flex items-center gap-1">
            <button
              onClick={() => onUpdate({ owned: !e.owned })}
              className={cx('chip px-2 py-0.5 text-[11px]', e.owned ? 'bg-emerald-600 text-white' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300')}
              title="Changer le statut"
            >
              {e.owned ? '✓ Possédée' : 'Non possédée'}
            </button>
          </div>
        </div>
        <button className="btn-ghost p-1.5" onClick={() => setEditing((v) => !v)} aria-label="Modifier">
          <Icon name="edit" className="size-4" />
        </button>
      </div>
      {editing && (
        <div className="flex flex-col gap-2 rounded-xl bg-slate-500/5 p-2">
          <input
            className="input py-1 text-sm"
            autoFocus
            defaultValue={e.name}
            aria-label="Nom"
            onBlur={(ev) => ev.target.value.trim() && ev.target.value.trim() !== e.name && onUpdate({ name: ev.target.value.trim() })}
            onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()}
          />
          <input
            className="input py-1 text-sm"
            placeholder="Note (matériel manquant, prix visé…)"
            defaultValue={e.notes ?? ''}
            onBlur={(ev) => ev.target.value.trim() !== (e.notes ?? '') && onUpdate({ notes: ev.target.value.trim() || undefined })}
            onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()}
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button className="btn-soft px-2 py-1 text-xs" onClick={() => fileRef.current?.click()}>
              📷 {e.thumb ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
            {e.thumb && (
              <button className="btn-ghost px-2 py-1 text-xs" onClick={removePhoto}>
                Retirer la photo
              </button>
            )}
            <button className="btn-soft px-2 py-1 text-xs" onClick={() => onUpdate({ kind: kindOf(e) === 'standalone' ? 'expansion' : 'standalone' })}>
              → {kindOf(e) === 'standalone' ? 'Extension' : 'Boîte autonome'}
            </button>
            {e.bggId && (
              <a className="text-orange-600" href={`https://boardgamegeek.com/boardgame/${e.bggId}`} target="_blank" rel="noreferrer">
                BGG ↗
              </a>
            )}
            <button className="btn-danger ml-auto px-2 py-1 text-xs" onClick={onRemove}>
              <Icon name="trash" className="size-3.5" /> Retirer
            </button>
          </div>
        </div>
      )}
      {view && (
        <Lightbox
          src={view.src}
          alt={e.name}
          loading={view.loading}
          onClose={() => setView(null)}
          actions={
            <button className="btn-soft bg-white/15 text-white" onClick={() => fileRef.current?.click()}>
              📷 Remplacer par ma photo
            </button>
          }
        />
      )}
    </li>
  );
}

export default function Expansions({ game, onChange }: { game: Game; onChange: (list: Expansion[]) => void }) {
  const list = useMemo(() => game.expansions ?? [], [game.expansions]);
  const [name, setName] = useState('');
  const [owned, setOwned] = useState(true);
  const [kind, setKind] = useState<ExpansionKind>('expansion');
  const [showBgg, setShowBgg] = useState(false);
  const [q, setQ] = useState('');

  const known = new Set(list.map((e) => e.bggId).filter(Boolean));
  const suggestions = (game.bggExpansions ?? []).filter((x) => !known.has(x.bggId) && (!q || normalize(x.name).includes(normalize(q))));

  const update = (id: string, patch: Partial<Expansion>) => onChange(list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (e: Expansion) => confirm(`Retirer « ${e.name} » ?`) && onChange(list.filter((x) => x.id !== e.id));
  const add = (e: Omit<Expansion, 'id'>) => onChange([...list, { id: newId(), ...e }]);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return;
    add({ name: name.trim(), owned, ...(kind === 'standalone' ? { kind } : {}) });
    setName('');
  };

  const ownedCount = list.filter((e) => e.owned).length;
  const sorted = (k: ExpansionKind) =>
    list.filter((e) => kindOf(e) === k).sort((a, b) => Number(b.owned) - Number(a.owned) || a.name.localeCompare(b.name, 'fr'));

  return (
    <details className="card overflow-hidden" open={list.length > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold">
        <span>Boîtes & extensions</span>
        {list.length > 0 && (
          <span className="chip bg-slate-500/10 text-xs font-normal text-slate-500">
            {ownedCount} possédée{ownedCount > 1 ? 's' : ''} / {list.length}
          </span>
        )}
      </summary>
      <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
        {GROUPS.map((g) => {
          const items = sorted(g.kind);
          if (!items.length) return null;
          const own = items.filter((e) => e.owned).length;
          return (
            <section key={g.kind} className={cx('rounded-2xl border px-3 pt-2.5 pb-1', g.box)}>
              <h4 className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">
                  {g.icon} {g.title} <span className="text-xs font-normal text-slate-500">· {g.hint}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {own}/{items.length}
                </span>
              </h4>
              <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((e) => (
                  <Row key={e.id} e={e} gameId={game.id} onUpdate={(p) => update(e.id, p)} onRemove={() => remove(e)} />
                ))}
              </ul>
            </section>
          );
        })}

        <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl bg-slate-500/5 p-2">
          <input className="input py-1.5" placeholder="Ajouter une boîte ou une extension…" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap items-center gap-1.5">
            {(['expansion', 'standalone'] as ExpansionKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cx('chip px-2.5 py-1', kind === k ? 'bg-indigo-600 text-white' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300')}
              >
                {k === 'standalone' ? 'Boîte autonome' : 'Extension'}
              </button>
            ))}
            <button
              type="button"
              className={cx('chip px-2.5 py-1', owned ? 'bg-emerald-600 text-white' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300')}
              onClick={() => setOwned((o) => !o)}
            >
              {owned ? '✓ Possédée' : 'Non possédée'}
            </button>
            <button className="btn-primary ml-auto px-3 py-1" aria-label="Ajouter" disabled={!name.trim()}>
              <Icon name="plus" className="size-4" />
            </button>
          </div>
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
