# Ludothèque — guide pour Claude Code

PWA perso (Vite + React + TS + Tailwind + Firebase) pour suivre des jeux de société : possédés / wishlist / à surveiller.
Multi-familles : chaque famille a sa propre collection de jeux.

## Commandes projet

- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run deploy` → build + push de `dist/` sur la branche `deploy` (Hostinger Git) — voir README
- Toujours vérifier `npm run build && npm run lint` avant de conclure une modif de code.

## Firestore

```
config/access                    { creatorEmails: string[], openSignup: bool }   (admin)
users/{uid}                      { familyId, email, displayName }
families/{fid}                   { name, ownerUid, inviteCode, createdAt }
families/{fid}/members/{uid}     { role: 'owner'|'member', code, email, displayName, joinedAt }
families/{fid}/games/{gid}       jeu (schéma ci-dessous)
invites/{code}                   { familyId, createdBy, createdAt }
```

Règles : `firestore.rules` (accès aux jeux = membres de la famille). Déploiement des règles : `npm run rules:deploy` (compte de service) ou `npx firebase-tools deploy --only firestore:rules`.

### Schéma d'un jeu

Saisi par l'utilisateur :

| champ | type | note |
|---|---|---|
| name | string | requis |
| status | `'owned' \| 'wishlist' \| 'watch'` | |
| playersMin, playersMax | number | 0 = inconnu |
| durationMin | number | durée typique en minutes, 0 = inconnue |
| ageMin? | number | âge minimum conseillé |
| priceBought?, priceTarget? | number | euros |
| shop?, url? | string | url = lien d'achat |
| priority | 1 \| 2 \| 3 | 1 = haute |
| notes | string | markdown |
| tags | string[] | minuscules |
| missingParts? | md | matériel manquant / abîmé (badge « incomplet ») |
| expansions? | `{ id, name, owned, bggId?, notes? }[]` | extensions possédées ou suivies — **jamais modifiées par l'enrichissement** |
| createdAt | Timestamp | |

Enrichi par Claude :

| champ | type | contenu attendu |
|---|---|---|
| bggId | number | id BoardGameGeek |
| coverUrl | string | URL image de couverture (BGG `cf.geekdo-images.com` de préférence) |
| thumbUrl | string | miniature (liste) |
| yearPublished | number | année de sortie |
| bggRating | number | note moyenne BGG (1 décimale) |
| bggExpansions | `{ bggId, name }[]` | extensions connues sur BGG (suggestions dans l'app) |
| autofillNote | string | message de l'autofill BGG (ambiguïté, introuvable) |
| complexity | number 1–5 | poids BGG arrondi à 0,5 près |
| rulesSummary | md | 8–15 lignes : thème, but du jeu, comment on gagne, mécaniques principales |
| setup | md | liste à puces, 5–10 étapes de mise en place |
| turnStructure | md | liste numérotée des phases/actions d'un tour, 10–20 lignes max |
| endCondition | md | 2–5 lignes : déclencheur de fin + décompte + départage |
| tips | md | 3–6 conseils (stratégie débutant, erreurs fréquentes, règles souvent oubliées) |
| variants | md | variantes officielles (solo, 2 joueurs, extensions notables) ; sinon `Aucune variante officielle notable.` |
| sources | string[] | URLs réellement consultées |
| enrichedAt / enrichedBy | Timestamp / string | posés automatiquement par `update` |

**Langue / disponibilité (règle utilisateur)** : uniquement ce qui existe **en français**. Noms **français officiels**
uniquement (pas de « (VO) », pas de titre anglais entre parenthèses). Une boîte/extension disponible seulement en VO
**n'est pas ajoutée** (vérifier une fiche VF chez un éditeur/boutique FR : Matagot, Intrafin, Asmodee, play-in, philibert…).
Pour corriger une liste existante : `expansionsPatch: { "<nom actuel>": { name?, notes?, kind?, remove: true } }`.

**Images** : toutes stockées **carrées**, complétées par un fond blanc (CI `toDataUrl`, appli `fileToCompactDataUrl`).
Ré-encodage global : workflow `firebase-admin` → `squarify`.

Niveau de détail : **intermédiaire** — structuré et utilisable à table pour se rafraîchir la mémoire, sans être exhaustif (pas de cas particuliers de toutes les cartes).

## Script admin `scripts/games.mjs`

Prérequis : `GOOGLE_APPLICATION_CREDENTIALS` pointe vers le JSON du compte de service (hors du repo, jamais commité, jamais affiché), ou `FIREBASE_SERVICE_ACCOUNT` contient ce JSON.

```bash
node scripts/games.mjs families                       # familles, membres, nb de jeux
node scripts/games.mjs list [--pending] [--family F]  # pending = sans enrichedAt ; sans --family = toutes familles
node scripts/games.mjs get <ref>                      # ref = gameId ou familyId/gameId
node scripts/games.mjs update <ref> <json>            # merge + enrichedAt=now, enrichedBy='claude'
node scripts/games.mjs update <ref> <json> --no-enrich  # merge simple (correction d'un champ de base)
node scripts/games.mjs add <json> [--family F]        # objet ou tableau
node scripts/games.mjs delete <ref>
node scripts/games.mjs access show|allow <email>|revoke <email>|open true|false
node scripts/games.mjs rules deploy                   # publie firestore.rules (= npm run rules:deploy)
node scripts/games.mjs export [--pending]             # liste compacte gzip+base64 (logs CI)
node scripts/games.mjs apply enrichments [--applied f]  # applique enrichments/<fid>__<gid>.json
node scripts/games.mjs autofill [ref] [--all] [--force] # API XML BGG (BGG_API_TOKEN) : image, âge, joueurs…
```

### Autofill BGG (automatique)

Workflow `BGG autofill` (toutes les heures + après chaque enrichissement) : pour chaque jeu nouveau, renommé
ou dont le `bggId` a changé, cherche le jeu sur BGG (noms alternatifs inclus, ex. titres FR) et remplit
`coverUrl`, `thumbUrl`, `ageMin`, `playersMin/Max`, `durationMin`, `yearPublished`, `complexity`, `bggRating`,
`bggExpansions` — sans écraser une saisie existante. Ambigu → `autofillNote` listant les candidats ; on tranche
en posant `bggId` (app : champ « ID BGG », ou enrichissement).

`<json>` = JSON inline, `@fichier.json` ou `-` (stdin). Une valeur `null` supprime le champ.
**Pour `update`, toujours passer par un fichier** (`@`) : le markdown français contient des apostrophes qui cassent les quotes du shell.

## Procédure « enrichis les jeux »

### Depuis une session cloud (pas de JSON de compte de service en local)

Tout passe par GitHub Actions (secret `FIREBASE_SERVICE_ACCOUNT`). Repo **public** : rien de personnel dans les fichiers/logs.

1. Lancer le workflow `firebase-admin.yml` avec `command=export-pending` (outil GitHub `actions_run_trigger`, ref = branche par défaut).
2. Lire les logs du job (`get_job_logs`, `tail_lines: 300`), extraire les lignes entre `LUDO_EXPORT_BEGIN` et `LUDO_EXPORT_END`,
   puis : `tr -d '\n' | base64 -d | gunzip` → JSON `[{ ref, name, playersMin, …, bggId, autofillNote, expansions }]`.
   (Base64 obligatoire : GitHub masque les `{` `}` dans les logs à cause du secret JSON multi-lignes.)
3. Rechercher / rédiger comme ci-dessous, puis écrire **un fichier par jeu** : `enrichments/<familyId>__<gameId>.json`
   (`ref` = `familyId/gameId`). Mêmes champs que pour `update`. Ne pas inclure `expansions`.
4. Commit + push sur la branche par défaut → workflow « Appliquer les enrichissements » : écrit dans Firestore,
   supprime les fichiers (commit bot `[skip ci]` → faire `git pull` avant le push suivant), lance l'autofill.
5. Vérifier le run (`actions_list` → `list_workflow_jobs` → logs : `✓ <nom>` par jeu).

### Depuis la machine de l'utilisateur (JSON local)

Quand l'utilisateur dit « enrichis les jeux » (ou « enrichis <nom> ») :

1. `node scripts/games.mjs list --pending` (ou `get` pour un jeu précis). `list` renvoie `familyId` : utiliser `familyId/id` comme ref.
2. Pour chaque jeu :
   1. Identifier le jeu sans ambiguïté : WebSearch / WebFetch sur BoardGameGeek (bggId, image, poids, joueurs, durée), site de l'éditeur, règles officielles (PDF éditeur), FAQ.
   2. **Si incertitude** (homonymes, édition/version inconnue, jeu introuvable, infos contradictoires) : **demander à l'utilisateur** avant d'écrire, ne pas deviner.
   3. Rédiger **en français, avec tes propres mots** — ne jamais copier/coller ni paraphraser de près le livret de règles ; synthétiser.
   4. Remplir **tous** les champs enrichis (cf. tableau) + `sources` (URLs réellement consultées).
      **Image** : ajouter `"coverPages": [url1, url2, …]` = pages produit FR (play-in, espritjeu, philibert, ludum, éditeur…)
      trouvées par WebSearch, ou URLs d'image directes. La CI télécharge l'image og:image de la première page qui
      répond, la réduit (600 px, JPEG ≤ 180 Ko) et la stocke dans `coverUrl` (`coverSource` = page). **Toujours une page produit
      montrant la boîte** (pas Wikipédia : ses images sont souvent du matériel, pas la boîte ; `covers` reste manuel).
      Pour un jeu déjà enrichi, un fichier `{ "coverPages": [...] }` suffit.
      **Gammes** (boîtes autonomes + extensions) : une seule fiche au nom de la gamme ; `expansionsAdd: [{ name, owned, kind: 'standalone'|'expansion' }]`
      ajoute les éléments absents de `expansions` sans toucher à ceux saisis par l'utilisateur.
      Image d'un élément : `coverPages` dans l'élément d'`expansionsAdd`, ou `expansionImages: { "<nom exact>": [urls] }`
      pour des éléments existants → grand format dans `games/{gid}/images/{id}`, miniature dans `expansions[].thumb`. `bggId` exact en priorité :
      l'autofill complète ensuite image, miniature, note, extensions BGG.
   5. Champs de base `playersMin`, `playersMax`, `durationMin`, `ageMin` : les compléter **uniquement s'ils sont vides/0** (ne jamais écraser une saisie utilisateur). Ne pas toucher `status`, prix, `priority`, `notes`, `tags`, `missingParts`, `expansions`.
   6. Écrire le JSON dans un fichier temporaire (ex. `/tmp/ludo-<id>.json`) puis `node scripts/games.mjs update <familyId>/<id> @/tmp/ludo-<id>.json`. Vérifier la sortie.
3. Récap final en liste :
   - jeux traités (nom → complexité, sources principales)
   - jeux ignorés / en attente (nom → raison, question posée)

Exemple de fichier `update` :

```json
{
  "bggId": 342942,
  "coverUrl": "https://cf.geekdo-images.com/....jpg",
  "complexity": 3.5,
  "rulesSummary": "…",
  "setup": "- …\n- …",
  "turnStructure": "1. …\n2. …",
  "endCondition": "…",
  "tips": "- …",
  "variants": "- **Solo** : …",
  "sources": ["https://boardgamegeek.com/boardgame/342942", "https://…"]
}
```

## Conventions code

- UI en français, mobile-first, dark mode via `prefers-color-scheme`.
- SDK Firebase modular ; écritures sans `await` bloquant (fonctionne hors-ligne, cache IndexedDB).
- Ne jamais commiter : `.env*`, JSON de compte de service, `dist/`.
