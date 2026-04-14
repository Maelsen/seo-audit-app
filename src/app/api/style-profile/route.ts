import { NextRequest, NextResponse } from "next/server";
import { loadEdits, loadStyleProfile } from "@/lib/storage";
import {
  extractAndUpdateStyleProfile,
  addExplicitTip,
} from "@/lib/agent/style-profile";

export const maxDuration = 120;

export async function GET() {
  const profile = await loadStyleProfile();
  const edits = await loadEdits();
  return NextResponse.json({ profile, editCount: edits.length });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { action: "refresh" | "addTip"; tip?: string };
  if (body.action === "refresh") {
    const edits = await loadEdits();
    const before = await loadStyleProfile();
    const unprocessed = edits.length - (before.lastProcessedEditIndex ?? 0);
    if (unprocessed <= 0) {
      return NextResponse.json({
        updated: false,
        profile: before,
        editCount: edits.length,
        message: "Keine neuen Edits seit letztem Update.",
      });
    }
    const profile = await extractAndUpdateStyleProfile();
    return NextResponse.json({ updated: true, profile, editCount: edits.length });
  }
  if (body.action === "addTip" && body.tip) {
    const profile = await addExplicitTip(body.tip);
    return NextResponse.json({ updated: true, profile });
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
