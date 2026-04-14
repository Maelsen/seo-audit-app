"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type ProgressItem = {
  kind: "progress" | "warn";
  label: string;
  detail?: string;
  at: number;
};

type StreamEvent =
  | { type: "progress"; label: string; detail?: string }
  | { type: "warn"; label: string; detail?: string }
  | { type: "error"; message: string }
  | { type: "result"; data: { auditId: string } };

async function* readNdjson(
  response: Response,
): AsyncGenerator<StreamEvent, void, void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        yield JSON.parse(line) as StreamEvent;
      } catch {
        // ignore malformed lines
      }
    }
  }
  const rest = buffer.trim();
  if (rest) {
    try {
      yield JSON.parse(rest) as StreamEvent;
    } catch {
      // ignore
    }
  }
}

export default function LandingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [error, setError] = useState<string>("");

  function push(item: ProgressItem) {
    setProgress((prev) => [...prev, item]);
  }

  async function runStream(
    response: Response,
    onResult: (data: { auditId: string }) => void,
  ) {
    if (!response.ok && response.headers.get("content-type")?.includes("json")) {
      const err = await response.json();
      throw new Error(err.error || "Request failed");
    }
    for await (const event of readNdjson(response)) {
      if (event.type === "progress") {
        push({
          kind: "progress",
          label: event.label,
          detail: event.detail,
          at: Date.now(),
        });
      } else if (event.type === "warn") {
        push({
          kind: "warn",
          label: event.label,
          detail: event.detail,
          at: Date.now(),
        });
      } else if (event.type === "error") {
        throw new Error(event.message);
      } else if (event.type === "result") {
        onResult(event.data);
      }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setProgress([]);
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      let auditId = "";
      await runStream(uploadRes, (data) => {
        auditId = data.auditId;
      });
      if (!auditId) throw new Error("Upload lieferte keine auditId");

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      await runStream(analyzeRes, () => {});

      router.push(`/audit/${auditId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "60px 20px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              letterSpacing: 2,
              color: "#ffffff",
            }}
          >
            <span style={{ color: "#38E1E1" }}>A</span>RTISTIC{" "}
            <span style={{ color: "#38E1E1" }}>A</span>VENUE
          </div>
          <h1 style={{ fontSize: 32, marginTop: 16, marginBottom: 8 }}>
            SEO Audit erstellen
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            URL eingeben, Exporte hochladen, AI macht den Rest
          </p>
          <p style={{ marginTop: 12, fontSize: 13 }}>
            <a href="/editor" style={{ color: "#38E1E1", textDecoration: "none" }}>
              Template-Editor öffnen →
            </a>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#1a1a1a",
            padding: 32,
            borderRadius: 12,
            border: "1px solid #2a2a2a",
          }}
        >
          <Field label="Projekt-Name">
            <input
              name="projectName"
              placeholder="z.B. homeraum-immobilien.de - April 2026"
              style={inputStyle}
            />
          </Field>

          <Field label="Website URL">
            <input
              name="url"
              required
              placeholder="https://www.homeraum-immobilien.de"
              style={inputStyle}
            />
          </Field>

          <Field label="Screaming Frog CSV">
            <input
              type="file"
              name="screamingFrog"
              accept=".csv"
              style={fileStyle}
            />
          </Field>

          <Field label="SEOptimer PDF (optional)">
            <input
              type="file"
              name="seoptimer"
              accept=".pdf"
              style={fileStyle}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 24,
              width: "100%",
              padding: "14px 20px",
              background: submitting ? "#2a2a2a" : "#38E1E1",
              color: submitting ? "#6b7280" : "#0d0d0d",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: "bold",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Audit läuft ..." : "Audit erstellen"}
          </button>

          {progress.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#0f2a2a",
                border: "1px solid #1a4a4a",
                borderLeft: "3px solid #38E1E1",
                borderRadius: 4,
                maxHeight: 260,
                overflowY: "auto",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              {progress.map((p, i) => {
                const isLast = i === progress.length - 1;
                const color =
                  p.kind === "warn"
                    ? "#fbbf24"
                    : isLast && submitting
                      ? "#38E1E1"
                      : "#6ee7e7";
                return (
                  <div key={i} style={{ color, marginBottom: 2 }}>
                    {isLast && submitting ? "> " : "  "}
                    {p.label}
                    {p.detail && (
                      <span style={{ color: "#5a8a8a" }}>  — {p.detail}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: "#2a0f0f",
                borderLeft: "3px solid #ef4444",
                color: "#fca5a5",
                fontSize: 13,
                borderRadius: 4,
              }}
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "#d4d4d4",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0d0d0d",
  border: "1px solid #333",
  borderRadius: 6,
  color: "#ffffff",
  fontSize: 14,
};

const fileStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0d0d0d",
  border: "1px dashed #333",
  borderRadius: 6,
  color: "#9ca3af",
  fontSize: 13,
};
