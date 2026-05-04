#!/usr/bin/env python3
"""
4 Pixel-Bug-Detektoren fuer das full-fidelity-test System.

Outputs structured JSON: {check, variant, page, severity, message}

Usage:
    python3 bug-hunts.py <variant> <pdf_path> <png_dir> <template_json> > findings.json
"""

import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import importlib
parse_mod = importlib.import_module("parse-template-frames")
get_frames = parse_mod.get_frames
mm_to_px = parse_mod.mm_to_px

A4_W_MM = 210.0
A4_H_MM = 297.0
DPI = 200


def mm_box_to_px(x_mm, y_mm, w_mm, h_mm, img_w, img_h):
    """Convert mm-bbox to px-bbox using image dimensions (handles DPI variance)."""
    px_per_mm_x = img_w / A4_W_MM
    px_per_mm_y = img_h / A4_H_MM
    return (
        round(x_mm * px_per_mm_x),
        round(y_mm * px_per_mm_y),
        round((x_mm + w_mm) * px_per_mm_x),
        round((y_mm + h_mm) * px_per_mm_y),
    )


def is_bg_or_grey(rgb, tol=40):
    """Hintergrund (#1a1a1a) oder dunkelgrau Ring (#4a4a4a)."""
    r, g, b = rgb[:3]
    # Nahe schwarz / dark grey ring (R ≈ G ≈ B, alle < 90)
    if r < 90 and g < 90 and b < 90 and abs(r - g) < tol and abs(g - b) < tol:
        return True
    return False


def is_white_glyph(rgb, threshold=200):
    """Weisse Note-Schrift im Donut."""
    r, g, b = rgb[:3]
    return r > threshold and g > threshold and b > threshold


def is_red_button_bg(rgb, target=(255, 87, 87), tol=30):
    """RED_BUTTON #FF5757."""
    r, g, b = rgb[:3]
    tr, tg, tb = target
    return abs(r - tr) < tol and abs(g - tg) < tol and abs(b - tb) < tol


# ============ Detector 1: Note-im-Ring-Check (Bug 3) ============

def check_note_in_ring(variant: str, png_path: Path, page_num: int, frames: list, findings: list):
    """Pro ScoreCircle auf der Page: prüft ob Glyph-Bbox innerhalb Ring liegt."""
    img = Image.open(png_path).convert("RGB")
    w, h = img.size
    px = img.load()

    for f in frames:
        if f["page"] != page_num:
            continue
        # Donut-Center (mm) und Outer-Radius (mm)
        cx_mm = f["x"] + f["w"] / 2
        cy_mm = f["y"] + f["h"] / 2
        r_mm = f["size"] / 2
        # Ring-Stroke ist OUTER, Glyph muss INNERHALB von (r - stroke - margin) bleiben
        inner_safe_r_mm = r_mm - f["strokeWidth"] / 2 - 0.5

        cx_px = round(cx_mm * w / A4_W_MM)
        cy_px = round(cy_mm * h / A4_H_MM)
        outer_r_px = round(r_mm * w / A4_W_MM)
        safe_r_px = round(inner_safe_r_mm * w / A4_W_MM)

        # Scan disc: alle weissen Pixel (= Glyph) sammeln
        glyph_pixels = []
        bbox_left, bbox_right, bbox_top, bbox_bottom = w, 0, h, 0
        scan_r = outer_r_px
        for y_off in range(-scan_r, scan_r + 1):
            for x_off in range(-scan_r, scan_r + 1):
                if x_off * x_off + y_off * y_off > scan_r * scan_r:
                    continue
                x = cx_px + x_off
                y = cy_px + y_off
                if x < 0 or x >= w or y < 0 or y >= h:
                    continue
                if is_white_glyph(px[x, y]):
                    glyph_pixels.append((x, y))
                    bbox_left = min(bbox_left, x)
                    bbox_right = max(bbox_right, x)
                    bbox_top = min(bbox_top, y)
                    bbox_bottom = max(bbox_bottom, y)

        if not glyph_pixels:
            continue  # Kein Glyph erkannt — Donut leer? (separate detection)

        # Max-Distanz vom Center (Glyph-Bbox-Eck)
        max_dist = max(
            ((cx_px - bbox_left) ** 2 + (cy_px - bbox_top) ** 2) ** 0.5,
            ((bbox_right - cx_px) ** 2 + (cy_px - bbox_top) ** 2) ** 0.5,
            ((cx_px - bbox_left) ** 2 + (bbox_bottom - cy_px) ** 2) ** 0.5,
            ((bbox_right - cx_px) ** 2 + (bbox_bottom - cy_px) ** 2) ** 0.5,
        )
        if max_dist > safe_r_px:
            overflow_px = max_dist - safe_r_px
            overflow_mm = overflow_px / w * A4_W_MM
            findings.append({
                "check": "note-in-ring",
                "variant": variant,
                "page": page_num,
                "severity": "fail",
                "message": f"ScoreCircle '{f['id']}' Note ragt {overflow_mm:.1f}mm aus Ring (size={f['size']}mm, fontSize={f['fontSize']}pt)",
                "block_id": f["id"],
            })


