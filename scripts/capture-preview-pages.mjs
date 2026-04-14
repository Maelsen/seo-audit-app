import puppeteer from "puppeteer-core";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../tmp/preview-screens");

const URL = process.env.PREVIEW_URL ||
  "http://localhost:3000/api/generate-pdf?auditId=mock-test-homeraum&engine=template&templateId=default&format=html";

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1.5 });
    await page.goto(URL, { waitUntil: "networkidle0" });
    const count = await page.evaluate(() => document.querySelectorAll("section.audit-page").length);
    console.log(`Found ${count} pages`);
    for (let i = 0; i < count; i++) {
      const sel = `section.audit-page:nth-of-type(${i + 1})`;
      const el = await page.$(sel);
      if (!el) {
        console.log(`Page ${i}: element not found`);
        continue;
      }
      const out = resolve(OUT_DIR, `page-${String(i).padStart(2, "0")}.png`);
      await el.screenshot({ path: out });
      console.log(`Saved ${out}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
