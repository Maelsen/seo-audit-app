import { NextRequest, NextResponse } from "next/server";
import {
  deleteTemplate,
  loadTemplate,
  saveTemplate,
} from "@/lib/storage";
import type { Template } from "@/lib/editor/template-types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const template = await loadTemplate(id);
  if (!template) {
    return NextResponse.json(
      { error: "Template nicht gefunden" },
      { status: 404 },
    );
  }
  return NextResponse.json({ template });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const existing = await loadTemplate(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Template nicht gefunden" },
      { status: 404 },
    );
  }

  let patch: Partial<Template>;
  try {
    patch = (await req.json()) as Partial<Template>;
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const updated: Template = {
    ...existing,
    ...patch,
    id: existing.id,
    version: 1,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await saveTemplate(updated);
  return NextResponse.json({ template: updated });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (id === "default") {
    return NextResponse.json(
      { error: "Das Default-Template kann nicht gelöscht werden." },
      { status: 400 },
    );
  }
  const ok = await deleteTemplate(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Template nicht gefunden" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
