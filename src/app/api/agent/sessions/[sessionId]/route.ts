import { NextRequest } from "next/server";
import { loadSession } from "@/lib/agent/session-storage";

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const session = await loadSession(sessionId);
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(session);
}
