import Anthropic from "@anthropic-ai/sdk";
import {
  loadEdits,
  loadStyleProfile,
  saveStyleProfile,
} from "../storage";
import type { EditEntry, StyleProfile } from "../types";

const MODEL = "claude-sonnet-4-5";
const TOOL_NAME = "update_style_profile";
const MAX_LEARNINGS = 12;

const SYSTEM_PROMPT = `Du bist ein Style-Extractor. Deine Aufgabe ist aus Edit-Diffs (Original-AI-Vorschlag vs. Vasileios' editierte Version) Muster abzuleiten die beschreiben wie Vasileios Mavridis (SEO-Berater bei Artistic Avenue) schreibt und bewertet.

Arbeitsweise:
1. Für jeden neuen Edit überlegst du was sich konkret geändert hat und WARUM. Was ist das Delta zwischen AI-Vorschlag und Vasileios' Version? Ist es Ton, Länge, Schärfe der Bewertung, Konkretheit, Reihenfolge, Wortwahl?
2. Du prüfst ob der Edit ein neues Muster zeigt oder ein bestehendes Learning bestätigt.
3. Du verfeinerst oder ergänzt die bestehende Learnings-Liste. Einzelfälle sind noch keine Regel. Eine Regel entsteht wenn sich ein Muster wiederholt oder mit einem bestehenden Learning deckt.
4. Widersprüchliche oder veraltete Learnings entfernst oder milderst du ab.

Learnings sind knappe deutsche Sätze die eine Präferenz beschreiben. Beispiele:
- "Vasileios bewertet Conversion strenger und gibt meist eine Note schlechter als die AI-Baseline"
- "Er benennt Elemente konkret (Kontaktformular, CTA-Button) statt generisch"
- "Er kürzt lange Einleitungssätze und kommt direkt zum Punkt"
- "Bei Local SEO betont er NAP-Konsistenz als wichtigstes Kriterium"

Du rufst immer genau einmal das update_style_profile Tool auf mit der vollständigen neuen Learnings-Liste und einer kurzen Reasoning-Zusammenfassung.`;

function formatEdits(edits: EditEntry[]): string {
  return edits
    .map(
      (e, idx) =>
        `### Edit ${idx + 1} — ${e.section} / ${e.field}
Original AI Vorschlag:
${e.originalValue}

Editierte Version von Vasileios:
${e.editedValue}`,
    )
    .join("\n\n---\n\n");
}

export async function extractAndUpdateStyleProfile(): Promise<StyleProfile> {
  const edits = await loadEdits();
  const current = await loadStyleProfile();

  const processedUpTo = current.lastProcessedEditIndex ?? 0;
  const newEdits = edits.slice(processedUpTo);
  if (newEdits.length === 0) {
    return current;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return current;
  }
  const client = new Anthropic({ apiKey });

  const existingList =
    current.learnings.length > 0
      ? current.learnings.map((l, i) => `${i + 1}. ${l}`).join("\n")
      : "(noch keine Learnings)";

  const userText = `Bestehende Learnings:
${existingList}

${newEdits.length} neue Edits seit der letzten Auswertung:

${formatEdits(newEdits)}

Aufgabe:
1. Überlege für jeden neuen Edit das Delta und warum Vasileios das geändert hat.
2. Prüfe ob das ein neues Muster zeigt oder ein bestehendes Learning bestätigt.
3. Gib die vollständige neue Learnings-Liste zurück (bestehende + neue + verfeinerte, nach Wichtigkeit sortiert, maximal ${MAX_LEARNINGS}).
4. Schreibe in reasoning kurz in 2-3 Sätzen was der Kern der Änderung war.

Rufe das update_style_profile Tool auf.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Aktualisiert das Style Profile von Vasileios mit verfeinerten Learnings und einer Reasoning-Zusammenfassung.",
        input_schema: {
          type: "object",
          properties: {
            reasoning: {
              type: "string",
              description:
                "Kurze Zusammenfassung (2-3 Sätze) was du in den neuen Edits gesehen hast und warum du die Learnings so aktualisiert hast.",
            },
            learnings: {
              type: "array",
              items: { type: "string" },
              description: `Vollständige neue Learnings-Liste, nach Wichtigkeit sortiert. Maximal ${MAX_LEARNINGS} Einträge. Jedes Learning ist ein knapper deutscher Satz.`,
            },
          },
          required: ["reasoning", "learnings"],
        },
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: userText }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return current;
  }

  const input = toolUse.input as {
    reasoning?: string;
    learnings?: unknown;
  };
  const learnings = Array.isArray(input.learnings)
    ? (input.learnings.filter((x) => typeof x === "string") as string[]).slice(
        0,
        MAX_LEARNINGS,
      )
    : current.learnings;

  const updated: StyleProfile = {
    updatedAt: new Date().toISOString(),
    totalEdits: edits.length,
    lastProcessedEditIndex: edits.length,
    learnings,
    lastReasoning:
      typeof input.reasoning === "string" ? input.reasoning : undefined,
    explicitTips: current.explicitTips,
  };
  await saveStyleProfile(updated);
  return updated;
}

export async function addExplicitTip(tip: string): Promise<StyleProfile> {
  const profile = await loadStyleProfile();
  profile.explicitTips.push(tip);
  profile.updatedAt = new Date().toISOString();
  await saveStyleProfile(profile);
  return profile;
}
