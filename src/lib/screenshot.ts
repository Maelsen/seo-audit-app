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
