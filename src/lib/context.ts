import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';
import type { Family, Game, Status } from './types';

export interface Session {
  user: User;
  family: Family;
}
export const SessionContext = createContext<Session | null>(null);
export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession hors SessionContext');
  return s;
}

export type SortKey = 'name' | 'rating' | 'priority' | 'price' | 'duration' | 'recent';
export type ViewMode = 'list' | 'grid';

export interface Filters {
  q: string;
  status: Status | 'all';
  tags: string[];
  players: number | null;
  maxDuration: number | null;
  /** âge du plus jeune joueur : garde les jeux dont ageMin ≤ age (ou inconnu) */
  age: number | null;
  pendingOnly: boolean;
  incompleteOnly: boolean;
  sort: SortKey;
  dir: 'asc' | 'desc';
  view: ViewMode;
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  status: 'all',
  tags: [],
  players: null,
  maxDuration: null,
  age: null,
  pendingOnly: false,
  incompleteOnly: false,
  sort: 'name',
  dir: 'asc',
  view: 'list',
};

export interface GamesState {
  games: Game[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
}
export const GamesContext = createContext<GamesState | null>(null);
export function useGames() {
  const s = useContext(GamesContext);
  if (!s) throw new Error('useGames hors GamesContext');
  return s;
}
