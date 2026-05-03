#!/bin/bash
# PostToolUse hook: Pruefe nach Edit auf page-builders.ts dass jeder
# `binding: { kind: "audit", path: "..." }` auch im BINDING_CATALOG
# (binding-catalog.ts) existiert.
#
# Faengt den M7-closingNote- + M13-topIssues-Bug bei Build-Time statt
# erst im Editor-E2E:
# - Backend-Render funktioniert auch ohne Catalog-Eintrag (TextBlockView
#   liest den Audit-Pfad direkt).
# - ABER der Editor-Inspector zeigt "(statisch)" statt das Label, und
#   wenn der User den Block speichert wird das audit-Binding zerstoert.
#
# Erweitert in M13 (vorher nur sections.*-Prefix gepruerft):
# - Alle audit-Pfade (sections.*, comparison.*, phasenplan.*, summary.*,
#   inhaber.*, topRisks, recommendations, screenshots.*, plus Top-Level
#   wie url/projectName/overallScore/etc).
# - Index-Pfade (z.B. `summary.topIssues[${idx}].headline` im
#   template-string) werden zur regex `summary\.topIssues\[\d+\]\.headline`
#   konvertiert und gegen den Catalog gematcht.
#
# Triggert auf Edits an src/lib/editor/page-builders.ts.
# Exit 0 = non-blocking. Output geht als Context an Claude zurueck.

set +e

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .input.file_path // empty' 2>/dev/null)

case "$FILE" in
  *src/lib/editor/page-builders.ts)
    PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
    cd "$PROJECT_DIR" || exit 0

    OUTPUT=$(PROJECT_DIR="$PROJECT_DIR" python3 - <<'PY'
import os, re

root = os.environ["PROJECT_DIR"]
with open(f"{root}/src/lib/editor/page-builders.ts") as f:
    builders = f.read()
with open(f"{root}/src/lib/editor/binding-catalog.ts") as f:
    catalog = f.read()

# "used" paths: double-quoted strings in `path: "..."`
# `\b` word-boundary verhindert Match auf `fieldPath: "..."` (comparisonTable cols)
used_quoted = set(re.findall(r'\bpath:\s*"([^"]+)"', builders))

# "used" template paths: backtick strings `path: `summary.topIssues[${idx}].headline``
used_templates = set(re.findall(r'\bpath:\s*`([^`]+)`', builders))

# Catalog paths
catalog_paths = set(re.findall(r'\bpath:\s*"([^"]+)"', catalog))

# Strict diff: USED_QUOTED minus CATALOG
missing_quoted = sorted(used_quoted - catalog_paths)

# Template-Check: jeden template-pattern in regex umwandeln und gegen
# Catalog matchen. Pattern `${...}` wird zu `[a-zA-Z0-9_]+` (numeric
# index ODER string key wie "html"/"js" — beide kommen vor).
missing_templates = []
for pat in sorted(used_templates):
    placeholder = re.sub(r'\$\{[^}]+\}', '__INDEX__', pat)
    regex = re.escape(placeholder).replace('__INDEX__', r'[a-zA-Z0-9_]+')
    if not any(re.fullmatch(regex, cp) for cp in catalog_paths):
        missing_templates.append(pat)

total_used = len(used_quoted) + len(used_templates)
total_missing = len(missing_quoted) + len(missing_templates)

if total_missing > 0:
    print(f"[binding-catalog-consistency] WARN: {total_missing} audit-binding(s) in page-builders.ts NICHT in BINDING_CATALOG:")
    for p in missing_quoted:
        print(f"  - {p}")
    for p in missing_templates:
        placeholder = re.sub(r'\$\{[^}]+\}', '[N]', p)
        print(f"  - {p}  (template — Catalog braucht alle expandierten Pfade fuer N=0,1,2,...; aktuell 0 Match fuer Pattern '{placeholder}')")
    print()
    print("Folge: Editor zeigt '(statisch)' fuer diese Blocks, Save zerstoert das audit-Binding.")
    print("Fix: passende Eintraege zu src/lib/editor/binding-catalog.ts hinzufuegen.")
else:
    print(f"[binding-catalog-consistency] alle {total_used} audit-bindings in page-builders.ts sind catalog-mapped ({len(used_quoted)} quoted + {len(used_templates)} template) ✓")
PY
)
    echo "$OUTPUT"
    ;;
  *)
    # Nicht-relevante Datei - silent skip.
    ;;
esac

exit 0
