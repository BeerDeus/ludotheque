// Jeu d'icônes sur mesure, thème « ludothèque médiévale-fantasy ».
// 24×24, trait currentColor ; les aplats légers (.d) donnent un rendu bicolore.
import type { ReactElement } from 'react';

const D = { fill: 'currentColor', fillOpacity: 0.18, stroke: 'none' } as const;

const ICONS = {
  plus: (
    <>
      <path d="M12 4.5v15M4.5 12h15" />
      <path d="m12 9.5 2.5 2.5-2.5 2.5L9.5 12z" {...D} fillOpacity={0.35} />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" {...D} />
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5M10.5 7.5v6M7.5 10.5h6" strokeWidth={1.2} />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" {...D} />
      <path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" />
    </>
  ),
  back: <path d="M14.5 5.5 8 12l6.5 6.5M8 12h0" />,
  menu: (
    <>
      <path d="M6 7h12M6 12h12M6 17h12" />
      <path d="m3.5 7 1-1 1 1-1 1zM3.5 12l1-1 1 1-1 1zM3.5 17l1-1 1 1-1 1z" {...D} fillOpacity={0.6} />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  // plume d'écriture
  edit: (
    <>
      <path d="M19.5 3.5c-6 1-10 5.5-11.5 11l-1.5 5 2-1.5c1-3 2.5-5 4.5-6.5-1.5 2.5-2.5 4-3 6 6-1.5 9.5-7 9.5-14z" {...D} />
      <path d="M19.5 3.5c-6 1-10 5.5-11.5 11l-1.5 5M19.5 3.5c0 7-3.5 12.5-9.5 14M10.5 13l3-3" />
    </>
  ),
  trash: (
    <>
      <path d="M6.5 8h11l-1 11.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5z" {...D} />
      <path d="M4.5 8h15M9.5 8V5.5h5V8M6.5 8l1 11.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5l1-11.5M10 11.5v6M14 11.5v6" />
    </>
  ),
  // maillons de chaîne
  link: (
    <>
      <rect x="2.5" y="8.5" width="10" height="7" rx="3.5" transform="rotate(-35 7.5 12)" />
      <rect x="11.5" y="8.5" width="10" height="7" rx="3.5" transform="rotate(-35 16.5 12)" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  // meeple
  users: (
    <>
      <path d="M12 3.2a2.6 2.6 0 0 1 2.6 2.6c0 .9-.4 1.6-1 2.1 2 .4 6.4 1.4 6.4 3.4 0 1-1.4 1.3-3.2 1.1l2.6 6.6c.2.5-.2 1-.7 1h-3.6L12 16.2 8.9 20H5.3c-.5 0-.9-.5-.7-1l2.6-6.6C5.4 12.6 4 12.3 4 11.3c0-2 4.4-3 6.4-3.4a2.6 2.6 0 0 1 1.6-4.7z" {...D} />
      <path d="M12 3.2a2.6 2.6 0 0 1 2.6 2.6c0 .9-.4 1.6-1 2.1 2 .4 6.4 1.4 6.4 3.4 0 1-1.4 1.3-3.2 1.1l2.6 6.6c.2.5-.2 1-.7 1h-3.6L12 16.2 8.9 20H5.3c-.5 0-.9-.5-.7-1l2.6-6.6C5.4 12.6 4 12.3 4 11.3c0-2 4.4-3 6.4-3.4a2.6 2.6 0 0 1 1.6-4.7z" />
    </>
  ),
  // sablier
  clock: (
    <>
      <path d="M8 6.5h8c0 3-4 4.5-4 5.5s4 2.5 4 5.5H8c0-3 4-4.5 4-5.5S8 9.5 8 6.5z" {...D} />
      <path d="M6 3.5h12M6 20.5h12M7.5 3.5v1c0 3.5 4.5 5.5 4.5 7.5s-4.5 4-4.5 7.5v1M16.5 3.5v1c0 3.5-4.5 5.5-4.5 7.5s4.5 4 4.5 7.5v1" />
      <path d="M10 18.5h4" strokeWidth={2.2} />
    </>
  ),
  // parchemin qu'on descend
  download: (
    <>
      <path d="M6 4.5h10.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H7.5" {...D} />
      <path d="M8 4.5h8.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2V6.5a2 2 0 1 1 2.5-2zM12 8v7.5M9 12.5l3 3 3-3" />
    </>
  ),
  // porte en arche
  logout: (
    <>
      <path d="M5 21V9a5 5 0 0 1 10 0v12z" {...D} />
      <path d="M3.5 21h13M5 21V9a5 5 0 0 1 10 0v12M12 14.5h.01M18 9.5l3 3-3 3M21 12.5h-5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 2.5c.6 4.6 2.4 6.9 7 7.5-4.6.6-6.4 2.9-7 7.5-.6-4.6-2.4-6.9-7-7.5 4.6-.6 6.4-2.9 7-7.5z" {...D} />
      <path d="M12 2.5c.6 4.6 2.4 6.9 7 7.5-4.6.6-6.4 2.9-7 7.5-.6-4.6-2.4-6.9-7-7.5 4.6-.6 6.4-2.9 7-7.5zM18.5 16.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" />
    </>
  ),
  sort: <path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" />,
  // enclume (complexité)
  brain: (
    <>
      <path d="M4 7h11.5c0 2.5 2 3.5 4.5 3.5-1 2-3 3-5.5 3H14v2l2.5 3.5h-9L10 15.5v-2c-3.5 0-6-2.5-6-6.5z" {...D} />
      <path d="M4 7h11.5c0 2.5 2 3.5 4.5 3.5-1 2-3 3-5.5 3H14v2l2.5 3.5h-9L10 15.5v-2c-3.5 0-6-2.5-6-6.5zM6.5 19h11" />
    </>
  ),
  // bourse de pièces
  cart: (
    <>
      <path d="M8.5 8.5c-3 2-4.5 5-4.5 8 0 2.5 2.5 4 8 4s8-1.5 8-4c0-3-1.5-6-4.5-8z" {...D} />
      <path d="M8.5 8.5c-3 2-4.5 5-4.5 8 0 2.5 2.5 4 8 4s8-1.5 8-4c0-3-1.5-6-4.5-8M8.5 8.5h7M9.5 8.5 8 4.5c2 .8 3 .8 4 0 1 .8 2 .8 4 0l-1.5 4M12 11.5v6M10 13.2c0-1 4-1.5 4 .3s-4 1.2-4 2.8 4 1.2 4 .2" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5a2 2 0 0 1 2-2h2.5l1.5-2.5h5L16 6.5h2.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" {...D} />
      <path d="M3.5 8.5a2 2 0 0 1 2-2h2.5l1.5-2.5h5L16 6.5h2.5a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  // coffre (boîte autonome)
  chest: (
    <>
      <path d="M3.5 11h17v8.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" {...D} />
      <path d="M3.5 11V9a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v2M3.5 11h17v8.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM8 4.5V11M16 4.5V11M10.5 11v3.5h3V11" />
    </>
  ),
  // parchemin scellé (extension)
  scroll: (
    <>
      <path d="M7 4.5h10a2 2 0 0 1 2 2v11" {...D} />
      <path d="M7 4.5h10.5a2 2 0 0 1 2 2V17M7 4.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9.5M7 4.5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2M12 9h4M12 12h4" />
      <circle cx="16.5" cy="17.5" r="2.5" {...D} fillOpacity={0.5} />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </>
  ),
  // d20
  dice: (
    <>
      <path d="M12 2.5 20.5 7.5v9L12 21.5l-8.5-5v-9z" {...D} />
      <path d="M12 2.5 20.5 7.5v9L12 21.5l-8.5-5v-9zM12 2.5 7.5 13h9zM7.5 13 3.5 7.5M16.5 13l4-5.5M7.5 13 12 21.5l4.5-8.5" />
    </>
  ),
  // écu (possédé)
  shield: (
    <>
      <path d="M12 3 19.5 5.5v6c0 5-3.5 8-7.5 9.5-4-1.5-7.5-4.5-7.5-9.5v-6z" {...D} />
      <path d="M12 3 19.5 5.5v6c0 5-3.5 8-7.5 9.5-4-1.5-7.5-4.5-7.5-9.5v-6zM8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  // fiole (souhait)
  potion: (
    <>
      <path d="M9.5 9.5V4h5v5.5c3 1 5 3.8 5 6.5a7.5 7.5 0 0 1-15 0c0-2.7 2-5.5 5-6.5z" {...D} />
      <path d="M8.5 4h7M9.5 4v5.5c-3 1-5 3.8-5 6.5a7.5 7.5 0 0 0 15 0c0-2.7-2-5.5-5-6.5V4M7 14.5c2-1 4 1 6 0s3.5-.5 4 0" />
    </>
  ),
  // longue-vue (à surveiller)
  spyglass: (
    <>
      <path d="m3 15 11-6.5 2 3.5-11 6.5z" {...D} />
      <path d="m3 15 11-6.5 2 3.5-11 6.5zM14 8.5l4.5-2.5 2 3.5-4.5 2.5M8.5 17.5 11 21M7 12.5l1.5 2.5" />
    </>
  ),
  // écu fendu (matériel manquant)
  warning: (
    <>
      <path d="M12 3 19.5 5.5v6c0 5-3.5 8-7.5 9.5-4-1.5-7.5-4.5-7.5-9.5v-6z" {...D} />
      <path d="M12 3 19.5 5.5v6c0 5-3.5 8-7.5 9.5-4-1.5-7.5-4.5-7.5-9.5v-6zM12 3l-1.5 5 3 3-2.5 4 1 6" />
    </>
  ),
  // torche (priorité)
  torch: (
    <>
      <path d="M12 2.5c2.5 2.5 3.5 4.5 2 6.5h-4c-1.5-2 0-3.5 1-4.5 0 1.5.5 2 1 2.5 0-1.5 0-3 0-4.5z" {...D} fillOpacity={0.4} />
      <path d="M12 2.5c2.5 2.5 3.5 4.5 2 6.5h-4c-1.5-2 0-3.5 1-4.5 0 1.5.5 2 1 2.5 0-1.5 0-3 0-4.5zM9 9h6l-1.5 3h-3zM10.5 12l.5 9.5h2l.5-9.5" />
    </>
  ),
  // grimoire ouvert (règles)
  tome: (
    <>
      <path d="M12 6.5c-2-1.5-5-2-8.5-2v13c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-13c-3.5 0-6.5.5-8.5 2z" {...D} />
      <path d="M12 6.5c-2-1.5-5-2-8.5-2v13c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-13c-3.5 0-6.5.5-8.5 2zM12 6.5v13" />
    </>
  ),
  // carte au trésor (mise en place)
  map: (
    <>
      <path d="M3.5 6 9 4l6 2 5.5-2v14L15 20l-6-2-5.5 2z" {...D} />
      <path d="M3.5 6 9 4l6 2 5.5-2v14L15 20l-6-2-5.5 2zM9 4v14M15 6v14" />
    </>
  ),
  // épées croisées (tour / compétitif)
  swords: (
    <>
      <path d="M4 4l9 9M20 4l-9 9M6.5 15.5l2 2M15.5 17.5l2-2M3.5 20.5l3-3M20.5 20.5l-3-3" />
      <path d="M4 4h3.5L13 9.5 9.5 13 4 7.5z" {...D} />
      <path d="M20 4h-3.5L11 9.5l3.5 3.5L20 7.5z" {...D} />
      <path d="M4 4v3.5M4 4h3.5M20 4v3.5M20 4h-3.5" />
    </>
  ),
  // étendard (fin de partie)
  flag: (
    <>
      <path d="M6 4h12l-3 4.5 3 4.5H6z" {...D} />
      <path d="M6 21V3.5M6 4h12l-3 4.5 3 4.5H6" />
    </>
  ),
  // bougie (conseils)
  candle: (
    <>
      <path d="M9 10h6v10.5H9z" {...D} />
      <path d="M9 10h6v10.5H9zM6.5 20.5h11M12 10V8M12 2.5c1.5 1.5 2 2.8 1 4-.5.6-1.5.6-2 0-1-1.2-.5-2.5 1-4z" />
    </>
  ),
  // embranchement (variantes)
  branch: (
    <>
      <circle cx="6" cy="5.5" r="2" />
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="8" r="2" {...D} fillOpacity={0.5} />
      <circle cx="18" cy="8" r="2" />
      <path d="M6 7.5v9M18 10c0 4-6 3-11 7" />
    </>
  ),
  crown: (
    <>
      <path d="M4 8l4 4 4-6.5 4 6.5 4-4-1.5 10h-13z" {...D} />
      <path d="M4 8l4 4 4-6.5 4 6.5 4-4-1.5 10h-13zM5.5 20.5h13" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" {...D} />
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" strokeWidth={2.2} />
    </>
  ),
  // clé (prêt)
  key: (
    <>
      <circle cx="7.5" cy="12" r="4" {...D} />
      <circle cx="7.5" cy="12" r="4" />
      <path d="M11.5 12h9M17 12v3.5M20 12v2.5" />
    </>
  ),
  // bannières (statistiques)
  chart: (
    <>
      <path d="M4.5 4h4v14l-2-1.5-2 1.5zM10 9h4v11l-2-1.5-2 1.5zM15.5 6h4v10l-2-1.5-2 1.5z" {...D} />
      <path d="M4.5 4h4v14l-2-1.5-2 1.5zM10 9h4v11l-2-1.5-2 1.5zM15.5 6h4v10l-2-1.5-2 1.5z" />
    </>
  ),
  // deux meeples côte à côte (coopératif)
  coop: (
    <>
      <path d="M8 4.5a2 2 0 0 1 1.3 3.5c1.5.3 4.2 1 4.2 2.4 0 .7-.9.9-2.1.8l1.8 5.3c.1.4-.1.7-.5.7h-2.4L8 14.4l-2.3 2.8H3.3c-.4 0-.6-.3-.5-.7l1.8-5.3c-1.2.1-2.1-.1-2.1-.8 0-1.4 2.7-2.1 4.2-2.4A2 2 0 0 1 8 4.5z" {...D} />
      <path d="M8 4.5a2 2 0 0 1 1.3 3.5c1.5.3 4.2 1 4.2 2.4 0 .7-.9.9-2.1.8l1.8 5.3c.1.4-.1.7-.5.7h-2.4L8 14.4l-2.3 2.8H3.3c-.4 0-.6-.3-.5-.7l1.8-5.3c-1.2.1-2.1-.1-2.1-.8 0-1.4 2.7-2.1 4.2-2.4A2 2 0 0 1 8 4.5z" />
      <path d="M16 7.5a2 2 0 0 1 1.3 3.5c1.5.3 4.2 1 4.2 2.4 0 .7-.9.9-2.1.8l1.8 5.3c.1.4-.1.7-.5.7h-2.4L16 17.4l-2.3 2.8h-1.4" />
    </>
  ),
  // deux écus (équipes)
  team: (
    <>
      <path d="M8 4.5 13 6v4c0 3.5-2.5 5.5-5 6.5C5.5 15.5 3 13.5 3 10V6z" {...D} />
      <path d="M8 4.5 13 6v4c0 3.5-2.5 5.5-5 6.5C5.5 15.5 3 13.5 3 10V6zM16 7.5 21 9v4c0 3.5-2.5 5.5-5 6.5-1.6-.6-3.1-1.6-4-3" />
    </>
  ),
  // meeple solo
  solo: (
    <>
      <circle cx="12" cy="6" r="2.6" {...D} fillOpacity={0.4} />
      <circle cx="12" cy="6" r="2.6" />
      <path d="M7 20.5 9.5 13 6 12c0-1.5 3-3 6-3s6 1.5 6 3l-3.5 1 2.5 7.5H14l-2-3.5-2 3.5z" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" {...D} />
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" {...D} />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  list: (
    <>
      <rect x="4" y="5" width="4" height="4" rx="1" {...D} fillOpacity={0.5} />
      <rect x="4" y="15" width="4" height="4" rx="1" {...D} fillOpacity={0.5} />
      <path d="M11 7h9M11 17h9M4 12h16" />
    </>
  ),
  external: <path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10" />,
  up: <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  down: <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  // tourelle (accueil / famille)
  tower: (
    <>
      <path d="M6 9h12v11.5H6z" {...D} />
      <path d="M5 4.5h2.5v2h2v-2h5v2h2v-2H19V9H5zM6 9v11.5h12V9M10 20.5v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" {...D} />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.5h.01" strokeWidth={2.2} />
    </>
  ),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof ICONS;

export default function Icon({ name, className = 'size-5', title }: { name: IconName; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {ICONS[name]}
    </svg>
  );
}
