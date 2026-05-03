---
name: diff-text-rows-vs-vasileios
description: Quantifiziert mm-Drift zwischen App-PDF und Vasileios-Referenz-PNG fuer eine bestimmte Page durch white-text-row-Detection. Wraps die wiederholte Inline-Python-Sequenz aus M11-M13. Args - auditId pageNum [templateId] [xMin] [xMax]. xMin/xMax in pixel grenzen den Spalten-Scan ein (default full-content 160-1500). Default templateId=default.
---

# diff-text-rows-vs-vasileios

Wenn ein Page-Builder gebaut oder angepasst wurde, ist die wichtigste Drift-Frage nicht "rendert es ueberhaupt" sondern "wie weit weichen die einzelnen Text-Rows von Vasileios' Original ab". M11-M13 haben jedes Mal ~3-5x den gleichen Inline-Python-Block fuer drift-detection geschrieben. Dieser Skill abstrahiert das.

## Args

Format: `<auditId> <pageNum> [templateId] [xMin] [xMax]`.

- `auditId`: Pflicht. Audit dessen PDF gerendert werden soll. z.B. `vasileios-m13`.
- `pageNum`: Pflicht. Page-Index 1-20 — wird sowohl gegen App-PDF als auch gegen `docs/measurements/page-NN.png` gematcht.
- `templateId`: Optional, default `default`.
- `xMin`, `xMax`: Optional, Pixel-Range fuer Column-Scan. Default `160 1500` (full content area).
  Nutze custom range fuer 2-Spalten-Layouts:
  - `160 700` = LEFT-column (z.B. M13 Page 20 left-col text)
  - `1100 1500` = RIGHT-column (z.B. M13 Page 20 right-col)

Beispiele:
- `vasileios-m13 19` → Drift-Tabelle Page 19 full-content
- `vasileios-m13 20 default 160 700` → Page 20 nur LEFT-Spalte (Body + outroItalic + ps)
- `vasileios-m11 15 default` → Page 15 (M11 Score-Donut + Mini-Donuts + Resource-Tiles)

## Voraussetzungen

```bash
test -f "data/audits/${AUDIT_ID}.json" || { echo "FEHLT: data/audits/${AUDIT_ID}.json"; exit 1; }
test -f "docs/measurements/page-$(printf '%02d' "${PAGE_NUM}").png" || { echo "FEHLT: Reference-PNG"; exit 1; }
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:3000/api/health  # muss 200 sein
python3 -c "import numpy" 2>/dev/null || { echo "FEHLT numpy: pip install numpy"; exit 1; }
```

## Schritte

### 1. App-PDF rendern + Page-PNG croppen

```bash
AUDIT_ID="$1"; PAGE_NUM="$2"; TEMPLATE_ID="${3:-default}"
curl -sS -o "/tmp/diff-${AUDIT_ID}.pdf" \
  "http://localhost:3000/api/generate-pdf?auditId=${AUDIT_ID}&templateId=${TEMPLATE_ID}" \
  -w "PDF: HTTP %{http_code} %{size_download} bytes\n" --max-time 90

pdftoppm -r 200 -f "${PAGE_NUM}" -l "${PAGE_NUM}" \
  "/tmp/diff-${AUDIT_ID}.pdf" "/tmp/diff-app-page"
sips -s format png "/tmp/diff-app-page-$(printf '%d' "${PAGE_NUM}").ppm" \
  --out "/tmp/diff-app-page-${PAGE_NUM}.png" >/dev/null 2>&1 || \
  convert "/tmp/diff-app-page-$(printf '%d' "${PAGE_NUM}").ppm" "/tmp/diff-app-page-${PAGE_NUM}.png"
```

Hinweis: `pdftoppm` benennt Output mit nicht-gepaddetem Index (`-19.ppm`, `-20.ppm`). Das `printf` ist dazu da.

### 2. Drift-Tabelle berechnen

