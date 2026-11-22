#!/usr/bin/env node
// CLI admin Ludothèque (firebase-admin, contourne les règles Firestore).
// Auth : GOOGLE_APPLICATION_CREDENTIALS=/chemin/hors-repo/service-account.json
// Doc complète : CLAUDE.md
import { readFileSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const USAGE = `Usage: node scripts/games.mjs <commande> [args] [--family <fid>]

Jeux
  list [--pending]            JSON des jeux (pending = sans enrichedAt). Sans --family : toutes les familles.
  get <ref>                   Un jeu. ref = <gameId> ou <familyId>/<gameId>
  update <ref> <json>         Merge des champs + enrichedAt=now, enrichedBy='claude'
                              (--no-enrich : merge simple, sans toucher enrichedAt/enrichedBy)
  add <json>                  Ajoute un jeu (ou un tableau de jeux)
  delete <ref>                Supprime un jeu

Familles / accès
  families                    Liste des familles (id, nom, membres, nb de jeux)
  access show                 Affiche config/access
  access allow <email>        Autorise <email> à créer une famille
  access revoke <email>       Retire l'autorisation
  access open <true|false>    Création de famille ouverte à tout compte connecté

<json> : JSON inline, @fichier.json, ou - (stdin).
Famille par défaut : --family, sinon $LUDO_FAMILY, sinon l'unique famille existante.`;

const BASE_FIELDS = ['name', 'status', 'playersMin', 'playersMax', 'durationMin', 'priceBought', 'priceTarget', 'shop', 'url', 'priority', 'notes', 'tags'];
const ENRICHED_FIELDS = ['bggId', 'coverUrl', 'complexity', 'rulesSummary', 'setup', 'turnStructure', 'endCondition', 'tips', 'variants', 'sources'];
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
  else if (a === '-h' || a === '--help') flags.help = true;
  else pos.push(a);
}
const [cmd, ...rest] = pos;

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}
if (!cmd || flags.help) die(USAGE, cmd ? 0 : 1);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  die('GOOGLE_APPLICATION_CREDENTIALS non défini (chemin du JSON de compte de service, hors du repo).');
}

initializeApp({ credential: applicationDefault() });
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
  for (const k of ['tags', 'sources']) if (k in data && !Array.isArray(data[k])) die(`${k} doit être un tableau.`);
  for (const k of ['playersMin', 'playersMax', 'durationMin', 'priceBought', 'priceTarget', 'bggId', 'complexity'])
    if (k in data && data[k] != null && typeof data[k] !== 'number') die(`${k} doit être un nombre.`);
  // null = suppression du champ
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === null ? FieldValue.delete() : v]));
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
};

if (!commands[cmd]) die(USAGE);
try {
  await commands[cmd](rest);
} catch (e) {
  die(`Erreur : ${e.message}`);
}
