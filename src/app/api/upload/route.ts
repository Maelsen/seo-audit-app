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
import type {
  AuditData,
  ComparisonSection,
  InhaberSection,
  PhasenplanSection,
  SectionBase,
  SummarySection,
} from "@/lib/types";

export const maxDuration = 300;

function emptySectionBase(): SectionBase {
  return {
    score: "C",
    heading: "",
    text: "",
    findings: [],
    costText: "",
    actions: [],
  };
}

function stub(): AuditData["sections"] {
  return {
    onpageSeo: {
      ...emptySectionBase(),
      serpPreview: { title: "", url: "", description: "" },
      h2h6Frequency: { h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
    },
    uxConversion: emptySectionBase(),
    seitenstrukturContent: emptySectionBase(),
    lokalesSeo: emptySectionBase(),
    leistung: {
      ...emptySectionBase(),
      serverResponseTime: 0,
      contentLoadTime: 0,
      scriptLoadTime: 0,
      resourceCounts: { html: 0, js: 0, css: 0, img: 0, other: 0, total: 0 },
      pageSizeMb: 0,
      pageSizeBreakdown: { html: 0, js: 0, css: 0, img: 0, other: 0 },
    },
    links: {
      ...emptySectionBase(),
      score: "F",
      domainStrength: 0,
      pageStrength: 0,
      totalBacklinks: 0,
      referringDomains: 0,
      nofollow: 0,
      dofollow: 0,
      subnets: 0,
      ips: 0,
      govBacklinks: 0,
    },
  };
}

function emptyComparison(): ComparisonSection {
  return { heading: "", altSentences: [], rows: [] };
}

function emptyPhasenplan(): PhasenplanSection {
  return {
    intro: "",
    phase1: { title: "Phase 1 - Sofortmassnahmen (Woche 1-2)", entries: [] },
    phase2: { title: "Phase 2 - Conversion & Sichtbarkeit (Monat 1)", entries: [] },
    phase3: { title: "Phase 3 - Reichweite ausbauen (Monat 2-3)", entries: [] },
    afterPhase1: "",
    afterPhase2: "",
    afterPhase3: "",
  };
}

function emptySummary(): SummarySection {
  return {
    heading: "Zusammenfassung & naechster Schritt",
    subline: "",
    topIssues: [],
    closingHeadline: "Das ist loesbar",
    closingSubline: "und zwar schneller als du denkst.",
    closingBody: "",
    ctaCyan: "Der naechste Schritt liegt bei dir.",
    ctaBold: "Lass uns das gemeinsam angehen!",
  };
}

function defaultInhaber(): InhaberSection {
  return {
    thankYou: "Vielen Dank fuer Ihre Zeit!",
    body: "",
    outroItalic: "",
    ps: "",
    name: "Vasilis Mavridis",
    role: "Inhaber von Artistic Avenue",
    photo: "/assets/vasilis.png",
    phone: "+49 179 3213 445",
    email: "info@artisticavenue.de",
    website: "www.artisticavenue.de",
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

    // Defaults: KEINE Placeholder-Strings. Wenn AI diese Felder nicht setzt,
    // bleiben sie leer und rendern als visuelle Luecke (statt "Platzhalter 1"
    // ins finale PDF zu leaken). Vorher leak-bug aus full-fidelity-test
    // (Bug 2 + 5): Defaults wie "Die Diagnose wird vom Agent generiert" und
    // "Platzhalter X" landeten im AI-output Audit wenn AI das submit_audit
    // Tool ohne diese Felder aufgerufen hat.
    const audit: AuditData = {
      id: auditId,
      createdAt: now,
      updatedAt: now,
      url: normalizedUrl,
      projectName,
      overallScore: "C",
      overallHeading: "",
      introText: "",
      diagnosisText: "",
      sections: stub(),
      topRisks: [],
      comparison: emptyComparison(),
      phasenplan: emptyPhasenplan(),
      summary: emptySummary(),
      inhaber: defaultInhaber(),
      recommendations: [],
      screenshots,
      rawInputs: { screamingFrog, seoptimer, pageSpeed },
    };

    await saveAudit(audit);
    emit({ type: "progress", label: "Audit gespeichert" });
    emit({ type: "result", data: { auditId } });
  });
}
