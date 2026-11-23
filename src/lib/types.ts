import type { Timestamp } from 'firebase/firestore';

export type Status = 'owned' | 'wishlist' | 'watch';
export type Priority = 1 | 2 | 3;

export const STATUSES: Status[] = ['owned', 'wishlist', 'watch'];

export const STATUS_LABEL: Record<Status, string> = {
  owned: 'Possédé',
  wishlist: 'Wishlist',
  watch: 'À surveiller',
};

export const STATUS_LABEL_PLURAL: Record<Status, string> = {
  owned: 'Possédés',
  wishlist: 'Wishlist',
  watch: 'À surveiller',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  1: 'Haute',
  2: 'Moyenne',
  3: 'Basse',
};

export type ExpansionKind = 'standalone' | 'expansion';

/** Élément d'une gamme : boîte autonome (jouable seule) ou extension */
export interface Expansion {
  id: string;
  name: string;
  owned: boolean;
  /** défaut : 'expansion' */
  kind?: ExpansionKind;
  /** miniature (data URL ~128 px) ; l'image en grand est dans games/{gid}/images/{id} */
  thumb?: string;
  bggId?: number;
  notes?: string;
}

export interface BggRef {
  bggId: number;
  name: string;
}

/** Champs saisis par l'utilisateur */
export interface GameBase {
  name: string;
  status: Status;
  playersMin: number;
  playersMax: number;
  durationMin: number;
  ageMin?: number;
  priceBought?: number;
  priceTarget?: number;
  shop?: string;
  url?: string;
  priority: Priority;
  /** Note personnelle 1–5 étoiles */
  myRating?: number;
  notes: string;
  tags: string[];
  /** Matériel manquant / abîmé (markdown) */
  missingParts?: string;
  expansions?: Expansion[];
  createdAt?: Timestamp | null;
}

/** Champs remplis par Claude (scripts/games.mjs update) */
export interface GameEnriched {
  bggId?: number;
  coverUrl?: string;
  thumbUrl?: string;
  /** Image choisie par l'utilisateur (photo ou URL) : l'autofill BGG ne la remplace pas */
  customCover?: boolean;
  yearPublished?: number;
  bggRating?: number;
  /** Extensions connues sur BGG (suggestions) */
  bggExpansions?: BggRef[];
  autofilledAt?: Timestamp | null;
  autofillNote?: string;
  complexity?: number;
  rulesSummary?: string;
  setup?: string;
  turnStructure?: string;
  endCondition?: string;
  tips?: string;
  variants?: string;
  sources?: string[];
  enrichedAt?: Timestamp | null;
  enrichedBy?: string;
}

export interface Game extends GameBase, GameEnriched {
  id: string;
}

export const ENRICHED_SECTIONS = [
  { key: 'rulesSummary', label: 'Résumé des règles' },
  { key: 'setup', label: 'Mise en place' },
  { key: 'turnStructure', label: "Déroulé d'un tour" },
  { key: 'endCondition', label: 'Fin de partie' },
  { key: 'tips', label: 'Conseils' },
  { key: 'variants', label: 'Variantes' },
] as const satisfies ReadonlyArray<{ key: keyof GameEnriched; label: string }>;

export type EnrichedSectionKey = (typeof ENRICHED_SECTIONS)[number]['key'];

export interface Family {
  id: string;
  name: string;
  ownerUid: string;
  inviteCode: string;
}

export interface Member {
  uid: string;
  role: 'owner' | 'member';
  email?: string;
  displayName?: string;
}
