#!/usr/bin/env tsx
// Seed default.json mit den 20 Seiten fuer Vasileios' Layout.
// Jede Page wird via BUILDERS aus src/lib/editor/page-builders.ts befuellt.
// Builder die noch nicht implementiert sind (M5-M13) liefern nur pageChrome
// oder leeres Array — Pages bleiben sichtbar im PDF-Output dank 1px-Anchor-Div.
//
// --if-missing skipt wenn die Datei schon existiert (Bootstrap auf Railway).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  BUILDERS,
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  type PageKey,
} from "../src/lib/editor/page-builders";

const TEMPLATE_PATH = resolve(process.cwd(), "data/templates/default.json");
const IF_MISSING = process.argv.includes("--if-missing");

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

function buildPage(p: PageMeta) {
  return {
    id: p.id,
    name: p.name,
    background: "#1a1a1a",
    width: PAGE_WIDTH_MM,
    height: PAGE_HEIGHT_MM,
    blocks: BUILDERS[p.key](),
  };
}

function main() {
  if (IF_MISSING && existsSync(TEMPLATE_PATH)) {
    console.log(`Template exists at ${TEMPLATE_PATH}, skipping seed.`);
    return;
  }
  mkdirSync(dirname(TEMPLATE_PATH), { recursive: true });

  type Existing = {
    id?: string;
    name?: string;
    version?: number;
    createdAt?: string;
    updatedAt?: string;
    pages?: unknown[];
    assets?: unknown;
  };

  let existing: Existing;
  try {
    existing = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8")) as Existing;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    existing = {
      id: "default",
      name: "Artistic Avenue Default",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [],
    };
  }
  const assets = existing.assets;
  existing.pages = PAGES.map(buildPage);
  existing.updatedAt = new Date().toISOString();
  if (assets) existing.assets = assets;
  writeFileSync(TEMPLATE_PATH, JSON.stringify(existing, null, 2));
  const blockCount = (existing.pages as ReturnType<typeof buildPage>[]).reduce(
    (n, p) => n + p.blocks.length,
    0,
  );
  console.log(
    `Wrote ${existing.pages.length} pages (${blockCount} total blocks) to ${TEMPLATE_PATH}`,
  );
}

main();
