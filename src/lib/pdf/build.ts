import { AuditDocument } from "@/components/pdf-template/AuditDocument";
import { setBrandAssets } from "@/components/pdf-template/brand-state";
import type { AuditData } from "../types";
import { loadTemplate, readScreenshot } from "../storage";
import { TemplateRenderer } from "../editor/render-template";
import { promises as fs } from "fs";
import path from "path";

type RenderFn = (element: React.ReactElement) => string;
let cachedRender: RenderFn | null = null;

async function getRenderer(): Promise<RenderFn> {
  if (cachedRender) return cachedRender;
  const specifier = "react-dom" + "/server.node";
  const mod = (await import(/* webpackIgnore: true */ specifier)) as {
    renderToStaticMarkup: RenderFn;
  };
  cachedRender = mod.renderToStaticMarkup;
  return cachedRender;
}

async function screenshotToDataUrl(
  auditId: string,
  name: string,
): Promise<string | undefined> {
  const buf = await readScreenshot(auditId, name);
  if (!buf) return undefined;
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function assetToDataUrl(
  filename: string,
  mime = "image/png",
): Promise<string | undefined> {
  try {
    const file = path.join(process.cwd(), "public", "assets", filename);
    const buf = await fs.readFile(file);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

function htmlShell(audit: AuditData, body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>SEO Audit ${audit.url}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #1a1a1a; }
  body { font-family: 'Poppins', 'Open Sans', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .audit-page { width: 210mm; height: 296mm; overflow: hidden; position: relative; page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page; }
  .audit-page:last-child { page-break-after: auto; break-after: auto; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export async function buildAuditHtml(audit: AuditData): Promise<string> {
  const [cover, mobile, tablet, logo, signet] = await Promise.all([
    screenshotToDataUrl(audit.id, "cover"),
    screenshotToDataUrl(audit.id, "mobile"),
    screenshotToDataUrl(audit.id, "tablet"),
    assetToDataUrl("ArtisticAvenue-Logo.png"),
    assetToDataUrl("ArtisticAvenue-Signet.png"),
  ]);

  setBrandAssets(logo, signet);

  const render = await getRenderer();
  const body = render(
    AuditDocument({
      audit,
      coverScreenshotDataUrl: cover,
      mobileScreenshotDataUrl: mobile,
      tabletScreenshotDataUrl: tablet,
    }),
  );

  return htmlShell(audit, body);
}

export async function buildTemplateHtml(
  audit: AuditData,
  templateId: string,
): Promise<string> {
  const template = await loadTemplate(templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" nicht gefunden`);
  }
  const [cover, mobile, tablet, logo, signet] = await Promise.all([
    screenshotToDataUrl(audit.id, "cover"),
    screenshotToDataUrl(audit.id, "mobile"),
    screenshotToDataUrl(audit.id, "tablet"),
    assetToDataUrl("ArtisticAvenue-Logo.png"),
    assetToDataUrl("ArtisticAvenue-Signet.png"),
  ]);
  setBrandAssets(logo, signet);

  const auditWithScreenshots: AuditData = {
    ...audit,
    screenshots: {
      ...(audit.screenshots ?? {}),
      cover: cover ?? audit.screenshots?.cover,
      mobile: mobile ?? audit.screenshots?.mobile,
      tablet: tablet ?? audit.screenshots?.tablet,
    },
  };

  const render = await getRenderer();
  const body = render(
    TemplateRenderer({ template, audit: auditWithScreenshots }),
  );
  return htmlShell(audit, body);
}
