/**
 * Vergleicht alle 14 Seiten: Legacy-HTML vs. Decomposed-Template
 * Speichert Screenshots nach /tmp/visual_compare/{page}-legacy.png und {page}-decomposed.png
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const AUDIT = process.env.AUDIT || "0ba6d3a9-6c5c-4e6f-998f-830fff2757ed";
const OUT = "/tmp/visual_compare";
const ONLY = process.env.PAGE; // optional: nur eine Seite

const PAGES = [
  { key: "cover",           index: 0 },
  { key: "overview",        index: 1 },
  { key: "topRisks",        index: 2 },
  { key: "recommendations", index: 3 },
  { key: "onPageSeo1",      index: 4 },
  { key: "onPageSeo2",      index: 5 },
  { key: "uxConversion",    index: 6 },
  { key: "links1",          index: 7 },
  { key: "links2",          index: 8 },
  { key: "usability",       index: 9 },
  { key: "leistung",        index: 10 },
  { key: "social",          index: 11 },
  { key: "lokalesSeo",      index: 12 },
  { key: "thankYou",        index: 13 },
];

await mkdir(OUT, { recursive: true });

// Decomposed-Template für alle Seiten gleichzeitig anlegen
const def = (await (await fetch(`${BASE}/api/templates/default`)).json()).template;
const tpl = JSON.parse(JSON.stringify(def));
tpl.id = "vc-all";
tpl.name = "vc-all";

const pages = ONLY ? PAGES.filter(p => p.key === ONLY) : PAGES;

for (const p of pages) {
  const dcResp = await fetch(`${BASE}/api/templates/decompose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageKey: p.key }),
  });
  const dc = await dcResp.json();
  if (!dc.blocks) { console.error(`Decompose failed for ${p.key}:`, dc); continue; }
  tpl.pages[p.index].blocks = dc.blocks;
}

await fetch(`${BASE}/api/templates/vc-all`, { method: "DELETE" }).catch(() => {});
const cr = await fetch(`${BASE}/api/templates`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(tpl),
});
if (cr.status !== 201) {
  console.error("Create failed:", cr.status, await cr.text());
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1260, deviceScaleFactor: 2 });

  // Legacy alle Seiten laden
  await page.goto(`${BASE}/api/generate-pdf?auditId=${AUDIT}&format=html`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  for (const p of pages) {
    const el = await page.$(`section.audit-page:nth-of-type(${p.index + 1})`);
    if (!el) { console.warn(`No legacy section for ${p.key} (index ${p.index})`); continue; }
    await el.screenshot({ path: `${OUT}/${p.key}-legacy.png` });
    console.log(`Legacy  ${p.key} -> ${OUT}/${p.key}-legacy.png`);
  }

  // Decomposed alle Seiten laden
  await page.goto(`${BASE}/api/generate-pdf?auditId=${AUDIT}&engine=template&templateId=vc-all&format=html`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  for (const p of pages) {
    const el = await page.$(`section.audit-page:nth-of-type(${p.index + 1})`);
    if (!el) { console.warn(`No decomposed section for ${p.key} (index ${p.index})`); continue; }
    await el.screenshot({ path: `${OUT}/${p.key}-decomposed.png` });
    console.log(`Decomp  ${p.key} -> ${OUT}/${p.key}-decomposed.png`);
  }
} finally {
  await browser.close();
}

await fetch(`${BASE}/api/templates/vc-all`, { method: "DELETE" }).catch(() => {});
console.log("Done.");
