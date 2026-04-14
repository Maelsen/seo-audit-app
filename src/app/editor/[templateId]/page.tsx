import { redirect } from "next/navigation";
import { listAudits, loadAudit, loadTemplate } from "@/lib/storage";
import { EditorClient } from "./EditorClient";
import type { AuditData } from "@/lib/types";

type PageProps = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ auditId?: string }>;
};

export default async function TemplateEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { templateId } = await params;
  const { auditId } = await searchParams;

  const template = await loadTemplate(templateId);
  if (!template) {
    redirect("/editor");
  }

  let audit: AuditData | null = null;
  if (auditId) {
    audit = await loadAudit(auditId);
  }
  if (!audit) {
    const all = await listAudits();
    audit = all[0] ?? null;
  }
  if (!audit) {
    return (
      <div
        style={{
          padding: 40,
          fontFamily: "Poppins, Arial, sans-serif",
          color: "#fff",
          background: "#1a1a1a",
          minHeight: "100vh",
        }}
      >
        <h1>Kein Audit verfuegbar</h1>
        <p>
          Lade mindestens ein Audit hoch bevor du den Editor startest, damit die
          Bindings einen Datensatz haben.
        </p>
      </div>
    );
  }

  return <EditorClient initialTemplate={template} audit={audit} />;
}
