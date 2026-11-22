import { useRef, useState } from 'react';
import { deleteField } from 'firebase/firestore';
import { useSession } from '../lib/context';
import { updateGame } from '../lib/games';
import { fileToCompactDataUrl, imageSearchUrl } from '../lib/image';
import { toast } from '../lib/toast';
import type { Game } from '../lib/types';
import Cover from './Cover';
import Icon from './Icon';
import Modal from './Modal';

export default function CoverPicker({ game, onClose }: { game: Game; onClose: () => void }) {
  const { family } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const save = (coverUrl: string) => {
    void updateGame(family.id, game.id, { coverUrl, customCover: true, thumbUrl: deleteField() as unknown as string }).catch((e: Error) =>
      toast(`Erreur : ${e.message}`),
    );
    toast('Image enregistrée');
    onClose();
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      setPreview(await fileToCompactDataUrl(f));
    } catch {
      toast('Image illisible');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    void updateGame(family.id, game.id, { coverUrl: deleteField() as unknown as string, customCover: deleteField() as unknown as boolean });
    toast('Image retirée');
    onClose();
  };

  const shown = preview || (/^https?:\/\//.test(url) ? url : '') || game.coverUrl;

  return (
    <Modal title="Image du jeu" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Cover name={game.name} url={shown} className="mx-auto aspect-square w-44 rounded-2xl text-4xl shadow" />

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <button className="btn-soft py-3" disabled={busy} onClick={() => fileRef.current?.click()}>
          📷 Prendre une photo / choisir une image
        </button>

        <div className="flex flex-col gap-2">
          <label className="label" htmlFor="cp-url">
            …ou coller l’adresse d’une image
          </label>
          <input
            id="cp-url"
            className="input"
            type="url"
            inputMode="url"
            placeholder="https://…/image.jpg"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value.trim());
              setPreview('');
            }}
          />
          <a className="text-sm text-indigo-600 dark:text-indigo-400" href={imageSearchUrl(game.name)} target="_blank" rel="noreferrer noopener">
            <Icon name="search" className="mr-1 inline size-4" />
            Chercher une image de « {game.name} » (appui long sur l’image → « Copier l’adresse de l’image »)
          </a>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          {game.coverUrl ? (
            <button className="btn-danger" onClick={remove}>
              Retirer
            </button>
          ) : (
            <span />
          )}
          <button className="btn-primary" disabled={busy || (!preview && !/^https?:\/\//.test(url))} onClick={() => save(preview || url)}>
            Utiliser cette image
          </button>
        </div>
        <p className="text-xs text-slate-500">Une image choisie ici ne sera pas remplacée par celle de BGG.</p>
      </div>
    </Modal>
  );
}
