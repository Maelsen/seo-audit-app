---
name: setup-domain-edge-test
description: Generiert 3 Test-Audits mit kurzen, mittellangen und langen Domain-URLs aus einem Base-Audit, rendert pro Variante ein PDF + cropped Header-PNG. Faengt domain-laengen-abhaengiges Wrap-Verhalten in TextBlocks (z.B. Subline "fuer {domain}") ab. Args - baseAuditId [templateId]. Default templateId=m3-chrome.
---

# setup-domain-edge-test

Domain-Strings koennen unterschiedlich lang sein (z.B. `x.de` vs. `www.allerlaengste-firmenwebsite-im-internet.de`). TextBlocks die `{domain}` aufloesen (M3 chrome-url, M4 cover-Domain etc.) reagieren auf das mit Wrap, Truncate oder Layout-Drift. Dieser Skill generiert 3 Test-Audit-JSONs und rendert pro Variante ein Crop des betroffenen Bereichs.

## Args

Format: `<baseAuditId> [templateId]`.

- `baseAuditId`: Pflicht. Audit-JSON dessen Inhalte (sections, scores, screenshots) als Source dienen — wird kopiert und nur `url` + `id` ueberschrieben. Typisch `m2-smoke`.
- `templateId`: Optional, Default `m3-chrome`. Welches Template gegen die 3 URL-Varianten gerendert wird.

## Generierte Test-URLs

| Variante | URL | Domain-chars | Erwartung |
|---|---|---|---|
| short | `https://x.de` | 4 | passt in 1 Line, viel Whitespace |
| medium | `https://www.beispielfirma.de` | 21 | passt in 1 Line, fast Frame-Breite |
| long | `https://www.allerlaengste-firmenwebsite-im-internet.de` | 49 | wraps auf 2 Lines (M3 dokumentiert) |

## Schritte

### 1. Voraussetzungen

```bash
BASE_AUDIT="$1"; TEMPLATE_ID="${2:-m3-chrome}"
test -f "data/audits/${BASE_AUDIT}.json" || { echo "FEHLT: data/audits/${BASE_AUDIT}.json"; exit 1; }
test -f "data/templates/${TEMPLATE_ID}.json" || { echo "FEHLT: data/templates/${TEMPLATE_ID}.json"; exit 1; }
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:3000/api/health
```

### 2. Test-Audits erzeugen

```bash
BASE_AUDIT="$1"
python3 <<PY
import json, os, shutil
base = json.load(open(f'data/audits/${BASE_AUDIT}.json'))
variants = [
    ("short",  "https://x.de"),
    ("medium", "https://www.beispielfirma.de"),
    ("long",   "https://www.allerlaengste-firmenwebsite-im-internet.de"),
]
for name, url in variants:
    aid = f"domain-edge-{name}"
    a = dict(base)
    a["id"] = aid
    a["url"] = url
    json.dump(a, open(f"data/audits/{aid}.json", "w"), indent=2)
    print(f"created data/audits/{aid}.json -> {url}")
PY
```

### 3. PDF + Header-Crop pro Variante

```bash
TEMPLATE_ID="${2:-m3-chrome}"
for name in short medium long; do
  curl -sS -o "/tmp/domain-${name}.pdf" \
    "http://localhost:3000/api/generate-pdf?auditId=domain-edge-${name}&templateId=${TEMPLATE_ID}" \
    -w "domain-edge-${name}: HTTP %{http_code} %{size_download} bytes\n"
  pdftoppm -r 200 -f 1 -l 1 "/tmp/domain-${name}.pdf" "/tmp/domain-${name}-page" -png
done
ls /tmp/domain-*-page-*.png
```

### 4. Header-Region croppen (top 40mm = top 315 px @ 200dpi)

```bash
python3 <<'PY'
from PIL import Image
import os
for name in ["short", "medium", "long"]:
    src = f"/tmp/domain-{name}-page-1.png"
    if not os.path.exists(src): continue
    img = Image.open(src)
    W, H = img.size
    # Top 40mm = ~315 px bei 200dpi (1mm = 7.874px)
    crop = img.crop((0, 0, W, 315))
    out = f"/tmp/domain-{name}-header.png"
    crop.save(out)
    print(f"cropped {out}: {crop.size[0]}x{crop.size[1]}px")
PY
ls /tmp/domain-*-header.png
```

### 5. Lese alle 3 Crops mit `Read`

Lies `/tmp/domain-short-header.png`, `/tmp/domain-medium-header.png`, `/tmp/domain-long-header.png` einzeln mit dem `Read`-Tool. Pro Variante kurz beurteilen:

- **short**: "fuer x.de" — Subline kurz, sollte sauber center-aligned wirken.
- **medium**: "fuer www.beispielfirma.de" — Subline ~Frame-Breite, sieht symmetrisch unter "SEO-Audit" aus.
- **long**: "fuer www.allerlaengste-firmenwebsite-im-internet.de" — Subline wraps auf 2 Lines im 64mm-Frame. Erwartet, akzeptabel.

### 6. Cleanup

```bash
rm -f data/audits/domain-edge-short.json data/audits/domain-edge-medium.json data/audits/domain-edge-long.json
rm -f /tmp/domain-*.pdf /tmp/domain-*-page-*.png /tmp/domain-*-header.png
```

## Output

Kompakte Tabelle:

```
Domain-Edge-Test gegen Template m3-chrome (audit base: m2-smoke):

  short  (4 chars)  → 1 line, center-aligned ✓
  medium (21 chars) → 1 line, fast Frame-Breite ✓
  long   (49 chars) → 2-line wrap, kein crash ✓

Bekannte Layout-Limitation: Subline wrappt bei >32 chars in 64mm-Frame
mit fontSize 9pt. Bei realen Audit-Domains (15-30 chars) tritt das nicht auf.
```

Bei Crash oder unerwartetem Layout: PNG-Pfade explizit benennen + Findings melden, NICHT cleanen damit der User selbst nachschauen kann.

## Wann nutzen

- Nach jedem neuen TextBlock der `{domain}` oder andere variable Audit-Felder aufloest (M4 Cover Domain, M13 Inhaber-URL etc.)
- Wenn ein Vasileios-Vergleich auf seiner Domain (waschbaer-service.de, 22 chars) gut aussieht und du sicherstellen willst dass es bei kuerzeren oder laengeren Domains nicht bricht
- Vor M14 als finaler Edge-Sweep ueber alle text-bound Pages

## Hinweis

Setzt voraus dass `next dev` laeuft (Health 200). Audits werden in `data/audits/` angelegt (gitignored, ist OK). Cleanup-Step nicht vergessen — sonst sammeln sich Test-Audits an und das `default`-Template-Listing zeigt sie als auswaehlbare Audit-IDs.
