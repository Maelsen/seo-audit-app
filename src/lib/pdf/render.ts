import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { resolveChromiumExecutable } from "../chromium-path";

async function launchBrowser() {
  const path = await resolveChromiumExecutable(() => chromium.executablePath());
  return puppeteer.launch({
    executablePath: path.executablePath,
    headless: true,
    args: [...(path.useSparticuzArgs ? chromium.args : []), "--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
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
