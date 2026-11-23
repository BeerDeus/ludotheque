import type { Game, Level } from './types';

/** Niveau explicite, sinon déduit de la complexité (poids BGG) */
export function levelOf(g: Pick<Game, 'level' | 'complexity'>): { level?: Level; auto: boolean } {
  if (g.level) return { level: g.level, auto: false };
  const c = g.complexity;
  if (!c) return { auto: true };
  return { level: c < 1.75 ? 'familial' : c < 2.75 ? 'initie' : 'expert', auto: true };
}

export const LEVEL_STYLE: Record<Level, string> = {
  ambiance: 'bg-pink-500/15 text-pink-700 dark:text-pink-300',
  familial: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  initie: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  expert: 'bg-accent-500/20 text-accent-800 dark:text-accent-300',
};

export const playsCount = (g: Game) => g.plays?.length ?? 0;
export const lastPlayed = (g: Game) => (g.plays ?? []).reduce<string | undefined>((m, p) => (!m || p.date > m ? p.date : m), undefined);

export const formatDay = (d?: string) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const wantedOf = (games: Game[]) =>
  games.flatMap((g) => (g.expansions ?? []).filter((e) => e.wanted && !e.owned).map((e) => ({ game: g, exp: e })));