# ============ Detector 2: Button-Center-Check (Bug 4) ============

def check_button_center(variant: str, png_path: Path, page_num: int, frames: list, findings: list):
    """Pro Empfehlungs-Button: prueft ob Text-Centroid mit Bg-Centroid ueberlappt."""
    img = Image.open(png_path).convert("RGB")
    w, h = img.size
    px = img.load()

    for f in frames:
        if f["page"] != page_num:
            continue
        x0, y0, x1, y1 = mm_box_to_px(f["x"], f["y"], f["w"], f["h"], w, h)
        # Padding: Button kann sligth ueber Frame ragen, deshalb expand
        x0 = max(0, x0 - 4)
        y0 = max(0, y0 - 4)
        x1 = min(w, x1 + 4)
        y1 = min(h, y1 + 4)

        # Sammle Bg-Pixel (rote) und Text-Pixel (weiss)
        bg_xs, bg_ys, txt_xs, txt_ys = [], [], [], []
        for y in range(y0, y1):
            for x in range(x0, x1):
                rgb = px[x, y]
                if is_red_button_bg(rgb):
                    bg_xs.append(x)
                    bg_ys.append(y)
                elif is_white_glyph(rgb, threshold=220):
                    txt_xs.append(x)
                    txt_ys.append(y)

        if not bg_xs:
            continue  # Kein roter Button hier
        if not txt_xs:
            findings.append({
                "check": "button-center",
                "variant": variant,
                "page": page_num,
                "severity": "fail",
                "message": f"Button '{f['id']}' hat keinen Text",
                "block_id": f["id"],
            })
            continue

        # Centroids
        bg_cx = sum(bg_xs) / len(bg_xs)
        bg_cy = sum(bg_ys) / len(bg_ys)
        txt_cx = sum(txt_xs) / len(txt_xs)
        txt_cy = sum(txt_ys) / len(txt_ys)

        dx_px = abs(bg_cx - txt_cx)
        dy_px = abs(bg_cy - txt_cy)
        dx_mm = dx_px / w * A4_W_MM
        dy_mm = dy_px / h * A4_H_MM

        # Threshold: 1.0mm dx (Glyph-Asymmetrie bei langen Strings), 0.7mm dy.
        # dy ist visuell wichtiger als dx — Vertical-Off-Center auffaelliger.
        if dx_mm > 1.0 or dy_mm > 0.7:
            findings.append({
                "check": "button-center",
                "variant": variant,
                "page": page_num,
                "severity": "fail",
                "message": f"Button '{f['id']}' Text off-center: dx={dx_mm:.2f}mm dy={dy_mm:.2f}mm",
                "block_id": f["id"],
            })


# ============ Detector 3: Empty-Block-Detector (Bug 2 + 5) ============

