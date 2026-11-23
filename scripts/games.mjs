#!/usr/bin/env node
// CLI admin Ludothèque (firebase-admin, contourne les règles Firestore).
// Auth : GOOGLE_APPLICATION_CREDENTIALS=/chemin/hors-repo/service-account.json
// Doc complète : CLAUDE.md
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { findGame, things, toGamePatch } from './lib/bgg.mjs';
import { bytesFromPages, coverFromPages, toDataUrl, wikipediaImage } from './lib/covers.mjs';

const USAGE = `Usage: node scripts/games.mjs <commande> [args] [--family <fid>]

Jeux
  list [--pending]            JSON des jeux (pending = sans enrichedAt). Sans --family : toutes les familles.
  get <ref>                   Un jeu. ref = <gameId> ou <familyId>/<gameId>
  update <ref> <json>         Merge des champs + enrichedAt=now, enrichedBy='claude'
                              (--no-enrich : merge simple, sans toucher enrichedAt/enrichedBy)
  add <json>                  Ajoute un jeu (ou un tableau de jeux)
  delete <ref>                Supprime un jeu
  export [--pending]          Liste compacte (gzip+base64 entre marqueurs) pour les logs CI publics
  apply <dir> [--applied f]   Applique <dir>/<familyId>__<gameId>.json (update enrichi) ; f = fichiers appliqués
  squarify                    Re-encode toutes les images stockées en carré (fond blanc)
  covers [ref] [--all]        Image manquante → cherche sur Wikipédia (FR/EN), stockée en JPEG compact
                              (dans un JSON d'update/apply : "coverPages": [urls de pages produit ou d'images])
  autofill [ref] [--all] [--force]
                              Remplit image, âge, joueurs, durée, année, complexité, note, extensions BGG
                              via l'API XML BGG (BGG_API_TOKEN requis). Par défaut : jeux jamais traités
                              ou renommés. --force : écrase aussi les champs déjà remplis.

Familles / accès
  families                    Liste des familles (id, nom, membres, nb de jeux)
  access show                 Affiche config/access
  access allow <email>        Autorise <email> à créer une famille
  access revoke <email>       Retire l'autorisation
  access open <true|false>    Création de famille ouverte à tout compte connecté
  rules deploy                Publie firestore.rules (la base Firestore doit exister)

<json> : JSON inline, @fichier.json, ou - (stdin).
Famille par défaut : --family, sinon $LUDO_FAMILY, sinon l'unique famille existante.`;

const BASE_FIELDS = ['name', 'status', 'playersMin', 'playersMax', 'durationMin', 'ageMin', 'priceBought', 'priceTarget', 'shop', 'url', 'priority', 'myRating', 'notes', 'tags', 'missingParts', 'expansions'];
const ENRICHED_FIELDS = ['expansionsAdd', 'expansionsPatch', 'expansionImages', 'bggId', 'coverUrl', 'thumbUrl', 'customCover', 'coverPages', 'coverSource', 'yearPublished', 'bggRating', 'bggExpansions', 'autofillNote', 'complexity', 'rulesSummary', 'setup', 'turnStructure', 'endCondition', 'tips', 'variants', 'sources'];
const ALLOWED = new Set([...BASE_FIELDS, ...ENRICHED_FIELDS]);
const STATUSES = ['owned', 'wishlist', 'watch'];

// ---------- args ----------
const argv = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--family') flags.family = argv[++i];
  else if (a.startsWith('--family=')) flags.family = a.slice(9);
  else if (a === '--pending') flags.pending = true;
  else if (a === '--no-enrich') flags.noEnrich = true;
  else if (a === '--all') flags.all = true;
  else if (a === '--force') flags.force = true;
  else if (a === '--applied') flags.applied = argv[++i];
  else if (a === '-h' || a === '--help') flags.help = true;
  else pos.push(a);
}
const [cmd, ...rest] = pos;

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}
if (!cmd || flags.help) die(USAGE, cmd ? 0 : 1);

// Credentials : GOOGLE_APPLICATION_CREDENTIALS (chemin du JSON) ou FIREBASE_SERVICE_ACCOUNT (contenu du JSON)
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } catch {
    die('FIREBASE_SERVICE_ACCOUNT ne contient pas un JSON de compte de service valide.');
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = applicationDefault();
} else {
  die('Définir GOOGLE_APPLICATION_CREDENTIALS (chemin du JSON, hors repo) ou FIREBASE_SERVICE_ACCOUNT (contenu du JSON).');
}

