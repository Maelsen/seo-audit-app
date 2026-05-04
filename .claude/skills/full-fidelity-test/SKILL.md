---
name: full-fidelity-test
description: Render 5 Audit-Varianten × 20 Pages, run pixel-Bug-Hunts gegen Vasileios-Vorlage, schreibt /tmp/fft/test-report.html und öffnet ihn bei FAIL automatisch. Tiefer als /verify-feature für Layout-Änderungen. Run BEFORE jedem "done" claim das Layout ändert.
---

# Full-Fidelity Visual Test

Ein robustes pixel-basiertes Test-System das die 6 typischen Bug-Klassen aktiv sucht statt nur "auf Layout-Sanity" zu prüfen. Wurde gebaut nachdem ein User-Live-Test 6 visuelle Bugs gefunden hat die durch oberflächliche `/verify-feature` Verifikation durchgeschlüpft sind.

## Was es testet

Pro Audit-Variante (5×) und Page (20×):

1. **Note-im-Ring-Check** — ScoreCircle-Glyph darf nicht aus dem Stroke-Radius ragen. Aktiviert primär durch `test-long-grade` (2-Zeichen-Noten `C+`/`B+`/`D-`).
2. **Button-Center-Check** — Empfehlungs-Button-Text-Centroid vs Bg-Centroid (Toleranz 0.5mm horizontal, 0.7mm vertikal). Aktiviert durch `test-high-recos` (3-stellige Counts wie "Empfehlungen: 127").
3. **Empty-Block-Detector** — `pdftotext -layout` sucht nach Placeholder-Strings ("Die Diagnose wird vom Agent generiert", "Wird vom Agent ersetzt", "{audit.", "{{"). Aktiviert durch `test-ai-realistic` + `test-real-ai`.
4. **Cookie-Banner-Detector** — Cover-Page Mid-Zone Pixel-Histogramm; >30% reine weiße Pixel = Banner-Verdacht. Aktiviert durch `test-real-ai` (echter Screenshot).

## Audit-Varianten (alle in `data/audits/test-*.json`)

- **`test-full`** — Vasileios-seed, alle Felder voll, `overallScore=C` (1-Zeichen). Baseline.
- **`test-ai-realistic`** — simuliert AI-Output: `comparisonImages=[]`, `schemaMarkupImage=""`, `findings=[]` in 2 Sections, `closingNote=""` in 3 Sections.
- **`test-long-grade`** — `overallScore=C+`, alle Section-Scores 2-Zeichen (`B+`/`C-`/`D-`/`B-`/`C+`/`D+`).
- **`test-high-recos`** — `recommendations.length=127` → Empfehlungs-Button "Empfehlungen: 127".
- **`test-real-ai`** — echter AI-Audit via `/api/upload` mit Live-Anthropic-API (kostet ~$0.30 + 60s pro Run). Übersprungen wenn `SKIP_REAL_AI=1` oder `ANTHROPIC_API_KEY` fehlt.

## Aufruf

```
tsx scripts/full-fidelity-test.ts
```

Voraussetzung: `npm run dev` läuft (Health 200), `ANTHROPIC_API_KEY` in `.env.local` (für `test-real-ai`, sonst übersprungen).

## Output

```
Full-Fidelity Test: X bugs found across N variants × 20 pages
Report: /tmp/fft/test-report.html
```

Bei `X > 0` öffnet das Skript automatisch `/tmp/fft/test-report.html` (macOS `open`) mit:
- Header: Total Findings + Summary
- Pro Variant: 20 Cells in Grid mit Side-by-Side App | Vasileios PNG (200 DPI)
- Pro Cell: PASS-Badge oder FAIL-Findings mit Detail
- Filter: nur FAILs / alle / nur PASSes

## Bekannte Bug-Patterns die aufgespürt werden

| Bug | Aktiviert durch | Detector |
|---|---|---|
| Cookie-Banner auf Cover | `test-real-ai` | cookie-banner |
| Page 2 Diagnose-Placeholder | `test-real-ai` + `test-ai-realistic` | empty-block |
| Page 4 alt-sentences leer | `test-real-ai` | empty-block |
| Note "C+" ragt aus Donut | `test-long-grade` | note-in-ring |
| "Empfehlungen 18" off-center | `test-high-recos` | button-center |
| Pie-Chart Labels außen statt innen | (manuell, nicht automatisiert — visueller Side-by-Side im Report) | — |

## Wann nutzen

- VOR jedem `commit` der Page-Builders, ScoreCircle-View, PieChart-View oder Screenshot-Pipeline ändert
- VOR jeder Production-Reseed via `/api/admin/reseed-template`
- VOR jeder "done"-Meldung an den User

## Wann NICHT nutzen

- Bei reinen Schema-/Type-Änderungen ohne Visual-Effekt → `/verify-app` reicht
- Bei Editor-UI-Änderungen ohne PDF-Effekt → `/verify-chrome-editor-e2e` ist passender
- Während aktivem Bug-Fix-Iteration nach jedem 1-Zeilen-Fix → zu langsam (~3 Min/Run inklusive AI), erst nach mehreren Fixes batchen

## Was NICHT geprüft wird (bewusst)

- Pie-Chart-Label-Position (innen/außen) — wird visuell im Report sichtbar, kein automatischer Check
- Color-Genauigkeit der ScoreCircle-Farben (Vasileios hat custom-colored Donuts pro Page) — Side-by-Side reicht
- Font-Rendering-Subpixel-Drift — Toleranzen in den Detektoren sind konservativ

## Datei-Inventar

- `scripts/full-fidelity-test.ts` — Entrypoint
- `scripts/seed-test-variants.ts` — 4-Variant-Seeder (5. via /api/upload)
- `scripts/lib/build-side-by-side.py` — App|Vasileios PNG-Combiner
- `scripts/lib/bug-hunts.py` — 4 Pixel-Detektoren
- `scripts/lib/render-report.py` — HTML-Report
- `scripts/lib/parse-template-frames.py` — Helper: mm-Bboxes aus default.json
