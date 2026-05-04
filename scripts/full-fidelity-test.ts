#!/usr/bin/env tsx
// Full-Fidelity Visual Test System
//
// 1. Health-Check next dev (200)
// 2. seed-test-variants ausfuehren (4 simulierte Audits)
// 3. test-real-ai erzeugen via /api/upload mit Live-AI (optional, env-gated)
// 4. Pro Variante: PDF rendern + pages als PNG zerlegen
// 5. Side-by-Side mit Vasileios-Referenz bauen
// 6. Bug-hunts ausfuehren
// 7. HTML-Report generieren
// 8. open Report bei FAIL
//
// Args: keine
// Env: SKIP_REAL_AI=1 ueberspringt test-real-ai (default: aktiviert wenn ANTHROPIC_API_KEY gesetzt)
// Output: "Full-Fidelity Test: X bugs found across N variants × 20 pages"

import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const FFT_DIR = "/tmp/fft";
const REF_DIR = resolve(cwd, "docs/measurements");
const TEMPLATE = resolve(cwd, "data/templates/default.json");
const APP = "http://localhost:3000";

const SIMULATED_VARIANTS: string[] = [
  "test-full",
  "test-ai-realistic",
  "test-long-grade",
  "test-high-recos",
];
const REAL_AI_VARIANT = "test-real-ai";

function step(label: string): void {
  console.log(`\n=== ${label} ===`);
}

function healthCheck(): void {
  step("Health-Check");
  try {
    const r = execSync(`curl -s -o /dev/null -w "%{http_code}" ${APP}/api/health`).toString();
    if (r.trim() !== "200") throw new Error(`health=${r}`);
    console.log("✓ next dev running");
  } catch (e) {
    console.error(`✗ next dev nicht erreichbar (${e}). Starte mit 'npm run dev' und retry.`);
    process.exit(1);
  }
}

function seedDefaultTemplate(): void {
  step("Re-seed default.json aus aktuellem BUILDERS-Map");
  // Wichtig: page-builders.ts Aenderungen brauchen explizites Re-Seed,
  // sonst rendert das alte default.json. Kein --if-missing hier.
  execSync("tsx scripts/seed-default-template.ts", { cwd, stdio: "inherit" });
}

function seedSimulated(): void {
  step("Seed simulierte Test-Varianten");
  execSync("tsx scripts/seed-test-variants.ts", { cwd, stdio: "inherit" });
}

function seedRealAi(): boolean {
  if (process.env.SKIP_REAL_AI === "1") {
    console.log("⊘ test-real-ai uebersprungen (SKIP_REAL_AI=1)");
    return false;
  }
  if (!process.env.ANTHROPIC_API_KEY && !readEnvLocal().ANTHROPIC_API_KEY) {
    console.log("⊘ test-real-ai uebersprungen (ANTHROPIC_API_KEY fehlt)");
    return false;
  }
  step("Seed test-real-ai (echtes AI-Audit, kostet ~$0.30)");

  const body = {
    url: "https://www.eme-gebaeudereinigung.de",
    projectName: "EME Test (full-fidelity)",
  };
  // POST /api/upload als JSON ohne Files (CSV/PDF optional)
  // Endpoint streamt SSE — wir lesen bis "result"-event und holen auditId
  const tmpFile = `${FFT_DIR}/upload-resp.txt`;
  try {
    execSync(
      `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(body)}' ${APP}/api/upload --max-time 240 -o ${tmpFile}`,
      { cwd, stdio: "inherit" },
    );
  } catch {
    console.warn("✗ test-real-ai upload failed, fallback skip");
    return false;
  }

  const resp = readFileSync(tmpFile, "utf-8");
  // SSE: extrahiere "auditId" aus letztem result-event
  const match = resp.match(/"auditId":\s*"([a-z0-9-]+)"/i);
  if (!match) {
    console.warn("✗ Konnte auditId nicht aus Upload-Response extrahieren");
    return false;
  }
  const realAuditId = match[1];

  // Rename: data/audits/{realAuditId}.json → data/audits/test-real-ai.json
  const src = resolve(cwd, `data/audits/${realAuditId}.json`);
  const dst = resolve(cwd, `data/audits/${REAL_AI_VARIANT}.json`);
  if (!existsSync(src)) {
    console.warn(`✗ ${src} fehlt nach Upload`);
    return false;
  }
  const audit = JSON.parse(readFileSync(src, "utf-8"));
  audit.id = REAL_AI_VARIANT;
  writeFileSync(dst, JSON.stringify(audit, null, 2));
  console.log(`✓ test-real-ai gespeichert (Original-ID: ${realAuditId})`);
  return true;
}

