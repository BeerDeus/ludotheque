import { useState, type ReactNode } from 'react';
import Icon from './Icon';
import Markdown from './Markdown';

type InputKind = 'text' | 'number' | 'url' | 'decimal';

/** Valeur courte éditable au tap (Entrée/blur = enregistrer, Échap = annuler) */
export function EditableField({
  label,
  value,
  display,
  kind = 'text',
  placeholder = '—',
  onSave,
}: {
  label: string;
  value: string;
  display?: ReactNode;
  kind?: InputKind;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() !== value) onSave(draft.trim());
    setDraft(null);
  };

  return (
    <div className="min-w-0">
      <span className="label">{label}</span>
      {draft === null ? (
        <button className="w-full truncate rounded-lg py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setDraft(value)}>
          {value ? display ?? value : <span className="text-slate-400">{placeholder}</span>}
        </button>
      ) : (
        <input
          className="input py-1"
          autoFocus
          type={kind === 'number' ? 'number' : kind === 'url' ? 'url' : 'text'}
          inputMode={kind === 'number' ? 'numeric' : kind === 'decimal' ? 'decimal' : undefined}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setDraft(null);
          }}
        />
      )}
    </div>
  );
}

/** Section markdown repliable, éditable */
export function EditableMarkdown({
  label,
  value,
  onSave,
  defaultOpen,
  empty = 'Pas encore renseigné.',
}: {
  label: string;
  value?: string;
  onSave: (v: string) => void;
  defaultOpen?: boolean;
  empty?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <details className="card group overflow-hidden" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          {!value && <span className="chip bg-slate-500/10 text-xs font-normal text-slate-500">vide</span>}
          <Icon name="back" className="size-4 -rotate-90 transition group-open:rotate-90" />
        </span>
      </summary>
      <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        {draft === null ? (
          <>
            {value ? <Markdown>{value}</Markdown> : <p className="text-sm text-slate-400">{empty}</p>}
            <button className="btn-ghost mt-2 px-2 py-1 text-xs" onClick={() => setDraft(value ?? '')}>
              <Icon name="edit" className="size-3.5" /> Modifier
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea className="input min-h-48 font-mono text-sm" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setDraft(null)}>
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (draft !== (value ?? '')) onSave(draft);
                  setDraft(null);
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
