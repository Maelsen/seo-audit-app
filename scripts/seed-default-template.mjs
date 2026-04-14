#!/usr/bin/env node
// Seed default.json mit legacyPage-Bloecken (1:1 identisch mit Legacy-Renderer).
// Jede Seite hat einen einzelnen legacyPage-Block der die originale React-Komponente rendert.
// Im Editor kann der User per "Elemente bearbeiten"-Button die Seite in einzelne Bloecke zerlegen.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TEMPLATE_PATH = resolve(process.cwd(), "data/templates/default.json");
const IF_MISSING = process.argv.includes("--if-missing");

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

function buildPage({ id, name, pageKey }) {
  return {
    id, name, background: "#1a1a1a", width: 210, height: 296,
    blocks: [{
      id: `${id}-legacy`, type: "legacyPage", pageKey,
      zIndex: 1, frame: { x: 0, y: 0, w: 210, h: 296 },
    }],
  };
}

function main() {
  if (IF_MISSING && existsSync(TEMPLATE_PATH)) {
    console.log(`Template exists at ${TEMPLATE_PATH}, skipping seed.`);
    return;
  }
  mkdirSync(dirname(TEMPLATE_PATH), { recursive: true });
  let existing;
  try {
    existing = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    existing = {
      id: "default", name: "Artistic Avenue Default",
      version: 1, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), pages: [],
    };
  }
  const assets = existing.assets;
  existing.pages = PAGES.map(buildPage);
  existing.updatedAt = new Date().toISOString();
  if (assets) existing.assets = assets;
  writeFileSync(TEMPLATE_PATH, JSON.stringify(existing, null, 2));
  console.log(`Wrote ${existing.pages.length} legacy pages to ${TEMPLATE_PATH}`);
}

main();
