import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { saveScreenshot } from "./storage";
import { resolveChromiumExecutable } from "./chromium-path";

async function launchBrowser(): Promise<Browser> {
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

type Viewport = {
  width: number;
  height: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  deviceScaleFactor?: number;
};

// Versucht typische Cookie-Consent-Banner zu schliessen bevor der Screenshot
// gemacht wird. Die Buttons-Selektoren sind nach Wahrscheinlichkeit sortiert.
// Schluckt alle Errors — wenn nichts passt, wird Screenshot mit Banner gemacht
// (besser als kein Screenshot).
async function dismissCookieBanner(page: import("puppeteer-core").Page): Promise<void> {
  // CSS-Selektoren (Puppeteer unterstuetzt :has-text NICHT, deshalb DOM-Eval).
  const result = await page
    .evaluate(() => {
      const buttonTexts = [
        "alles akzeptieren",
        "alle akzeptieren",
        "akzeptieren",
        "accept all",
        "accept",
        "zustimmen",
        "ok",
        "verstanden",
        "agree",
        "i agree",
      ];
      const selectors = [
        'button[id*="accept" i]',
        'button[class*="accept" i]',
        '[id*="cookie" i] button',
        '[class*="cookie" i] button',
        '[id*="consent" i] button',
        '[class*="consent" i] button',
      ];
      // 1. Versuch: text-basiert
      const allButtons = Array.from(
        document.querySelectorAll<HTMLElement>('button, a, [role="button"]'),
      );
      for (const btn of allButtons) {
        const txt = (btn.innerText || btn.textContent || "").trim().toLowerCase();
        if (buttonTexts.some((t) => txt === t || txt.includes(t))) {
          (btn as HTMLElement).click();
          return `text-match: "${txt.substring(0, 40)}"`;
        }
      }
      // 2. Versuch: id/class-basiert
      for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el) {
          el.click();
          return `selector: ${sel}`;
        }
      }
      return null;
    })
    .catch(() => null);
  if (result) {
    // Banner-Animation Dauer
    await new Promise((r) => setTimeout(r, 800));
  }
}

async function captureOne(
  auditId: string,
  url: string,
  viewport: Viewport,
  kind: "cover" | "mobile" | "tablet",
): Promise<string | undefined> {
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2500));
    // Cookie-Banner-Dismiss vor Screenshot (Bug 1 aus full-fidelity-test).
    // Errors werden geschluckt — wenn kein Banner: weiter machen.
    await dismissCookieBanner(page).catch(() => {});
    const buf = (await page.screenshot({ type: "png", fullPage: false })) as Buffer;
    return await saveScreenshot(auditId, kind, buf);
  } catch (err) {
    console.error(`[screenshot] ${kind} failed for ${url}:`, (err as Error).message);
    return undefined;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}

export async function captureScreenshots(
  auditId: string,
  url: string,
): Promise<{ cover?: string; mobile?: string; tablet?: string }> {
  const result: { cover?: string; mobile?: string; tablet?: string } = {};

  result.cover = await captureOne(auditId, url, { width: 1440, height: 900 }, "cover");
  result.mobile = await captureOne(
    auditId,
    url,
    { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    "mobile",
  );
  result.tablet = await captureOne(
    auditId,
    url,
    { width: 820, height: 1180, deviceScaleFactor: 2 },
    "tablet",
  );

  return result;
}

export async function screenshotToBase64(
  url: string,
  viewport: { width: number; height: number; isMobile?: boolean },
): Promise<string> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const buf = (await page.screenshot({ type: "png" })) as Buffer;
    return buf.toString("base64");
  } finally {
    await browser.close();
  }
}
