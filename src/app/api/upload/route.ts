import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { saveAudit, saveUpload } from "@/lib/storage";
import {
  parseScreamingFrogCsv,
  type ScreamingFrogData,
} from "@/lib/parsers/screaming-frog";
import { parseSeoptimerPdf, type SeoptimerData } from "@/lib/parsers/seoptimer";
import { fetchPageSpeed, type PageSpeedData } from "@/lib/parsers/pagespeed";
import { captureScreenshots } from "@/lib/screenshot";
import { ndjsonResponse } from "@/lib/stream";
import type { AuditData } from "@/lib/types";

export const maxDuration = 300;

function stub(): AuditData["sections"] {
  return {
    onpageSeo: {
      score: "C",
      heading: "",
      text: "",
      titleTag: { value: "", length: 0, status: "info" },
      metaDescription: { value: "", length: 0, status: "info" },
      serpPreview: { title: "", url: "", description: "" },
      language: { value: "", status: "info" },
      h1: { value: "", status: "info" },
      h2h6Frequency: { h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
      wordCount: { value: 0, status: "info" },
      technicalChecks: [],
    },
    uxConversion: {
      score: "C",
      heading: "",
      text: "",
      findings: [],
      summary: "",
    },
    usability: {
      score: "C",
      heading: "",
      text: "",
      mobilePageSpeed: 0,
      desktopPageSpeed: 0,
      coreWebVitals: "info",
      viewport: "info",
      pageSpeedStatus: "info",
    },
    leistung: {
      score: "C",
      heading: "",
      text: "",
      serverResponseTime: 0,
      contentLoadTime: 0,
      scriptLoadTime: 0,
      resources: { html: 0, js: 0, css: 0, img: 0, other: 0, total: 0 },
      jsErrors: "info",
      http2: "info",
      imagesOptimized: "info",
      minified: "info",
    },
    social: { score: "F", heading: "", text: "", checks: [] },
    lokalesSeo: {
      score: "C",
      heading: "",
      text: "",
      businessSchema: "info",
      gbpIdentified: "info",
      gbpCompleteness: "info",
      reviewsStatus: "info",
    },
    links: {
      score: "F",
      heading: "",
      text: "",
      domainStrength: 0,
      pageStrength: 0,
      totalBacklinks: 0,
      referringDomains: 0,
      nofollow: 0,
      dofollow: 0,
      subnets: 0,
      ips: 0,
      govBacklinks: 0,
      topBacklinks: [],
      topPages: [],
      topAnchors: [],
      topTlds: [],
      topCountries: [],
      internalLinks: 0,
    },
  };
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const url = String(form.get("url") ?? "").trim();
  const projectName = String(form.get("projectName") ?? "").trim() || url;
  const screamingFrogFile = form.get("screamingFrog") as File | null;
  const seoptimerFile = form.get("seoptimer") as File | null;

  return ndjsonResponse(async (emit) => {
    if (!url) {
      throw new Error("URL fehlt");
    }

    const auditId = randomUUID();
    const now = new Date().toISOString();
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    let screamingFrog: ScreamingFrogData | undefined;
    let seoptimer: SeoptimerData | undefined;
    let pageSpeed: PageSpeedData | undefined;

    emit({
      type: "progress",
      label: "Audit gestartet",
      detail: normalizedUrl,
    });

    if (screamingFrogFile && screamingFrogFile.size > 0) {
      emit({
        type: "progress",
        label: "Screaming Frog CSV parsen",
        detail: screamingFrogFile.name,
      });
      const buf = Buffer.from(await screamingFrogFile.arrayBuffer());
      await saveUpload(auditId, screamingFrogFile.name, buf);
      screamingFrog = parseScreamingFrogCsv(buf.toString("utf8"));
      emit({
        type: "progress",
        label: "Screaming Frog fertig",
        detail: `${screamingFrog.issues.length} Probleme gefunden`,
      });
    }

    if (seoptimerFile && seoptimerFile.size > 0) {
      emit({
        type: "progress",
        label: "SEOptimer PDF parsen",
        detail: seoptimerFile.name,
      });
      const buf = Buffer.from(await seoptimerFile.arrayBuffer());
      await saveUpload(auditId, seoptimerFile.name, buf);
      try {
        seoptimer = await parseSeoptimerPdf(buf);
        emit({
          type: "progress",
          label: "SEOptimer fertig",
          detail: seoptimer.overallScore
            ? `Gesamtnote ${seoptimer.overallScore}`
            : `${seoptimer.recommendations.length} Empfehlungen`,
        });
      } catch (err) {
        emit({
          type: "warn",
          label: "SEOptimer Parse fehlgeschlagen",
          detail: (err as Error).message,
        });
      }
    }

    emit({ type: "progress", label: "Google PageSpeed abfragen" });
    try {
      pageSpeed = await fetchPageSpeed(normalizedUrl);
      emit({
        type: "progress",
        label: "PageSpeed fertig",
        detail: `Mobile ${pageSpeed.mobile.performanceScore}, Desktop ${pageSpeed.desktop.performanceScore}`,
      });
    } catch (err) {
      emit({
        type: "warn",
        label: "PageSpeed fehlgeschlagen",
        detail: (err as Error).message,
      });
    }

    emit({
      type: "progress",
      label: "Screenshots aufnehmen",
      detail: "Desktop, Mobile, Tablet",
    });
    let screenshots: AuditData["screenshots"] = {};
    try {
      screenshots = await captureScreenshots(auditId, normalizedUrl);
      emit({
        type: "progress",
        label: "Screenshots fertig",
        detail: Object.keys(screenshots).join(", "),
      });
    } catch (err) {
      emit({
        type: "warn",
        label: "Screenshots fehlgeschlagen",
        detail: (err as Error).message,
      });
    }

    const audit: AuditData = {
      id: auditId,
      createdAt: now,
      updatedAt: now,
      url: normalizedUrl,
      projectName,
      overallScore: "C",
      overallHeading: "Ihre Seite koennte besser sein",
      introText:
        "Dieser Bericht bewertet Ihre Website anhand wichtiger Faktoren wie On-Page-SEO, Off-Page-Backlinks, Social Media, Leistung und mehr.",
      sections: stub(),
      topRisks: [
        { title: "Platzhalter 1", description: "Wird vom Agent ersetzt" },
        { title: "Platzhalter 2", description: "Wird vom Agent ersetzt" },
        { title: "Platzhalter 3", description: "Wird vom Agent ersetzt" },
      ],
      recommendations: [],
      screenshots,
      rawInputs: { screamingFrog, seoptimer, pageSpeed },
    };

    await saveAudit(audit);
    emit({ type: "progress", label: "Audit gespeichert" });
    emit({ type: "result", data: { auditId } });
  });
}
