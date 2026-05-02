---
name: measure-vasileios-page
description: Vermisst Elemente in Vasileios' Referenz-PDF-Pages (docs/measurements/page-NN.png) per Python+PIL und gibt mm-Bboxes + Hex-Colors aus. Wraps die wiederholte Pixel-Analyse-Sequenz aus M3. Args - pageNum [element] [yMin] [yMax]. element ist eines von logo, header-text, footer-stripe, text-rows, pills, dividers, cyan-region, image-regions, all (Default all). yMin/yMax in mm grenzen Scan ein (nur fuer text-rows/pills/dividers/cyan-region/image-regions).
---

# measure-vasileios-page

Vermisst Layout-Elemente in Vasileios' Referenz-PDF auf mm-genau, ohne dass man die Python-Pixel-Heuristiken jedes Mal selbst zusammenstellen muss. Standard-Chrome (logo, header, footer) plus Custom-Layout (text-rows, pills, dividers, cyan-regions) fuer M5-M13 Page-Builder.

## Args

Format: `<pageNum> [element] [yMin] [yMax]`.

- `pageNum`: 1-20, mappt auf `docs/measurements/page-NN.png`
- `element` (optional, Default `all`): `logo` | `header-text` | `footer-stripe` | `text-rows` | `pills` | `dividers` | `cyan-region` | `image-regions` | `all`
- `yMin`, `yMax`: optional in mm. Nur fuer `text-rows` | `pills` | `dividers` | `cyan-region` | `image-regions` — grenzt den Scan-Bereich ein. Default ist Page-Mid-Range (35mm bis 285mm) damit Chrome ausgeblendet bleibt.

Beispiele:
- `5` → Standard-Chrome auf Page 5 (logo + header-text + footer-stripe)
- `5 logo` → nur Logo
- `4 pills 145 175` → cyan Pills im y-Range 145-175mm (Tabellen-Header auf Page 4)
- `4 dividers 165 285` → horizontale gray Row-Dividers im Tabellen-Bereich
- `3 text-rows 65 230` → alle white-text-Rows im Body-Bereich (fuer Risk-Title/Body-Y-Positionen)
- `4 cyan-region 285 297` → cyan Bereiche im Footer (Stripes-Detection als Cross-Check)
- `10 image-regions 95 190` → Image-Slots auf Page 10 (zwei dunkle cards oben + cyan-Banner unten)

## Was wird vermessen

| element | Heuristik | Output |
|---|---|---|
| `logo` | non-bg-Pixel im upper-left Quadranten (R<60, G<60, B<60 = bg) | mm-Bbox + Size + Color-Sample |
| `header-text` | strict-cyan im upper-right Quadranten (R<50, G>200, B>200) + getrenntes White-Subline-Bbox | "SEO-Audit" cyan-Bbox + Subline-White-Bbox + text-heights |
| `footer-stripe` | strict-cyan im untersten 12mm der Page, center-column-scan fuer Bands | je Stripe: y-Range + Thickness + Gap zwischen Stripes + bottom-margin |
| `text-rows` | white-density-Scan (R+G+B > 600) per row in cols 160-1500 | je Run: y-Range in mm + height + density (text-Heights, line-Spacing) |
| `pills` | cyan-density-Scan (R<150, G>180, B>180) per col-group im yMin/yMax-Bereich | je Pill: x-Range + y-Range in mm + Color-Sample |
| `dividers` | horizontale gray-line-Detection (R==G==B, 50<R<180, >800px wide) | y-Position pro Divider in mm |
| `cyan-region` | cyan-density (R<100, G>200, B>200) per row im yMin/yMax | y-Range jeder Cyan-Region + height + Color-Sample |
| `image-regions` | dark-card-Detection: rechteckige Bereiche mit konsistentem mid-luma-Background (50<R+G+B/3<150, low color-variance) und scharfer Kanten-Abgrenzung gegen page-bg (<60). Erkennt nebeneinanderliegende Image-Slots wie auf Page 10 (zwei dark cards links/rechts + cyan-Banner unten). | je Region: x-Range + y-Range + w/h in mm + bg-Color-Sample |
| `all` | alle Standard-Chrome (logo + header-text + footer-stripe) | kombinierter Output, kein Custom-Layout |

Alle Werte in mm bei A4 (1mm = 7.874px @ 200dpi). Page-Width 210mm, Height 297mm.

## Schritte

### 1. Voraussetzungen

