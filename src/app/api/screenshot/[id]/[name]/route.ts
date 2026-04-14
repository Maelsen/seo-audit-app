import { NextRequest, NextResponse } from "next/server";
import { readScreenshot } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; name: string }> },
) {
  const { id, name } = await params;
  const buf = await readScreenshot(id, name);
  if (!buf) {
    return NextResponse.json(
      { error: "not found" },
      { status: 404 },
    );
  }
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
