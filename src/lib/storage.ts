import { promises as fs } from "fs";
import path from "path";
import type { AuditData, EditEntry, StyleProfile } from "./types";
import type { Template } from "./editor/template-types";

const DATA_ROOT = path.join(process.cwd(), "data");
const AUDITS_DIR = path.join(DATA_ROOT, "audits");
const UPLOADS_DIR = path.join(DATA_ROOT, "uploads");
const SCREENSHOTS_DIR = path.join(DATA_ROOT, "screenshots");
const TEMPLATES_DIR = path.join(DATA_ROOT, "templates");
const EDITS_FILE = path.join(DATA_ROOT, "edits.json");
const STYLE_PROFILE_FILE = path.join(DATA_ROOT, "style-profile.json");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveAudit(audit: AuditData): Promise<void> {
  await ensureDir(AUDITS_DIR);
  const file = path.join(AUDITS_DIR, `${audit.id}.json`);
  await fs.writeFile(file, JSON.stringify(audit, null, 2), "utf8");
}

export async function loadAudit(id: string): Promise<AuditData | null> {
  const file = path.join(AUDITS_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as AuditData;
  } catch {
    return null;
  }
}

export async function listAudits(): Promise<AuditData[]> {
  await ensureDir(AUDITS_DIR);
  const files = await fs.readdir(AUDITS_DIR);
  const audits: AuditData[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(AUDITS_DIR, f), "utf8");
    audits.push(JSON.parse(raw) as AuditData);
  }
  return audits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveUpload(
  auditId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const dir = path.join(UPLOADS_DIR, auditId);
  await ensureDir(dir);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(dir, safeName);
  await fs.writeFile(file, buffer);
  return file;
}

export async function saveScreenshot(
  auditId: string,
  name: string,
  buffer: Buffer,
): Promise<string> {
  const dir = path.join(SCREENSHOTS_DIR, auditId);
  await ensureDir(dir);
  const file = path.join(dir, `${name}.png`);
  await fs.writeFile(file, buffer);
  return `/api/screenshot/${auditId}/${name}`;
}

export async function readScreenshot(
  auditId: string,
  name: string,
): Promise<Buffer | null> {
  const file = path.join(SCREENSHOTS_DIR, auditId, `${name}.png`);
  try {
    return await fs.readFile(file);
  } catch {
    return null;
  }
}

export async function appendEdit(edit: EditEntry): Promise<void> {
  await ensureDir(DATA_ROOT);
  let edits: EditEntry[] = [];
  try {
    const raw = await fs.readFile(EDITS_FILE, "utf8");
    edits = JSON.parse(raw);
  } catch {
    edits = [];
  }
  edits.push(edit);
  await fs.writeFile(EDITS_FILE, JSON.stringify(edits, null, 2), "utf8");
}

export async function loadEdits(): Promise<EditEntry[]> {
  try {
    const raw = await fs.readFile(EDITS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function loadStyleProfile(): Promise<StyleProfile> {
  try {
    const raw = await fs.readFile(STYLE_PROFILE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StyleProfile>;
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      totalEdits: parsed.totalEdits ?? 0,
      lastProcessedEditIndex: parsed.lastProcessedEditIndex ?? 0,
      learnings: parsed.learnings ?? [],
      lastReasoning: parsed.lastReasoning,
      explicitTips: parsed.explicitTips ?? [],
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      totalEdits: 0,
      lastProcessedEditIndex: 0,
      learnings: [],
      explicitTips: [],
    };
  }
}

export async function saveStyleProfile(profile: StyleProfile): Promise<void> {
  await ensureDir(DATA_ROOT);
  await fs.writeFile(
    STYLE_PROFILE_FILE,
    JSON.stringify(profile, null, 2),
    "utf8",
  );
}

export async function saveTemplate(template: Template): Promise<void> {
  await ensureDir(TEMPLATES_DIR);
  const file = path.join(TEMPLATES_DIR, `${template.id}.json`);
  await fs.writeFile(file, JSON.stringify(template, null, 2), "utf8");
}

export async function loadTemplate(id: string): Promise<Template | null> {
  const file = path.join(TEMPLATES_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as Template;
  } catch {
    return null;
  }
}

export async function listTemplates(): Promise<Template[]> {
  await ensureDir(TEMPLATES_DIR);
  const files = await fs.readdir(TEMPLATES_DIR);
  const templates: Template[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(TEMPLATES_DIR, f), "utf8");
    templates.push(JSON.parse(raw) as Template);
  }
  return templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const file = path.join(TEMPLATES_DIR, `${id}.json`);
  try {
    await fs.unlink(file);
    return true;
  } catch {
    return false;
  }
}
