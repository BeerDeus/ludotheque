#!/usr/bin/env node
// Build + publication de dist/ sur une branche Git dédiée (orpheline, force-push),
// que le déploiement Git de Hostinger clone dans le dossier du sous-domaine.
//   DEPLOY_REMOTE   remote git ou URL (défaut: origin)
//   DEPLOY_BRANCH   branche suivie par Hostinger (défaut: deploy)
//   HOSTINGER_DEPLOY_WEBHOOK  URL "Auto deployment" hPanel (optionnel, sinon webhook GitHub ou bouton "Deploy")
// Options : --skip-build, --dry-run
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));
const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { stdio: 'inherit', ...opts });
const out = (cmd, a, opts = {}) => execFileSync(cmd, a, { encoding: 'utf8', ...opts }).trim();

// .env.deploy optionnel (KEY=VALUE) pour ne pas exporter à la main
const envFile = join(root, '.env.deploy');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const remoteName = process.env.DEPLOY_REMOTE || 'origin';
const branch = process.env.DEPLOY_BRANCH || 'deploy';
const remote = /[:/]/.test(remoteName) ? remoteName : out('git', ['remote', 'get-url', remoteName], { cwd: root });

if (!args.has('--skip-build')) {
  if (!existsSync(join(root, '.env')) && !process.env.VITE_FIREBASE_API_KEY) {
    console.error('.env manquant (config web Firebase). Voir .env.example.');
    process.exit(1);
  }
  sh('npm', ['run', 'build'], { cwd: root });
}

const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html introuvable : lance le build.');
  process.exit(1);
}

let sha = 'nogit';
try {
  sha = out('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  /* pas de commit */
}

const tmp = mkdtempSync(join(tmpdir(), 'ludo-deploy-'));
try {
  cpSync(dist, tmp, { recursive: true });
  const g = (...a) => sh('git', a, { cwd: tmp });
  g('init', '-q', '-b', branch);
  g('add', '-A');
  g('-c', 'user.name=ludotheque-deploy', '-c', 'user.email=deploy@localhost', 'commit', '-q', '-m', `deploy ${new Date().toISOString()} (${sha})`);
  if (args.has('--dry-run')) {
    console.log(`[dry-run] push vers ${remote} ${branch} ignoré. Contenu : ${tmp}`);
    process.exit(0);
  }
  g('push', '--force', remote, `${branch}:${branch}`);
  console.log(`✓ dist/ publié sur ${branch} (${sha})`);
} finally {
  if (!args.has('--dry-run')) rmSync(tmp, { recursive: true, force: true });
}

const hook = process.env.HOSTINGER_DEPLOY_WEBHOOK;
if (hook) {
  const res = await fetch(hook, { method: 'POST' });
  console.log(res.ok ? '✓ Webhook Hostinger déclenché' : `⚠ Webhook Hostinger : HTTP ${res.status}`);
} else {
  console.log('ℹ Pas de HOSTINGER_DEPLOY_WEBHOOK : Hostinger se met à jour via le webhook GitHub, sinon clique "Deploy" dans hPanel > Git.');
}
