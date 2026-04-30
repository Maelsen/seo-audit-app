---
name: render-pdf-preview
description: Generate a PDF for an audit and render selected pages as PNGs to /tmp so they can be visually inspected with Read. Replaces the manual curl→pdftoppm→Read pattern. Args - audit-id, optional template-id (default - "default"), optional page range (default - "1-3").
---

# render-pdf-preview

PDF-Render-Verifikation lokal. Generiert PDF aus laufendem `next dev` und rendert Pages als PNGs.

## Args

Argumente kommen als String. Format: `<auditId> [templateId] [pageRange]`.

Beispiele:
- `adc273ac-035f-4fde-ab11-6d6e8ab44be9`
- `adc273ac-035f-4fde-ab11-6d6e8ab44be9 default 1-5`
- `bd6273e0-66ba-4dd8-828e-aa67afeb9de5 default 17-18`

Defaults: `templateId=default`, `pageRange=1-3`.

## Schritte

### 1. PDF generieren
```bash
AUDIT="<auditId>"; TEMPLATE="${2:-default}"; PAGES="${3:-1-3}"
curl -s -o /tmp/preview.pdf "http://localhost:3000/api/generate-pdf?auditId=${AUDIT}&templateId=${TEMPLATE}"
pdfinfo /tmp/preview.pdf 2>&1 | grep -E "Pages|File size"
```
Erwartet: HTTP 200 implizit, `Pages: 20` (oder mehr/weniger je nach Template). Bei Fehler: pruefe `tail /tmp/seo-dev.log | grep -E "generate-pdf|Error"` — typischer Fehler ist Audit-not-found (404).

### 2. PNG-Rendering der gewuenschten Pages
```bash
rm -f /tmp/preview-page-*.png
FROM=$(echo "$PAGES" | cut -d- -f1); TO=$(echo "$PAGES" | cut -d- -f2)
pdftoppm -r 80 -f "$FROM" -l "$TO" /tmp/preview.pdf /tmp/preview-page -png
ls /tmp/preview-page-*.png
```
Erwartet: `/tmp/preview-page-NN.png` Dateien.

### 3. Visuelle Pruefung
Oeffne JEDE der erstellten PNGs mit dem `Read` Tool und melde was du siehst. Achte auf:
- Werden Inhalte gerendert oder sind Pages leer? (M3+)
- Position / Layout vs. Vasileios-Referenz unter `docs/measurements/page-NN.png`
- Fonts laden korrekt (sonst sehen Texte nach Times-New-Roman aus)
- Cyan-Footer-Stripe + Header-Logo / "SEO-Audit für ..." an erwarteten Positionen

## Output

Kurze Zusammenfassung:
```
PDF: 20 pages, 10KB, time 2.5s
Rendered pages 1-3 to /tmp/preview-page-{01,02,03}.png
Visual: Page 1 zeigt schwarze A4 mit "AGENT EDITED" zentriert (cyan, ~24pt). Page 2/3 leer (erwartet bis M4).
```
Bei Bug: explizit benennen + zeige relevante PNG via Read.

## Hinweis

Skill setzt voraus dass `next dev` laeuft (Health 200). Wenn nicht: erst `verify-app` Skill ausfuehren oder dev-server neu starten.
