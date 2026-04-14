import path from "path";
import { promises as fs } from "fs";

export const PROJECT_ROOT = process.cwd();

const DENY_PATTERNS: RegExp[] = [
  /^\.env(\..+)?$/,
  /(^|\/)\.env(\..+)?$/,
  /^node_modules(\/|$)/,
  /^\.next(\/|$)/,
  /^\.git(\/|$)/,
  /^data\/agent-backups(\/|$)/,
];

export type SandboxResult =
  | { ok: true; absolute: string; relative: string }
  | { ok: false; error: string };

export function resolveSandbox(input: string): SandboxResult {
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, error: "Path ist leer" };
  }
  const absolute = path.resolve(PROJECT_ROOT, input);
  const rel = path.relative(PROJECT_ROOT, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return {
      ok: false,
      error: `Path liegt ausserhalb des Projekts: ${input}`,
    };
  }
  const normalized = rel.split(path.sep).join("/");
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        ok: false,
        error: `Path ist blockiert (Deny-Liste): ${normalized}`,
      };
    }
  }
  return { ok: true, absolute, relative: normalized };
}

export async function pathExists(absolute: string): Promise<boolean> {
  try {
    await fs.access(absolute);
    return true;
  } catch {
    return false;
  }
}
