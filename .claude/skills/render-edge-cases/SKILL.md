---
name: render-edge-cases
description: Render the M2 edge-case smoke template for a specific block type (arrowBulletList, comparisonTable, pieChart). Generates PDF + PNGs from m2-edges template covering all known edge cases for that block (empty arrays, total=0, 1=100%, overflow:shrink, maxItems clip, fixed widths, donut etc). Use when changing a block-view to verify no regression on edge inputs.
---

# render-edge-cases

Edge-Case-Verifikation fuer einen Block-Type. Nutzt das `m2-edges` Audit + Template als Source-of-Truth fuer alle bekannten Edge-Inputs pro Block-Type.

## Args

Format: `<blockType>` — eines von: `arrowBulletList`, `comparisonTable`, `pieChart`, `all`.

Beispiele:
- `arrowBulletList` → rendert Page 1 (empty array, shrink, clip, static-ohne-items)
- `comparisonTable` → rendert Page 2 (0 rows, column.width gesetzt)
- `pieChart` → rendert Page 3 (total=0, 1=100%, Donut)
- `all` → rendert alle 3 Pages

Default falls leer: `all`.

## Mapping blockType → m2-edges Page

| blockType | Page | Edge-Cases |
|---|---|---|
| arrowBulletList | 1 | A=empty array, B=20 items + shrink, C=maxItems=2 clip, D=static binding ohne staticItems |
| comparisonTable | 2 | A=0 rows, B=column.width 50/65/65 + fehlender fieldPath |
| pieChart | 3 | A=total=0, B=1 slice = 100%, C=innerRadius>0 Donut + legend bottom |

## Schritte

### 1. Voraussetzungen pruefen

```bash
# m2-edges audit + template muessen existieren (gitignored, Re-Smoke-Asset aus M2)
test -f "data/audits/m2-edges.json" || echo "FEHLT: data/audits/m2-edges.json"
test -f "data/templates/m2-edges.json" || echo "FEHLT: data/templates/m2-edges.json"
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:3000/api/health
```

Wenn die Files fehlen: das m2-edges Setup wurde aus dem Volume geloescht (z.B. nach M0-style wipe). Dann muss es manuell rekonstruiert werden — die Setup-Schritte stehen in `PROGRESS.md` unter "## 2026-04-30: M2 Block-Primitives" (oder rekonstruier aus den Audit/Template-JSON-Schemas in `src/lib/types.ts` + `src/lib/editor/template-types.ts`).

### 2. Block-Type → Page mappen

```bash
BLOCK_TYPE="${1:-all}"
case "$BLOCK_TYPE" in
  arrowBulletList) PAGES="1-1";;
  comparisonTable) PAGES="2-2";;
  pieChart)        PAGES="3-3";;
  all)             PAGES="1-3";;
  *) echo "Unbekannter blockType: $BLOCK_TYPE"; exit 1;;
esac
```

### 3. PDF generieren + PNGs rendern

```bash
curl -s -o /tmp/edges.pdf "http://localhost:3000/api/generate-pdf?auditId=m2-edges&templateId=m2-edges" -w "HTTP:%{http_code} time:%{time_total}s\n"
pdfinfo /tmp/edges.pdf 2>&1 | grep -E "Pages|File size"

rm -f /tmp/edges-page-*.png
FROM=$(echo "$PAGES" | cut -d- -f1); TO=$(echo "$PAGES" | cut -d- -f2)
pdftoppm -r 100 -f "$FROM" -l "$TO" /tmp/edges.pdf /tmp/edges-page -png
ls /tmp/edges-page-*.png
```

### 4. Visuelle Pruefung

Lies JEDE der erstellten PNGs mit dem `Read` Tool. Pro Edge-Case kurz beurteilen:
- Rendert ohne Crash?
- Erwartetes Verhalten (z.B. leerer Frame bei empty array, full circle bei 100%-slice, Donut-Loch bei innerRadius>0)?
- Keine Label-Kollisionen / Cutoffs?

## Output

```
Edges-PDF: 3 pages, ~91KB, time 2.5s
Block-Type: pieChart → Page 3
- A (total=0): graue Dummy-Circle ✓
- B (1=100%): voller einfarbiger Kreis mit "100%" Label ✓
- C (Donut): Loch, slices in 4 Farben, Legend unten ✓
Keine Regressionen.
```

Bei Bug: PNG explizit benennen + Read.

## Wann nutzen

- VOR jedem Commit der einen Block-View aendert (`*BlockView.tsx` oder relevante Helper).
- Nach Schema-Aenderungen an Block-Types in `template-types.ts`.
- Als Smoke nach M3-M13 wenn Page-Builder die Bloecke in echten Layouts einsetzen.

## Hinweis

Skill setzt voraus dass `next dev` laeuft (Health 200). Wenn nicht: erst `verify-app` Skill ausfuehren oder dev-server neu starten.

Wenn neue Block-Types in spaeteren Milestones kommen: `m2-edges` Template um eine Page pro Block-Type erweitern und Mapping-Tabelle oben anpassen. Halte das Setup pflegbar — eine Page pro Block-Type, alle Edge-Cases drauf.
