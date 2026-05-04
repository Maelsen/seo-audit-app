import { NextResponse } from "next/server";
import { loadTemplate, saveTemplate } from "@/lib/storage";
import {
  BUILDERS,
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  type PageKey,
} from "@/lib/editor/page-builders";
import type { Template } from "@/lib/editor/template-types";

export const dynamic = "force-dynamic";

type PageMeta = { id: string; key: PageKey; name: string };

const PAGES: PageMeta[] = [
  { id: "cover",                     key: "cover",                  name: "Cover" },
  { id: "gesamtsituation",           key: "gesamtsituation",        name: "Gesamtsituation & Diagnose" },
  { id: "top-risiken",               key: "topRisiken",             name: "Top 3 Risiken" },
  { id: "wo-du-sein-koenntest",      key: "woDuSeinKoenntest",      name: "Wo du sein koenntest" },
  { id: "onpage-seo-1",              key: "onPageSeo1",             name: "On-Page SEO Ergebnisse" },
  { id: "onpage-seo-2",              key: "onPageSeo2",             name: "On-Page SEO Was kostet" },
  { id: "ux-conversion-1",           key: "uxConversion1",          name: "UX & Conversion Ergebnisse" },
  { id: "ux-conversion-2",           key: "uxConversion2",          name: "UX & Conversion Was kostet" },
  { id: "seitenstruktur-content-1",  key: "seitenstrukturContent1", name: "Seitenstruktur & Content Ergebnisse" },
  { id: "seitenstruktur-content-2",  key: "seitenstrukturContent2", name: "Seitenstruktur & Content Was kostet" },
  { id: "lokales-seo-1",             key: "lokalesSeo1",            name: "Lokales SEO Ergebnisse" },
  { id: "lokales-seo-2",             key: "lokalesSeo2",            name: "Lokales SEO Was kostet" },
  { id: "performance-1",             key: "performance1",           name: "Performance & Technisches Ergebnisse" },
  { id: "performance-2",             key: "performance2",           name: "Performance & Technisches Was kostet" },
  { id: "links-1",                   key: "links1",                 name: "Links & Autoritaet" },
  { id: "links-2",                   key: "links2",                 name: "Links & Autoritaet Was kostet" },
  { id: "phasenplan-1",              key: "phasenplan1",            name: "Phasenplan Phase 1+2" },
  { id: "phasenplan-2",              key: "phasenplan2",            name: "Phasenplan Phase 3" },
  { id: "zusammenfassung",           key: "zusammenfassung",        name: "Zusammenfassung & naechster Schritt" },
  { id: "inhaber",                   key: "inhaber",                name: "Inhaber" },
];

export async function POST() {
  const id = "default";
  const existing = await loadTemplate(id);
  const now = new Date().toISOString();

  const template: Template = {
    id,
    name: existing?.name ?? "Artistic Avenue Default",
    version: existing?.version ?? 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    pages: PAGES.map((p) => ({
      id: p.id,
      name: p.name,
      background: "#1a1a1a",
      width: PAGE_WIDTH_MM,
      height: PAGE_HEIGHT_MM,
      blocks: BUILDERS[p.key](),
    })),
    ...(existing?.assets ? { assets: existing.assets } : {}),
  };

  await saveTemplate(template);
  const blockCount = template.pages.reduce(
    (n, p) => n + (p.blocks?.length ?? 0),
    0,
  );
  return NextResponse.json({
    ok: true,
    pageCount: template.pages.length,
    blockCount,
    updatedAt: template.updatedAt,
  });
}