```bash
AUDIT_ID="$1" PAGE_NUM="$2" XMIN="${4:-160}" XMAX="${5:-1500}" python3 <<'PY'
import os
import numpy as np
from PIL import Image

audit_id = os.environ["AUDIT_ID"]
page_num = int(os.environ["PAGE_NUM"])
x_min = int(os.environ["XMIN"])
x_max = int(os.environ["XMAX"])

app_path = f"/tmp/diff-app-page-{page_num}.png"
ref_path = f"docs/measurements/page-{page_num:02d}.png"

def text_rows(img, x_min, x_max, y_min_mm=20, y_max_mm=280, threshold=20, density_floor=60):
    """White-text density scan per row, returns list of (y_start_mm, y_end_mm, density)."""
    arr = np.array(img); H, W = arr.shape[:2]; PX = W / 210.0
    region = arr[int(y_min_mm * PX):int(y_max_mm * PX), x_min:x_max]
    is_w = (region[:,:,0] > 200) & (region[:,:,1] > 200) & (region[:,:,2] > 200)
    density = is_w.sum(axis=1)
    runs, in_run, st = [], False, None
    for i, d in enumerate(density):
        if d > threshold:
            if not in_run: st, in_run = i, True
        else:
            if in_run:
                avg = int(density[st:i].mean())
                runs.append((y_min_mm + st / PX, y_min_mm + (i - 1) / PX, avg))
                in_run = False
    if in_run:
        avg = int(density[st:].mean())
        runs.append((y_min_mm + st / PX, y_min_mm + (len(density) - 1) / PX, avg))
    return [r for r in runs if r[2] >= density_floor]

app = Image.open(app_path)
ref = Image.open(ref_path)
ra = text_rows(app, x_min, x_max)
rr = text_rows(ref, x_min, x_max)

print(f"Page {page_num} drift comparison (x range {x_min}-{x_max}px):")
print(f"  App: {app_path}")
print(f"  Ref: {ref_path}")
print()
print(f"  {'#':>3}  {'App y_start':>12}  {'Ref y_start':>12}  {'Δ':>8}  Status")
print(f"  {'-'*3}  {'-'*12}  {'-'*12}  {'-'*8}  ------")

worst = 0.0
warn_count = 0
fail_count = 0
for i in range(max(len(ra), len(rr))):
    a = ra[i][0] if i < len(ra) else None
    r = rr[i][0] if i < len(rr) else None
    if a is None and r is None:
        continue
    if a is None or r is None:
        flag = "MISMATCH (App lines != Ref lines)"
        a_str = f"{a:.2f}" if a is not None else "—"
        r_str = f"{r:.2f}" if r is not None else "—"
        delta = "—"
        fail_count += 1
    else:
        d = a - r
        worst = max(worst, abs(d))
        if abs(d) < 2.5:
            flag = "✓"
        elif abs(d) < 5:
            flag = "⚠"
            warn_count += 1
        else:
            flag = "✗"
            fail_count += 1
        a_str = f"{a:.2f}"
        r_str = f"{r:.2f}"
        delta = f"{d:+.2f}mm"
    print(f"  {i+1:>3}  {a_str:>12}  {r_str:>12}  {delta:>8}  {flag}")

print()
print(f"Summary: {len(ra)} app rows, {len(rr)} ref rows, worst drift {worst:.2f}mm")
print(f"  ✓ unter 2.5mm: {len(ra) - warn_count - fail_count}")
print(f"  ⚠ 2.5-5mm: {warn_count}")
print(f"  ✗ ueber 5mm oder mismatch: {fail_count}")

if worst < 2.5 and fail_count == 0:
    print(f"\nVerdict: drift unter 2.5mm in allen {len(ra)} rows ✓")
elif worst < 5 and fail_count == 0:
    print(f"\nVerdict: drift unter 5mm, akzeptabel als Mikro-Differenz ⚠")
else:
    print(f"\nVerdict: drift > 5mm in {fail_count} row(s) — Layout-Korrektur empfohlen ✗")
PY
```

### 3. Output

Drift-Tabelle pro Text-Row mit ✓/⚠/✗ pro Row, plus Summary. Beispiel-Output:

```
Page 19 drift comparison (x range 160-1500px):
  App: /tmp/diff-app-page-19.png
  Ref: docs/measurements/page-19.png

    #   App y_start   Ref y_start         Δ  Status
  ---  ------------  ------------  --------  ------
    1         39.60         40.60   -1.00mm  ✓
    2         52.60         53.90   -1.30mm  ✓
    3         68.50         69.60   -1.10mm  ✓
    ...

Summary: 10 app rows, 10 ref rows, worst drift 1.30mm
  ✓ unter 2.5mm: 10
  ⚠ 2.5-5mm: 0
  ✗ ueber 5mm oder mismatch: 0

Verdict: drift unter 2.5mm in allen 10 rows ✓
```

## Wann nutzen

- **Nach jedem Page-Builder-Update** in M4-M13 (oder zukuenftigen M14+ wenn weitere Pages dazukommen) zur quantitativen Drift-Pruefung gegen Vasileios. Schneller als `pdf-verifier`-Subagent (5s vs 30s) und gibt konkrete mm-Werte.
- **Nach lineHeight/fontSize-Aenderungen** an einem Builder. M13 hat lineHeight von 1.5 auf 1.65 gebumped wegen Vasileios' breiteren line-spacing — der Drift-Check vorher/nachher zeigte sofort ob der Bump die Drift unter 4mm bringt.
- **Beim Tuning von 2-Spalten-Layouts** wo `xMin`/`xMax` einsetzbar sind (z.B. M13 Page 20 left-only oder right-only).

## Hinweise

- Das Skript geht von `next dev` ausfuehrend auf localhost:3000 aus. Wenn nicht: erst `/verify-app`.
- White-text-detection greift NUR fuer weisse Texte (R/G/B > 200). Cyan-Texte (z.B. headlines, ctaCyan) werden NICHT erfasst — siehe M13 Reibungspunkt "thankYou-color-discrepancy". Wenn du cyan-Drift pruefen willst, das Skript kopieren und `is_w` auf cyan-detection anpassen.
- Drift > 5mm bedeutet meist: line-spacing-mismatch ODER Text-Bind hat verschiedene Wort-Anzahl (App body 4 lines vs Ref body 6 lines → row-Index-misalignment, nicht echte Drift). Bei row-count-mismatch: pruef ob seed-Audit-Texte mit Vasileios' Original-Texten matchen.
- Bei Re-Run nach Builder-Aenderung: `/tmp/diff-*.png` werden ueberschrieben, Re-Seed des default-Templates (`npx tsx scripts/seed-default-template.ts`) ist VOR dem Re-Render noetig wenn page-builders.ts geaendert wurde.
