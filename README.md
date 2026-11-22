# Ludothèque

PWA (Vite + React + TS + Tailwind + Firebase) : jeux possédés / wishlist / à surveiller, partagés par famille.
Enrichissement (règles, résumé…) par Claude Code CLI via `scripts/games.mjs` → voir `CLAUDE.md`.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run deploy     # build + push dist/ sur la branche "deploy" (Hostinger Git)
```

## Étapes manuelles

### 1. Firebase (projet `ludotheque48`)

1. Console Firebase > **Authentication** > Sign-in method : activer **Google** et **E-mail/Mot de passe**.
2. Authentication > Paramètres > **Domaines autorisés** : ajouter `ludotheque.manaorbit.app`.
3. **Firestore Database** > Créer la base : mode production, région `eur3` (ou `europe-west9` Paris).
4. Déployer les règles (après l'étape 6, depuis ce dossier) :
   ```bash
   npm run rules:deploy      # via le compte de service (alternative : npx firebase-tools deploy --only firestore:rules)
   ```
5. Paramètres du projet > **Comptes de service** > *Générer une nouvelle clé privée* → ranger le JSON **hors du repo**, ex. `~/.config/ludotheque/service-account.json` (`chmod 600`).
6. Dans le shell où tourne Claude Code (ex. `~/.zshrc`) :
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/ludotheque/service-account.json"
   ```

### 2. `.env`

`cp .env.example .env` puis remplir avec la config web (console > Paramètres du projet > Vos applications > Web).
Déjà fait pour `ludotheque48` dans ce checkout (non commité).

### 3. Accès / familles

Pas d'UID en dur : l'accès se fait par **famille** (membres = allowlist, cf. `firestore.rules`).

```bash
node scripts/games.mjs access allow ton.email@gmail.com   # qui peut CRÉER une famille
```

- Créateurs : se connecter avec **Google** (la règle exige un email vérifié). Alternative : `access open true` (tout compte connecté peut créer une famille).
- Dans l'app : *Créer une famille* → menu ☰ > *Famille & invitations* > partager le lien/code à ta conjointe (elle se connecte puis *Rejoindre*).
- Autres familles : `access allow <leur email>`, elles créent leur propre famille, données séparées.

### 4. Seed (optionnel)

```bash
npm run seed            # 3 jeux d'exemple dans l'unique famille (sinon: -- --family <id>)
node scripts/games.mjs families
```

### 5. Hostinger — déploiement Git

1. Site `ludotheque.manaorbit.app` : créé ✅ (noter son dossier racine dans hPanel > Gestionnaire de fichiers, ex. `public_html` ou `public_html/ludotheque`).
2. hPanel > **SSL** : certificat actif pour `ludotheque.manaorbit.app` + *Forcer HTTPS*.
3. Vider le dossier du sous-domaine (le déploiement Git exige un dossier vide la 1ʳᵉ fois).
4. Premier push de la branche de déploiement depuis ta machine :
   ```bash
   npm run deploy
   ```
5. hPanel > Avancé > **GIT** :
   - Dépôt : `git@github.com:BeerDeus/ludotheque.git` — Branche : `deploy` — Dossier : vide si le site a son propre `public_html`, sinon le sous-dossier du sous-domaine.
   - Repo privé : copier la **clé SSH** affichée par hPanel → GitHub > repo > Settings > *Deploy keys* (lecture seule).
   - Activer **Auto deployment** : copier l'URL du webhook → GitHub > Settings > *Webhooks* (événement *push*), **ou** la mettre dans `.env.deploy` :
     ```
     HOSTINGER_DEPLOY_WEBHOOK=https://...
     ```
6. Ensuite, chaque `npm run deploy` = build + force-push `dist/` sur `deploy` → Hostinger se met à jour.

Options : `npm run deploy -- --dry-run` (sans push), `--skip-build`. Variables : `DEPLOY_REMOTE` (défaut `origin`), `DEPLOY_BRANCH` (défaut `deploy`).

### 6. Enrichissement

Dans ce dossier, avec `GOOGLE_APPLICATION_CREDENTIALS` exporté : lancer `claude` puis dire **« enrichis les jeux »**.

## Notes

- `.htaccess` (dans `public/`) : fallback SPA, `.git` masqué, cache du service worker désactivé.
- Hors-ligne : lecture via cache Firestore (IndexedDB) + precache PWA ; les modifs hors-ligne sont synchronisées au retour du réseau.
