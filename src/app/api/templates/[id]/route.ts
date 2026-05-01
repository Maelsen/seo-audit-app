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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 });
  }
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json(
      { error: "Body muss ein Objekt sein (Partial<Template>)" },
      { status: 400 },
    );
  }
  const ALLOWED_KEYS: ReadonlyArray<keyof Template> = [
    "id",
    "name",
    "version",
    "createdAt",
    "updatedAt",
    "pages",
    "assets",
  ];
  const allowedSet = new Set<string>(ALLOWED_KEYS);
  const unknownKeys = Object.keys(raw).filter((k) => !allowedSet.has(k));
  if (unknownKeys.length > 0) {
    return NextResponse.json(
      {
        error: `Unbekannte Top-Level-Keys: ${unknownKeys.join(", ")}. Erlaubt: ${ALLOWED_KEYS.join(", ")}.`,
      },
      { status: 400 },
    );
  }
  const patch = raw as Partial<Template>;

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
