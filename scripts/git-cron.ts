import { execSync } from "node:child_process";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

function log(msg: string) {
  console.log(`[git-cron] ${new Date().toISOString()} ${msg}`);
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", cwd: process.cwd() }).trim();
}

function isGitRepo(): boolean {
  try {
    run("git rev-parse --is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

function configureGit() {
  const name = process.env.GIT_AUTHOR_NAME || "Agent";
  const email = process.env.GIT_AUTHOR_EMAIL || "agent@local";
  const pat = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO;

  if (!pat || !repo) {
    log("GITHUB_PAT oder GITHUB_REPO fehlt. git-cron deaktiviert.");
    return false;
  }

  const remoteUrl = `https://x-access-token:${pat}@github.com/${repo}.git`;

  try {
    if (!isGitRepo()) {
      log("kein .git vorhanden — initialisiere Repo gegen origin/main");
      run("git init -b main");
      run(`git remote add origin ${remoteUrl}`);
      run("git fetch origin main --depth=1");
      // HEAD auf origin/main zeigen lassen, Working-Dir-Files bleiben.
      // Danach zeigt `git status` nur noch echte Diffs zum Remote.
      run("git reset --mixed FETCH_HEAD");
    } else {
      run(`git remote set-url origin ${remoteUrl}`);
    }
    run(`git config user.name "${name}"`);
    run(`git config user.email "${email}"`);
    return true;
  } catch (err) {
    log(`Git-Config fehlgeschlagen: ${(err as Error).message}`);
    return false;
  }
}

// Nur diese Pfade darf der Cron pushen. NIEMALS data/ (= Volume, user-generated)
// oder dynamisch generierte Build-Artefakte.
const SAFE_PATHS = [
  "src",
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  "nixpacks.toml",
  "railway.json",
  ".gitignore",
  ".env.example",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "tsconfig.json",
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
];

function syncOnce() {
  try {
    // nur Aenderungen in SAFE_PATHS adden, damit wir NIEMALS data/-Loeschungen committen
    run(`git add -- ${SAFE_PATHS.join(" ")}`);
    const staged = run("git diff --cached --name-only");
    if (!staged) {
      log("clean, nichts zu committen");
      return;
    }
    log(`staged changes:\n${staged}`);
    const msg = `chore(agent): auto-sync ${new Date().toISOString()}`;
    run(`git commit -m "${msg}"`);
    run("git push origin HEAD:main");
    log("push erfolgreich");
  } catch (err) {
    log(`Sync-Fehler: ${(err as Error).message}`);
  }
}

function main() {
  if (process.env.ENABLE_GIT_SYNC !== "1") {
    log("ENABLE_GIT_SYNC!=1 — git-cron laeuft nicht (lokale Dev-Umgebung)");
    return;
  }
  const ok = configureGit();
  if (!ok) return;

  log(`startet, Interval ${INTERVAL_MS / 1000}s`);
  syncOnce();
  setInterval(syncOnce, INTERVAL_MS);
}

main();
