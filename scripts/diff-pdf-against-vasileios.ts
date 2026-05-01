#!/usr/bin/env node
// scripts/diff-pdf-against-vasileios.ts
//
// Vergleicht eine App-rendered PDF-Page gegen Vasileios' Referenz-PDF auf mm-Pixel-Drift.
// Wraps die Sequenz: PDF-gen via API → pdftoppm → Python-PIL Vermessung → Drift-Tabelle.
//
// Usage: tsx scripts/diff-pdf-against-vasileios.ts <auditId> <templateId> <appPage> <refPage>
//
// Beispiel:
//   tsx scripts/diff-pdf-against-vasileios.ts m2-smoke m3-chrome 1 5
//   → rendert App-PDF von m2-smoke+m3-chrome, vergleicht App-Page-1 vs Vasileios-Page-5

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP_HOST = "http://localhost:3000";
const REF_PDF = join(
  process.env.HOME || "",
  "Downloads",
  "SEO AUDIT WASCHBÄR SERVICE.pdf",
);
const TMP = tmpdir();

function sh(cmd: string, opts: { silent?: boolean } = {}): string {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : ["ignore", "pipe", "pipe"],
  });
}

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function main() {
  const [auditId, templateId, appPageStr, refPageStr] = process.argv.slice(2);
  if (!auditId || !templateId || !appPageStr || !refPageStr) {
    die(
      "usage: tsx scripts/diff-pdf-against-vasileios.ts <auditId> <templateId> <appPage> <refPage>",
    );
  }
  const appPage = Number(appPageStr);
  const refPage = Number(refPageStr);
  if (!Number.isFinite(appPage) || !Number.isFinite(refPage)) {
    die("appPage and refPage must be integers");
  }
  if (!existsSync(REF_PDF)) die(`reference PDF missing: ${REF_PDF}`);

  // 1. App-PDF holen
  const appPdf = join(TMP, `vdiff-app-${auditId}-${templateId}.pdf`);
  console.log(`→ rendering app pdf via ${APP_HOST}/api/generate-pdf ...`);
  sh(
    `curl -sS -o "${appPdf}" "${APP_HOST}/api/generate-pdf?auditId=${encodeURIComponent(auditId)}&templateId=${encodeURIComponent(templateId)}"`,
  );
  if (!existsSync(appPdf)) die(`failed to fetch app pdf to ${appPdf}`);
  const info = sh(`pdfinfo "${appPdf}"`, { silent: true });
  const pagesMatch = info.match(/Pages:\s+(\d+)/);
  console.log(`  app pdf: ${pagesMatch?.[1] ?? "?"} pages`);

  // 2. PNGs rendern (200dpi)
  const appPng = join(TMP, `vdiff-app-page-${appPage}.png`);
  const refPng = join(TMP, `vdiff-ref-page-${String(refPage).padStart(2, "0")}.png`);
  sh(`rm -f "${TMP}/vdiff-app-page-"*.png "${TMP}/vdiff-ref-page-"*.png`);
  sh(
    `pdftoppm -r 200 -f ${appPage} -l ${appPage} "${appPdf}" "${TMP}/vdiff-app-page" -png`,
  );
  sh(
    `pdftoppm -r 200 -f ${refPage} -l ${refPage} "${REF_PDF}" "${TMP}/vdiff-ref-page" -png`,
  );
  // pdftoppm may pad single-digit numbers when needed; resolve actual filenames
  const findPng = (prefix: string): string => {
    const out = sh(`ls "${TMP}/${prefix}-page"*.png 2>/dev/null | head -1`, {
      silent: true,
    }).trim();
    if (!out) die(`could not find rendered PNG for ${prefix}`);
    return out;
  };
  const appPngActual = findPng("vdiff-app");
  const refPngActual = findPng("vdiff-ref");
  console.log(`  app png:  ${appPngActual}`);
  console.log(`  ref png:  ${refPngActual}`);

  // 3. Python-Mess-Skript schreiben + ausfuehren
  const pyScript = join(TMP, "diff-pdf.py");
  writeFileSync(
    pyScript,
    `
from PIL import Image

def measure(path):
    img = Image.open(path).convert("RGB")
    W, H = img.size
    PX_PER_MM = W / 210.0
    px = img.load()

    # NOTE: schwellen sind so gewaehlt dass sowohl Vasileios-Cyan (#08f8fc, #0be2e6)
    # als auch App-Brand-Cyan (#38E1E1, R=56) detected werden.
    def is_bg(r,g,b):  return r < 60 and g < 60 and b < 60
    def is_cyan_strict(r,g,b):  return r < 80 and g > 200 and b > 200
    def is_cyan_relaxed(r,g,b): return r < 100 and g > 180 and b > 180

    def to_mm(p): return p / PX_PER_MM

    out = {"page_w_mm": 210.0, "page_h_mm": H/PX_PER_MM}

    xs, ys = [], []
    for y in range(0, int(H*0.10)):
        for x in range(0, int(W*0.30)):
            r,g,b = px[x,y]
            if not is_bg(r,g,b):
                xs.append(x); ys.append(y)
    if xs:
        out["logo_x"] = (to_mm(min(xs)), to_mm(max(xs)))
        out["logo_y"] = (to_mm(min(ys)), to_mm(max(ys)))
        out["logo_w_mm"] = to_mm(max(xs)-min(xs))
        out["logo_h_mm"] = to_mm(max(ys)-min(ys))

    cx, cy = [], []
    for y in range(0, int(H*0.10)):
        for x in range(int(W*0.55), W):
            r,g,b = px[x,y]
            if is_cyan_strict(r,g,b):
                cx.append(x); cy.append(y)
    if cx:
        out["title_y"] = (to_mm(min(cy)), to_mm(max(cy)))
        out["title_right_mm"] = to_mm(max(cx))
        out["title_h_mm"] = to_mm(max(cy)-min(cy))

    xc = W // 2
    bands = []
    in_band, band_start = False, None
    for y in range(int(H*0.85), H):
        r,g,b = px[xc, y]
        is_c = is_cyan_relaxed(r,g,b)
        if is_c and not in_band:
            band_start = y; in_band = True
        elif not is_c and in_band:
            bands.append((band_start, y-1)); in_band = False
    if in_band: bands.append((band_start, H-1))
    if bands:
        out["stripe1_y_top"] = to_mm(bands[0][0])
        out["stripe1_thick"] = to_mm(bands[0][1] - bands[0][0] + 1)
    if len(bands) >= 2:
        out["stripe2_y_top"] = to_mm(bands[1][0])
        out["stripe2_thick"] = to_mm(bands[1][1] - bands[1][0] + 1)
        out["stripe_gap"] = to_mm(bands[1][0] - bands[0][1] - 1)
    if bands:
        out["bottom_margin_mm"] = to_mm(H - bands[-1][1] - 1)
    return out

import sys, json
app = measure(sys.argv[1])
ref = measure(sys.argv[2])

print(f"{'metric':24}{'ref':>14}{'app':>14}{'drift_mm':>12}")
print("-" * 64)
keys = ["logo_x","logo_y","logo_w_mm","logo_h_mm",
        "title_y","title_right_mm","title_h_mm",
        "stripe1_y_top","stripe1_thick","stripe2_y_top","stripe2_thick",
        "stripe_gap","bottom_margin_mm"]
for k in keys:
    rv = ref.get(k)
    av = app.get(k)
    if rv is None and av is None: continue
    if isinstance(rv, tuple):
        rv_s = f"[{rv[0]:.2f},{rv[1]:.2f}]"
        if av is None:
            print(f"{k:24}{rv_s:>14}{'-':>14}{'-':>12}")
            continue
        d_min = av[0]-rv[0]; d_max = av[1]-rv[1]
        flag = " ✓" if max(abs(d_min), abs(d_max)) < 0.5 else (" ⚠" if max(abs(d_min), abs(d_max)) < 2.0 else " ✗")
        print(f"{k:24}{rv_s:>14}[{av[0]:.2f},{av[1]:.2f}]   {d_min:+.2f}/{d_max:+.2f}{flag}")
    elif isinstance(rv, (int, float)):
        if av is None: continue
        d = av - rv
        flag = " ✓" if abs(d) < 0.5 else (" ⚠" if abs(d) < 2.0 else " ✗")
        print(f"{k:24}{rv:>14.2f}{av:>14.2f}{d:+12.2f}{flag}")
`,
    "utf8",
  );

  console.log(`\n→ measuring + diffing ...\n`);
  const diff = sh(
    `python3 "${pyScript}" "${appPngActual}" "${refPngActual}"`,
    { silent: true },
  );
  console.log(diff);
}

main();
