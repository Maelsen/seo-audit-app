#!/usr/bin/env python3
"""
Generiert /tmp/fft/test-report.html mit Side-by-Side-Vergleich aller Pages
fuer alle Varianten + Findings-Liste.

Usage:
    python3 render-report.py <findings.json> <out_html>
"""

import json
import sys
from pathlib import Path
from datetime import datetime

VARIANTS = ["test-full", "test-ai-realistic", "test-long-grade", "test-high-recos", "test-real-ai"]


def render(findings: list, out_html: Path):
    findings_by_variant_page: dict = {}
    for f in findings:
        key = (f.get("variant", "?"), f.get("page", 0))
        findings_by_variant_page.setdefault(key, []).append(f)

    fail_count = sum(1 for f in findings if f.get("severity") == "fail")
    total_pages = 20

    parts = ['<!DOCTYPE html>', '<html lang="de"><head><meta charset="utf-8">']
    parts.append('<title>Full-Fidelity Test Report</title>')
    parts.append('''<style>
        body { font-family: -apple-system, system-ui, sans-serif; background: #1a1a1a; color: #e6e6e6; margin: 0; padding: 0; }
        header { padding: 24px; background: #0a0a0a; border-bottom: 2px solid #38E1E1; position: sticky; top: 0; z-index: 100; }
        h1 { margin: 0; font-size: 24px; color: #ffffff; }
        .summary { font-size: 14px; color: #cfcfcf; margin-top: 6px; }
        .summary.fail { color: #ef4444; font-weight: 700; }
        .summary.pass { color: #22c55e; font-weight: 700; }
        .filter { margin-top: 12px; }
        .filter button { background: #2a2a2a; color: #fff; border: 1px solid #444; padding: 6px 14px; cursor: pointer; border-radius: 4px; margin-right: 6px; font-size: 13px; }
        .filter button.active { background: #38E1E1; color: #0a0a0a; border-color: #38E1E1; }
        .variant-section { margin: 32px 0; padding: 0 24px; }
        h2 { color: #38E1E1; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 6px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        .cell { background: #222; border-radius: 6px; padding: 12px; border-left: 4px solid #444; }
        .cell.fail { border-left-color: #ef4444; }
        .cell.pass { border-left-color: #22c55e; }
        .cell h3 { margin: 0 0 8px 0; font-size: 14px; color: #fff; }
        .cell img { max-width: 100%; border: 1px solid #333; }
        .findings { margin-top: 8px; font-size: 12px; }
        .finding { padding: 4px 8px; margin: 2px 0; border-radius: 3px; }
        .finding.fail { background: #4a1f1f; color: #ffcaca; }
        .finding.warning { background: #4a3f1f; color: #ffeaca; }
        .pass-label { color: #22c55e; font-weight: 600; font-size: 12px; }
    </style>''')
    parts.append('<script>')
    parts.append('''
        function showOnly(filter) {
            document.querySelectorAll(".filter button").forEach(b => b.classList.remove("active"));
            event.target.classList.add("active");
            document.querySelectorAll(".cell").forEach(c => {
                if (filter === "all") c.style.display = "block";
                else if (filter === "fail") c.style.display = c.classList.contains("fail") ? "block" : "none";
                else if (filter === "pass") c.style.display = c.classList.contains("pass") ? "block" : "none";
            });
        }
    ''')
    parts.append('</script>')
    parts.append('</head><body>')

    parts.append('<header>')
    parts.append('<h1>Full-Fidelity Visual Test Report</h1>')
    summary_class = "fail" if fail_count > 0 else "pass"
    summary_text = f"{fail_count} bugs found" if fail_count > 0 else "0 bugs / all pages pass"
    parts.append(f'<div class="summary {summary_class}">{summary_text}</div>')
    parts.append(f'<div class="summary">Run: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} • {len(VARIANTS)} variants × {total_pages} pages</div>')
    parts.append('<div class="filter">')
    parts.append('<button onclick="showOnly(\'all\')" class="active">Alle</button>')
    parts.append('<button onclick="showOnly(\'fail\')">Nur FAILs</button>')
    parts.append('<button onclick="showOnly(\'pass\')">Nur PASSes</button>')
    parts.append('</div>')
    parts.append('</header>')

    for variant in VARIANTS:
        parts.append(f'<div class="variant-section"><h2>{variant}</h2><div class="grid">')
        for page in range(1, total_pages + 1):
            cell_findings = findings_by_variant_page.get((variant, page), [])
            cell_class = "fail" if cell_findings else "pass"
            parts.append(f'<div class="cell {cell_class}" id="{variant}-p{page}">')
            parts.append(f'<h3>Page {page:02d}</h3>')
            img_path = f"diff-page-{page:02d}-{variant}.png"
            parts.append(f'<img src="{img_path}" alt="page {page} {variant}" loading="lazy">')
            parts.append('<div class="findings">')
            if cell_findings:
                for f in cell_findings:
                    sev = f.get("severity", "fail")
                    parts.append(f'<div class="finding {sev}"><strong>[{f["check"]}]</strong> {f["message"]}</div>')
            else:
                parts.append('<div class="pass-label">✓ PASS</div>')
            parts.append('</div></div>')
        # Plus: variant-level Findings (z.B. empty-block die nicht page-specific)
        zero_page_findings = findings_by_variant_page.get((variant, 0), [])
        if zero_page_findings:
            parts.append('<div class="cell fail" style="grid-column: 1/-1">')
            parts.append('<h3>Variant-Level Findings</h3><div class="findings">')
            for f in zero_page_findings:
                parts.append(f'<div class="finding fail"><strong>[{f["check"]}]</strong> {f["message"]}</div>')
            parts.append('</div></div>')
        parts.append('</div></div>')

    parts.append('</body></html>')

    out_html.parent.mkdir(parents=True, exist_ok=True)
    out_html.write_text("\n".join(parts), encoding="utf-8")


def main():
    if len(sys.argv) < 3:
        print("Usage: render-report.py <findings.json> <out_html>", file=sys.stderr)
        sys.exit(1)
    findings = json.loads(Path(sys.argv[1]).read_text())
    render(findings, Path(sys.argv[2]))
    print(f"Wrote {sys.argv[2]}")


if __name__ == "__main__":
    main()
