"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

type TemplateSummary = {
  id: string;
  name: string;
  pageCount: number;
  blockCount: number;
  updatedAt: string;
};

type Props = { initialTemplates: TemplateSummary[] };

export function EditorIndexClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<TemplateSummary[]>(initialTemplates);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function refresh() {
    const res = await fetch("/api/templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(
        (data.templates as {
          id: string;
          name: string;
          pages: { blocks: unknown[] }[];
          updatedAt: string;
        }[]).map((t) => ({
          id: t.id,
          name: t.name,
          pageCount: t.pages.length,
          blockCount: t.pages.reduce((acc, p) => acc + p.blocks.length, 0),
          updatedAt: t.updatedAt,
        })),
      );
    }
  }

  async function handleCreate() {
    const id = prompt("Neue Template-ID (z.B. mein-template)");
    if (!id) return;
    const name = prompt("Name", id) ?? id;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name,
          pages: [
            {
              id: "page-1",
              name: "Seite 1",
              background: "#1a1a1a",
              width: 210,
              height: 296,
              blocks: [],
            },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fehler");
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate(id: string) {
    const newId = prompt(`Neue ID (Kopie von ${id})`, `${id}-copy`);
    if (!newId) return;
    setBusy(true);
    setError("");
    try {
      const loadRes = await fetch(`/api/templates/${id}`);
      if (!loadRes.ok) throw new Error("Original nicht gefunden");
      const { template } = await loadRes.json();
      const name = prompt("Name", `${template.name} Kopie`) ?? template.name;
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, id: newId, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fehler");
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(id: string, currentName: string) {
    const name = prompt("Neuer Name", currentName);
    if (!name || name === currentName) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fehler");
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (id === "default") {
      setError("Das Default-Template kann nicht gelöscht werden.");
      return;
    }
    if (!confirm(`Template "${id}" wirklich löschen?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Fehler");
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0e",
        color: "#e5e5e5",
        fontFamily: "Poppins, Arial, sans-serif",
        padding: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>
            Template-Editor
          </h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
            Wähle ein Template zum Bearbeiten oder erstelle ein neues.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={busy}
          style={{
            background: "#38E1E1",
            color: "#0a0a0a",
            padding: "10px 20px",
            borderRadius: 6,
            border: "none",
            fontFamily: "Poppins, Arial, sans-serif",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Neues Template
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#2a0f0f",
            color: "#fca5a5",
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {templates.length === 0 && (
        <div style={{ color: "#888" }}>
          Keine Templates vorhanden. Klicke auf &quot;Neues Template&quot;.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {templates.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#141414",
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Link
              href={`/editor/${t.id}`}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
                {t.name}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                {t.pageCount} Seite{t.pageCount === 1 ? "" : "n"} ·{" "}
                {t.blockCount} Blöcke
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 8 }}>
                Aktualisiert:{" "}
                {new Date(t.updatedAt).toLocaleString("de-DE")}
              </div>
            </Link>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                borderTop: "1px solid #2a2a2a",
                paddingTop: 10,
              }}
            >
              <button
                onClick={() => router.push(`/editor/${t.id}`)}
                style={miniBtn}
              >
                Öffnen
              </button>
              <button
                onClick={() => handleDuplicate(t.id)}
                disabled={busy}
                style={miniBtn}
              >
                Kopie
              </button>
              <button
                onClick={() => handleRename(t.id, t.name)}
                disabled={busy}
                style={miniBtn}
              >
                Umben.
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={busy}
                style={{ ...miniBtn, color: "#ff8a8a", borderColor: "#5a2020" }}
              >
                Lösch.
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const miniBtn = {
  flex: 1,
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  color: "#e5e5e5",
  padding: "6px 4px",
  borderRadius: 4,
  fontSize: 10,
  fontFamily: "Poppins, Arial, sans-serif",
  cursor: "pointer",
};
