import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool, type ToolContext, type Attachment } from "./tools";
import { loadSession, saveSession, newSession } from "./session-storage";
import type {
  AppliedChange,
  ChatContext,
  ChatSession,
  StoredMessage,
} from "./chat-types";
import type { EmitFn } from "../stream";

const MODEL = "claude-sonnet-4-6";
const MAX_ITERATIONS = 50;
const MAX_TOKENS = 8000;

function buildSystemPrompt(context: ChatContext): string {
  const parts: string[] = [];
  parts.push(
    "Du bist ein AI-Agent, der direkt in die SEO-Audit-App von Artistic Avenue eingebaut ist.",
    "Du hast Zugriff auf die komplette Codebase (Next.js 16 + React 19 + TypeScript).",
    "Du kannst Dateien lesen, schreiben, bearbeiten und loeschen. Kein Shell-Zugriff.",
    "Jede Schreib-Aenderung wird automatisch gebackuppt, der User kann Undo machen.",
    "",
    "Arbeitsweise:",
    "1. Erst verstehen: lies relevante Dateien bevor du etwas aenderst.",
    "2. Bei unklaren Requests nachfragen statt raten.",
    "3. Beim Editieren: edit_file bevorzugen (kleine Aenderungen), write_file nur fuer neue Dateien oder grosse Rewrites.",
    "4. Nie auf .env*, node_modules, .git oder data/agent-backups zugreifen (wird blockiert).",
    "5. Nach Aenderungen kurz erklaeren was gemacht wurde. Diffs werden dem User automatisch angezeigt.",
    "6. Nicht die ganze Codebase scannen, sei effizient mit Tool-Calls.",
    "",
    "Projekt-Struktur (WICHTIG, vor jeder Aenderung mitdenken):",
    "",
    "Die App hat DREI getrennte Render-Pfade. Du musst wissen welchen der User vor sich hat BEVOR du editierst.",
    "",
    "1) LANDING-PAGE (`/`)",
    "   - Datei: src/app/page.tsx",
    "   - Upload-Formular fuer neue Audits",
    "",
    "2) AUDIT-REVIEW (`/audit/[id]`)",
    "   - Datei: src/app/audit/[id]/page.tsx (Client-Component, inline styles)",
    "   - Zeigt Score-Kreise, Empfehlungen, Top-Risiken zum Editieren",
    "   - Schriftgroessen/Farben stehen als inline styles DIREKT in dieser Datei",
    "   - Wenn location=audit -> Aenderungen hier machen",
    "   - Hat NICHTS mit data/templates/ oder page-builders.ts zu tun",
    "",
    "3) PDF-TEMPLATE-SYSTEM (Editor + PDF-Export)",
    "   - Editor UI: src/app/editor/[templateId]/EditorClient.tsx",
    "   - Block-Views: src/lib/editor/blocks/*BlockView.tsx (rendert JSX fuer PDF)",
    "   - Template-JSON: data/templates/{id}.json (Positionen, Styles, Bindings)",
    "   - page-builders.ts: ZERLEGT legacy React-Pages in Template-Bloecke. Wirkt NUR wenn User im Editor 'Seite in Elemente aufteilen' klickt. Aendert NICHT die Live-Ansicht von irgendwas.",
    "   - pdf-template/*.tsx: Legacy React-Komponenten, werden per Puppeteer zu PDF gerendert",
    "   - Wenn location=editor -> meistens template JSON oder Block-Views editieren",
    "",
    "Entscheidungs-Regel:",
    "- location=audit UND User beschwert sich ueber was er sieht -> src/app/audit/[id]/page.tsx",
    "- location=editor UND User will Layout/Style im PDF-Preview -> Block-Views oder Template-JSON",
    "- Unsicher? Frag kurz nach oder les erst die Datei die zum Context passt",
    "",
    "Verbotene Aenderungen ohne explizite Aufforderung:",
    "- src/lib/agent/* (DU lebst hier)",
    "- package.json, next.config, tsconfig",
    "",
    "Attachments (hochgeladene Bilder):",
    "- Du SIEHST hochgeladene Bilder direkt im Chat (Vision).",
    "- Um sie zu SPEICHERN: list_attachments -> save_attachment(index, target_path).",
    "- Wenn der User 'speicher dieses Bild' oder 'nutze dieses Foto' sagt, frage nicht nach der Datei. Ruf list_attachments auf und speicher das letzte Attachment.",
    "- Typische Ziele: public/assets/, public/images/, src/components/pdf-template/assets/",
    "- Wenn du ein bestehendes Bild ersetzt, finde zuerst mit search_codebase wo der alte Pfad referenziert wird, und aendere den Code nur falls der neue Dateiname anders ist.",
    "",
    "Problemloesung wenn eine Aenderung nicht wirkt:",
    "- Denk wie ein Entwickler: wenn User sagt 'geht nicht' frag was er sieht, pruefe ob du die richtige Datei erwischt hast.",
    "- Es gibt oft mehrere aehnlich benannte Dateien (z.B. legacy pdf-template/ vs neuer editor/blocks/). Der Render-Pfad zaehlt.",
    "- Nutze search_codebase um zu verfolgen WO eine Komponente importiert und gerendert wird, bevor du sie aenderst.",
    "",
    "Sprache: Antworte auf Deutsch (Umgangssprache, keine Bindestriche/Doppelpunkte/Metaphern), der User heisst Vasileios.",
  );

  const ctxLines: string[] = [];
  if (context.location) ctxLines.push(`Aktueller Ort: ${context.location}`);
  if (context.templateId) ctxLines.push(`Template-ID: ${context.templateId}`);
  if (context.selectedPageId)
    ctxLines.push(`Ausgewaehlte Seite: ${context.selectedPageId}`);
  if (context.selectedBlockId)
    ctxLines.push(`Ausgewaehlter Block: ${context.selectedBlockId}`);
  if (context.auditId) ctxLines.push(`Audit-ID: ${context.auditId}`);
  if (ctxLines.length > 0) {
    parts.push("", "Aktueller User-Context:", ...ctxLines);
  }
  return parts.join("\n");
}