initializeApp({ credential });
const db = getFirestore();

// ---------- helpers ----------
function readJson(arg) {
  if (arg == null) die('JSON manquant.');
  let raw = arg;
  if (arg === '-') raw = readFileSync(0, 'utf8');
  else if (arg.startsWith('@')) raw = readFileSync(arg.slice(1), 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    die(`JSON invalide : ${e.message}`);
  }
}

const serialize = (v) => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialize(x)]));
  return v;
};

const out = (data) => console.log(JSON.stringify(serialize(data), null, 2));

const gameJson = (snap) => ({ id: snap.id, familyId: snap.ref.parent.parent.id, ...snap.data() });

async function resolveFamily({ required = true } = {}) {
  const fid = flags.family || process.env.LUDO_FAMILY;
  if (fid) {
    const s = await db.doc(`families/${fid}`).get();
    if (!s.exists) die(`Famille inconnue : ${fid}`);
    return fid;
  }
  if (!required) return null;
  const fams = await db.collection('families').get();
  if (fams.size === 1) return fams.docs[0].id;
  if (fams.size === 0) die("Aucune famille. Crée-en une depuis l'app d'abord.");
  die(`Plusieurs familles, précise --family <id> :\n${fams.docs.map((d) => `  ${d.id}  ${d.data().name}`).join('\n')}`);
}

async function resolveGame(ref) {
  if (!ref) die('ref manquante (<gameId> ou <familyId>/<gameId>).');
  if (ref.includes('/')) {
    const [fid, gid] = ref.split('/');
    const s = await db.doc(`families/${fid}/games/${gid}`).get();
    if (!s.exists) die(`Jeu introuvable : ${ref}`);
    return s;
  }
  const fid = await resolveFamily({ required: false });
  if (fid) {
    const s = await db.doc(`families/${fid}/games/${ref}`).get();
    if (!s.exists) die(`Jeu introuvable : ${fid}/${ref}`);
    return s;
  }
  const fams = await db.collection('families').get();
  const hits = (await Promise.all(fams.docs.map((f) => f.ref.collection('games').doc(ref).get()))).filter((s) => s.exists);
  if (!hits.length) die(`Jeu introuvable : ${ref}`);
  if (hits.length > 1) die(`Id ambigu, utilise <familyId>/<gameId> : ${hits.map((h) => h.ref.parent.parent.id).join(', ')}`);
  return hits[0];
}

function validate(data, { partial }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) die('Objet JSON attendu.');
  const unknown = Object.keys(data).filter((k) => !ALLOWED.has(k));
  if (unknown.length) die(`Champs inconnus : ${unknown.join(', ')}\nAutorisés : ${[...ALLOWED].join(', ')}`);
  if (!partial && (typeof data.name !== 'string' || !data.name.trim())) die('name requis.');
  if ('status' in data && !STATUSES.includes(data.status)) die(`status invalide (${STATUSES.join('|')}).`);
  if ('priority' in data && ![1, 2, 3].includes(data.priority)) die('priority doit valoir 1, 2 ou 3.');
  if ('complexity' in data && data.complexity != null && !(data.complexity >= 1 && data.complexity <= 5)) die('complexity entre 1 et 5.');
  for (const k of ['tags', 'sources', 'expansions', 'expansionsAdd', 'bggExpansions', 'coverPages']) if (k in data && data[k] != null && !Array.isArray(data[k])) die(`${k} doit être un tableau.`);
  for (const key of ['expansions', 'expansionsAdd']) {
    if (!Array.isArray(data[key])) continue;
    data[key] = data[key].map((e) => {
      if (!e || typeof e.name !== 'string' || !e.name.trim()) die('expansions[] : { name, owned, bggId?, notes? } attendu.');
      return {
        id: e.id || randomUUID(),
        name: e.name.trim(),
        owned: Boolean(e.owned),
        ...(e.kind === 'standalone' ? { kind: 'standalone' } : {}),
        ...(e.bggId ? { bggId: Number(e.bggId) } : {}),
        ...(e.notes ? { notes: String(e.notes) } : {}),
        ...(e.thumb ? { thumb: String(e.thumb) } : {}),
        ...(Array.isArray(e.coverPages) ? { coverPages: e.coverPages } : {}),
      };
    });
  }
  for (const k of ['playersMin', 'playersMax', 'durationMin', 'ageMin', 'priceBought', 'priceTarget', 'bggId', 'complexity', 'yearPublished', 'bggRating'])
    if (k in data && data[k] != null && typeof data[k] !== 'number') die(`${k} doit être un nombre.`);
  // null = suppression du champ
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === null ? FieldValue.delete() : v]));
}