function readEnvLocal(): Record<string, string> {
  try {
    const env = readFileSync(resolve(cwd, ".env.local"), "utf-8");
    const out: Record<string, string> = {};
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

function renderPdf(variant: string): boolean {
  const pdfPath = `${FFT_DIR}/${variant}.pdf`;
  try {
    execSync(
      `curl -s -o ${pdfPath} -w "%{http_code}" "${APP}/api/generate-pdf?auditId=${variant}&templateId=default" -m 90`,
      { cwd },
    );
    if (!existsSync(pdfPath)) {
      console.warn(`✗ ${variant}: PDF-Datei nicht erzeugt`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`✗ ${variant}: render-fail (${e})`);
    return false;
  }
}

function pdfToPngs(variant: string): void {
  const pdfPath = `${FFT_DIR}/${variant}.pdf`;
  const dir = `${FFT_DIR}/${variant}`;
  mkdirSync(dir, { recursive: true });
  // pdftoppm bei 200 DPI
  execSync(`pdftoppm -r 200 ${pdfPath} ${dir}/page -png`, { cwd });
  // pdftoppm produziert page-1.png, page-2.png, ... rename auf 01/02 fuer ordering
  for (let p = 1; p <= 20; p++) {
    const old1 = `${dir}/page-${p}.png`;
    const old2 = `${dir}/page-${String(p).padStart(2, "0")}.png`;
    if (existsSync(old1) && !existsSync(old2)) {
      execSync(`mv ${old1} ${old2}`);
    }
  }
}

function buildSideBySides(variant: string): void {
  const dir = `${FFT_DIR}/${variant}`;
  for (let p = 1; p <= 20; p++) {
    const pp = String(p).padStart(2, "0");
    const app = `${dir}/page-${pp}.png`;
    const ref = resolve(REF_DIR, `page-${pp}.png`);
    const out = `${FFT_DIR}/diff-page-${pp}-${variant}.png`;
    if (!existsSync(app) || !existsSync(ref)) continue;
    spawnSync(
      "python3",
      [resolve(cwd, "scripts/lib/build-side-by-side.py"), app, ref, out, `App (${variant})`, "Vasileios Vorlage"],
      { cwd, stdio: "inherit" },
    );
  }
}

function runBugHunts(variants: string[]): unknown[] {
  step("Bug-Hunt-Detektoren");
  const all: unknown[] = [];
  for (const v of variants) {
    const pdfPath = `${FFT_DIR}/${v}.pdf`;
    const dir = `${FFT_DIR}/${v}`;
    if (!existsSync(pdfPath)) continue;
    const result = spawnSync(
      "python3",
      [resolve(cwd, "scripts/lib/bug-hunts.py"), v, pdfPath, dir, TEMPLATE],
      { cwd, encoding: "utf-8" },
    );
    if (result.status !== 0) {
      console.warn(`✗ bug-hunts fehlgeschlagen fuer ${v}: ${result.stderr}`);
      continue;
    }
    try {
      const findings = JSON.parse(result.stdout);
      console.log(`  ${v}: ${findings.length} findings`);
      all.push(...findings);
    } catch (e) {
      console.warn(`✗ Konnte findings JSON nicht parsen fuer ${v}`);
    }
  }
  return all;
}

function renderReport(findings: unknown[]): void {
  step("HTML-Report generieren");
  const findingsPath = `${FFT_DIR}/findings.json`;
  const reportPath = `${FFT_DIR}/test-report.html`;
  writeFileSync(findingsPath, JSON.stringify(findings, null, 2));
  spawnSync(
    "python3",
    [resolve(cwd, "scripts/lib/render-report.py"), findingsPath, reportPath],
    { cwd, stdio: "inherit" },
  );
  console.log(`✓ Report: ${reportPath}`);
}

function main() {
  if (existsSync(FFT_DIR)) {
    rmSync(FFT_DIR, { recursive: true, force: true });
  }
  mkdirSync(FFT_DIR, { recursive: true });

  healthCheck();
  seedDefaultTemplate();
  seedSimulated();

  // test-real-ai (optional)
  seedRealAi();

  const allVariants = [...SIMULATED_VARIANTS];
  if (existsSync(resolve(cwd, `data/audits/${REAL_AI_VARIANT}.json`))) {
    allVariants.push(REAL_AI_VARIANT);
  }

  step("Render PDFs");
  for (const v of allVariants) {
    if (renderPdf(v)) {
      pdfToPngs(v);
      buildSideBySides(v);
      console.log(`  ✓ ${v} (PDF + 20 PNGs + side-by-sides)`);
    }
  }

  const findings = runBugHunts(allVariants);
  renderReport(findings);

  const failCount = findings.filter(
    (f) => (f as { severity: string }).severity === "fail",
  ).length;

  console.log(
    `\nFull-Fidelity Test: ${failCount} bugs found across ${allVariants.length} variants × 20 pages`,
  );
  console.log(`Report: ${FFT_DIR}/test-report.html`);

  if (failCount > 0) {
    try {
      execSync(`open ${FFT_DIR}/test-report.html`);
    } catch {}
    process.exit(1);
  }
  process.exit(0);
}

main();
