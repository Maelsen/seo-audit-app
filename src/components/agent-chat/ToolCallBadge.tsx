"use client";

import { useState, type ReactElement } from "react";
import type { ToolCallView } from "./types";

type Props = { call: ToolCallView };

export function ToolCallBadge({ call }: Props): ReactElement {
  const [open, setOpen] = useState(false);
  const inputStr = JSON.stringify(call.input, null, 2);
  const result = call.result;
  const isError = result?.isError;
  const color = isError ? "#ef4444" : result ? "#38E1E1" : "#888";
  return (
    <div
      style={{
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 4,
        padding: "6px 8px",
        margin: "6px 0",
        background: "#0d0d0d",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 11,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          color,
          cursor: "pointer",
          padding: 0,
          fontSize: 11,
          fontFamily: "inherit",
          textAlign: "left",
          width: "100%",
        }}
      >
        {open ? "▾" : "▸"} {call.name}
        {result && !isError && " ✓"}
        {isError && " ✗"}
        {!result && " …"}
      </button>
      {open && (
        <div style={{ marginTop: 6, color: "#9ca3af" }}>
          <div style={{ color: "#6ee7e7", marginBottom: 4 }}>Input:</div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 150,
              overflow: "auto",
              background: "#1a1a1a",
              padding: 6,
              borderRadius: 3,
            }}
          >
            {inputStr}
          </pre>
          {result && (
            <>
              <div style={{ color: isError ? "#fca5a5" : "#6ee7e7", margin: "6px 0 4px" }}>
                Result{isError ? " (Fehler)" : ""}:
              </div>
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 200,
                  overflow: "auto",
                  background: "#1a1a1a",
                  padding: 6,
                  borderRadius: 3,
                  color: isError ? "#fca5a5" : "#d4d4d4",
                }}
              >
                {result.content}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