/**
 * expansionsPatch : { "<nom actuel>": { name?, notes?, kind?, remove?: true } } — renomme/corrige/retire
 * des éléments existants (le statut possédé est conservé). Appliqué avant expansionsAdd.
 */
function applyExpansionsPatch(data, current = []) {
  const patch = data.expansionsPatch;
  delete data.expansionsPatch;
  if (!patch || typeof patch !== 'object') return current;
  const key = (n) => n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const byKey = new Map(Object.entries(patch).map(([k, v]) => [key(k), v]));
  let removed = 0;
  let changed = 0;
  const next = [];
  for (const e of current) {
    const p = byKey.get(key(e.name));
    if (!p) {
      next.push(e);
      continue;
    }
    if (p.remove) {
      removed++;
      continue;
    }
    const upd = { ...e };
    if (typeof p.name === 'string' && p.name.trim()) upd.name = p.name.trim();
    if ('notes' in p) {
      if (p.notes) upd.notes = String(p.notes);
      else delete upd.notes;
    }
    if (p.kind === 'standalone') upd.kind = 'standalone';
    if (p.kind === 'expansion') delete upd.kind;
    next.push(upd);
    changed++;
  }
  console.log(`  extensions : ${changed} corrigée(s), ${removed} retirée(s)`);
  data.expansions = next;
  return next;
}

/** expansionsAdd : ajoute à la liste existante les éléments absents (même nom normalisé), sans toucher aux autres */
function mergeExpansionsAdd(data, current = []) {
  const add = data.expansionsAdd;
  delete data.expansionsAdd;
  if (!Array.isArray(add) || !add.length) return;
  const key = (n) => n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const have = new Set(current.map((e) => key(e.name)));
  const fresh = add.filter((e) => !have.has(key(e.name)));
  if (fresh.length) data.expansions = [...current, ...fresh];
  console.log(`  extensions : +${fresh.length} (${add.length - fresh.length} déjà présente(s))`);
}

/**
 * Images des boîtes/extensions : `coverPages` sur un élément de expansions(Add), ou
 * `expansionImages: { "<nom>": [urls] }` pour des éléments existants. Grand format → images/{id}, miniature → e.thumb.
 */
async function resolveExpansionImages(ref, data, current = []) {
  const map = data.expansionImages;
  delete data.expansionImages;
  const key = (n) => n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const byName = new Map(Object.entries(map ?? {}).map(([k, v]) => [key(k), v]));
  const list = data.expansions ?? (byName.size ? current.map((e) => ({ ...e })) : null);
  if (!list) return;
  let n = 0;
  for (const e of list) {
    const pages = e.coverPages ?? byName.get(key(e.name));
    delete e.coverPages;
    if (!Array.isArray(pages) || !pages.length) continue;
    const hit = await bytesFromPages(pages);
    if (!hit) {
      console.log(`  ⚠ pas d'image pour « ${e.name} »`);
      continue;
    }
    await ref.collection('images').doc(e.id).set({ dataUrl: await toDataUrl(hit.bytes, 800, 220_000), source: hit.source, updatedAt: FieldValue.serverTimestamp() });
    e.thumb = await toDataUrl(hit.bytes, 128, 12_000);
    n++;
  }
  data.expansions = list;
  if (n) console.log(`  images boîtes/extensions : ${n}`);
}

