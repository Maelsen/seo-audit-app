#!/usr/bin/env node
// Seed default.json mit den 20 Seiten-Shells fuer Vasileios' neues Layout.
// Jede Seite ist initial leer (blocks: []), Block-Befuellung erfolgt in M3-M13.
// --if-missing skipt wenn die Datei schon existiert (Bootstrap auf Railway).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const TEMPLATE_PATH = resolve(process.cwd(), "data/templates/default.json");
const IF_MISSING = process.argv.includes("--if-missing");

const PAGES = [
  { id: "cover",                     name: "Cover" },
  { id: "gesamtsituation",           name: "Gesamtsituation & Diagnose" },
  { id: "top-risiken",               name: "Top 3 Risiken" },
  { id: "wo-du-sein-koenntest",      name: "Wo du sein koenntest" },
  { id: "onpage-seo-1",              name: "On-Page SEO Ergebnisse" },
  { id: "onpage-seo-2",              name: "On-Page SEO Was kostet" },
  { id: "ux-conversion-1",           name: "UX & Conversion Ergebnisse" },
  { id: "ux-conversion-2",           name: "UX & Conversion Was kostet" },
  { id: "seitenstruktur-content-1",  name: "Seitenstruktur & Content Ergebnisse" },
  { id: "seitenstruktur-content-2",  name: "Seitenstruktur & Content Was kostet" },
  { id: "lokales-seo-1",             name: "Lokales SEO Ergebnisse" },
  { id: "lokales-seo-2",             name: "Lokales SEO Was kostet" },
  { id: "performance-1",             name: "Performance & Technisches Ergebnisse" },
  { id: "performance-2",             name: "Performance & Technisches Was kostet" },
  { id: "links-1",                   name: "Links & Autoritaet" },
  { id: "links-2",                   name: "Links & Autoritaet Was kostet" },
  { id: "phasenplan-1",              name: "Phasenplan Phase 1+2" },
  { id: "phasenplan-2",              name: "Phasenplan Phase 3" },
  { id: "zusammenfassung",           name: "Zusammenfassung & naechster Schritt" },
  { id: "inhaber",                   name: "Inhaber" },
];

function buildPage({ id, name }) {
  return {
    id,
    name,
    background: "#1a1a1a",
    width: 210,
    height: 297,
    blocks: [],
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
  console.log(`Wrote ${existing.pages.length} page shells to ${TEMPLATE_PATH}`);
}

main();
