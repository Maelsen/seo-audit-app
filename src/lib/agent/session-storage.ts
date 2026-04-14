import { promises as fs } from "fs";
import path from "path";
import { PROJECT_ROOT } from "./sandbox";
import type { ChatSession } from "./chat-types";

const CHATS_DIR = path.join(PROJECT_ROOT, "data", "agent-chats");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function sessionPath(id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) throw new Error("Ungueltige Session-ID");
  return path.join(CHATS_DIR, `${safe}.json`);
}

export async function loadSession(id: string): Promise<ChatSession | null> {
  try {
    const raw = await fs.readFile(sessionPath(id), "utf8");
    return JSON.parse(raw) as ChatSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: ChatSession): Promise<void> {
  await ensureDir(CHATS_DIR);
  await fs.writeFile(
    sessionPath(session.id),
    JSON.stringify(session, null, 2),
    "utf8",
  );
}

export async function listSessions(): Promise<
  Array<{ id: string; createdAt: string; updatedAt: string; firstUserText: string }>
> {
  await ensureDir(CHATS_DIR);
  const files = await fs.readdir(CHATS_DIR);
  const out: Array<{
    id: string;
    createdAt: string;
    updatedAt: string;
    firstUserText: string;
  }> = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(CHATS_DIR, f), "utf8");
      const s = JSON.parse(raw) as ChatSession;
      const firstUser = s.messages.find((m) => m.role === "user");
      let preview = "";
      if (firstUser) {
        for (const block of firstUser.content) {
          if (block.type === "text") {
            preview = block.text.slice(0, 80);
            break;
          }
        }
      }
      out.push({
        id: s.id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        firstUserText: preview,
      });
    } catch {
      // skip corrupt
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function newSession(id: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    messages: [],
    appliedChanges: [],
  };
}