/** coverPages (pages produit / URLs d'image) → coverUrl (data URL compacte). Mute `data`. */
async function resolveCoverPages(data, name) {
  const pages = data.coverPages;
  delete data.coverPages;
  if (!Array.isArray(pages) || !pages.length) return;
  const hit = await coverFromPages(pages);
  if (hit) {
    Object.assign(data, hit, { customCover: true, thumbUrl: FieldValue.delete() });
    console.log(`  image ← ${hit.coverSource}`);
  } else console.log(`  ⚠ aucune image récupérée pour ${name}`);
}

// ---------- commandes ----------
const commands = {
  async list() {
    const fid = await resolveFamily({ required: false });
    const snap = fid ? await db.collection(`families/${fid}/games`).get() : await db.collectionGroup('games').get();
    let games = snap.docs.map(gameJson);
    if (flags.pending) games = games.filter((g) => !g.enrichedAt);
    games.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    out(games);
  },

  async get([ref]) {
    out(gameJson(await resolveGame(ref)));
  },

  async update([ref, json]) {
    const snap = await resolveGame(ref);
    const data = validate(readJson(json), { partial: true });
    const base = applyExpansionsPatch(data, snap.data().expansions);
    mergeExpansionsAdd(data, base);
    await resolveExpansionImages(snap.ref, data, base);
    await resolveCoverPages(data, snap.data().name);
    if (!flags.noEnrich) Object.assign(data, { enrichedAt: FieldValue.serverTimestamp(), enrichedBy: 'claude' });
    await snap.ref.set(data, { merge: true });
    out(gameJson(await snap.ref.get()));
  },

  async add([json]) {
    const fid = await resolveFamily();
    const input = readJson(json);
    const list = Array.isArray(input) ? input : [input];
    const created = [];
    for (const raw of list) {
      const data = validate(raw, { partial: false });
      const ref = db.collection(`families/${fid}/games`).doc();
      await ref.set({
        status: 'wishlist',
        playersMin: 0,
        playersMax: 0,
        durationMin: 0,
        priority: 2,
        notes: '',
        tags: [],
        ...data,
        createdAt: FieldValue.serverTimestamp(),
      });
      created.push({ id: ref.id, familyId: fid, name: data.name });
    }
    out(created);
  },

  async delete([ref]) {
    const snap = await resolveGame(ref);
    await snap.ref.delete();
    out({ deleted: `${snap.ref.parent.parent.id}/${snap.id}` });
  },

  async export() {
    const fid = await resolveFamily({ required: false });
    const snap = fid ? await db.collection(`families/${fid}/games`).get() : await db.collectionGroup('games').get();
    let games = snap.docs.map(gameJson);
    if (flags.pending) games = games.filter((g) => !g.enrichedAt);
    const compact = games
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((g) => ({
        ref: `${g.familyId}/${g.id}`,
        name: g.name,
        status: g.status,
        playersMin: g.playersMin,
        playersMax: g.playersMax,
        durationMin: g.durationMin,
        ageMin: g.ageMin,
        bggId: g.bggId,
        enriched: Boolean(g.enrichedAt),
        autofillNote: g.autofillNote,
        expansions: (g.expansions ?? []).map((e) => e.name),
      }));
    const b64 = gzipSync(JSON.stringify(compact)).toString('base64');
    console.log(`LUDO_EXPORT_BEGIN count=${compact.length}`);
    for (let i = 0; i < b64.length; i += 2000) console.log(b64.slice(i, i + 2000));
    console.log('LUDO_EXPORT_END');
  },

  async apply([dir]) {
    if (!dir) die('apply <dir>');
    const files = readdirSync(dir).filter((f) => /^[A-Za-z0-9]+__[A-Za-z0-9]+\.json$/.test(f));
    const applied = [];
    let failed = 0;
    for (const f of files) {
      const [fid, gid] = f.replace(/\.json$/, '').split('__');
      const ref = db.doc(`families/${fid}/games/${gid}`);
      try {
        const snap = await ref.get();
        if (!snap.exists) throw new Error('jeu introuvable');
        const data = validate(JSON.parse(readFileSync(join(dir, f), 'utf8')), { partial: true });
        delete data.expansions; // jamais écrasées par un enrichissement
        const base = applyExpansionsPatch(data, snap.data().expansions);
        mergeExpansionsAdd(data, base);
        await resolveExpansionImages(ref, data, base);
        await resolveCoverPages(data, snap.data().name);
        await ref.set({ ...data, enrichedAt: FieldValue.serverTimestamp(), enrichedBy: 'claude' }, { merge: true });
        applied.push(join(dir, f));
        console.log(`✓ ${snap.data().name} (${Object.keys(data).length} champs)`);
      } catch (e) {
        failed++;
        console.error(`✗ ${f} : ${e.message}`);
      }
    }
    if (flags.applied) writeFileSync(flags.applied, applied.join('\n') + (applied.length ? '\n' : ''));
    console.log(`${applied.length} appliqué(s), ${failed} échec(s)`);
    if (failed) process.exitCode = 1;
  },

  /** Re-encode toutes les images stockées en carré fond blanc (jaquettes, grands formats, miniatures) */
  async squarify() {
    const fromData = (u) => Buffer.from(u.split(',')[1], 'base64');
    const isData = (u) => typeof u === 'string' && u.startsWith('data:image/');
    const snaps = (await db.collectionGroup('games').get()).docs;
    let n = 0;
    for (const s of snaps) {
      const g = s.data();
      const patch = {};
      if (isData(g.coverUrl)) patch.coverUrl = await toDataUrl(fromData(g.coverUrl));
      if (Array.isArray(g.expansions) && g.expansions.length) {
        const list = [];
        for (const e of g.expansions) {
          const img = await s.ref.collection('images').doc(e.id).get();
          const full = img.exists ? img.data().dataUrl : null;
          if (isData(full)) {
            const bytes = fromData(full);
            await img.ref.set({ dataUrl: await toDataUrl(bytes, 800, 220_000) }, { merge: true });
            list.push({ ...e, thumb: await toDataUrl(bytes, 128, 12_000) });
            n++;
          } else if (isData(e.thumb)) list.push({ ...e, thumb: await toDataUrl(fromData(e.thumb), 128, 12_000) });
          else list.push(e);
        }
        patch.expansions = list;
      }
      if (Object.keys(patch).length) {
        await s.ref.set(patch, { merge: true });
        console.log(`✓ ${g.name}`);
      }
    }
    console.log(`${n} image(s) de boîtes/extensions re-encodée(s)`);
  },

  /** Images manquantes : cherche sur Wikipédia (FR/EN). Ne retente pas un jeu déjà essayé sous le même nom. */
  async covers([ref]) {
    let snaps;
    if (ref) snaps = [await resolveGame(ref)];
    else {
      const fid = await resolveFamily({ required: false });
      snaps = (fid ? await db.collection(`families/${fid}/games`).get() : await db.collectionGroup('games').get()).docs.filter((s) => {
        const g = s.data();
        return !g.coverUrl && (flags.all || g.coverTriedName !== g.name);
      });
    }
    console.log(`${snaps.length} jeu(x) sans image à chercher`);
    for (const s of snaps) {
      const g = s.data();
      try {
        const hit = await wikipediaImage(g.name);
        if (hit) {
          await s.ref.set({ coverUrl: await toDataUrl(hit.bytes), coverSource: hit.page, customCover: true, thumbUrl: FieldValue.delete(), coverTriedName: g.name }, { merge: true });
          console.log(`✓ ${g.name} ← ${hit.page}`);
        } else {
          await s.ref.set({ coverTriedName: g.name }, { merge: true });
          console.log(`· ${g.name} : rien sur Wikipédia`);
        }
      } catch (e) {
        console.error(`✗ ${g.name} : ${e.message}`);
      }
    }
  },

  async autofill([ref]) {
    const token = process.env.BGG_API_TOKEN;
    if (!token) {
      console.log('BGG_API_TOKEN absent : autofill ignoré (voir README > BGG).');
      return;
    }
    let snaps;
    if (ref) snaps = [await resolveGame(ref)];
    else {
      const fid = await resolveFamily({ required: false });
      snaps = (fid ? await db.collection(`families/${fid}/games`).get() : await db.collectionGroup('games').get()).docs;
      if (!flags.all)
        snaps = snaps.filter((s) => {
          const g = s.data();
          return !g.autofilledAt || g.autofillName !== g.name || (g.bggId && g.autofillBggId !== g.bggId);
        });
    }
    console.log(`${snaps.length} jeu(x) à traiter`);
    const write = (snap, patch) =>
      snap.ref.set(
        { ...patch, autofilledAt: FieldValue.serverTimestamp(), autofillName: snap.data().name, autofillBggId: patch.bggId ?? snap.data().bggId ?? null },
        { merge: true },
      );

    // 1) jeux avec bggId connu : par lots de 20
    const withId = snaps.filter((s) => s.data().bggId);
    for (let i = 0; i < withId.length; i += 20) {
      const batch = withId.slice(i, i + 20);
      const details = new Map((await things(batch.map((s) => s.data().bggId), token)).map((d) => [d.bggId, d]));
      for (const s of batch) {
        const d = details.get(s.data().bggId);
        if (!d) {
          await write(s, { autofillNote: `bggId ${s.data().bggId} introuvable sur BGG` });
          console.log(`? ${s.data().name} : bggId introuvable`);
          continue;
        }
        await write(s, { ...toGamePatch(s.data(), d, { force: flags.force }), autofillNote: FieldValue.delete() });
        console.log(`✓ ${s.data().name} → ${d.name} (${d.bggId})`);
      }
    }
    // 2) jeux sans bggId : recherche par nom
    for (const s of snaps.filter((x) => !x.data().bggId)) {
      const g = s.data();
      try {
        const r = await findGame(g.name, token);
        if (r.match) {
          await write(s, { ...toGamePatch(g, r.match, { force: flags.force }), autofillNote: FieldValue.delete() });
          console.log(`✓ ${g.name} → ${r.match.name} (${r.match.bggId})`);
        } else if (r.ambiguous) {
          const list = r.ambiguous.map((d) => `${d.name}${d.yearPublished ? ` (${d.yearPublished})` : ''} #${d.bggId}`).join(' ; ');
          await write(s, { autofillNote: `plusieurs jeux possibles, préciser le bggId : ${list}` });
          console.log(`? ${g.name} : ambigu → ${list}`);
        } else {
          await write(s, { autofillNote: 'aucun jeu trouvé sur BGG avec ce nom' });
          console.log(`✗ ${g.name} : introuvable`);
        }
      } catch (e) {
        console.error(`✗ ${g.name} : ${e.message}`);
        if (/token/.test(e.message)) process.exit(1);
      }
    }
  },

  async families() {
    const fams = await db.collection('families').get();
    out(
      await Promise.all(
        fams.docs.map(async (f) => {
          const [members, games] = await Promise.all([f.ref.collection('members').get(), f.ref.collection('games').count().get()]);
          return {
            id: f.id,
            name: f.data().name,
            members: members.docs.map((m) => ({ uid: m.id, email: m.data().email, role: m.data().role })),
            games: games.data().count,
          };
        }),
      ),
    );
  },

  async access([sub, value]) {
    const ref = db.doc('config/access');
    switch (sub) {
      case 'show':
      case undefined:
        break;
      case 'allow':
        if (!value) die('email manquant.');
        await ref.set({ creatorEmails: FieldValue.arrayUnion(value.toLowerCase()) }, { merge: true });
        break;
      case 'revoke':
        if (!value) die('email manquant.');
        await ref.set({ creatorEmails: FieldValue.arrayRemove(value.toLowerCase()) }, { merge: true });
        break;
      case 'open':
        if (!['true', 'false'].includes(value)) die('access open true|false');
        await ref.set({ openSignup: value === 'true' }, { merge: true });
        break;
      default:
        die(USAGE);
    }
    const s = await ref.get();
    out(s.exists ? s.data() : { creatorEmails: [], openSignup: false });
  },

  async rules([sub]) {
    if (sub !== 'deploy') die('rules deploy');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..');
    const source = readFileSync(join(root, 'firestore.rules'), 'utf8');
    const rules = getSecurityRules();
    const ruleset = await rules.releaseFirestoreRulesetFromSource(source);
    const live = await rules.getFirestoreRuleset();
    const verified = live.name === ruleset.name && live.source[0]?.content === source;
    out({ released: ruleset.name, createTime: ruleset.createTime, verified });
    if (!verified) die('La release active ne correspond pas à firestore.rules.');
  },
};

if (!commands[cmd]) die(USAGE);
try {
  await commands[cmd](rest);
} catch (e) {
  die(`Erreur : ${e.message}`);
}
