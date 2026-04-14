import { promises as fs } from "fs";
import path from "path";
import { PROJECT_ROOT, pathExists } from "./sandbox";

const BACKUPS_DIR = path.join(PROJECT_ROOT, "data", "agent-backups");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeForBackupName(relPath: string): string {
  return relPath.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function createBackup(
  sessionId: string,
  relPath: string,
  absolutePath: string,
): Promise<string | null> {
  const exists = await pathExists(absolutePath);
  if (!exists) return null;
  const safeSession = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
  const dir = path.join(BACKUPS_DIR, safeSession);
  await ensureDir(dir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fname = `${timestamp}-${sanitizeForBackupName(relPath)}.bak`;
  const target = path.join(dir, fname);
  try {
    const data = await fs.readFile(absolutePath);
    await fs.writeFile(target, data);
    return path.relative(PROJECT_ROOT, target).split(path.sep).join("/");
  } catch {
    return null;
  }
}

export async function restoreBackup(relBackupPath: string, relTarget: string) {
  const src = path.resolve(PROJECT_ROOT, relBackupPath);
  const dst = path.resolve(PROJECT_ROOT, relTarget);
  const data = await fs.readFile(src);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.writeFile(dst, data);
}

export async function cleanOldBackups(maxAgeDays = 30): Promise<void> {
  try {
    const sessions = await fs.readdir(BACKUPS_DIR);
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    for (const session of sessions) {
      const dir = path.join(BACKUPS_DIR, session);
      const files = await fs.readdir(dir);
      for (const f of files) {
        const full = path.join(dir, f);
        const stat = await fs.stat(full).catch(() => null);
        if (stat && stat.mtimeMs < cutoff) {
          await fs.unlink(full).catch(() => {});
        }
      }
    }
  } catch {
    // no backups yet
  }
}