export type ChatInput = {
  sessionId: string;
  context: ChatContext;
  userContent: Anthropic.Messages.ContentBlockParam[];
};

export async function runChatTurn(
  input: ChatInput,
  emit: EmitFn,
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const client = new Anthropic({ apiKey });

  let session = await loadSession(input.sessionId);
  if (!session) {
    session = newSession(input.sessionId);
  }

  const userMessage: StoredMessage = {
    role: "user",
    content: input.userContent,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(userMessage);

  const attachments: Attachment[] = [];
  for (const m of session.messages) {
    if (m.role !== "user") continue;
    for (const block of m.content) {
      if (block.type === "image" && block.source.type === "base64") {
        attachments.push({
          index: attachments.length,
          mediaType: block.source.media_type,
          data: block.source.data,
          sizeBytes: Math.floor((block.source.data.length * 3) / 4),
        });
      }
    }
  }

  const system = buildSystemPrompt(input.context);
  const toolCtx: ToolContext = {
    sessionId: input.sessionId,
    appliedChanges: [],
    attachments,
  };

  emit({ type: "progress", label: "Agent startet", detail: MODEL });

  const apiMessages: Anthropic.Messages.MessageParam[] = session.messages.map(
    (m) => ({ role: m.role, content: m.content }),
  );

  let iteration = 0;
  while (iteration < MAX_ITERATIONS) {
    iteration += 1;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: AGENT_TOOLS,
      messages: apiMessages,
    });

    const assistantBlocks: Anthropic.Messages.ContentBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        assistantBlocks.push({ type: "text", text: block.text });
        if (block.text.trim().length > 0) {
          emit({ type: "progress", label: "agent_text", detail: block.text });
        }
      } else if (block.type === "tool_use") {
        assistantBlocks.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input,
        });
        emit({
          type: "progress",
          label: "tool_call",
          detail: JSON.stringify({ id: block.id, name: block.name, input: block.input }),
        });
      }
    }

    const assistantStored: StoredMessage = {
      role: "assistant",
      content: assistantBlocks,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(assistantStored);
    apiMessages.push({ role: "assistant", content: assistantBlocks });

    if (response.stop_reason !== "tool_use") {
      break;
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of toolUses) {
      if (block.type !== "tool_use") continue;
      const result = await executeTool(block.name, block.input, toolCtx);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.content,
        is_error: result.isError,
      });
      emit({
        type: "progress",
        label: "tool_result",
        detail: JSON.stringify({
          tool_use_id: block.id,
          isError: result.isError,
          preview: result.content.slice(0, 300),
        }),
      });
    }

    const userResultBlocks: Anthropic.Messages.ContentBlockParam[] = toolResults;
    const userResultStored: StoredMessage = {
      role: "user",
      content: userResultBlocks,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userResultStored);
    apiMessages.push({ role: "user", content: userResultBlocks });
  }

  session.updatedAt = new Date().toISOString();
  session.appliedChanges.push(...toolCtx.appliedChanges);
  await saveSession(session);

  emit({
    type: "result",
    data: {
      sessionId: session.id,
      iterations: iteration,
      appliedChanges: toolCtx.appliedChanges,
    },
  });
}

export type { ChatSession, AppliedChange };
