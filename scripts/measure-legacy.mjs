import puppeteer from "puppeteer-core";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../tmp");
const OUT_FILE = resolve(OUT_DIR, "legacy-measurements.json");

const URL =
  "http://localhost:3000/api/generate-pdf?auditId=0ba6d3a9-6c5c-4e6f-998f-830fff2757ed&format=html";

const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Convert rgb(r, g, b) or rgba(r, g, b, a) to hex
function rgbToHex(rgb) {
  if (!rgb) return "#000000";
  const match = rgb.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
  );
  if (!match) return rgb;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 1 });

    console.log("Navigating to:", URL);
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);
    console.log("Fonts loaded");

    const rawData = await page.evaluate(() => {
      const pages = Array.from(
        document.querySelectorAll("section.audit-page")
      );
      console.log("Found pages:", pages.length);

      // Helper to check if an element has direct text node children
      function getDirectText(el) {
        let text = "";
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          }
        }
        return text.trim();
      }

      // Helper to check if color is transparent
      function isTransparent(color) {
        if (!color) return true;
        if (color === "transparent" || color === "rgba(0, 0, 0, 0)") return true;
        const match = color.match(
          /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/
        );
        if (match && parseFloat(match[1]) === 0) return true;
        return false;
      }

      // Helper to check if element is visible
      function isVisible(el) {
        const style = getComputedStyle(el);
        if (style.display === "none") return false;
        if (style.visibility === "hidden") return false;
        if (style.opacity === "0") return false;
        return true;
      }

      const allResults = [];

      pages.forEach((pageEl, pageIndex) => {
        const pageRect = pageEl.getBoundingClientRect();
        const pageWidthPx = pageRect.width;
        const scale = 210 / pageWidthPx; // mm per px

        const pageElements = [];

        // Get ALL descendant elements
        const allEls = pageEl.querySelectorAll("*");

        for (const el of allEls) {
          if (!isVisible(el)) continue;

          const rect = el.getBoundingClientRect();
          const relX = (rect.left - pageRect.left) * scale;
          const relY = (rect.top - pageRect.top) * scale;
          const w = rect.width * scale;
          const h = rect.height * scale;

          // Filter out too-small elements
          if (w < 1 || h < 1) continue;

          const tagName = el.tagName.toLowerCase();
          const style = getComputedStyle(el);

          const baseInfo = {
            pageIndex,
            tag: tagName,
            x: Math.round(relX * 100) / 100,
            y: Math.round(relY * 100) / 100,
            width: Math.round(w * 100) / 100,
            height: Math.round(h * 100) / 100,
          };

          // Check what kind of element this is
          if (tagName === "img") {
            pageElements.push({
              ...baseInfo,
              type: "image",
              src: (el.getAttribute("src") || "").substring(0, 50),
              imgWidth: Math.round(w * 100) / 100,
              imgHeight: Math.round(h * 100) / 100,
            });
            continue;
          }

          if (tagName === "svg") {
            // Try to determine a type hint from class or content
            const classes = el.getAttribute("class") || "";
            const firstChild = el.firstElementChild
              ? el.firstElementChild.tagName.toLowerCase()
              : "";
            pageElements.push({
              ...baseInfo,
              type: "svg",
              svgWidth: Math.round(w * 100) / 100,
              svgHeight: Math.round(h * 100) / 100,
              typeHint: classes || firstChild || "unknown",
            });
            continue;
          }

          // Skip children of SVG elements
          if (el.closest("svg") && tagName !== "svg") continue;

          // Check for direct text content
          const directText = getDirectText(el);
          if (directText.length > 0) {
            const fontSizePx = parseFloat(style.fontSize);
            const fontSizePt = Math.round(fontSizePx * 0.75 * 100) / 100;
            const lineHeightRaw = style.lineHeight;
            let lineHeight = lineHeightRaw;
            if (lineHeightRaw.endsWith("px")) {
              lineHeight =
                Math.round(
                  (parseFloat(lineHeightRaw) / fontSizePx) * 100
                ) / 100;
            }

            pageElements.push({
              ...baseInfo,
              type: "text",
              text: directText.substring(0, 200),
              fontFamily: style.fontFamily,
              fontSize: fontSizePt,
              fontWeight: style.fontWeight,
              color: style.color,
              textAlign: style.textAlign,
              lineHeight,
              textTransform: style.textTransform,
              letterSpacing: style.letterSpacing,
            });
            continue;
          }

          // Check for shape elements (div/span with bg color)
          if (
            tagName === "div" ||
            tagName === "span" ||
            tagName === "hr" ||
            tagName === "a" ||
            tagName === "li" ||
            tagName === "ul" ||
            tagName === "section" ||
            tagName === "header" ||
            tagName === "footer" ||
            tagName === "nav" ||
            tagName === "aside"
          ) {
            const bgColor = style.backgroundColor;
            const bgImage = style.backgroundImage;
            const hasBgColor = !isTransparent(bgColor);
            const hasBgImage = bgImage && bgImage !== "none";

            if (hasBgColor || hasBgImage) {
              pageElements.push({
                ...baseInfo,
                type: "shape",
                backgroundColor: bgColor,
                backgroundImage: hasBgImage
                  ? bgImage.substring(0, 80)
                  : "none",
                border: style.border,
                borderRadius: style.borderRadius,
              });
            }
          }
        }

        allResults.push({
          pageIndex,
          pageWidthPx,
          pageHeightPx: pageRect.height,
          pageWidthMm: 210,
          pageHeightMm: Math.round(pageRect.height * scale * 100) / 100,
          elementCount: pageElements.length,
          elements: pageElements,
        });
      });

      return allResults;
    });

    // Post-process: convert rgb colors to hex
    for (const pageData of rawData) {
      for (const el of pageData.elements) {
        if (el.type === "text" && el.color) {
          el.color = rgbToHex(el.color);
        }
        if (el.type === "shape" && el.backgroundColor) {
          el.backgroundColor = rgbToHex(el.backgroundColor);
        }
      }
    }

    // Summary
    const totalElements = rawData.reduce(
      (sum, p) => sum + p.elementCount,
      0
    );
    console.log(`\nTotal pages: ${rawData.length}`);
    console.log(`Total elements: ${totalElements}`);
    console.log("\nElements per page:");
    for (const p of rawData) {
      const byType = {};
      for (const el of p.elements) {
        byType[el.type] = (byType[el.type] || 0) + 1;
      }
      const breakdown = Object.entries(byType)
        .map(([t, c]) => `${t}:${c}`)
        .join(", ");
      console.log(
        `  Page ${p.pageIndex}: ${p.elementCount} elements (${breakdown})`
      );
    }

    await writeFile(OUT_FILE, JSON.stringify(rawData, null, 2), "utf-8");
    console.log(`\nSaved to ${OUT_FILE}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
