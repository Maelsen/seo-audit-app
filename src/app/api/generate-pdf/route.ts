import { NextRequest, NextResponse } from "next/server";
import { loadAudit, loadTemplate } from "@/lib/storage";
import { buildAuditHtml, buildTemplateHtml } from "@/lib/pdf/build";
import { renderHtmlToPdf } from "@/lib/pdf/render";

export const maxDuration = 300;

const DEFAULT_TEMPLATE_ID = "default";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auditId = searchParams.get("auditId");
  if (!auditId) {
    return NextResponse.json({ error: "auditId fehlt" }, { status: 400 });
  }
  const audit = await loadAudit(auditId);
  if (!audit) {
    return NextResponse.json(
      { error: "Audit nicht gefunden" },
      { status: 404 },
    );
  }

  const engine = searchParams.get("engine");
  const templateIdParam = searchParams.get("templateId");
  let html: string;
  try {
    if (engine === "legacy") {
      html = await buildAuditHtml(audit);
    } else {
      const resolvedTemplateId = templateIdParam ?? DEFAULT_TEMPLATE_ID;
      const template = await loadTemplate(resolvedTemplateId);
      if (template) {
        html = await buildTemplateHtml(audit, resolvedTemplateId);
      } else {
        html = await buildAuditHtml(audit);
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render-Fehler" },
      { status: 500 },
    );
  }
  const preview = searchParams.get("format") === "html";
  if (preview) {
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const pdf = await renderHtmlToPdf(html);
  const filename = `SEO-Audit-${audit.projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
