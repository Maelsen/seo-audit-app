"use client";

import { useEffect, useState, useCallback, use } from "react";
import type {
  AuditData,
  Grade,
  Priority,
  Recommendation,
  TopRisk,
} from "@/lib/types";
import { ALL_GRADES, gradeColor } from "@/lib/grade";
import { useProvideAgentContext } from "@/components/agent-chat/context-store";

type EditDiff = {
  section: string;
  field: string;
  original: string;
  edited: string;
};

export default function AuditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useProvideAgentContext({ location: "audit", auditId: id });
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [original, setOriginal] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tipText, setTipText] = useState("");
  const [templates, setTemplates] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { templates: { id: string; name: string }[] }) => {
        if (data?.templates) setTemplates(data.templates);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/audit/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAudit(data.audit);
          setOriginal(JSON.parse(JSON.stringify(data.audit)));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  const update = useCallback((updater: (prev: AuditData) => AuditData) => {
    setAudit((prev) => (prev ? updater(prev) : prev));
  }, []);

  function buildDiffs(): EditDiff[] {
    if (!audit || !original) return [];
    const diffs: EditDiff[] = [];
    const push = (
      section: string,
      field: string,
      o: unknown,
      e: unknown,
    ) => {
      const os = String(o ?? "");
      const es = String(e ?? "");
      if (os !== es) diffs.push({ section, field, original: os, edited: es });
    };

    push("overall", "score", original.overallScore, audit.overallScore);
    push("overall", "heading", original.overallHeading, audit.overallHeading);
    push("overall", "introText", original.introText, audit.introText);

    const sectionKeys = Object.keys(audit.sections) as (keyof typeof audit.sections)[];
    for (const key of sectionKeys) {
      const o = original.sections[key];
      const e = audit.sections[key];
      push(key, "score", o.score, e.score);
      push(key, "heading", o.heading, e.heading);
      push(key, "text", o.text, e.text);
    }

    for (let i = 0; i < Math.max(original.topRisks.length, audit.topRisks.length); i++) {
      const o = original.topRisks[i];
      const e = audit.topRisks[i];
      push("topRisks", `${i}.title`, o?.title, e?.title);
      push("topRisks", `${i}.description`, o?.description, e?.description);
    }

    for (let i = 0; i < Math.max(original.recommendations.length, audit.recommendations.length); i++) {
      const o = original.recommendations[i];
      const e = audit.recommendations[i];
      push("recommendations", `${i}.title`, o?.title, e?.title);
      push("recommendations", `${i}.priority`, o?.priority, e?.priority);
      push("recommendations", `${i}.text`, o?.text, e?.text);
    }

    return diffs;
  }

  async function handleSave() {
    if (!audit) return;
    setSaving(true);
    setError("");
    setStatus("Speichere Änderungen ...");
    try {
      const diffs = buildDiffs();
      const res = await fetch(`/api/audit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit, edits: diffs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
      setAudit(data.audit);
      setOriginal(JSON.parse(JSON.stringify(data.audit)));
      setStatus(`Gespeichert. ${diffs.length} Änderungen erfasst.`);
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePdf() {
    setStatus("Generiere PDF ...");
    setError("");
    try {
      const apiUrl = selectedTemplateId
        ? `/api/generate-pdf?auditId=${id}&templateId=${encodeURIComponent(selectedTemplateId)}`
        : `/api/generate-pdf?auditId=${id}`;
      const res = await fetch(apiUrl);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "PDF fehlgeschlagen");
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `seo-audit-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      setStatus("PDF heruntergeladen.");
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  }

  async function handleAddTip() {
    if (!tipText.trim()) return;
    setStatus("Speichere Tipp ins Style Profile ...");
    try {
      const res = await fetch("/api/style-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addTip", tip: tipText.trim() }),
      });
      if (!res.ok) throw new Error("Tipp konnte nicht gespeichert werden");
      setTipText("");
      setStatus("Tipp gespeichert.");
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  }

  async function handleRefreshStyleProfile() {
    setStatus("Style Profile wird aus Edits extrahiert ...");
    try {
      const res = await fetch("/api/style-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refresh fehlgeschlagen");
      setStatus(
        data.updated
          ? `Style Profile aktualisiert. ${data.profile?.learnings?.length ?? 0} Learnings aus ${data.editCount} Edits.`
          : data.message || "Noch nicht genug Edits.",
      );
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    }
  }

  if (loading) {
    return <Shell><p>Lade Audit ...</p></Shell>;
  }
  if (!audit) {
    return <Shell><p style={{ color: "#fca5a5" }}>{error || "Audit nicht gefunden."}</p></Shell>;
  }

  const sectionLabels: Record<string, string> = {
    onpageSeo: "On-Page SEO",
    uxConversion: "UX & Conversion",
    usability: "Usability",
    leistung: "Leistung",
    social: "Social",
    lokalesSeo: "Lokales SEO",
    links: "Links",
  };

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>{audit.projectName || "SEO Audit"}</h1>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>{audit.url}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button style={secondaryBtn} onClick={handleRefreshStyleProfile}>Style Profile</button>
          <button style={secondaryBtn} disabled={saving} onClick={handleSave}>
            {saving ? "Speichere ..." : "Speichern"}
          </button>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              ...secondaryBtn,
              padding: "8px 10px",
              minWidth: 160,
            }}
          >
            {templates.length === 0 && (
              <option value="default">Default Template</option>
            )}
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <a
            href={`/editor/${selectedTemplateId || "default"}`}
            target="_blank"
            rel="noreferrer"
            style={{ ...secondaryBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Template bearbeiten
          </a>
          <button style={primaryBtn} onClick={handleGeneratePdf}>PDF generieren</button>
        </div>
      </div>

      {status && <Banner color="#38E1E1" bg="#0f2a2a">{status}</Banner>}
      {error && <Banner color="#fca5a5" bg="#2a0f0f">{error}</Banner>}

      <Card title="Gesamt">
        <Row>
          <FieldLabel>Gesamtnote</FieldLabel>
          <GradeSelect
            value={audit.overallScore}
            onChange={(g) => update((a) => ({ ...a, overallScore: g }))}
          />
        </Row>
        <Row>
          <FieldLabel>Überschrift</FieldLabel>
          <input
            style={inputStyle}
            value={audit.overallHeading}
            onChange={(e) => update((a) => ({ ...a, overallHeading: e.target.value }))}
          />
        </Row>
        <Row>
          <FieldLabel>Intro Text</FieldLabel>
          <textarea
            style={{ ...inputStyle, minHeight: 100 }}
            value={audit.introText}
            onChange={(e) => update((a) => ({ ...a, introText: e.target.value }))}
          />
        </Row>
      </Card>

      <Card title="Top 3 Risiken">
        {audit.topRisks.map((risk, i) => (
          <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < audit.topRisks.length - 1 ? "1px solid #2a2a2a" : "none" }}>
            <FieldLabel>Risiko {i + 1} Titel</FieldLabel>
            <input
              style={inputStyle}
              value={risk.title}
              onChange={(e) =>
                update((a) => ({
                  ...a,
                  topRisks: a.topRisks.map((r, idx) => idx === i ? { ...r, title: e.target.value } : r),
                }))
              }
            />
            <div style={{ height: 8 }} />
            <FieldLabel>Beschreibung</FieldLabel>
            <textarea
              style={{ ...inputStyle, minHeight: 70 }}
              value={risk.description}
              onChange={(e) =>
                update((a) => ({
                  ...a,
                  topRisks: a.topRisks.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r),
                }))
              }
            />
          </div>
        ))}
        <button
          style={secondaryBtn}
          onClick={() =>
            update((a) => ({
              ...a,
              topRisks: [...a.topRisks, { title: "", description: "" } as TopRisk],
            }))
          }
        >
          + Risiko hinzufügen
        </button>
      </Card>

      <Card title="Empfehlungen">
        {audit.recommendations.map((rec, i) => (
          <div key={rec.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < audit.recommendations.length - 1 ? "1px solid #2a2a2a" : "none" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={rec.title}
                onChange={(e) =>
                  update((a) => ({
                    ...a,
                    recommendations: a.recommendations.map((r, idx) => idx === i ? { ...r, title: e.target.value } : r),
                  }))
                }
              />
              <PrioritySelect
                value={rec.priority}
                onChange={(p) =>
                  update((a) => ({
                    ...a,
                    recommendations: a.recommendations.map((r, idx) => idx === i ? { ...r, priority: p } : r),
                  }))
                }
              />
              <button
                style={deleteBtn}
                onClick={() =>
                  update((a) => ({
                    ...a,
                    recommendations: a.recommendations.filter((_, idx) => idx !== i),
                  }))
                }
              >
                Löschen
              </button>
            </div>
            {rec.text !== undefined && (
              <textarea
                style={{ ...inputStyle, minHeight: 60 }}
                placeholder="Optionale Beschreibung"
                value={rec.text || ""}
                onChange={(e) =>
                  update((a) => ({
                    ...a,
                    recommendations: a.recommendations.map((r, idx) => idx === i ? { ...r, text: e.target.value } : r),
                  }))
                }
              />
            )}
          </div>
        ))}
        <button
          style={secondaryBtn}
          onClick={() =>
            update((a) => ({
              ...a,
              recommendations: [
                ...a.recommendations,
                { id: crypto.randomUUID(), title: "", priority: "mittel", text: "" } as Recommendation,
              ],
            }))
          }
        >
          + Empfehlung hinzufügen
        </button>
      </Card>

      {(Object.keys(audit.sections) as (keyof typeof audit.sections)[]).map((key) => {
        const section = audit.sections[key];
        return (
          <Card key={key} title={sectionLabels[key]}>
            <Row>
              <FieldLabel>Note</FieldLabel>
              <GradeSelect
                value={section.score}
                onChange={(g) =>
                  update((a) => ({
                    ...a,
                    sections: { ...a.sections, [key]: { ...a.sections[key], score: g } },
                  }))
                }
              />
            </Row>
            <Row>
              <FieldLabel>Überschrift</FieldLabel>
              <input
                style={inputStyle}
                value={section.heading}
                onChange={(e) =>
                  update((a) => ({
                    ...a,
                    sections: { ...a.sections, [key]: { ...a.sections[key], heading: e.target.value } },
                  }))
                }
              />
            </Row>
            <Row>
              <FieldLabel>Text</FieldLabel>
              <textarea
                style={{ ...inputStyle, minHeight: 120 }}
                value={section.text}
                onChange={(e) =>
                  update((a) => ({
                    ...a,
                    sections: { ...a.sections, [key]: { ...a.sections[key], text: e.target.value } },
                  }))
                }
              />
            </Row>
          </Card>
        );
      })}

      <Card title="Tipp fürs nächste Mal">
        <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
          Feedback das ins Style Profile einfließt und zukünftige Audits beeinflusst.
        </p>
        <textarea
          style={{ ...inputStyle, minHeight: 70 }}
          placeholder="z.B. Schreib Texte kürzer, sei bei Conversion strenger ..."
          value={tipText}
          onChange={(e) => setTipText(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <button style={secondaryBtn} onClick={handleAddTip}>Tipp speichern</button>
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 16, color: "#38E1E1" }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#d4d4d4", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </label>
  );
}

