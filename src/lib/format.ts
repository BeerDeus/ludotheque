import type { Timestamp } from 'firebase/firestore';
import type { Game } from './types';

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatPrice = (n?: number | null) => (n == null || Number.isNaN(n) ? '' : eur.format(n));

export const formatPlayers = (g: Pick<Game, 'playersMin' | 'playersMax'>) => {
  const { playersMin: a, playersMax: b } = g;
  if (!a && !b) return '';
  if (!b || a === b) return `${a || b} j.`;
  if (!a) return `≤${b} j.`;
  return `${a}–${b} j.`;
};

export const formatAge = (n?: number) => (n ? `dès ${n} ans` : '');

export const formatDuration = (n?: number) => (n ? `${n} min` : '');

export const formatDate = (t?: Timestamp | null) =>
  t ? t.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const isEnriched = (g: Game) => Boolean(g.enrichedAt);

/** Prix pertinent selon le statut (acheté si possédé, cible sinon) */
export const relevantPrice = (g: Game) => (g.status === 'owned' ? g.priceBought : g.priceTarget ?? g.priceBought);

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export const parseTags = (s: string) =>
  Array.from(
    new Set(
      s
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
