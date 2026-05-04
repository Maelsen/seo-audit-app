#!/usr/bin/env python3
"""
Liest data/templates/default.json und gibt mm-Bboxes pro Block-Type zurueck.
Wird von bug-hunts.py importiert um zu wissen wo ScoreCircles + Buttons
auf welcher Page sitzen.

Usage:
    from parse_template_frames import get_frames
    frames = get_frames("path/to/default.json")
    # frames["scoreCircle"] -> [{page: 2, id: "gs-big-score", x, y, w, h, size, strokeWidth}, ...]
    # frames["recButton"]   -> [{page: 2, id: "gs-rec-button-text", x, y, w, h}, ...]
"""

import json
import sys
from pathlib import Path


def get_frames(template_path: str) -> dict:
    """Liest default.json und sammelt relevante Frames."""
    with open(template_path) as f:
        tpl = json.load(f)

    out = {
        "scoreCircle": [],
        "recButton": [],
        "pieChart": [],
    }

    for page_idx, page in enumerate(tpl["pages"]):
        page_num = page_idx + 1  # 1-based
        for block in page.get("blocks", []):
            btype = block.get("type")
            frame = block.get("frame", {})
            if btype == "scoreCircle":
                out["scoreCircle"].append({
                    "page": page_num,
                    "id": block.get("id"),
                    "x": frame.get("x", 0),
                    "y": frame.get("y", 0),
                    "w": frame.get("w", 0),
                    "h": frame.get("h", 0),
                    "size": block.get("size", frame.get("w", 0)),
                    "strokeWidth": block.get("strokeWidth", 1),
                    "fontSize": block.get("labelStyle", {}).get("fontSize", 11),
                })
            elif btype == "shape" and block.get("id", "").endswith("-button-bg"):
                # Empfehlungs-Button (rect shape mit -button-bg suffix).
                # Pair mit -button-text fuer Centering-Check.
                out["recButton"].append({
                    "page": page_num,
                    "id": block.get("id"),
                    "x": frame.get("x", 0),
                    "y": frame.get("y", 0),
                    "w": frame.get("w", 0),
                    "h": frame.get("h", 0),
                    "fill": block.get("fill", ""),
                })
            elif btype == "pieChart":
                out["pieChart"].append({
                    "page": page_num,
                    "id": block.get("id"),
                    "x": frame.get("x", 0),
                    "y": frame.get("y", 0),
                    "w": frame.get("w", 0),
                    "h": frame.get("h", 0),
                })

    return out


def mm_to_px(mm: float, dpi: int = 200) -> int:
    """A4: 210mm x 297mm. Bei 200 DPI: 1mm ~= 7.874 px."""
    return round(mm * dpi / 25.4)


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "data/templates/default.json"
    frames = get_frames(path)
    print(json.dumps(frames, indent=2))
