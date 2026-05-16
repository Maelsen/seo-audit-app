import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { loadAudit, readScreenshot, saveAudit } from "@/lib/storage";
import { runAgent } from "@/lib/agent/orchestrator";
import { ndjsonResponse } from "@/lib/stream";
import type { ScreamingFrogData } from "@/lib/parsers/screaming-frog";
import type { SeoptimerData } from "@/lib/parsers/seoptimer";
import type { PageSpeedData } from "@/lib/parsers/pagespeed";
import type { AuditData, Recommendation } from "@/lib/types";

export const maxDuration = 300;

// Default-Placeholder die NIE im finalen Report stehen duerfen. Der Prompt
// (src/lib/agent/prompts.ts) verspricht der AI eine Backend-Ablehnung —
// assertNoPlaceholders() macht dieses Versprechen wahr (Bug 2 full-fidelity).
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /Die Diagnose wird vom Agent generiert/i,
  /Wird vom Agent ersetzt/i,
  /Platzhalter \d/i,
];

function assertNoPlaceholders(result: unknown): void {
  const json = JSON.stringify(result);
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = json.match(pattern);
    if (match) {
      throw new Error(
        `AI-Report enthaelt noch einen Default-Placeholder ("${match[0]}") — Report abgelehnt.`,
      );
    }
  }
}

export async function POST(req: NextRequest) {
  const { auditId } = await req.json();

  return ndjsonResponse(async (emit) => {
    if (!auditId) {
      throw new Error("auditId fehlt");
    }
    emit({ type: "progress", label: "Audit aus Storage laden" });
    const audit = await loadAudit(auditId);
    if (!audit) {
      throw new Error("Audit nicht gefunden");
    }

    emit({ type: "progress", label: "Screenshots für Vision laden" });
    const [coverBuf, mobileBuf] = await Promise.all([
      readScreenshot(auditId, "cover"),
      readScreenshot(auditId, "mobile"),
    ]);

    const result = await runAgent(
      {
        url: audit.url,
        screamingFrog: audit.rawInputs?.screamingFrog as
          | ScreamingFrogData
          | undefined,
        seoptimer: audit.rawInputs?.seoptimer as SeoptimerData | undefined,
        pageSpeed: audit.rawInputs?.pageSpeed as PageSpeedData | undefined,
        screenshotBase64: coverBuf?.toString("base64"),
        mobileScreenshotBase64: mobileBuf?.toString("base64"),
      },
      (label, detail) => emit({ type: "progress", label, detail }),
    );

    assertNoPlaceholders(result);

    const recommendationsWithIds: Recommendation[] = result.recommendations.map(
      (r) => ({
        id: randomUUID(),
        title: r.title,
        priority: r.priority,
        text: r.text,
      }),
    );

    // Merge ALLE AI-generierten Felder. Vorher fehlten diagnosisText,
    // comparison, phasenplan, summary, inhaber → die Defaults aus
    // upload/route.ts blieben stehen (Bug 2 + 5 aus full-fidelity-test).
    const updated: AuditData = {
      ...audit,
      overallScore: result.overallScore,
      overallHeading: result.overallHeading,
      introText: result.introText,
      diagnosisText: result.diagnosisText,
      sections: result.sections,
      topRisks: result.topRisks,
      comparison: result.comparison,
      phasenplan: result.phasenplan,
      summary: result.summary,
      // inhaber: nur ueberschreiben wenn AI body/outroItalic/ps gesetzt hat —
      // sonst bleiben die Vasileios-Defaults aus defaultInhaber() erhalten
      inhaber: {
        ...audit.inhaber,
        ...(result.inhaber.body ? { body: result.inhaber.body } : {}),
        ...(result.inhaber.outroItalic
          ? { outroItalic: result.inhaber.outroItalic }
          : {}),
        ...(result.inhaber.ps ? { ps: result.inhaber.ps } : {}),
      },
      recommendations: recommendationsWithIds,
      updatedAt: new Date().toISOString(),
      originalAi: JSON.stringify(result),
    };

    emit({ type: "progress", label: "Audit mit AI-Ergebnis speichern" });
    await saveAudit(updated);

    emit({
      type: "progress",
      label: "Fertig",
      detail: `${result.recommendations.length} Empfehlungen, ${result.topRisks.length} Top Risiken`,
    });
    emit({ type: "result", data: { auditId } });
  });
}
