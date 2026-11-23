// Client minimal de l'API XML officielle de BoardGameGeek (xmlapi2).
// Token requis : https://boardgamegeek.com/using_the_xml_api → BGG_API_TOKEN
import { XMLParser } from 'fast-xml-parser';

const BASE = 'https://boardgamegeek.com/xmlapi2';
const DELAY_MS = 2500; // BGG demande de ne pas marteler l'API

// BGG double-encode certaines entités (« &amp;#039; ») : on décode ce qui reste après le parseur XML
export const decodeEntities = (v) =>
  typeof v !== 'string'
    ? v
    : v
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  attributeValueProcessor: (_, v) => decodeEntities(v),
  tagValueProcessor: (_, v) => decodeEntities(v),
  isArray: (name) => ['item', 'name', 'link'].includes(name),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;

async function get(path, token) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(`${BASE}/${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ludotheque-autofill' },
    });
    if (res.status === 202 || res.status === 429 || res.status >= 500) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new Error(`BGG ${res.status} : token BGG_API_TOKEN invalide ou absent`);
    if (!res.ok) throw new Error(`BGG HTTP ${res.status} sur ${path}`);
    return parser.parse(await res.text());
  }
  throw new Error(`BGG indisponible (${path})`);
}

const num = (v) => {
  const n = Number(v?.value ?? v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Recherche par nom (inclut les noms alternatifs, ex. titres français) */
export async function search(query, token, { exact = false } = {}) {
  const q = new URLSearchParams({ query, type: 'boardgame' });
  if (exact) q.set('exact', '1');
  const xml = await get(`search?${q}`, token);
  return (xml.items?.item ?? []).map((it) => ({ bggId: Number(it.id), name: it.name?.[0]?.value ?? '', year: num(it.yearpublished) }));
}

/** Détails (stats incluses) pour 1 à 20 ids */
export async function things(ids, token) {
  if (!ids.length) return [];
  const xml = await get(`thing?id=${ids.join(',')}&stats=1`, token);
  return (xml.items?.item ?? []).map(parseThing);
}

export function parseThing(it) {
  const names = it.name ?? [];
  const ratings = it.statistics?.ratings ?? {};
  const weight = num(ratings.averageweight);
  const avg = num(ratings.average);
  const links = it.link ?? [];
  return {
    bggId: Number(it.id),
    type: it.type,
    name: names.find((n) => n.type === 'primary')?.value ?? names[0]?.value ?? '',
    altNames: names.map((n) => n.value),
    image: typeof it.image === 'string' ? it.image.trim() : undefined,
    thumbnail: typeof it.thumbnail === 'string' ? it.thumbnail.trim() : undefined,
    yearPublished: num(it.yearpublished),
    minPlayers: num(it.minplayers),
    maxPlayers: num(it.maxplayers),
    playingTime: num(it.playingtime),
    minAge: num(it.minage),
    usersRated: num(ratings.usersrated) ?? 0,
    rating: avg ? Math.round(avg * 10) / 10 : undefined,
    complexity: weight ? Math.min(5, Math.max(1, Math.round(weight * 2) / 2)) : undefined,
    expansions: links
      .filter((l) => l.type === 'boardgameexpansion' && l.inbound !== 'true')
      .map((l) => ({ bggId: Number(l.id), name: l.value })),
  };
}

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Trouve le jeu BGG correspondant à un nom.
 * → { match } ou { ambiguous: [...] } ou { notFound: true }
 */
export async function findGame(name, token) {
  let hits = await search(name, token, { exact: true });
  if (!hits.length) hits = await search(name, token);
  if (!hits.length) return { notFound: true };
  const details = (await things([...new Set(hits.map((h) => h.bggId))].slice(0, 20), token)).filter((d) => d.type === 'boardgame');
  if (!details.length) return { notFound: true };
  const n = norm(name);
  const byPop = (a, b) => b.usersRated - a.usersRated;
  const exact = details.filter((d) => d.altNames.some((a) => norm(a) === n)).sort(byPop);
  if (exact.length === 1) return { match: exact[0] };
  if (exact.length > 1) {
    const [best, second] = exact;
    // homonymes : on ne tranche que si l'un est nettement plus connu
    return second.usersRated < best.usersRated * 0.3 ? { match: best } : { ambiguous: exact.slice(0, 5) };
  }
  // pas de correspondance exacte du nom : on laisse trancher un humain / Claude
  return { ambiguous: details.sort(byPop).slice(0, 5) };
}

/** Champs Firestore à écrire, sans écraser ce qui est déjà renseigné (sauf force) */
export function toGamePatch(game, d, { force = false } = {}) {
  const patch = {};
  const setIfEmpty = (k, v) => {
    if (v === undefined || v === null || v === '') return;
    if (force || game[k] === undefined || game[k] === null || game[k] === '' || game[k] === 0) patch[k] = v;
  };
  patch.bggId = d.bggId;
  if (!game.customCover) {
    setIfEmpty('coverUrl', d.image);
    setIfEmpty('thumbUrl', d.thumbnail);
  }
  setIfEmpty('yearPublished', d.yearPublished);
  setIfEmpty('playersMin', d.minPlayers);
  setIfEmpty('playersMax', d.maxPlayers);
  setIfEmpty('durationMin', d.playingTime);
  setIfEmpty('ageMin', d.minAge);
  setIfEmpty('complexity', d.complexity);
  if (d.rating) patch.bggRating = d.rating; // note BGG : toujours rafraîchie
  if (d.expansions.length) patch.bggExpansions = d.expansions.slice(0, 150);
  return patch;
}
