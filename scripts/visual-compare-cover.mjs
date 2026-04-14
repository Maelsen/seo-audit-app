import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const AUDIT = process.env.AUDIT || "0ba6d3a9-6c5c-4e6f-998f-830fff2757ed";
const PAGE_INDEX = Number(process.env.PAGE_INDEX ?? 0);
const PAGE_KEY = process.env.PAGE_KEY || "cover";
const OUT = "/tmp/visual_compare";

await mkdir(OUT, { recursive: true });

const def = (await (await fetch(`${BASE}/api/templates/default`)).json()).template;
const tpl = JSON.parse(JSON.stringify(def));
tpl.id = "vc-test";
tpl.name = "vc-test";

const dcResp = await fetch(`${BASE}/api/templates/decompose`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ pageKey: PAGE_KEY }),
});
const dc = await dcResp.json();
if (!dc.blocks) {
  console.error("Decompose failed:", dc);
  process.exit(1);
}
tpl.pages[PAGE_INDEX].blocks = dc.blocks;

await fetch(`${BASE}/api/templates/vc-test`, { method: "DELETE" }).catch(() => {});
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
  for (const [label, url] of [
    ["legacy", `${BASE}/api/generate-pdf?auditId=${AUDIT}&format=html`],
    ["decomposed", `${BASE}/api/generate-pdf?auditId=${AUDIT}&engine=template&templateId=vc-test&format=html`],
  ]) {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    const el = await page.$(`section.audit-page:nth-of-type(${PAGE_INDEX + 1})`);
    const out = `${OUT}/${label}-${PAGE_KEY}.png`;
    await el.screenshot({ path: out });
    console.log(`Saved ${out}`);
  }
} finally {
  await browser.close();
}

await fetch(`${BASE}/api/templates/vc-test`, { method: "DELETE" }).catch(() => {});
console.log("Done.");