function Banner({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div
      style={{
        padding: 12,
        marginBottom: 16,
        background: bg,
        borderLeft: `3px solid ${color}`,
        color,
        fontSize: 13,
        borderRadius: 4,
      }}
    >
      {children}
    </div>
  );
}

function GradeSelect({ value, onChange }: { value: Grade; onChange: (g: Grade) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Grade)}
      style={{
        ...inputStyle,
        width: 120,
        color: gradeColor(value),
        fontWeight: "bold",
      }}
    >
      {ALL_GRADES.map((g) => (
        <option key={g} value={g} style={{ color: "#fff", background: "#0d0d0d" }}>
          {g}
        </option>
      ))}
    </select>
  );
}

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const colors: Record<Priority, string> = {
    hoch: "#ef4444",
    mittel: "#f97316",
    niedrig: "#22c55e",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Priority)}
      style={{
        ...inputStyle,
        width: 130,
        color: colors[value],
        fontWeight: "bold",
      }}
    >
      <option value="hoch" style={{ color: "#fff", background: "#0d0d0d" }}>Hoch</option>
      <option value="mittel" style={{ color: "#fff", background: "#0d0d0d" }}>Mittel</option>
      <option value="niedrig" style={{ color: "#fff", background: "#0d0d0d" }}>Niedrig</option>
    </select>
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
  fontFamily: "inherit",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 18px",
  background: "#38E1E1",
  color: "#0d0d0d",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 18px",
  background: "#2a2a2a",
  color: "#ffffff",
  border: "1px solid #333",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
  padding: "10px 14px",
  background: "transparent",
  color: "#ef4444",
  border: "1px solid #4a1a1a",
  borderRadius: 6,
  fontSize: 12,
  cursor: "pointer",
};
