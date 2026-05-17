import puppeteer from "puppeteer-core";
import type { Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { resolveChromiumExecutable } from "../chromium-path";

// Auto-Shrink: Text-Bloecke deren Inhalt ueber den Frame hinauslaeuft werden
// in der Schriftgroesse reduziert bis sie passen — statt mit overflow:hidden
// mitten im Satz abzuschneiden oder optisch in den naechsten Block zu laufen.
// Faengt variable AI-Textlaengen ab (das Template ist auf Vasileios' kurze
// Original-Texte pixel-vermessen). Laeuft im Browser-Kontext nach fonts.ready.
async function autoShrinkOverflowingText(page: Page): Promise<void> {
  await page.evaluate(() => {
    const blocks = document.querySelectorAll<HTMLElement>(
      '[data-block-type="text"]',
    );
    blocks.forEach((el) => {
      const startPx = parseFloat(getComputedStyle(el).fontSize);
      if (!startPx) return;
      const minPx = Math.max(startPx * 0.6, 6.5);
      let fontPx = startPx;
      let guard = 0;
      while (
        el.scrollHeight > el.clientHeight + 1 &&
        fontPx > minPx &&
        guard < 60
      ) {
        fontPx -= 0.5;
        el.style.fontSize = `${fontPx}px`;
        guard++;
      }
    });
  });
}

async function launchBrowser() {
  const path = await resolveChromiumExecutable(() => chromium.executablePath());
  return puppeteer.launch({
    executablePath: path.executablePath,
    headless: true,
    args: [
      ...(path.useSparticuzArgs ? chromium.args : []),
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--no-first-run",
      "--no-zygote",
    ],
  });
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60000 });
    await page.evaluate(() => (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready);
    await autoShrinkOverflowingText(page);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
