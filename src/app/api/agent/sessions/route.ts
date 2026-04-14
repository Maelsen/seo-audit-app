import { listSessions } from "@/lib/agent/session-storage";

export async function GET() {
  const sessions = await listSessions();
  return Response.json({ sessions });
}
