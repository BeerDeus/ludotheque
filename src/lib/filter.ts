import type { Filters } from './context';
import { isEnriched, normalize, relevantPrice } from './format';
import type { Game } from './types';

export function applyFilters(games: Game[], f: Filters): Game[] {
  const q = normalize(f.q);
  const out = games.filter((g) => {
    if (f.status !== 'all' && g.status !== f.status) return false;
    if (f.pendingOnly && isEnriched(g)) return false;
    if (q && !normalize(`${g.name} ${g.tags.join(' ')} ${g.shop ?? ''} ${g.notes}`).includes(q)) return false;
    if (f.tags.length && !f.tags.every((t) => g.tags.includes(t))) return false;
    if (f.players != null) {
      const min = g.playersMin || 1;
      const max = g.playersMax || min;
      if (f.players < min || f.players > max) return false;
    }
    if (f.maxDuration != null && g.durationMin && g.durationMin > f.maxDuration) return false;
    return true;
  });

  const dir = f.dir === 'asc' ? 1 : -1;
  // valeurs manquantes toujours en fin de liste
  const num = (a?: number, b?: number) => {
    const ma = a == null || a === 0;
    const mb = b == null || b === 0;
    if (ma && mb) return 0;
    if (ma) return 1;
    if (mb) return -1;
    return (a - b) * dir;
  };
  const byName = (a: Game, b: Game) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });

  return out.sort((a, b) => {
    let r = 0;
    switch (f.sort) {
      case 'name':
        r = byName(a, b) * dir;
        break;
      case 'priority':
        r = (a.priority - b.priority) * dir;
        break;
      case 'price':
        r = num(relevantPrice(a), relevantPrice(b));
        break;
      case 'duration':
        r = num(a.durationMin, b.durationMin);
        break;
      case 'recent':
        r = ((a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)) * -dir;
        break;
    }
    return r || byName(a, b);
  });
}

export const allTags = (games: Game[]) =>
  Array.from(new Set(games.flatMap((g) => g.tags ?? []))).sort((a, b) => a.localeCompare(b, 'fr'));
