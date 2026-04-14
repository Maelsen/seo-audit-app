import { execSync } from "node:child_process";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

function log(msg: string) {
  console.log(`[git-cron] ${new Date().toISOString()} ${msg}`);
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", cwd: process.cwd() }).trim();
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

  try {
    run(`git config user.name "${name}"`);
    run(`git config user.email "${email}"`);
    run(`git remote set-url origin https://x-access-token:${pat}@github.com/${repo}.git`);
    return true;
  } catch (err) {
    log(`Git-Config fehlgeschlagen: ${(err as Error).message}`);
    return false;
  }
}

function syncOnce() {
  try {
    const status = run("git status --porcelain");
    if (!status) {
      log("clean, nichts zu committen");
      return;
    }
    log(`uncommitted changes:\n${status}`);
    run("git add -A");
    const msg = `chore(agent): auto-sync ${new Date().toISOString()}`;
    run(`git commit -m "${msg}"`);
    run("git push origin HEAD");
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
