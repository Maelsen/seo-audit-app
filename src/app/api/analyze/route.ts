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

    const recommendationsWithIds: Recommendation[] = result.recommendations.map(
      (r) => ({
        id: randomUUID(),
        title: r.title,
        priority: r.priority,
        text: r.text,
      }),
    );

    const updated: AuditData = {
      ...audit,
      overallScore: result.overallScore,
      overallHeading: result.overallHeading,
      introText: result.introText,
      sections: result.sections,
      topRisks: result.topRisks,
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
