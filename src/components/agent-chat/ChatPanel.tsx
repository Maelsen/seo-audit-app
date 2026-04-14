"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { readNdjson } from "./stream-parser";
import type { ChatContext, MessageView, StoredMessage, AppliedChange, ToolCallView } from "./types";

const SESSION_STORAGE_KEY = "agent-chat-session-id";

function generateSessionId(): string {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function storedToView(messages: StoredMessage[]): MessageView[] {
  const views: MessageView[] = [];
  const toolResults: Record<string, { content: string; isError: boolean }> = {};

  for (const m of messages) {
    if (m.role === "user") {
      for (const block of m.content) {
        if (block.type === "tool_result") {
          const content =
            typeof block.content === "string"
              ? block.content
              : Array.isArray(block.content)
                ? block.content
                    .map((b) => (b.type === "text" ? b.text : ""))
                    .join("")
                : "";
          toolResults[block.tool_use_id] = {
            content,
            isError: Boolean(block.is_error),
          };
        }
      }
    }
  }

  for (const m of messages) {
    const texts: string[] = [];
    const toolCalls: ToolCallView[] = [];
    const images: string[] = [];
    let hasUserContent = false;

    for (const block of m.content) {
      if (block.type === "text") {
        if (block.text.trim().length > 0) {
          texts.push(block.text);
          hasUserContent = true;
        }
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
          result: toolResults[block.id],
        });
      } else if (block.type === "image") {
        const src = block.source;
        if (src.type === "base64") {
          images.push(`data:${src.media_type};base64,${src.data}`);
        }
        hasUserContent = true;
      } else if (block.type === "tool_result") {
        // Already captured as result on tool_use blocks; don't render as a bubble.
      }
    }

    if (m.role === "user" && !hasUserContent) continue;
    if (m.role === "assistant" && texts.length === 0 && toolCalls.length === 0)
      continue;

    views.push({
      role: m.role,
      timestamp: m.timestamp,
      texts,
      toolCalls,
      toolResultsFor: toolResults,
      images,
    });
  }
  return views;
}

type Props = {
  context: ChatContext;
  onClose: () => void;
  onChangesApplied?: () => void;
};

export function ChatPanel({ context, onClose, onChangesApplied }: Props): ReactElement {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [appliedChanges, setAppliedChanges] = useState<AppliedChange[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = generateSessionId();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    setSessionId(id);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/agent/sessions/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const stored: StoredMessage[] = data.messages ?? [];
      setMessages(storedToView(stored));
      setAppliedChanges(data.appliedChanges ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (sessionId) void loadSession(sessionId);
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isRunning]);

  function newChat() {
    const id = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
    setSessionId(id);
    setMessages([]);
    setAppliedChanges([]);
    setError(null);
  }

  async function sendMessage(text: string, imageUrls: string[]) {
    if (!sessionId) return;
    setError(null);
    setIsRunning(true);

    const userBlocks: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
    > = [];
    for (const url of imageUrls) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        userBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1],
            data: match[2],
          },
        });
      }
    }
    if (text.trim().length > 0) {
      userBlocks.push({ type: "text", text });
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        timestamp: new Date().toISOString(),
        texts: text.trim().length > 0 ? [text] : [],
        toolCalls: [],
        toolResultsFor: {},
        images: imageUrls,
      },
    ]);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, context, content: userBlocks }),
      });
      for await (const event of readNdjson(res)) {
        if (event.type === "error") {
          setError(event.message);
        } else if (event.type === "result") {
          await loadSession(sessionId);
          if (event.data.appliedChanges.length > 0) {
            onChangesApplied?.();
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  }

  async function undoLast() {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/agent/undo/${sessionId}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Undo fehlgeschlagen" }));
        setError(data.error ?? "Undo fehlgeschlagen");
        return;
      }
      await loadSession(sessionId);
      onChangesApplied?.();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0a0a0a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#0f0f0f",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#38E1E1" }}>
          AI Agent
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>
          {context.location ? `(${context.location})` : ""}
        </div>
        <button
          type="button"
          onClick={newChat}
          title="Neuer Chat"
          style={{
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#9ca3af",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          + Neu
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: 18,
            cursor: "pointer",
            padding: 0,
            width: 24,
          }}
        >
          ×
        </button>
      </div>
      <div
        ref={scrollRef}
        style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <MessageList
          messages={messages}
          isRunning={isRunning}
          error={error}
          appliedChanges={appliedChanges}
          onUndo={undoLast}
        />
      </div>
      <MessageInput disabled={isRunning || !sessionId} onSend={sendMessage} />
    </div>
  );
}
