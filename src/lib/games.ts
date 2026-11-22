import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type FieldValue,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Game, GameBase, Status } from './types';

const gamesCol = (fid: string) => collection(db, 'families', fid, 'games');
const gameDoc = (fid: string, id: string) => doc(db, 'families', fid, 'games', id);

type Patch = Record<string, unknown>;

/** '' / undefined / NaN → suppression du champ (update) */
function toUpdate(patch: Patch): Record<string, unknown | FieldValue> {
  const out: Record<string, unknown | FieldValue> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'id') continue;
    out[k] = v === '' || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? deleteField() : v;
  }
  return out;
}

/** '' / undefined / NaN → omis (create) */
function toCreate(patch: Patch): Patch {
  return Object.fromEntries(
    Object.entries(patch).filter(
      ([k, v]) => k !== 'id' && v !== '' && v !== undefined && !(typeof v === 'number' && Number.isNaN(v)),
    ),
  );
}

/** Retourne l'id immédiatement (fonctionne hors-ligne) ; `done` se résout à la synchro serveur */
export function addGame(fid: string, data: Partial<GameBase>) {
  const ref = doc(gamesCol(fid));
  const done = setDoc(ref, {
    notes: '',
    tags: [],
    priority: 2,
    playersMin: 0,
    playersMax: 0,
    durationMin: 0,
    ...toCreate(data),
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, done };
}

export const updateGame = (fid: string, id: string, patch: Partial<Game>) =>
  updateDoc(gameDoc(fid, id), toUpdate(patch));

export const setStatus = (fid: string, id: string, status: Status) => updateDoc(gameDoc(fid, id), { status });

export const deleteGame = (fid: string, id: string) => deleteDoc(gameDoc(fid, id));

const isTimestamp = (v: unknown): v is Timestamp =>
  typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as Timestamp).toDate === 'function';

export function exportJson(games: Game[], familyName: string) {
  const data = games.map((g) =>
    Object.fromEntries(Object.entries(g).map(([k, v]) => [k, isTimestamp(v) ? v.toDate().toISOString() : v])),
  );
  const blob = new Blob([JSON.stringify({ family: familyName, exportedAt: new Date().toISOString(), games: data }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ludotheque-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
