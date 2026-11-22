import { useState, type FormEvent } from 'react';
import { signOut, type User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useLocation, useNavigate } from 'react-router';
import { auth } from '../lib/firebase';
import { createFamily, joinFamily } from '../lib/families';
import Logo from './Logo';

export default function Onboarding({ user }: { user: User }) {
  const location = useLocation();
  const navigate = useNavigate();
  const codeFromUrl = location.pathname.match(/^\/rejoindre\/([A-Za-z0-9-]+)/)?.[1] ?? '';
  const [code, setCode] = useState(codeFromUrl);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = (fn: () => Promise<unknown>, denied: string) => async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await fn();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof FirebaseError && err.code === 'permission-denied' ? denied : err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="size-12" />
        <h1 className="text-xl font-bold">Bienvenue {user.displayName?.split(' ')[0] ?? ''}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          La ludothèque est partagée par famille. Rejoins celle d’un proche avec son code, ou crée la tienne.
        </p>
      </div>

      <form className="card flex flex-col gap-3 p-4" onSubmit={run(() => joinFamily(user, code), 'Code invalide pour cette famille.')}>
        <h2 className="font-semibold">Rejoindre une famille</h2>
        <input className="input font-mono uppercase tracking-widest" placeholder="CODE D'INVITATION" value={code} onChange={(e) => setCode(e.target.value)} required />
        <button className="btn-primary" disabled={busy}>
          Rejoindre
        </button>
      </form>

      <form className="card flex flex-col gap-3 p-4" onSubmit={run(() => createFamily(user, name), 'Création de famille non autorisée pour ce compte. Demande à l’admin de t’ajouter (scripts/games.mjs access allow <email>).')}>
        <h2 className="font-semibold">Créer une famille</h2>
        <input className="input" placeholder="Nom (ex : Famille Dupont)" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <button className="btn-soft" disabled={busy}>
          Créer
        </button>
      </form>

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

      <button className="btn-ghost self-center text-xs" onClick={() => signOut(auth)}>
        Se déconnecter ({user.email})
      </button>
    </div>
  );
}
