#!/usr/bin/env node
// Seed default.json mit dekomponierten Blöcken für alle 14 Seiten.
// Benutzt die laufende Dev-Server-API /api/templates/decompose um decomposePageBlocks() auszuführen.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEMPLATE_PATH = resolve(process.cwd(), "data/templates/default.json");

const PAGES = [
  { id: "cover", name: "Cover", pageKey: "cover" },
  { id: "overview", name: "Overview", pageKey: "overview" },
  { id: "top-risks", name: "Top Risiken", pageKey: "topRisks" },
  { id: "recommendations", name: "Empfehlungen", pageKey: "recommendations" },
  { id: "onpage-seo-1", name: "On-Page SEO 1", pageKey: "onPageSeo1" },
  { id: "onpage-seo-2", name: "On-Page SEO 2", pageKey: "onPageSeo2" },
  { id: "ux-conversion", name: "UX & Conversion", pageKey: "uxConversion" },
  { id: "links-1", name: "Links 1", pageKey: "links1" },
  { id: "links-2", name: "Links 2", pageKey: "links2" },
  { id: "usability", name: "Usability", pageKey: "usability" },
  { id: "leistung", name: "Leistung", pageKey: "leistung" },
  { id: "social", name: "Social", pageKey: "social" },
  { id: "lokales-seo", name: "Lokales SEO", pageKey: "lokalesSeo" },
  { id: "thankyou", name: "Danke", pageKey: "thankYou" },
];

async function decompose(pageKey) {
  const res = await fetch(`${BASE}/api/templates/decompose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageKey }),
  });
  if (!res.ok) {
    throw new Error(`decompose ${pageKey} failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.blocks;
}

async function main() {
  const existing = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
  const assets = existing.assets;

  const newPages = [];
  for (const { id, name, pageKey } of PAGES) {
    const blocks = await decompose(pageKey);
    newPages.push({
      id,
      name,
      background: "#1a1a1a",
      width: 210,
      height: 296,
      blocks,
    });
    console.log(`  ${id}: ${blocks.length} blocks`);
  }

  existing.pages = newPages;
  existing.updatedAt = new Date().toISOString();
  if (assets) existing.assets = assets;

  writeFileSync(TEMPLATE_PATH, JSON.stringify(existing, null, 2));
  console.log(`Wrote ${newPages.length} pages to ${TEMPLATE_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
