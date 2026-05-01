---
name: measure-vasileios-page
description: Vermisst Elemente in Vasileios' Referenz-PDF-Pages (docs/measurements/page-NN.png) per Python+PIL und gibt mm-Bboxes + Hex-Colors aus. Wraps die wiederholte Pixel-Analyse-Sequenz aus M3. Args - pageNum [element]. element ist eines von logo, header-text, footer-stripe, all (Default).
---

# measure-vasileios-page

Vermisst Logo / Header-Text / Footer-Stripes in Vasileios' Referenz-PDF auf mm-genau, ohne dass man die Python-Pixel-Heuristiken jedes Mal selbst zusammenstellen muss.

## Args

Format: `<pageNum> [element]`.

- `pageNum`: 1-20, mappt auf `docs/measurements/page-NN.png`
- `element` (optional, Default `all`): `logo` | `header-text` | `footer-stripe` | `all`

Beispiele:
- `5` → vermisst Logo + Header-Text + Footer auf Page 5
- `5 logo` → nur Logo
- `13 footer-stripe` → nur Footer auf Performance-Page

## Was wird vermessen

| element | Heuristik | Output |
|---|---|---|
| `logo` | non-bg-Pixel im upper-left Quadranten (R<60, G<60, B<60 = bg) | mm-Bbox + Size + Color-Sample |
| `header-text` | strict-cyan im upper-right Quadranten (R<50, G>200, B>200) + getrenntes White-Subline-Bbox | "SEO-Audit" cyan-Bbox + Subline-White-Bbox + text-heights |
| `footer-stripe` | strict-cyan im untersten 12mm der Page, center-column-scan fuer Bands | je Stripe: y-Range + Thickness + Gap zwischen Stripes + bottom-margin |
| `all` | alle drei | kombinierter Output |

Alle Werte in mm bei A4 (1mm = 7.874px @ 200dpi). Page-Width 210mm, Height 297mm.

## Schritte

### 1. Voraussetzungen

```bash
PAGE="$1"; ELEMENT="${2:-all}"
PNG="docs/measurements/page-$(printf '%02d' "$PAGE").png"
test -f "$PNG" || { echo "FEHLT: $PNG"; exit 1; }
python3 -c "from PIL import Image" 2>/dev/null || { echo "Python-PIL fehlt"; exit 1; }
```

### 2. Mess-Skript ausfuehren

Inline-Python via Bash:

