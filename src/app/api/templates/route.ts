import { NextRequest, NextResponse } from "next/server";
import { listTemplates, saveTemplate } from "@/lib/storage";
import type { Template } from "@/lib/editor/template-types";

export async function GET() {
  const templates = await listTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  let body: Partial<Template>;
  try {
    body = (await req.json()) as Partial<Template>;
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  if (!body.id || !body.name || !Array.isArray(body.pages)) {
    return NextResponse.json(
      { error: "id, name und pages sind Pflicht" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const template: Template = {
    id: body.id,
    name: body.name,
    version: 1,
    createdAt: body.createdAt ?? now,
    updatedAt: now,
    pages: body.pages,
    ...(body.assets ? { assets: body.assets } : {}),
  };
  await saveTemplate(template);
  return NextResponse.json({ template }, { status: 201 });
}
