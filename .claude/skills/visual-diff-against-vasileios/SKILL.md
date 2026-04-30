---
name: visual-diff-against-vasileios
description: Render the current app PDF and Vasileios' reference PDF side-by-side at 200 DPI, then run the pdf-verifier subagent for a structured drift report. Wraps the manual curl→pdftoppm→subagent-prompt sequence. Args - audit-id, optional template-id, app-page-range, ref-page-range.
---

# visual-diff-against-vasileios

Pixel-/Style-Diff zwischen dem App-PDF und Vasileios' Referenz-PDF. Wickelt den existing `pdf-verifier` Subagent in eine deterministische Sequenz.

## Args

Format: `<auditId> [templateId] [appPages] [refPages]`.

Beispiele:
- `adc273ac-035f-4fde-ab11-6d6e8ab44be9 default 1-2 1-2` — Cover + Gesamtsituation gegen Vasileios Page 1-2
- `adc273ac default 4-4 4-4` — nur Page 4 (comparisonTable / "Wo du sein koenntest")
- `adc273ac default 13-13 13-13` — nur Page 13 (pieChart / "Aufschluesselung Seitengroesse")

Defaults: `templateId=default`, `appPages=1-2`, `refPages=1-2`.

## Mapping App-Pages → Vasileios-Pages

In der Regel 1:1 (App-Page-N entspricht Vasileios-Page-N), weil das App-Template auf 20 Pages spiegelt. Ausnahmen: M2-Smoke-Setups wie `m2-smoke` haben alles auf 1 Page kombiniert — dort die Mappings explizit angeben.

| App-Page | Vasileios-Page | Inhalt | Milestone |
|---|---|---|---|
| 1 | 1 | Cover | M4 |
| 2 | 2 | Gesamtsituation & Diagnose | M4 |
| 3 | 3 | Top 3 Risiken | M5 |
| 4 | 4 | Wo du sein koenntest (comparisonTable) | M5 |
| 5-6 | 5-6 | On-Page SEO (2 Pages, Page 6 = arrowBulletList) | M6 |
| 7-8 | 7-8 | UX & Conversion | M7 |
| 9-10 | 9-10 | Seitenstruktur & Content | M8 |
| 11-12 | 11-12 | Lokales SEO | M9 |
| 13-14 | 13-14 | Performance (Page 13 = pieChart) | M10 |
| 15-16 | 15-16 | Links & Autoritaet | M11 |
| 17-18 | 17-18 | Phasenplan | M12 |
| 19-20 | 19-20 | Zusammenfassung + Inhaber | M13 |

## Schritte

### 1. App-PDF generieren

```bash
AUDIT="$1"; TEMPLATE="${2:-default}"; APP_PAGES="${3:-1-2}"; REF_PAGES="${4:-1-2}"
curl -s -o /tmp/vdiff-app.pdf "http://localhost:3000/api/generate-pdf?auditId=${AUDIT}&templateId=${TEMPLATE}" -w "HTTP:%{http_code} time:%{time_total}s\n"
pdfinfo /tmp/vdiff-app.pdf 2>&1 | grep -E "Pages|File size"
```

### 2. Beide PDFs als 200dpi PNGs rendern (Vasileios-Mass)

```bash
rm -f /tmp/vdiff-{app,ref}-page-*.png

APP_FROM=$(echo "$APP_PAGES" | cut -d- -f1); APP_TO=$(echo "$APP_PAGES" | cut -d- -f2)
REF_FROM=$(echo "$REF_PAGES" | cut -d- -f1); REF_TO=$(echo "$REF_PAGES" | cut -d- -f2)

pdftoppm -r 200 -f "$APP_FROM" -l "$APP_TO" /tmp/vdiff-app.pdf /tmp/vdiff-app-page -png
pdftoppm -r 200 -f "$REF_FROM" -l "$REF_TO" "/Users/marlinwiethuechter/Downloads/SEO AUDIT WASCHBÄR SERVICE.pdf" /tmp/vdiff-ref-page -png

ls /tmp/vdiff-*.png
```

### 3. pdf-verifier Subagent aufrufen

Nutze den existing Subagent unter `.claude/agents/pdf-verifier.md` via Agent-Tool mit `subagent_type: "pdf-verifier"`. Uebergib im Prompt:

- `auditId`, `templateId` (siehe args)
- `appPages` und `refPages` (deren Mapping siehst du oben)
- die bereits gerenderten PNG-Pfade in `/tmp/vdiff-{app,ref}-page-*.png` damit der Subagent sie direkt liest statt selber zu generieren

Beispiel-Prompt-Skeleton:

```
Visueller Diff App-PDF vs Vasileios-Referenz.

Inputs (bereits in /tmp gerendert):
- App: /tmp/vdiff-app-page-{N}.png (audit=$AUDIT, template=$TEMPLATE, pages $APP_PAGES)
- Ref: /tmp/vdiff-ref-page-{N}.png (Vasileios pages $REF_PAGES)

Vergleiche systematisch (Header, Footer, Section-Titel, Score-Donuts, Tabellen, Fonts).

Output: ✓ Matches / ✗ Drift / Empfehlung. Halte den Bericht unter 300 Worten.
```

### 4. Bericht zurueck an Haupt-Agent

Subagent gibt einen Markdown-Diff-Bericht zurueck. Falls Drift gefunden: konkrete Fix-Stellen im Page-Builder oder Block-View nennen.

## Output

```
visual-diff:
  App-PDF: 20 pages, 95KB, time 2.4s
  Rendered app: 1-2 → /tmp/vdiff-app-page-{1,2}.png
  Rendered ref: 1-2 → /tmp/vdiff-ref-page-{1,2}.png
  pdf-verifier: <Subagent-Bericht>
```

## Wann nutzen

- Nach jedem Page-Builder-Update in M3-M13 BEVOR der Builder als "fertig" abgehakt wird.
- Wenn du eine Style-Drift bemerkst aber unsicher bist welcher konkrete Wert (Position, Farbe, Spacing) abweicht.
- Vor dem ersten Vasileios-Production-Run als finale Visual-Sanity.

## Hinweise

- Der Subagent ist read-only (Bash + Read), aendert keinen Code. Korrekturen macht der Haupt-Agent nach Erhalt des Berichts.
- Vasileios-Referenz-PDF muss unter `~/Downloads/SEO AUDIT WASCHBÄR SERVICE.pdf` liegen. Falls verschoben: Pfad oben anpassen.
- Skill setzt voraus dass `next dev` laeuft (Health 200).
- 200 DPI ist Pflicht (nicht 100), damit beide PNGs auf identischer Pixel-Skala vergleichbar sind. `docs/measurements/README.md` haelt die Konvertierung fest (1mm = 7.874px bei 200 DPI).
