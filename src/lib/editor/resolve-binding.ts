import type { AuditData } from "../types";
import type { Binding } from "./template-types";

const SEGMENT_RE = /([^.[\]]+)|\[(\d+)\]/g;

export function resolvePath(root: unknown, path: string): unknown {
  if (!path) return root;
  let current: unknown = root;
  SEGMENT_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SEGMENT_RE.exec(path)) !== null) {
    if (current == null) return undefined;
    const key = match[1] ?? match[2];
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function extractDomain(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname;
  } catch {
    return raw;
  }
}

export function applyTextTemplate(text: string, audit: AuditData): string {
  if (!text || !text.includes("{")) return text;
  return text
    .replace(/\{audit\.([^}]+)\}/g, (_, path: string) => {
      const val = resolvePath(audit, path);
      return val == null ? "" : String(val);
    })
    .replaceAll("{domain}", extractDomain(audit.url));
}

export function resolveBinding(
  audit: AuditData,
  binding: Binding,
): unknown {
  if (binding.kind === "static") return undefined;
  if (binding.kind === "audit") return resolvePath(audit, binding.path);
  if (binding.kind === "computed") {
    const raw = resolvePath(audit, binding.path);
    if (binding.fn === "domain") return extractDomain(raw);
    return undefined;
  }
  return undefined;
}
