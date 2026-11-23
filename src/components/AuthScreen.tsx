import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '../lib/firebase';
import Icon from './Icon';
import Logo from './Logo';

const msg = (e: unknown) => {
  const code = e instanceof FirebaseError ? e.code : '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères min).',
    'auth/unauthorized-domain': 'Domaine non autorisé dans Firebase Auth (voir README).',
    'auth/operation-not-allowed': 'Méthode de connexion non activée dans Firebase.',
    'auth/popup-closed-by-user': '',
  };
  return code in map ? map[code] : e instanceof Error ? e.message : String(e);
};

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const google = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      if (e instanceof FirebaseError && e.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setError(msg(e));
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(msg(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email) return setError('Saisis ton email d’abord.');
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo('Email de réinitialisation envoyé.');
    } catch (err) {
      setError(msg(err));
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo framed className="size-28 drop-shadow-xl" />
        <h1 className="font-display text-3xl font-bold">Ludothèque</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Jeux possédés, wishlist et à surveiller.</p>
      </div>

      <button className="btn-soft w-full py-3" onClick={google}>
        <Icon name="key" className="size-5 text-accent-600 dark:text-accent-400" />
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> ou <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="input" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          className="input"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button className="btn-primary py-3" disabled={busy}>
          {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
        </button>
        <div className="flex justify-between text-sm">
          <button type="button" className="text-accent-600 dark:text-accent-400" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Créer un compte' : 'J’ai déjà un compte'}
          </button>
          {mode === 'login' && (
            <button type="button" className="text-slate-500" onClick={reset}>
              Mot de passe oublié
            </button>
          )}
        </div>
      </form>

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {info && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">{info}</p>}
    </div>
  );
}
