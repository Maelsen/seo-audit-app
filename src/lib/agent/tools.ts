import { promises as fs } from "fs";
import path from "path";
import { execFileSync } from "child_process";
import type Anthropic from "@anthropic-ai/sdk";
import { resolveSandbox, PROJECT_ROOT } from "./sandbox";
import { createBackup } from "./backup";
import type { AppliedChange } from "./chat-types";

export type Attachment = {
  index: number;
  mediaType: string;
  data: string; // base64
  sizeBytes: number;
};

export type ToolContext = {
  sessionId: string;
  appliedChanges: AppliedChange[];
  attachments: Attachment[];
};

export type ToolResult = {
  content: string;
  isError: boolean;
};

export const AGENT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "read_file",
    description:
      "Liest eine Datei im Projekt. Gibt Inhalt als Text zurueck. Max 200 KB pro Aufruf. Path relativ zum Projekt-Root.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relativer Path, z.B. 'src/app/page.tsx'",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description:
      "Listet Inhalte eines Ordners (nicht-rekursiv). Zeigt Dateien mit Groesse und Unterordner.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Relativer Ordner-Path, z.B. 'src/app' oder '.' fuer Root",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_codebase",
    description:
      "Sucht einen Regex im Projekt (ripgrep-aehnlich). Liefert Datei:Zeile:Match. Max 200 Treffer.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "JavaScript-Regex, z.B. 'export function \\\\w+'",
        },
        glob: {
          type: "string",
          description:
            "Optional: Dateifilter (Suffix), z.B. '.tsx' oder '.json'",
        },
      },
      required: ["pattern"],
    },
  },
  {
    name: "write_file",
    description:
      "Schreibt Datei (ueberschreibt komplett oder erstellt neu). Erstellt automatisch Backup der Vorgaenger-Version falls existierte. Fuer grosse Aenderungen. Fuer kleine Aenderungen lieber edit_file benutzen.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relativer Path" },
        content: {
          type: "string",
          description: "Vollstaendiger neuer Datei-Inhalt",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "edit_file",
    description:
      "Ersetzt einen exakten String-Bereich in einer Datei durch einen neuen. old_string muss im File exakt und EINMALIG vorkommen (sonst Fehler). Erstellt automatisch Backup.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relativer Path" },
        old_string: {
          type: "string",
          description: "Exakter existierender Text (genug Kontext fuer Eindeutigkeit)",
        },
        new_string: { type: "string", description: "Ersatz-Text" },
      },
      required: ["path", "old_string", "new_string"],
    },
  },
  {
    name: "delete_file",
    description:
      "Loescht eine Datei. Erstellt automatisch Backup. Nutzen mit Vorsicht.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relativer Path" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_attachments",
    description:
      "Listet alle Bilder/Dateien die der User in dieser Session hochgeladen hat. Gibt Index, MIME-Type und Groesse zurueck. Nutzen bevor save_attachment aufgerufen wird.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "save_attachment",
    description:
      "Speichert ein vom User hochgeladenes Bild unter einem Pfad im Projekt ab. index kommt aus list_attachments. target_path ist relativ zum Projekt-Root, Dateiendung passt automatisch zum MIME-Type wenn weggelassen. Erstellt automatisch Backup falls Datei existiert.",
    input_schema: {
      type: "object",
      properties: {
        index: {
          type: "integer",
          description: "Attachment-Index aus list_attachments",
        },
        target_path: {
          type: "string",
          description:
            "Relativer Zielpfad, z.B. 'public/assets/vasilis.jpg'",
        },
      },
      required: ["index", "target_path"],
    },
  },
  {
    name: "git_sync",
    description:
      "Committet und pusht alle ungespeicherten Aenderungen zu GitHub. Nur aktiv auf dem Live-Server (ENABLE_GIT_SYNC=1). Nutzen wenn der User sagt 'speicher', 'commit', 'push', oder nach einer groesseren Session um den aktuellen Stand zu sichern.",
    input_schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Kurze Commit-Message, z.B. 'landing-page titel geaendert'",
        },
      },
      required: ["message"],
    },
  },
];

const MAX_READ_BYTES = 200_000;
const MAX_SEARCH_HITS = 200;

async function walkDir(
  dir: string,
  relBase: string,
  suffix: string | undefined,
  out: string[],
  maxFiles = 5000,
): Promise<void> {
  if (out.length >= maxFiles) return;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    if (out.length >= maxFiles) return;
    const full = path.join(dir, e.name);
    const rel = path.join(relBase, e.name).split(path.sep).join("/");
    if (e.isDirectory()) {
      if (
        e.name === "node_modules" ||
        e.name === ".next" ||
        e.name === ".git" ||
        rel.startsWith("data/agent-backups")
      )
        continue;
      await walkDir(full, rel, suffix, out, maxFiles);
    } else if (e.isFile()) {
      if (suffix && !rel.endsWith(suffix)) continue;
      out.push(rel);
    }
  }
}

