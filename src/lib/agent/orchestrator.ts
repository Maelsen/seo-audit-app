import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { auditSchema, type AuditSchema } from "./schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { ScreamingFrogData } from "../parsers/screaming-frog";
import type { SeoptimerData } from "../parsers/seoptimer";
import type { PageSpeedData } from "../parsers/pagespeed";
import { loadStyleProfile } from "../storage";

const MODEL = "claude-sonnet-4-5";
const TOOL_NAME = "submit_audit";

export type AgentInput = {
  url: string;
  screamingFrog?: ScreamingFrogData;
  seoptimer?: SeoptimerData;
  pageSpeed?: PageSpeedData;
  screenshotBase64?: string;
  mobileScreenshotBase64?: string;
};

export type AgentProgress = (label: string, detail?: string) => void;

function buildToolDataText(input: AgentInput): string {
  const parts: string[] = [];

  if (input.screamingFrog) {
    parts.push("## Screaming Frog Report");
    parts.push(`Total issues: ${input.screamingFrog.issues.length}`);
    parts.push("Top Issues:");
    input.screamingFrog.issues.slice(0, 30).forEach((i) => {
      parts.push(
        `- [${i.issuePriority}] ${i.issueName} (${i.urls} URLs, ${i.percentOfTotal}%)`,
      );
    });
    parts.push("Totals:");
    parts.push(JSON.stringify(input.screamingFrog.totals, null, 2));
    parts.push("");
  }

  if (input.seoptimer) {
    parts.push("## SEOptimer Report");
    if (input.seoptimer.overallScore)
      parts.push(`Overall score: ${input.seoptimer.overallScore}`);
    if (input.seoptimer.recommendationCount)
      parts.push(`Recommendations: ${input.seoptimer.recommendationCount}`);
    if (input.seoptimer.recommendations.length) {
      parts.push("Recommendations list:");
      input.seoptimer.recommendations.forEach((r) => {
        parts.push(`- [${r.priority}] ${r.title}`);
      });
    }
    const excerpt = input.seoptimer.rawText
      .split(/\n/)
      .filter((l) => l.trim())
      .slice(0, 200)
      .join("\n");
    parts.push("Raw text excerpt:");
    parts.push(excerpt);
    parts.push("");
  }

  if (input.pageSpeed) {
    parts.push("## Google PageSpeed Insights");
    parts.push(`Mobile Performance Score: ${input.pageSpeed.mobile.performanceScore}`);
    parts.push(`Desktop Performance Score: ${input.pageSpeed.desktop.performanceScore}`);
    if (input.pageSpeed.mobile.lcp)
      parts.push(`Mobile LCP: ${(input.pageSpeed.mobile.lcp / 1000).toFixed(1)}s`);
    if (input.pageSpeed.mobile.cls !== undefined)
      parts.push(`Mobile CLS: ${input.pageSpeed.mobile.cls}`);
    if (input.pageSpeed.mobile.ttfb)
      parts.push(`Mobile TTFB: ${(input.pageSpeed.mobile.ttfb / 1000).toFixed(2)}s`);
    parts.push("");
  }

  return parts.join("\n");
}

export async function runAgent(
  input: AgentInput,
  onProgress?: AgentProgress,
): Promise<AuditSchema> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const client = new Anthropic({ apiKey });

  onProgress?.("Style Profile laden");
  const styleProfile = await loadStyleProfile();
  const toolData = buildToolDataText(input);
  const userText = buildUserPrompt({
    url: input.url,
    toolData,
    styleProfile,
  });

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];
  if (input.screenshotBase64) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: input.screenshotBase64,
      },
    });
    contentBlocks.push({
      type: "text",
      text: "Das ist der Desktop-Screenshot der Website. Bewerte Design, CTAs, Navigation, Vertrauen im Abschnitt uxConversion.",
    });
  }
  if (input.mobileScreenshotBase64) {
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: input.mobileScreenshotBase64,
      },
    });
    contentBlocks.push({
      type: "text",
      text: "Das ist der Mobile-Screenshot der Website. Beachte die Mobile-Optimierung.",
    });
  }
  contentBlocks.push({ type: "text", text: userText });

  const jsonSchema = z.toJSONSchema(auditSchema, {
    target: "draft-7",
    unrepresentable: "any",
  });

  onProgress?.("Claude Agent gestartet", `Model ${MODEL}`);

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Gibt den vollständigen strukturierten SEO-Audit-Report zurück. Muss exakt dem Input-Schema entsprechen. Alle Felder müssen befüllt sein, bei fehlenden Daten sinnvolle Defaults (0 bei Zahlen, leerer String nur wenn wirklich unbekannt).",
        input_schema: jsonSchema as Anthropic.Messages.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: contentBlocks }],
  });

  let lastTick = Date.now();
  let bytesSoFar = 0;
  stream.on("inputJson", (delta: string) => {
    bytesSoFar += delta.length;
    const now = Date.now();
    if (now - lastTick > 700) {
      lastTick = now;
      onProgress?.(
        "Claude schreibt Report",
        `${Math.round(bytesSoFar / 1024)} kB empfangen`,
      );
    }
  });
  stream.on("text", (delta: string) => {
    bytesSoFar += delta.length;
    const now = Date.now();
    if (now - lastTick > 700) {
      lastTick = now;
      onProgress?.("Claude denkt nach", `${bytesSoFar} Zeichen`);
    }
  });

  const finalMessage = await stream.finalMessage();
  onProgress?.(
    "Claude Antwort erhalten",
    `${finalMessage.usage.input_tokens} in, ${finalMessage.usage.output_tokens} out`,
  );

  const toolUse = finalMessage.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Agent returned no tool_use response");
  }

  onProgress?.("Output gegen Schema prüfen");
  const result = auditSchema.safeParse(toolUse.input);
  if (!result.success) {
    throw new Error(
      `Agent output failed schema validation: ${result.error.message}`,
    );
  }
  return result.data;
}
