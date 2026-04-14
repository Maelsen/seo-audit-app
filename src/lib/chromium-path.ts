import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

let cached: { executablePath: string; useSparticuzArgs: boolean } | null = null;

export async function resolveChromiumExecutable(
  sparticuzFallback: () => Promise<string>,
): Promise<{ executablePath: string; useSparticuzArgs: boolean }> {
  if (cached) return cached;

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    cached = { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, useSparticuzArgs: false };
    return cached;
  }

  if (process.platform === "darwin") {
    cached = {
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      useSparticuzArgs: false,
    };
    return cached;
  }

  for (const p of CANDIDATES) {
    if (existsSync(p)) {
      cached = { executablePath: p, useSparticuzArgs: false };
      return cached;
    }
  }

  try {
    const which = execSync("which chromium || which chromium-browser || which google-chrome", {
      encoding: "utf8",
    }).trim();
    if (which) {
      cached = { executablePath: which, useSparticuzArgs: false };
      return cached;
    }
  } catch {
    // fall through
  }

  const sparticuz = await sparticuzFallback();
  cached = { executablePath: sparticuz, useSparticuzArgs: true };
  return cached;
}
