import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_FILTERS, GamesContext, useSession, type Filters } from '../lib/context';
import type { Game } from '../lib/types';

const LS_KEY = 'ludo.filters';

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw), q: '' } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function GamesProvider({ children }: { children: ReactNode }) {
  const { family } = useSession();
  const [state, setState] = useState<{ fid: string; games: Game[]; error: string | null } | null>(null);
  const [filters, setFiltersState] = useState<Filters>(loadFilters);

  useEffect(() => {
    const fid = family.id;
    return onSnapshot(
      collection(db, 'families', fid, 'games'),
      (snap) =>
        setState({
          fid,
          error: null,
          games: snap.docs.map((d) => {
            const data = d.data();
            return { tags: [], notes: '', priority: 2, ...data, id: d.id } as unknown as Game;
          }),
        }),
      (err) => setState({ fid, games: [], error: err.message }),
    );
  }, [family.id]);

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...f };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...next, q: '' }));
      } catch {
        /* stockage indisponible */
      }
      return next;
    });
  }, []);

  const ready = state?.fid === family.id;
  const value = useMemo(
    () => ({
      games: ready ? state.games : [],
      loading: !ready,
      error: ready ? state.error : null,
      filters,
      setFilters,
    }),
    [ready, state, filters, setFilters],
  );

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}