PLACEHOLDER_STRINGS = [
    "Die Diagnose wird vom Agent generiert",
    "Wird vom Agent ersetzt",
    "Platzhalter 1",
    "Platzhalter 2",
    "Platzhalter 3",
    "{{",
    "{audit.",  # ungeresolvte template-vars
    "TBD",
    "Lorem ipsum",
]

def check_empty_blocks(variant: str, pdf_path: Path, findings: list):
    """pdftotext -layout, Suche nach Placeholder-Strings."""
    try:
        text = subprocess.check_output(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            timeout=30,
        ).decode("utf-8", errors="ignore")
    except subprocess.CalledProcessError as e:
        findings.append({
            "check": "empty-block",
            "variant": variant,
            "page": 0,
            "severity": "fail",
            "message": f"pdftotext failed: {e}",
        })
        return

    for ph in PLACEHOLDER_STRINGS:
        if ph in text:
            # Versuch Page-Number zu finden via pdftotext mit -f -l per page
            page_found = locate_string_page(pdf_path, ph)
            findings.append({
                "check": "empty-block",
                "variant": variant,
                "page": page_found,
                "severity": "fail",
                "message": f"Placeholder leaked: '{ph}'",
            })


def locate_string_page(pdf_path: Path, needle: str) -> int:
    for p in range(1, 21):
        try:
            t = subprocess.check_output(
                ["pdftotext", "-layout", "-f", str(p), "-l", str(p), str(pdf_path), "-"],
                timeout=10,
            ).decode("utf-8", errors="ignore")
            if needle in t:
                return p
        except Exception:
            continue
    return 0


# ============ Detector 4: Cookie-Banner-Detector (Bug 1) ============

def check_cookie_banner(variant: str, cover_png: Path, findings: list):
    """Cover-Page: prueft mid-zone auf grosses weisses Rechteck (typischer Banner)."""
    if not cover_png.exists():
        return
    img = Image.open(cover_png).convert("RGB")
    W, H = img.size
    # Mid-Zone wo das Cover-Screenshot ist (~y 130-240mm bei A4)
    # Aber nur INNERHALB des Screenshot-Frames pruefen
    crop_x0 = int(W * 0.30)
    crop_x1 = int(W * 0.70)
    crop_y0 = int(H * 0.40)  # mittig in Screenshot
    crop_y1 = int(H * 0.60)
    zone = img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
    pixels = list(zone.getdata())
    n = len(pixels)
    if n == 0:
        return
    white_count = sum(1 for r, g, b in pixels if r > 230 and g > 230 and b > 230)
    white_pct = white_count / n
    if white_pct > 0.30:
        findings.append({
            "check": "cookie-banner",
            "variant": variant,
            "page": 1,
            "severity": "fail",
            "message": f"Cookie-Banner verdaechtig: {white_pct:.0%} reine weisse Pixel in Cover-Mid-Zone (Threshold 30%)",
        })


# ============ Main ============

def main():
    if len(sys.argv) < 5:
        print("Usage: bug-hunts.py <variant> <pdf_path> <png_dir> <template_json>", file=sys.stderr)
        sys.exit(1)

    variant = sys.argv[1]
    pdf_path = Path(sys.argv[2])
    png_dir = Path(sys.argv[3])
    template_json = sys.argv[4]

    frames = get_frames(template_json)
    findings = []

    # 1. Note-im-Ring fuer alle ScoreCircle-Pages
    for f in frames["scoreCircle"]:
        png_path = png_dir / f"page-{f['page']:02d}.png"
        if png_path.exists():
            check_note_in_ring(variant, png_path, f["page"], [f], findings)

    # 2. Button-Center fuer alle recButton-Pages
    for f in frames["recButton"]:
        png_path = png_dir / f"page-{f['page']:02d}.png"
        if png_path.exists():
            check_button_center(variant, png_path, f["page"], [f], findings)

    # 3. Empty-Block-Detector
    check_empty_blocks(variant, pdf_path, findings)

    # 4. Cookie-Banner (nur Cover)
    cover_png = png_dir / "page-01.png"
    check_cookie_banner(variant, cover_png, findings)

    print(json.dumps(findings, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