```bash
python3 <<'PY'
import sys, os
from PIL import Image

PAGE_NUM = int(os.environ.get("PAGE", "5"))
ELEMENT = os.environ.get("ELEMENT", "all")
PNG = f"docs/measurements/page-{PAGE_NUM:02d}.png"

img = Image.open(PNG).convert("RGB")
W, H = img.size
PX_PER_MM = W / 210.0
px = img.load()

def is_bg(r,g,b):  return r < 60 and g < 60 and b < 60
def is_cyan_strict(r,g,b):  return r < 50 and g > 200 and b > 200
def is_cyan_relaxed(r,g,b): return r < 100 and g > 180 and b > 180
def to_mm(p): return p / PX_PER_MM

def measure_logo():
    xs, ys = [], []
    for y in range(0, int(H*0.10)):
        for x in range(0, int(W*0.30)):
            r,g,b = px[x,y]
            if not is_bg(r,g,b):
                xs.append(x); ys.append(y)
    if not xs:
        return None
    cyan_xs, cyan_ys = [], []
    for y in range(min(ys), max(ys)+1):
        for x in range(min(xs), max(xs)+1):
            r,g,b = px[x,y]
            if is_cyan_relaxed(r,g,b):
                cyan_xs.append(x); cyan_ys.append(y)
    color = None
    if cyan_xs:
        mx, my = cyan_xs[len(cyan_xs)//2], cyan_ys[len(cyan_ys)//2]
        r,g,b = px[mx, my]
        color = f"#{r:02x}{g:02x}{b:02x}"
    return {
        "x_mm": (to_mm(min(xs)), to_mm(max(xs))),
        "y_mm": (to_mm(min(ys)), to_mm(max(ys))),
        "size_mm": (to_mm(max(xs)-min(xs)), to_mm(max(ys)-min(ys))),
        "color_sample": color,
    }

def measure_header_text():
    cx, cy = [], []
    for y in range(0, int(H*0.10)):
        for x in range(int(W*0.55), W):
            r,g,b = px[x,y]
            if is_cyan_strict(r,g,b):
                cx.append(x); cy.append(y)
    cyan = None
    if cx:
        cyan = {
            "x_mm": (to_mm(min(cx)), to_mm(max(cx))),
            "y_mm": (to_mm(min(cy)), to_mm(max(cy))),
            "height_mm": to_mm(max(cy)-min(cy)),
            "right_edge_mm": to_mm(max(cx)),
            "right_margin_mm": to_mm(W - max(cx)),
        }
    wx, wy = [], []
    if cy:
        sub_y_min = max(cy) + 2
        for y in range(sub_y_min, int(H*0.10)):
            for x in range(int(W*0.55), W):
                r,g,b = px[x,y]
                if r > 180 and g > 180 and b > 180:
                    wx.append(x); wy.append(y)
    white = None
    if wx:
        white = {
            "x_mm": (to_mm(min(wx)), to_mm(max(wx))),
            "y_mm": (to_mm(min(wy)), to_mm(max(wy))),
            "right_edge_mm": to_mm(max(wx)),
        }
    return {"cyan": cyan, "white_subline": white}

def measure_footer_stripe():
    xc = W // 2
    bands = []
    in_band, band_start = False, None
    y_start = int(H * (1 - 12/297.0))
    for y in range(y_start, H):
        r,g,b = px[xc, y]
        is_c = is_cyan_relaxed(r,g,b)
        if is_c and not in_band:
            band_start = y; in_band = True
        elif not is_c and in_band:
            bands.append((band_start, y-1)); in_band = False
    if in_band:
        bands.append((band_start, H-1))
    stripes = []
    for i, (s, e) in enumerate(bands):
        stripes.append({
            "stripe": i+1,
            "y_top_mm": to_mm(s),
            "y_bot_mm": to_mm(e),
            "thickness_mm": to_mm(e - s + 1),
        })
    out = {"stripes": stripes}
    if len(bands) >= 2:
        out["gap_mm"] = to_mm(bands[1][0] - bands[0][1] - 1)
    if bands:
        out["bottom_margin_mm"] = to_mm(H - bands[-1][1] - 1)
    if bands:
        s, e = bands[0]
        for x in range(W//2, min(W, W//2+20)):
            r,g,b = px[x, (s+e)//2]
            if is_cyan_relaxed(r,g,b):
                out["color_sample"] = f"#{r:02x}{g:02x}{b:02x}"
                break
    return out

def fmt(v):
    if isinstance(v, tuple):
        return "[{:.2f}, {:.2f}]".format(*v)
    if isinstance(v, float):
        return "{:.2f}".format(v)
    return str(v)

print(f"Page {PAGE_NUM} ({W}x{H}px, 1mm={PX_PER_MM:.3f}px):\n")

if ELEMENT in ("logo", "all"):
    r = measure_logo()
    print("LOGO:")
    if r:
        for k, v in r.items(): print(f"  {k}: {fmt(v)}")
    else:
        print("  no non-bg pixels found")
    print()

if ELEMENT in ("header-text", "all"):
    r = measure_header_text()
    print("HEADER-TEXT:")
    if r["cyan"]:
        print("  cyan-line ('SEO-Audit'):")
        for k, v in r["cyan"].items(): print(f"    {k}: {fmt(v)}")
    else:
        print("  cyan-line: none found")
    if r["white_subline"]:
        print("  white-subline ('fuer ...'):")
        for k, v in r["white_subline"].items(): print(f"    {k}: {fmt(v)}")
    else:
        print("  white-subline: none found")
    print()

if ELEMENT in ("footer-stripe", "all"):
    r = measure_footer_stripe()
    print("FOOTER-STRIPES:")
    for s in r["stripes"]:
        print(f"  stripe {s['stripe']}: y[{s['y_top_mm']:.2f}, {s['y_bot_mm']:.2f}] thickness={s['thickness_mm']:.2f}mm")
    if "gap_mm" in r: print(f"  gap: {r['gap_mm']:.2f}mm")
    if "bottom_margin_mm" in r: print(f"  bottom margin: {r['bottom_margin_mm']:.2f}mm")
    if "color_sample" in r: print(f"  color: {r['color_sample']}")
    print()
PY
```

Setze `PAGE` und `ELEMENT` als Env-Variablen vor dem Heredoc:

```bash
PAGE="$1" ELEMENT="${2:-all}" python3 <<'PY' ...
```

### 3. Output formatieren

Reines Tabellen-Output, keine Prosa. Beispiel:

```
Page 5 (1655x2340px, 1mm=7.881px):

LOGO:
  x_mm: [22.59, 35.40]
  y_mm: [11.55, 22.46]
  size_mm: [12.82, 10.91]
  color_sample: #0dd7ec

HEADER-TEXT:
  cyan-line ('SEO-Audit'):
    x_mm: [155.95, 186.15]
    y_mm: [11.67, 16.11]
    height_mm: 4.44
    right_edge_mm: 186.15
    right_margin_mm: 23.85
  white-subline ('fuer ...'):
    x_mm: [142.16, 199.60]
    y_mm: [16.50, 19.79]
    right_edge_mm: 199.60

FOOTER-STRIPES:
  stripe 1: y[291.34, 293.24] thickness=2.03mm
  stripe 2: y[294.25, 296.16] thickness=2.03mm
  gap: 0.89mm
  bottom margin: 0.63mm
  color: #08f8fc
```

## Wann nutzen

- VOR jedem Page-Builder in M4-M13 wenn neue Vasileios-Pages vermessen werden muessen
- Wenn unsicher ob ein Element wirklich an Position X.Ymm sitzt
- Beim Drift-Quantifizieren nach App-Render: Werte gegen `/api/generate-pdf`-Output halten (das hat das gleiche px-zu-mm Verhaeltnis)

## Hinweis

Die Heuristiken (cyan-strict, bg, cyan-relaxed) sind fuer den Vasileios-Stil kalibriert: helles Cyan auf dunklem Background. Wenn Vasileios eine Page mit anderem Color-Scheme schickt (z.B. weisser Background) muss die Heuristik angepasst werden. Dann am besten direkt im Skill-MD die Schwellen tunen.

PNG-Files wurden in M0 mit `pdftoppm -r 200` aus `~/Downloads/SEO AUDIT WASCHBÄR SERVICE.pdf` gerendert. Falls Vasileios eine neue Version schickt: PDF gleichbenannt austauschen und re-rendern (M0-Steps in PROGRESS.md).
