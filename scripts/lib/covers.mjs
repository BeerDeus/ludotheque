// Récupération d'images de couverture depuis le web (exécuté en CI, accès internet complet).
// - imageFromPage(url) : page produit (boutique/éditeur) → image og:image ; ou URL d'image directe
// - wikipediaImage(name) : image d'infobox Wikipédia (FR puis EN)
// - toDataUrl(bytes) : redimensionne (600 px max) en JPEG compact → data URL stockable dans Firestore
import sharp from 'sharp';

const UA = 'LudothequeBot/1.0 (+https://ludotheque.manaorbit.app)';
const MAX_BYTES = 180_000;

async function get(url, accept) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/g, '/').replace(/&quot;/g, '"');

export function extractImageUrl(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
    /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return new URL(decode(m[1]), baseUrl).href;
  }
  return null;
}

export async function imageFromPage(url) {
  const res = await get(url, 'text/html,image/*;q=0.9,*/*;q=0.8');
  const type = res.headers.get('content-type') ?? '';
  if (type.startsWith('image/')) return { bytes: Buffer.from(await res.arrayBuffer()), imageUrl: url };
  const imageUrl = extractImageUrl(await res.text(), res.url);
  if (!imageUrl) throw new Error(`aucune image og:image sur ${url}`);
  const img = await get(imageUrl, 'image/*');
  return { bytes: Buffer.from(await img.arrayBuffer()), imageUrl };
}

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Image d'infobox d'un article Wikipédia dont le titre commence par le nom du jeu */
export async function wikipediaImage(name) {
  for (const [lang, hint] of [
    ['fr', 'jeu de société'],
    ['en', 'board game'],
  ]) {
    const q = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `${name} ${hint}`,
      gsrlimit: '5',
      prop: 'pageimages',
      piprop: 'original',
    });
    const data = await (await get(`https://${lang}.wikipedia.org/w/api.php?${q}`, 'application/json')).json();
    const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    const n = norm(name);
    const hit = pages.find((p) => p.original?.source && norm(p.title).startsWith(n));
    if (hit) {
      const img = await get(hit.original.source, 'image/*');
      return { bytes: Buffer.from(await img.arrayBuffer()), imageUrl: hit.original.source, page: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(hit.title)}` };
    }
  }
  return null;
}

export async function toDataUrl(bytes) {
  const base = sharp(bytes, { failOn: 'none' }).rotate().resize(600, 600, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' });
  for (const quality of [80, 70, 60, 50, 40]) {
    const out = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= MAX_BYTES) return `data:image/jpeg;base64,${out.toString('base64')}`;
  }
  const out = await base.clone().resize(400, 400, { fit: 'inside' }).jpeg({ quality: 50 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}

/** Essaie chaque page dans l'ordre ; renvoie { coverUrl, coverSource } ou null */
export async function coverFromPages(pages, log = console.log) {
  for (const page of pages) {
    try {
      const { bytes } = await imageFromPage(page);
      return { coverUrl: await toDataUrl(bytes), coverSource: page };
    } catch (e) {
      log(`  · ${page} : ${e.message}`);
    }
  }
  return null;
}