```bash
PAGE="$1"; ELEMENT="${2:-all}"; YMIN="${3:-35}"; YMAX="${4:-285}"
PNG="docs/measurements/page-$(printf '%02d' "$PAGE").png"
test -f "$PNG" || { echo "FEHLT: $PNG"; exit 1; }
python3 -c "from PIL import Image" 2>/dev/null || { echo "Python-PIL fehlt"; exit 1; }
# numpy nur fuer Custom-Layout-Elements noetig
case "$ELEMENT" in
  text-rows|pills|dividers|cyan-region|image-regions)
    python3 -c "import numpy" 2>/dev/null || { echo "FEHLT numpy: pip install numpy"; exit 1; }
    ;;
esac
```

### 2. Mess-Skript ausfuehren

Inline-Python via Bash:

```bash
python3 <<'PY'
import sys, os
from PIL import Image

PAGE_NUM = int(os.environ.get("PAGE", "5"))
ELEMENT = os.environ.get("ELEMENT", "all")
Y_MIN_MM = float(os.environ.get("YMIN", "35"))
Y_MAX_MM = float(os.environ.get("YMAX", "285"))
PNG = f"docs/measurements/page-{PAGE_NUM:02d}.png"

img = Image.open(PNG).convert("RGB")
W, H = img.size
PX_PER_MM = W / 210.0
px = img.load()

def is_bg(r,g,b):  return r < 60 and g < 60 and b < 60
def is_cyan_strict(r,g,b):  return r < 50 and g > 200 and b > 200
def is_cyan_relaxed(r,g,b): return r < 100 and g > 180 and b > 180
def to_mm(p): return p / PX_PER_MM
def from_mm(m): return int(round(m * PX_PER_MM))

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

# ---------- Custom-Layout-Element Heuristiken (M5+) ----------
# Diese brauchen numpy fuer schnelle row/col-Aggregationen

def measure_text_rows():
    import numpy as np
    arr = np.array(img)
    y0 = max(0, from_mm(Y_MIN_MM))
    y1 = min(H, from_mm(Y_MAX_MM))
    region = arr[y0:y1, 160:1500]
    is_w = (region[:,:,0] > 200) & (region[:,:,1] > 200) & (region[:,:,2] > 200)
    density = is_w.sum(axis=1)
    runs = []
    in_run, start = False, None
    for i, d in enumerate(density):
        if d > 30:
            if not in_run: start, in_run = i, True
        else:
            if in_run:
                runs.append((start, i - 1, density[start:i].mean()))
                in_run = False
    if in_run:
        runs.append((start, len(density) - 1, density[start:].mean()))
    return [
        {
            "y_mm": (to_mm(y0 + s), to_mm(y0 + e)),
            "h_mm": to_mm(e - s + 1),
            "density": int(d),
        }
        for (s, e, d) in runs if 4 < (e - s) < 250
    ]

def measure_pills():
    import numpy as np
    arr = np.array(img)
    y0 = max(0, from_mm(Y_MIN_MM))
    y1 = min(H, from_mm(Y_MAX_MM))
    region = arr[y0:y1, :, :]
    is_cyan = (region[:,:,1] > 180) & (region[:,:,2] > 180) & (region[:,:,0] < 150)
    # Mid-y pill detection: pick row with max cyan density
    row_density = is_cyan.sum(axis=1)
    if row_density.max() == 0:
        return {"pills": [], "y_range_mm": None, "color_sample": None}
    mid_y_local = int(row_density.argmax())
    mid_y = y0 + mid_y_local
    # Detect contiguous cyan x-segments at mid_y
    cyan_cols = np.where(is_cyan[mid_y_local])[0]
    pills = []
    if len(cyan_cols):
        groups = np.split(cyan_cols, np.where(np.diff(cyan_cols) > 8)[0] + 1)
        for g in groups:
            if len(g) > 30:
                pills.append({"x_mm": (to_mm(int(g[0])), to_mm(int(g[-1]))),
                              "w_mm": to_mm(len(g))})
    # Pill vertical extent: scan a column inside first pill
    y_top, y_bot = None, None
    if pills:
        x_sample = from_mm((pills[0]["x_mm"][0] + pills[0]["x_mm"][1]) / 2)
        col_cyan = is_cyan[:, x_sample] if x_sample < region.shape[1] else None
        if col_cyan is not None and col_cyan.any():
            ys = np.where(col_cyan)[0]
            y_top = to_mm(y0 + int(ys[0]))
            y_bot = to_mm(y0 + int(ys[-1]))
    color = None
    if pills:
        x_c = from_mm((pills[0]["x_mm"][0] + pills[0]["x_mm"][1]) / 2)
        if x_c < W:
            r,g,b = px[x_c, mid_y]
            color = f"#{r:02x}{g:02x}{b:02x}"
    return {
        "pills": pills,
        "y_range_mm": (y_top, y_bot) if y_top is not None else None,
        "h_mm": (y_bot - y_top) if (y_top is not None and y_bot is not None) else None,
        "color_sample": color,
    }

def measure_dividers():
    import numpy as np
    arr = np.array(img)
    y0 = max(0, from_mm(Y_MIN_MM))
    y1 = min(H, from_mm(Y_MAX_MM))
    region = arr[y0:y1, 160:1500, :]
    # Gray-line detection: per row, count near-gray pixels (R==G==B, mid-luma)
    is_gray = (
        (np.abs(region[:,:,0].astype(int) - region[:,:,1].astype(int)) < 15) &
        (np.abs(region[:,:,1].astype(int) - region[:,:,2].astype(int)) < 15) &
        (region[:,:,0] > 50) & (region[:,:,0] < 180)
    )
    counts = is_gray.sum(axis=1)
    dividers = []
    in_run, start = False, None
    for i, c in enumerate(counts):
        if c > 700:
            if not in_run: start, in_run = i, True
        else:
            if in_run:
                # Use first y of run as divider position (1-2px thick lines)
                dividers.append(to_mm(y0 + start))
                in_run = False
    if in_run:
        dividers.append(to_mm(y0 + start))
    # Deduplicate within ~1mm (anti-aliasing creates 2 adjacent rows)
    out = []
    for d in dividers:
        if not out or (d - out[-1]) > 0.8:
            out.append(d)
    return out

def measure_cyan_region():
    import numpy as np
    arr = np.array(img)
    y0 = max(0, from_mm(Y_MIN_MM))
    y1 = min(H, from_mm(Y_MAX_MM))
    region = arr[y0:y1, :, :]
    is_cyan = (region[:,:,1] > 200) & (region[:,:,2] > 200) & (region[:,:,0] < 100)
    row_density = is_cyan.sum(axis=1)
    bands = []
    in_run, start = False, None
    for i, d in enumerate(row_density):
        if d > 5:
            if not in_run: start, in_run = i, True
        else:
            if in_run:
                bands.append((start, i - 1))
                in_run = False
    if in_run:
        bands.append((start, len(row_density) - 1))
    out = []
    for (s, e) in bands:
        # Color sample at mid-band, cyan-pixel
        mid = (s + e) // 2
        cols_with_cyan = np.where(is_cyan[mid])[0]
        color = None
        if len(cols_with_cyan):
            x_c = int(cols_with_cyan[len(cols_with_cyan)//2])
            r,g,b = px[x_c, y0 + mid]
            color = f"#{r:02x}{g:02x}{b:02x}"
        out.append({
            "y_mm": (to_mm(y0 + s), to_mm(y0 + e)),
            "h_mm": to_mm(e - s + 1),
            "color_sample": color,
        })
    return out

def measure_image_regions():
    """Detect rectangular dark-card / image-slot regions: contiguous areas
    where the average luminance is mid-gray (clearly above page-bg ~46) but
    not full white, and the bbox aspect-ratio is rectangle-like.

    Heuristik:
      1. Build mask of pixels with bg_threshold < lum < highlight_threshold
         (i.e. neither page-bg nor pure-white text).
      2. Within yMin/yMax band, compute per-row x-extent of mask.
      3. Group consecutive rows where mask-density > min_width_px into bands.
      4. Per band, find horizontal x-runs at the band-mid-y (split into
         multiple side-by-side regions if there are gaps > 30px).
      5. Output bbox per region in mm + bg-color sample.
    """
    import numpy as np
    arr = np.array(img)
    y0 = max(0, from_mm(Y_MIN_MM))
    y1 = min(H, from_mm(Y_MAX_MM))
    region = arr[y0:y1, :, :]
    lum = region.mean(axis=2)
    # mask of non-bg pixels (image-card content): excludes page-bg AND pure
    # white text. Vasileios' page-bg ist ~38 luma, dark cards beginnen bei ~50.
    mask = (lum > 49) & (lum < 220)
    row_density = mask.sum(axis=1)
    # band-detection: rows where >=200px of mask present (substantial card)
    bands = []
    in_run, start = False, None
    for i, d in enumerate(row_density):
        if d > 200:
            if not in_run: start, in_run = i, True
        else:
            if in_run:
                bands.append((start, i - 1))
                in_run = False
    if in_run:
        bands.append((start, len(row_density) - 1))
    # Filter very thin bands (< ~5mm)
    min_band_h_px = from_mm(5)
    bands = [(s, e) for (s, e) in bands if (e - s) >= min_band_h_px]
    out = []
    for (s, e) in bands:
        # Find horizontal x-runs at mid-y of band
        mid_y = (s + e) // 2
        cols = np.where(mask[mid_y])[0]
        if len(cols) == 0:
            continue
        # Split into runs separated by gaps > 30px
        groups = np.split(cols, np.where(np.diff(cols) > 30)[0] + 1)
        for g in groups:
            if len(g) < from_mm(15):  # ignore < 15mm wide
                continue
            x_min, x_max = int(g[0]), int(g[-1])
            # Refine y-range per region: scan a column inside the region
            x_sample = (x_min + x_max) // 2
            col_mask = mask[:, x_sample]
            col_ys = np.where(col_mask)[0]
            # Restrict to ys within current band ± a bit
            within = [y for y in col_ys if s - 5 <= y <= e + 5]
            if not within:
                y_min_local, y_max_local = s, e
            else:
                y_min_local, y_max_local = min(within), max(within)
            # bg color sample
            r, g_, b_ = px[x_sample, y0 + (y_min_local + y_max_local) // 2]
            out.append({
                "x_mm": (to_mm(x_min), to_mm(x_max)),
                "y_mm": (to_mm(y0 + y_min_local), to_mm(y0 + y_max_local)),
                "w_mm": to_mm(x_max - x_min + 1),
                "h_mm": to_mm(y_max_local - y_min_local + 1),
                "bg_color": f"#{r:02x}{g_:02x}{b_:02x}",
            })
    return out

def fmt(v):
    if isinstance(v, tuple):
        if v[0] is None: return "(none)"
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

if ELEMENT == "text-rows":
    rs = measure_text_rows()
    print(f"TEXT-ROWS (y_mm {Y_MIN_MM:.0f}-{Y_MAX_MM:.0f}):")
    if not rs:
        print("  no text-density rows found")
    for r in rs:
        print(f"  y[{r['y_mm'][0]:.2f}, {r['y_mm'][1]:.2f}] h={r['h_mm']:.2f}mm density={r['density']}")
    print()

if ELEMENT == "pills":
    r = measure_pills()
    print(f"PILLS (y_mm {Y_MIN_MM:.0f}-{Y_MAX_MM:.0f}):")
    if not r["pills"]:
        print("  no cyan pills found in range")
    else:
        if r["y_range_mm"]:
            print(f"  y_range: [{r['y_range_mm'][0]:.2f}, {r['y_range_mm'][1]:.2f}] h={r['h_mm']:.2f}mm")
        if r["color_sample"]: print(f"  color: {r['color_sample']}")
        for i, p in enumerate(r["pills"]):
            print(f"  pill {i+1}: x[{p['x_mm'][0]:.2f}, {p['x_mm'][1]:.2f}] w={p['w_mm']:.2f}mm")
    print()

if ELEMENT == "dividers":
    ds = measure_dividers()
    print(f"DIVIDERS (y_mm {Y_MIN_MM:.0f}-{Y_MAX_MM:.0f}):")
    if not ds:
        print("  no horizontal gray lines found")
    for i, y in enumerate(ds):
        gap = ""
        if i > 0:
            gap = f"  (gap={y - ds[i-1]:.2f}mm)"
        print(f"  divider {i+1}: y={y:.2f}mm{gap}")
    print()

if ELEMENT == "cyan-region":
    rs = measure_cyan_region()
    print(f"CYAN-REGIONS (y_mm {Y_MIN_MM:.0f}-{Y_MAX_MM:.0f}):")
    if not rs:
        print("  no cyan regions found")
    for i, r in enumerate(rs):
        print(f"  region {i+1}: y[{r['y_mm'][0]:.2f}, {r['y_mm'][1]:.2f}] h={r['h_mm']:.2f}mm color={r['color_sample']}")
    print()

if ELEMENT == "image-regions":
    rs = measure_image_regions()
    print(f"IMAGE-REGIONS (y_mm {Y_MIN_MM:.0f}-{Y_MAX_MM:.0f}):")
    if not rs:
        print("  no image-card regions found")
    for i, r in enumerate(rs):
        print(f"  region {i+1}: x[{r['x_mm'][0]:.2f}, {r['x_mm'][1]:.2f}] y[{r['y_mm'][0]:.2f}, {r['y_mm'][1]:.2f}] w={r['w_mm']:.2f}mm h={r['h_mm']:.2f}mm bg={r['bg_color']}")
    print()
PY
```

Setze `PAGE`, `ELEMENT`, `YMIN`, `YMAX` als Env-Variablen vor dem Heredoc:

```bash
PAGE="$1" ELEMENT="${2:-all}" YMIN="${3:-35}" YMAX="${4:-285}" python3 <<'PY' ...
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
