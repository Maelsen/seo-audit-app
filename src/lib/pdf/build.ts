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
  .audit-page { width: 210mm; height: 297mm; overflow: hidden; position: relative; page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page; }
  .audit-page:last-child { page-break-after: auto; break-after: auto; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
${body}
</body>
</html>`;
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

  // M13: alle audit-Image-Pfade die auf public/assets/* zeigen werden inlined,
  // sonst kann Puppeteer (page.setContent ohne URL → about:blank) sie nicht
  // laden. Das ist generisch — egal ob inhaber.photo, schemaMarkupImage oder
  // andere zukuenftige Image-Bindings.
  const inhaberPhoto = await inlineAssetIfLocal(audit.inhaber?.photo);

  const auditWithScreenshots: AuditData = {
    ...audit,
    screenshots: {
      ...(audit.screenshots ?? {}),
      cover: cover ?? audit.screenshots?.cover,
      mobile: mobile ?? audit.screenshots?.mobile,
      tablet: tablet ?? audit.screenshots?.tablet,
    },
    inhaber: audit.inhaber
      ? { ...audit.inhaber, photo: inhaberPhoto ?? audit.inhaber.photo }
      : audit.inhaber,
  };

  const render = await getRenderer();
  const body = render(
    TemplateRenderer({ template, audit: auditWithScreenshots }),
  );
  return htmlShell(audit, body);
}

async function inlineAssetIfLocal(
  src: string | undefined,
): Promise<string | undefined> {
  if (!src) return undefined;
  const m = src.match(/^\/assets\/([^/?#]+)$/);
  if (!m) return undefined;
  const ext = m[1].split(".").pop()?.toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "svg"
      ? "image/svg+xml"
      : "image/png";
  return assetToDataUrl(m[1], mime);
}
