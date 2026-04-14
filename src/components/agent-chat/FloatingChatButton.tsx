"use client";

import { useState, type ReactElement } from "react";
import { ChatPanel } from "./ChatPanel";
import { useAgentContext } from "./context-store";

export function FloatingChatButton(): ReactElement {
  const [open, setOpen] = useState(false);
  const context = useAgentContext();

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="AI Agent oeffnen"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#38E1E1",
            color: "#0d0d0d",
            border: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            cursor: "pointer",
            fontSize: 20,
            fontWeight: "bold",
            zIndex: 9998,
          }}
        >
          AI
        </button>
      )}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(420px, 95vw)",
            background: "#0a0a0a",
            borderLeft: "1px solid #2a2a2a",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          <ChatPanel context={context} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
