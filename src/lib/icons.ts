import type { IconName } from '../components/Icon';
import type { PlayMode, Status } from './types';

export const STATUS_ICON: Record<Status, IconName> = { owned: 'shield', wishlist: 'potion', watch: 'spyglass' };
export const MODE_ICON: Record<PlayMode, IconName> = { coop: 'coop', competitif: 'swords', equipe: 'team', solo: 'solo' };
