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

Règles : `firestore.rules` (accès aux jeux = membres de la famille). Déploiement des règles : `npx firebase-tools deploy --only firestore:rules`.

### Schéma d'un jeu

Saisi par l'utilisateur :

| champ | type | note |
|---|---|---|
| name | string | requis |
| status | `'owned' \| 'wishlist' \| 'watch'` | |
| playersMin, playersMax | number | 0 = inconnu |
| durationMin | number | durée typique en minutes, 0 = inconnue |
| priceBought?, priceTarget? | number | euros |
| shop?, url? | string | url = lien d'achat |
| priority | 1 \| 2 \| 3 | 1 = haute |
| notes | string | markdown |
| tags | string[] | minuscules |
| createdAt | Timestamp | |

Enrichi par Claude :

| champ | type | contenu attendu |
|---|---|---|
| bggId | number | id BoardGameGeek |
| coverUrl | string | URL image de couverture (BGG `cf.geekdo-images.com` de préférence) |
| complexity | number 1–5 | poids BGG arrondi à 0,5 près |
| rulesSummary | md | 8–15 lignes : thème, but du jeu, comment on gagne, mécaniques principales |
| setup | md | liste à puces, 5–10 étapes de mise en place |
| turnStructure | md | liste numérotée des phases/actions d'un tour, 10–20 lignes max |
| endCondition | md | 2–5 lignes : déclencheur de fin + décompte + départage |
| tips | md | 3–6 conseils (stratégie débutant, erreurs fréquentes, règles souvent oubliées) |
| variants | md | variantes officielles (solo, 2 joueurs, extensions notables) ; sinon `Aucune variante officielle notable.` |
| sources | string[] | URLs réellement consultées |
| enrichedAt / enrichedBy | Timestamp / string | posés automatiquement par `update` |

Niveau de détail : **intermédiaire** — structuré et utilisable à table pour se rafraîchir la mémoire, sans être exhaustif (pas de cas particuliers de toutes les cartes).

## Script admin `scripts/games.mjs`

Prérequis : `GOOGLE_APPLICATION_CREDENTIALS` pointe vers le JSON du compte de service (hors du repo, jamais commité, jamais affiché).

```bash
node scripts/games.mjs families                       # familles, membres, nb de jeux
node scripts/games.mjs list [--pending] [--family F]  # pending = sans enrichedAt ; sans --family = toutes familles
node scripts/games.mjs get <ref>                      # ref = gameId ou familyId/gameId
node scripts/games.mjs update <ref> <json>            # merge + enrichedAt=now, enrichedBy='claude'
node scripts/games.mjs update <ref> <json> --no-enrich  # merge simple (correction d'un champ de base)
node scripts/games.mjs add <json> [--family F]        # objet ou tableau
node scripts/games.mjs delete <ref>
node scripts/games.mjs access show|allow <email>|revoke <email>|open true|false
```

`<json>` = JSON inline, `@fichier.json` ou `-` (stdin). Une valeur `null` supprime le champ.
**Pour `update`, toujours passer par un fichier** (`@`) : le markdown français contient des apostrophes qui cassent les quotes du shell.

## Procédure « enrichis les jeux »

Quand l'utilisateur dit « enrichis les jeux » (ou « enrichis <nom> ») :

1. `node scripts/games.mjs list --pending` (ou `get` pour un jeu précis). `list` renvoie `familyId` : utiliser `familyId/id` comme ref.
2. Pour chaque jeu :
   1. Identifier le jeu sans ambiguïté : WebSearch / WebFetch sur BoardGameGeek (bggId, image, poids, joueurs, durée), site de l'éditeur, règles officielles (PDF éditeur), FAQ.
   2. **Si incertitude** (homonymes, édition/version inconnue, jeu introuvable, infos contradictoires) : **demander à l'utilisateur** avant d'écrire, ne pas deviner.
   3. Rédiger **en français, avec tes propres mots** — ne jamais copier/coller ni paraphraser de près le livret de règles ; synthétiser.
   4. Remplir **tous** les champs enrichis (cf. tableau) + `sources` (URLs réellement consultées).
   5. Champs de base `playersMin`, `playersMax`, `durationMin` : les compléter **uniquement s'ils valent 0** (ne jamais écraser une saisie utilisateur). Ne pas toucher `status`, prix, `priority`, `notes`, `tags`.
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
