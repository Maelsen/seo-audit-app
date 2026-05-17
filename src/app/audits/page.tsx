"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AuditSummary } from "@/lib/types";
import { gradeColor } from "@/lib/grade";

export default function AuditsDashboardPage() {
  const [audits, setAudits] = useState<AuditSummary[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Laden fehlgeschlagen"))))
      .then((data: { audits: AuditSummary[] }) => setAudits(data.audits))
      .catch((e: Error) => {
        setError(e.message);
        setAudits([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!audits) return [];
    const q = query.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter(
      (a) =>
        a.projectName.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q),
    );
  }, [audits, query]);

  async function handleDelete(id: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/audit/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      setAudits((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
      setPendingDelete(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
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
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            <span style={{ color: "#38E1E1" }}>A</span>RTISTIC{" "}
            <span style={{ color: "#38E1E1" }}>A</span>VENUE
          </div>
          <h1 style={{ fontSize: 32, marginTop: 16, marginBottom: 8 }}>
            Audit-Übersicht
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            Alle bisher erstellten SEO-Audits wiederfinden und öffnen
          </p>
          <p style={{ marginTop: 12, fontSize: 13, display: "flex", gap: 16, justifyContent: "center" }}>
            <Link href="/" style={linkStyle}>
              + Neues Audit erstellen
            </Link>
            <Link href="/editor" style={linkStyle}>
              Template-Editor öffnen →
            </Link>
          </p>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nach Projekt-Name oder URL filtern ..."
          style={{
            width: "100%",
            padding: "11px 14px",
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 14,
            marginBottom: 20,
          }}
        />

        {error && (
          <div
            style={{
              marginBottom: 16,
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

        {audits === null && <p style={{ color: "#9ca3af" }}>Lade Audits ...</p>}

        {audits !== null && audits.length === 0 && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              background: "#1a1a1a",
              border: "1px dashed #2a2a2a",
              borderRadius: 12,
              color: "#9ca3af",
            }}
          >
            <p style={{ marginBottom: 12 }}>Noch keine Audits vorhanden.</p>
            <Link href="/" style={linkStyle}>
              Erstes Audit erstellen →
            </Link>
          </div>
        )}

        {audits !== null && audits.length > 0 && filtered.length === 0 && (
          <p style={{ color: "#9ca3af" }}>
            Kein Audit passt zum Filter {`„${query}"`}.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((a) => (
            <AuditRow
              key={a.id}
              audit={a}
              pendingDelete={pendingDelete === a.id}
              deleting={deletingId === a.id}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>

        {audits !== null && audits.length > 0 && (
          <p style={{ color: "#5a5a5a", fontSize: 12, marginTop: 20, textAlign: "center" }}>
            {filtered.length} von {audits.length} Audits
          </p>
        )}
      </div>
    </main>
  );
}

function AuditRow({
  audit,
  pendingDelete,
  deleting,
  onDelete,
}: {
  audit: AuditSummary;
  pendingDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const color = gradeColor(audit.overallScore);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          flexShrink: 0,
          borderRadius: 8,
          background: `${color}1a`,
          border: `1px solid ${color}`,
          color,
          fontWeight: "bold",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {audit.overallScore || "–"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {audit.projectName || audit.url || "Unbenanntes Audit"}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {audit.url}
        </div>
        <div style={{ fontSize: 11, color: "#5a5a5a", marginTop: 2 }}>
          {formatDate(audit.createdAt)} · {audit.recommendationCount}{" "}
          {audit.recommendationCount === 1 ? "Empfehlung" : "Empfehlungen"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Link href={`/audit/${audit.id}`} style={primaryBtn}>
          Öffnen
        </Link>
        <a
          href={`/api/generate-pdf?auditId=${encodeURIComponent(audit.id)}`}
          style={secondaryBtn}
        >
          PDF
        </a>
        <button
          onClick={onDelete}
          disabled={deleting}
          style={{
            ...secondaryBtn,
            border: `1px solid ${pendingDelete ? "#ef4444" : "#3a3a3a"}`,
            color: pendingDelete ? "#fca5a5" : "#9ca3af",
            cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          {deleting
            ? "..."
            : pendingDelete
              ? "Wirklich löschen?"
              : "Löschen"}
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const linkStyle: React.CSSProperties = {
  color: "#38E1E1",
  textDecoration: "none",
};

const primaryBtn: React.CSSProperties = {
  padding: "7px 14px",
  background: "#38E1E1",
  color: "#0d0d0d",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "7px 12px",
  background: "transparent",
  color: "#9ca3af",
  border: "1px solid #3a3a3a",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};
