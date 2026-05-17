import { NextResponse } from "next/server";
import { listAudits } from "@/lib/storage";
import type { AuditSummary } from "@/lib/types";

// Dashboard-Liste. Mappt die volle AuditData auf AuditSummary, damit
// originalAi + rawInputs nicht ueber den Draht gehen.
export async function GET() {
  const audits = await listAudits();
  const summaries: AuditSummary[] = audits.map((a) => ({
    id: a.id,
    projectName: a.projectName,
    url: a.url,
    overallScore: a.overallScore,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    recommendationCount: a.recommendations?.length ?? 0,
    hasScreenshot: Boolean(a.screenshots?.cover),
  }));
  return NextResponse.json({ audits: summaries });
}
