import { listTemplates } from "@/lib/storage";
import { EditorIndexClient } from "./EditorIndexClient";

export default async function EditorIndexPage() {
  const templates = await listTemplates();
  const summary = templates.map((t) => ({
    id: t.id,
    name: t.name,
    pageCount: t.pages.length,
    blockCount: t.pages.reduce((acc, p) => acc + p.blocks.length, 0),
    updatedAt: t.updatedAt,
  }));
  return <EditorIndexClient initialTemplates={summary} />;
}
