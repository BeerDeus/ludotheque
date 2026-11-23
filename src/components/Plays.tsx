import { useState, type FormEvent } from 'react';
import { formatDay, today } from '../lib/levels';
import type { Play } from '../lib/types';
import Icon from './Icon';

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Journal des parties jouées */
export default function Plays({ plays = [], onChange }: { plays?: Play[]; onChange: (p: Play[]) => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [players, setPlayers] = useState('');
  const [winner, setWinner] = useState('');
  const [note, setNote] = useState('');
  const sorted = [...plays].sort((a, b) => b.date.localeCompare(a.date));

  const add = (p: Omit<Play, 'id'>) => onChange([...plays, { id: newId(), ...p }]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    add({ date, ...(players ? { players: Number(players) } : {}), ...(winner.trim() ? { winner: winner.trim() } : {}), ...(note.trim() ? { note: note.trim() } : {}) });
    setPlayers('');
    setWinner('');
    setNote('');
    setOpen(false);
  };

  return (
    <details className="card group overflow-hidden" open={plays.length > 0}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold">
        <span className="flex items-center gap-2">
          <Icon name="calendar" className="size-5 text-accent-600 dark:text-accent-400" />
          <span className="font-display text-[15px]">Parties jouées</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="chip bg-slate-500/10 text-xs font-normal text-slate-500">{plays.length}</span>
          <Icon name="back" className="size-4 -rotate-90 transition group-open:rotate-90" />
        </span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => add({ date: today() })}>
            <Icon name="plus" className="size-4" /> Partie jouée aujourd’hui
          </button>
          <button className="btn-soft" onClick={() => setOpen((o) => !o)}>
            Détails…
          </button>
        </div>

        {open && (
          <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-xl bg-slate-500/5 p-2">
            <label className="col-span-1">
              <span className="label">Date</span>
              <input className="input py-1.5" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label>
              <span className="label">Joueurs</span>
              <input className="input py-1.5" inputMode="numeric" type="number" min={1} max={20} value={players} onChange={(e) => setPlayers(e.target.value)} />
            </label>
            <label className="col-span-2">
              <span className="label">Vainqueur</span>
              <input className="input py-1.5" placeholder="ex : Marcel, ou « victoire collective »" value={winner} onChange={(e) => setWinner(e.target.value)} />
            </label>
            <label className="col-span-2">
              <span className="label">Note</span>
              <input className="input py-1.5" placeholder="scénario, score, souvenir…" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button className="btn-primary col-span-2">Enregistrer la partie</button>
          </form>
        )}

        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune partie enregistrée pour l’instant.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
            {sorted.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-slate-500">{formatDay(p.date)}</span>
                <span className="min-w-0 flex-1">
                  {p.winner && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Icon name="crown" className="size-4 text-gold-500" />
                      {p.winner}
                    </span>
                  )}
                  {p.players ? <span className="ml-2 text-xs text-slate-500">{p.players} joueurs</span> : null}
                  {p.note && <span className="block text-xs text-slate-500">{p.note}</span>}
                  {!p.winner && !p.players && !p.note && <span className="text-slate-400">—</span>}
                </span>
                <button className="btn-ghost p-1 text-slate-400" onClick={() => confirm('Supprimer cette partie ?') && onChange(plays.filter((x) => x.id !== p.id))} aria-label="Supprimer">
                  <Icon name="trash" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
