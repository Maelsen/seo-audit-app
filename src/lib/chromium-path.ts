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

  try {
    const out = execSync(
      "command -v chromium 2>/dev/null; command -v chromium-browser 2>/dev/null; command -v google-chrome 2>/dev/null; true",
      { encoding: "utf8" },
    );
    const paths = out.split("\n").map((s) => s.trim()).filter(Boolean);
    const good = paths.find((p) => !p.startsWith("/usr/bin/") && existsSync(p));
    if (good) {
      cached = { executablePath: good, useSparticuzArgs: false };
      return cached;
    }
  } catch {
    // fall through
  }

  for (const p of CANDIDATES) {
    if (p.startsWith("/usr/bin/chromium")) continue;
    if (existsSync(p)) {
      cached = { executablePath: p, useSparticuzArgs: false };
      return cached;
    }
  }

  const sparticuz = await sparticuzFallback();
  cached = { executablePath: sparticuz, useSparticuzArgs: true };
  return cached;
}
