import { NextRequest, NextResponse } from "next/server";
import { decomposePageBlocks } from "@/lib/editor/page-builders";
import type { LegacyPageKey } from "@/lib/editor/template-types";

export async function POST(req: NextRequest) {
  let body: { pageKey?: LegacyPageKey };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }
  if (!body.pageKey) {
    return NextResponse.json({ error: "pageKey fehlt" }, { status: 400 });
  }
  const blocks = decomposePageBlocks(body.pageKey);
  return NextResponse.json({ blocks });
}
