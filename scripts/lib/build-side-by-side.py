#!/usr/bin/env python3
"""
Kombiniert App-PDF-Page-PNG mit Vasileios-Vorlage-PNG horizontal nebeneinander.

Usage:
    python3 build-side-by-side.py <app.png> <ref.png> <out.png> [label_left] [label_right]
"""

import sys
from PIL import Image, ImageDraw, ImageFont


def combine(app_path: str, ref_path: str, out_path: str,
            label_left: str = "App", label_right: str = "Vasileios") -> None:
    a = Image.open(app_path).convert("RGB")
    r = Image.open(ref_path).convert("RGB")

    # Skaliere beide auf gleiche Hoehe (max 1200px)
    target_h = min(a.height, r.height, 1200)
    a = a.resize((int(a.width * target_h / a.height), target_h), Image.LANCZOS)
    r = r.resize((int(r.width * target_h / r.height), target_h), Image.LANCZOS)

    gap = 16
    label_h = 30
    canvas_w = a.width + r.width + gap
    canvas_h = target_h + label_h
    canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
    canvas.paste(a, (0, label_h))
    canvas.paste(r, (a.width + gap, label_h))

    # Labels oben
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except Exception:
        font = ImageFont.load_default()
    draw.text((8, 6), label_left, fill="#333333", font=font)
    draw.text((a.width + gap + 8, 6), label_right, fill="#333333", font=font)

    canvas.save(out_path, "PNG", optimize=True)


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: build-side-by-side.py <app.png> <ref.png> <out.png> [label_left] [label_right]")
        sys.exit(1)
    args = sys.argv[1:]
    combine(*args)
