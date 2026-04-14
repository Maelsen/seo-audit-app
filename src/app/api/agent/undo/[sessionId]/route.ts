import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import { loadSession, saveSession } from "@/lib/agent/session-storage";
import { restoreBackup } from "@/lib/agent/backup";
import { resolveSandbox } from "@/lib/agent/sandbox";

type Ctx = { params: Promise<{ sessionId: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const session = await loadSession(sessionId);
  if (!session) return Response.json({ error: "not found" }, { status: 404 });

  const lastChange = session.appliedChanges[session.appliedChanges.length - 1];
  if (!lastChange) {
    return Response.json({ error: "keine rueckgaengig-machbare Aenderung" }, { status: 400 });
  }

  const sb = resolveSandbox(lastChange.path);
  if (!sb.ok) return Response.json({ error: sb.error }, { status: 400 });

  try {
    if (lastChange.action === "created") {
      await fs.unlink(sb.absolute).catch(() => {});
    } else if (lastChange.backupPath) {
      await restoreBackup(lastChange.backupPath, lastChange.path);
    } else {
      return Response.json({ error: "kein Backup vorhanden" }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  session.appliedChanges.pop();
  session.updatedAt = new Date().toISOString();
  await saveSession(session);

  return Response.json({
    ok: true,
    restored: {
      path: lastChange.path,
      action: lastChange.action,
    },
    remaining: session.appliedChanges.length,
  });
}
