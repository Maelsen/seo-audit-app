#!/usr/bin/env node
// Dumpt alle Measurement-Daten pro Seite in lesbare .txt Files
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const m = JSON.parse(
  readFileSync(resolve(process.cwd(), "tmp/legacy-measurements.json"), "utf8"),
);
const OUT = resolve(process.cwd(), "tmp/measurements");
mkdirSync(OUT, { recursive: true });

const NAMES = [
  "cover", "overview", "topRisks", "recommendations",
  "onPageSeo1", "onPageSeo2", "uxConversion", "links1", "links2",
  "usability", "leistung", "social", "lokalesSeo", "thankYou",
];

for (let i = 0; i < m.length; i++) {
  const p = m[i];
  const name = NAMES[i] || `page-${i}`;
  const els = [...p.elements].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  lines.push(`# ${name} (pageIndex=${i}, ${p.elementCount} elements)`);
  for (const e of els) {
    const loc = `y=${e.y.toString().padStart(7)} x=${e.x.toString().padStart(7)} w=${e.width.toString().padStart(6)} h=${e.height.toString().padStart(6)}`;
    if (e.type === "text") {
      lines.push(
        `${loc} TEXT fs=${e.fontSize} fw=${e.fontWeight} c=${e.color} ta=${e.textAlign} lh=${e.lineHeight} tt=${e.textTransform} ls=${e.letterSpacing} ff=${e.fontFamily.substring(0, 15)} | "${e.text.replace(/\n/g, "\\n")}"`,
      );
    } else if (e.type === "shape") {
      lines.push(
        `${loc} SHAPE bg=${e.backgroundColor} br=${e.borderRadius} bi=${e.backgroundImage?.substring(0, 40)}`,
      );
    } else if (e.type === "image") {
      lines.push(`${loc} IMAGE src=${(e.src || "").substring(0, 30)}`);
    } else if (e.type === "svg") {
      lines.push(`${loc} SVG hint=${e.typeHint}`);
    }
  }
  writeFileSync(resolve(OUT, `${name}.txt`), lines.join("\n"));
  console.log(`Wrote ${name}.txt (${els.length} elements)`);
}
