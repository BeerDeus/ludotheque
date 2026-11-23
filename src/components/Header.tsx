import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useGames, useSession } from '../lib/context';
import { exportJson } from '../lib/games';
import Icon from './Icon';
import Logo from './Logo';

export default function Header({ left, title, right }: { left?: ReactNode; title?: string; right?: ReactNode }) {
  const { family } = useSession();
  const { games } = useGames();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-100/85 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/85"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-1.5 px-3">
        {left ?? (
          <Link to="/" className="flex items-center gap-2" aria-label="Accueil">
            <Logo className="size-9" />
          </Link>
        )}
        <h1 className="font-display min-w-0 flex-1 truncate text-[17px] font-semibold">{title ?? family.name}</h1>
        {right ?? (
          <Link to="/que-jouer" className="btn-ghost p-2" aria-label="Que jouer ?" title="Que jouer ?">
            <Icon name="dice" className="size-6" />
          </Link>
        )}
        <div className="relative">
          <button className="btn-ghost p-2" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            <Icon name="menu" className="size-6" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="card absolute right-0 z-50 mt-1 w-60 overflow-hidden p-1 shadow-xl" onClick={() => setOpen(false)}>
                <Link to="/que-jouer" className="btn-ghost w-full justify-start">
                  <Icon name="dice" className="size-4" /> Que jouer ce soir ?
                </Link>
                <Link to="/stats" className="btn-ghost w-full justify-start">
                  <Icon name="chart" className="size-4" /> Statistiques
                </Link>
                <Link to="/famille" className="btn-ghost w-full justify-start">
                  <Icon name="tower" className="size-4" /> Famille & invitations
                </Link>
                <button className="btn-ghost w-full justify-start" onClick={() => exportJson(games, family.name)}>
                  <Icon name="download" className="size-4" /> Export JSON
                </button>
                <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <button className="btn-ghost w-full justify-start" onClick={() => signOut(auth)}>
                  <Icon name="logout" className="size-4" /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
