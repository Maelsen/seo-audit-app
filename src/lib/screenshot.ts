import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { saveScreenshot } from "./storage";

async function launchBrowser() {
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const localPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return puppeteer.launch({
    executablePath: localPath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function captureScreenshots(
  auditId: string,
  url: string,
): Promise<{
  cover?: string;
  mobile?: string;
  tablet?: string;
}> {
  const browser = await launchBrowser();
  try {
    const result: { cover?: string; mobile?: string; tablet?: string } = {};

    const coverPage = await browser.newPage();
    await coverPage.setViewport({ width: 1440, height: 900 });
    await coverPage.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    const coverBuf = (await coverPage.screenshot({
      type: "png",
      fullPage: false,
    })) as Buffer;
    result.cover = await saveScreenshot(auditId, "cover", coverBuf);
    await coverPage.close();

    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    await mobilePage.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    const mobileBuf = (await mobilePage.screenshot({
      type: "png",
      fullPage: false,
    })) as Buffer;
    result.mobile = await saveScreenshot(auditId, "mobile", mobileBuf);
    await mobilePage.close();

    const tabletPage = await browser.newPage();
    await tabletPage.setViewport({
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
    });
    await tabletPage.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    const tabletBuf = (await tabletPage.screenshot({
      type: "png",
      fullPage: false,
    })) as Buffer;
    result.tablet = await saveScreenshot(auditId, "tablet", tabletBuf);
    await tabletPage.close();

    return result;
  } finally {
    await browser.close();
  }
}

export async function screenshotToBase64(
  url: string,
  viewport: { width: number; height: number; isMobile?: boolean },
): Promise<string> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    const buf = (await page.screenshot({ type: "png" })) as Buffer;
    return buf.toString("base64");
  } finally {
    await browser.close();
  }
}
