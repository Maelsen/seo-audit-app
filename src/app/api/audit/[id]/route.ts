import { NextRequest, NextResponse } from "next/server";
import { loadAudit, saveAudit, appendEdit } from "@/lib/storage";
import { extractAndUpdateStyleProfile } from "@/lib/agent/style-profile";
import { randomUUID } from "crypto";
import type { AuditData, EditEntry } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audit = await loadAudit(id);
  if (!audit) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ audit });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = await loadAudit(id);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await req.json()) as {
    audit: AuditData;
    edits?: { section: string; field: string; original: string; edited: string }[];
  };
  const updated: AuditData = {
    ...body.audit,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    originalAi: existing.originalAi,
    screenshots: existing.screenshots,
    rawInputs: existing.rawInputs,
  };
  await saveAudit(updated);

  if (body.edits && body.edits.length > 0) {
    for (const diff of body.edits) {
      const entry: EditEntry = {
        id: randomUUID(),
        auditId: id,
        section: diff.section,
        field: diff.field,
        originalValue: diff.original,
        editedValue: diff.edited,
        timestamp: new Date().toISOString(),
      };
      await appendEdit(entry);
    }
    void extractAndUpdateStyleProfile().catch((err) => {
      console.error("Style Profile auto update failed:", err);
    });
  }

  return NextResponse.json({ audit: updated });
}