async function runRead(args: { path: string }): Promise<ToolResult> {
  const sb = resolveSandbox(args.path);
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const stat = await fs.stat(sb.absolute);
    if (stat.isDirectory()) {
      return {
        content: `Path '${sb.relative}' ist ein Ordner. Nutze list_files.`,
        isError: true,
      };
    }
    if (stat.size > MAX_READ_BYTES) {
      const buf = await fs.readFile(sb.absolute);
      const head = buf.slice(0, MAX_READ_BYTES).toString("utf8");
      return {
        content: `[Datei ist ${stat.size} Bytes, zeige nur erste ${MAX_READ_BYTES}]\n\n${head}`,
        isError: false,
      };
    }
    const text = await fs.readFile(sb.absolute, "utf8");
    return { content: text, isError: false };
  } catch (err) {
    return { content: `Lesen fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

async function runList(args: { path: string }): Promise<ToolResult> {
  const sb = resolveSandbox(args.path || ".");
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const entries = await fs.readdir(sb.absolute, { withFileTypes: true });
    const lines: string[] = [];
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") {
          lines.push(`[dir] ${e.name}/  (uebersprungen)`);
          continue;
        }
        lines.push(`[dir] ${e.name}/`);
      } else if (e.isFile()) {
        const full = path.join(sb.absolute, e.name);
        const s = await fs.stat(full).catch(() => null);
        lines.push(`[file] ${e.name}  (${s?.size ?? "?"} B)`);
      }
    }
    return {
      content: `Ordner ${sb.relative || "."}:\n${lines.join("\n") || "(leer)"}`,
      isError: false,
    };
  } catch (err) {
    return { content: `List fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

async function runSearch(args: {
  pattern: string;
  glob?: string;
}): Promise<ToolResult> {
  let regex: RegExp;
  try {
    regex = new RegExp(args.pattern, "m");
  } catch (err) {
    return { content: `Ungueltiger Regex: ${(err as Error).message}`, isError: true };
  }
  const files: string[] = [];
  await walkDir(PROJECT_ROOT, "", args.glob, files);
  const hits: string[] = [];
  for (const rel of files) {
    if (hits.length >= MAX_SEARCH_HITS) break;
    const sb = resolveSandbox(rel);
    if (!sb.ok) continue;
    try {
      const text = await fs.readFile(sb.absolute, "utf8");
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (hits.length >= MAX_SEARCH_HITS) break;
        if (regex.test(lines[i])) {
          const line = lines[i].slice(0, 300);
          hits.push(`${rel}:${i + 1}: ${line}`);
        }
      }
    } catch {
      // binary or unreadable, skip
    }
  }
  return {
    content:
      hits.length === 0
        ? "Keine Treffer"
        : `${hits.length} Treffer:\n${hits.join("\n")}`,
    isError: false,
  };
}

async function runWrite(
  args: { path: string; content: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  const sb = resolveSandbox(args.path);
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const existed = await fs
      .stat(sb.absolute)
      .then(() => true)
      .catch(() => false);
    const backupPath = existed
      ? await createBackup(ctx.sessionId, sb.relative, sb.absolute)
      : null;
    await fs.mkdir(path.dirname(sb.absolute), { recursive: true });
    await fs.writeFile(sb.absolute, args.content, "utf8");
    ctx.appliedChanges.push({
      timestamp: new Date().toISOString(),
      tool: "write_file",
      path: sb.relative,
      backupPath,
      action: existed ? "modified" : "created",
    });
    return {
      content: `Datei ${existed ? "ueberschrieben" : "erstellt"}: ${sb.relative} (${args.content.length} Zeichen)`,
      isError: false,
    };
  } catch (err) {
    return { content: `Write fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

async function runEdit(
  args: { path: string; old_string: string; new_string: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  const sb = resolveSandbox(args.path);
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const text = await fs.readFile(sb.absolute, "utf8");
    const idx = text.indexOf(args.old_string);
    if (idx === -1) {
      return {
        content: `old_string nicht in ${sb.relative} gefunden. Pruefe exakte Schreibweise inkl. Whitespace.`,
        isError: true,
      };
    }
    const idx2 = text.indexOf(args.old_string, idx + 1);
    if (idx2 !== -1) {
      return {
        content: `old_string kommt mehrfach in ${sb.relative} vor. Fuege mehr Kontext hinzu damit eindeutig.`,
        isError: true,
      };
    }
    const backupPath = await createBackup(ctx.sessionId, sb.relative, sb.absolute);
    const updated = text.slice(0, idx) + args.new_string + text.slice(idx + args.old_string.length);
    await fs.writeFile(sb.absolute, updated, "utf8");
    ctx.appliedChanges.push({
      timestamp: new Date().toISOString(),
      tool: "apply_patch",
      path: sb.relative,
      backupPath,
      action: "modified",
    });
    return {
      content: `Edit angewendet: ${sb.relative}`,
      isError: false,
    };
  } catch (err) {
    return { content: `Edit fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

function extForMediaType(mt: string): string {
  switch (mt) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return "";
  }
}

function runListAttachments(ctx: ToolContext): ToolResult {
  if (ctx.attachments.length === 0) {
    return {
      content: "Keine Attachments in dieser Session. Der User muss erst ein Bild hochladen.",
      isError: false,
    };
  }
  const lines = ctx.attachments.map(
    (a) => `[${a.index}] ${a.mediaType} (${Math.round(a.sizeBytes / 1024)} KB)`,
  );
  return {
    content: `${ctx.attachments.length} Attachment(s):\n${lines.join("\n")}`,
    isError: false,
  };
}

async function runSaveAttachment(
  args: { index: number; target_path: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  const att = ctx.attachments.find((a) => a.index === args.index);
  if (!att) {
    return {
      content: `Attachment #${args.index} nicht gefunden. Nutze list_attachments.`,
      isError: true,
    };
  }
  let target = args.target_path;
  const hasExt = /\.[a-zA-Z0-9]{1,5}$/.test(target);
  if (!hasExt) {
    target = target + extForMediaType(att.mediaType);
  }
  const sb = resolveSandbox(target);
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const existed = await fs
      .stat(sb.absolute)
      .then(() => true)
      .catch(() => false);
    const backupPath = existed
      ? await createBackup(ctx.sessionId, sb.relative, sb.absolute)
      : null;
    await fs.mkdir(path.dirname(sb.absolute), { recursive: true });
    const buf = Buffer.from(att.data, "base64");
    await fs.writeFile(sb.absolute, buf);
    ctx.appliedChanges.push({
      timestamp: new Date().toISOString(),
      tool: "write_file",
      path: sb.relative,
      backupPath,
      action: existed ? "modified" : "created",
    });
    return {
      content: `Attachment #${args.index} gespeichert als ${sb.relative} (${buf.length} Bytes)`,
      isError: false,
    };
  } catch (err) {
    return { content: `Save fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

async function runDelete(
  args: { path: string },
  ctx: ToolContext,
): Promise<ToolResult> {
  const sb = resolveSandbox(args.path);
  if (!sb.ok) return { content: sb.error, isError: true };
  try {
    const backupPath = await createBackup(ctx.sessionId, sb.relative, sb.absolute);
    await fs.unlink(sb.absolute);
    ctx.appliedChanges.push({
      timestamp: new Date().toISOString(),
      tool: "delete_file",
      path: sb.relative,
      backupPath,
      action: "deleted",
    });
    return { content: `Datei geloescht: ${sb.relative}`, isError: false };
  } catch (err) {
    return { content: `Delete fehlgeschlagen: ${(err as Error).message}`, isError: true };
  }
}

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  }).trim();
}

async function runGitSync(args: { message: string }): Promise<ToolResult> {
  if (process.env.ENABLE_GIT_SYNC !== "1") {
    return {
      content:
        "git_sync ist deaktiviert (ENABLE_GIT_SYNC!=1). Das passiert wenn du lokal laeufst. Sag dem User er kann selber committen oder es auf dem Live-Server versuchen.",
      isError: true,
    };
  }
  try {
    const status = git(["status", "--porcelain"]);
    if (!status) {
      return { content: "Nichts zu committen (git ist clean).", isError: false };
    }
    git(["add", "-A"]);
    const msg = args.message.trim() || "chore(agent): changes";
    git(["commit", "-m", `agent: ${msg}`]);
    git(["push", "origin", "HEAD"]);
    return {
      content: `Push erfolgreich. Commit-Message: "agent: ${msg}"\n\nGeaenderte Dateien:\n${status}`,
      isError: false,
    };
  } catch (err) {
    const e = err as { stderr?: Buffer | string; message: string };
    const stderr = typeof e.stderr === "string" ? e.stderr : e.stderr?.toString() ?? "";
    return {
      content: `git_sync fehlgeschlagen: ${e.message}\n${stderr}`,
      isError: true,
    };
  }
}

export async function executeTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  try {
    switch (name) {
      case "read_file":
        return runRead({ path: String(args.path ?? "") });
      case "list_files":
        return runList({ path: String(args.path ?? ".") });
      case "search_codebase":
        return runSearch({
          pattern: String(args.pattern ?? ""),
          glob: args.glob ? String(args.glob) : undefined,
        });
      case "write_file":
        return runWrite(
          { path: String(args.path ?? ""), content: String(args.content ?? "") },
          ctx,
        );
      case "edit_file":
        return runEdit(
          {
            path: String(args.path ?? ""),
            old_string: String(args.old_string ?? ""),
            new_string: String(args.new_string ?? ""),
          },
          ctx,
        );
      case "delete_file":
        return runDelete({ path: String(args.path ?? "") }, ctx);
      case "list_attachments":
        return runListAttachments(ctx);
      case "save_attachment":
        return runSaveAttachment(
          {
            index: Number(args.index ?? -1),
            target_path: String(args.target_path ?? ""),
          },
          ctx,
        );
      case "git_sync":
        return runGitSync({ message: String(args.message ?? "") });
      default:
        return { content: `Unbekanntes Tool: ${name}`, isError: true };
    }
  } catch (err) {
    return { content: `Tool-Exception: ${(err as Error).message}`, isError: true };
  }
}
