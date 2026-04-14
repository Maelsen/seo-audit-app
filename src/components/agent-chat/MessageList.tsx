"use client";

import type { ReactElement } from "react";
import type { MessageView, AppliedChange } from "./types";
import { ToolCallBadge } from "./ToolCallBadge";

type Props = {
  messages: MessageView[];
  isRunning: boolean;
  error: string | null;
  appliedChanges: AppliedChange[];
  onUndo: () => void;
};

export function MessageList({
  messages,
  isRunning,
  error,
  appliedChanges,
  onUndo,
}: Props): ReactElement {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {messages.length === 0 && !isRunning && (
        <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: 20 }}>
          Sag dem Agent was du brauchst.
          <br />
          Z.B. &quot;zeig mir die Landing-Page&quot; oder &quot;mach den Footer fett&quot;.
        </div>
      )}
      {messages.map((m, i) => (
        <MessageBubble key={i} message={m} />
      ))}
      {isRunning && (
        <div style={{ color: "#38E1E1", fontSize: 12, padding: 6 }}>
          Agent arbeitet...
        </div>
      )}
      {error && (
        <div
          style={{
            color: "#fca5a5",
            background: "#2a0f0f",
            borderLeft: "3px solid #ef4444",
            padding: 8,
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {appliedChanges.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #2a2a2a",
            paddingTop: 8,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          <div style={{ marginBottom: 4 }}>
            {appliedChanges.length} Aenderung{appliedChanges.length === 1 ? "" : "en"} in dieser Session:
          </div>
          <ul style={{ margin: 0, paddingLeft: 14 }}>
            {appliedChanges.map((c, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <span style={{ color: "#6ee7e7" }}>{c.action}</span> {c.path}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onUndo}
            style={{
              marginTop: 6,
              background: "#1a1a1a",
              color: "#fbbf24",
              border: "1px solid #fbbf2440",
              padding: "4px 8px",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Letzte Aenderung rueckgaengig
          </button>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: MessageView }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "90%",
        background: isUser ? "#0f2a2a" : "#1a1a1a",
        border: `1px solid ${isUser ? "#1a4a4a" : "#2a2a2a"}`,
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        color: "#e5e7eb",
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {message.images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt=""
          style={{
            maxWidth: "100%",
            borderRadius: 4,
            marginBottom: 6,
            display: "block",
          }}
        />
      ))}
      {message.texts.map((t, i) => (
        <div key={i} style={{ marginBottom: i < message.texts.length - 1 ? 6 : 0 }}>
          {t}
        </div>
      ))}
      {message.toolCalls.map((c) => (
        <ToolCallBadge
          key={c.id}
          call={{
            ...c,
            result: message.toolResultsFor[c.id] ?? c.result,
          }}
        />
      ))}
    </div>
  );
}
