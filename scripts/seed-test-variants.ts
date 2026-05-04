#!/usr/bin/env tsx
// Generiert 4 simulierte Test-Audit-JSONs in data/audits/test-*.json
// fuer das full-fidelity-test System. Variante 5 (test-real-ai) wird
// separat erzeugt durch echten /api/upload Call mit Live-AI.
//
// Varianten:
//   test-full           — Vasileios-seed, alle Felder voll, overallScore=C
//   test-ai-realistic   — simuliert AI-Output mit leeren Optional-Feldern
//   test-long-grade     — overallScore=C+, sections.*.score 2-Zeichen → Bug 3
//   test-high-recos     — recommendations.length=127 → Bug 4 Button-Center
//
// Re-uses deepMerge + Vasileios-Texte aus seed-vasileios-audit.ts via spawn.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();

function loadAudit(id: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(cwd, `data/audits/${id}.json`), "utf-8"));
}

function saveAudit(id: string, audit: Record<string, unknown>): void {
  audit.id = id;
  audit.updatedAt = new Date().toISOString();
  writeFileSync(
    resolve(cwd, `data/audits/${id}.json`),
    JSON.stringify(audit, null, 2),
    "utf-8",
  );
  console.log(`Wrote test-variant ${id}`);
}

// 1. test-full: re-seed mit allen Vasileios-Daten
function buildFull(): void {
  execSync("tsx scripts/seed-vasileios-audit.ts test-full all", {
    cwd,
    stdio: "inherit",
  });
}

// 2. test-ai-realistic: simuliert AI-Output mit leeren Optional-Feldern
//    (typisches Verhalten wenn keine Tool-Daten vorhanden sind).
//    Pflichtfelder bleiben gefuellt (das pruefen wir mit test-real-ai durch
//    echte AI-Generierung — wenn AI dort Placeholder leakt, faengt Empty-Block
//    Detector das).
function buildAiRealistic(): void {
  buildVariantFromFull("test-full", "test-ai-realistic", (audit) => {
    // Optional-Felder leeren — keine Pflichtfeld-Placeholder hier
    const sections = audit.sections as Record<string, Record<string, unknown>>;
    if (sections?.seitenstrukturContent) {
      sections.seitenstrukturContent.comparisonImages = [];
      sections.seitenstrukturContent.closingNote = "";
    }
    if (sections?.lokalesSeo) {
      sections.lokalesSeo.schemaMarkupImage = "";
      sections.lokalesSeo.schemaMarkupCaption = "";
    }
    if (sections?.leistung) {
      sections.leistung.findings = [];
    }
    if (sections?.links) {
      sections.links.findings = [];
    }
    for (const key of ["onpageSeo", "uxConversion", "leistung"]) {
      if (sections?.[key]) sections[key].closingNote = "";
    }
  });
}

// 3. test-long-grade: 2-Zeichen-Noten ueberall — fuer ScoreCircle-Overflow-Test
function buildLongGrade(): void {
  buildVariantFromFull("test-full", "test-long-grade", (audit) => {
    audit.overallScore = "C+";
    const sections = audit.sections as Record<string, Record<string, unknown>>;
    const grades = ["B+", "C-", "D-", "B-", "C+", "D+"];
    const keys = ["onpageSeo", "uxConversion", "seitenstrukturContent", "lokalesSeo", "leistung", "links"];
    keys.forEach((k, i) => {
      if (sections?.[k]) sections[k].score = grades[i];
    });
  });
}

// 4. test-high-recos: 127 recommendations → Button-Text "Empfehlungen: 127"
//    Plus zusaetzliche Empfehlungen die wir aus Vasileios bauen + dummies fuellen.
function buildHighRecos(): void {
  buildVariantFromFull("test-full", "test-high-recos", (audit) => {
    const existing = (audit.recommendations as unknown[]) ?? [];
    const target = 127;
    const dummies: unknown[] = [];
    for (let i = existing.length; i < target; i++) {
      dummies.push({
        title: `Zusaetzliche Empfehlung ${i + 1}`,
        priority: i % 3 === 0 ? "hoch" : i % 3 === 1 ? "mittel" : "niedrig",
        description: `Dummy-Empfehlung fuer Test-High-Recos Variant.`,
      });
    }
    audit.recommendations = [...existing, ...dummies];
  });
}

function buildVariantFromFull(
  baseId: string,
  variantId: string,
  patch: (audit: Record<string, unknown>) => void,
): void {
  const base = loadAudit(baseId);
  const audit = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  patch(audit);
  saveAudit(variantId, audit);
}

function main(): void {
  console.log("=== seed-test-variants ===");
  buildFull();
  buildAiRealistic();
  buildLongGrade();
  buildHighRecos();
  console.log("Done. 4 simulated variants written to data/audits/test-*.json");
  console.log("(test-real-ai wird separat durch full-fidelity-test.ts erstellt)");
}

main();
