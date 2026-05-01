#!/bin/bash
# PostToolUse hook: Pruefe nach Edit auf page-builders.ts dass jeder
# `binding: { kind: "audit", path: "sections.X.Y" }` auch im
# BINDING_CATALOG (binding-catalog.ts) existiert.
#
# Faengt den M7-closingNote-Bug bei Build-Time statt erst im Editor-E2E:
# - Backend-Render funktioniert auch ohne Catalog-Eintrag (TextBlockView
#   liest den Audit-Pfad direkt).
# - ABER der Editor-Inspector zeigt "(statisch)" statt das Label, und
#   wenn der User den Block speichert wird das audit-Binding zerstoert.
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

    # Alle audit-binding paths aus page-builders.ts extrahieren.
    # `\bpath:` mit word-boundary matched `path:` aber nicht `fieldPath:`.
    # Filter auf "sections." prefix (top-level paths wie "url", "projectName"
    # sind alle bereits im Catalog drin und nicht das hier zu fangende Risiko).
    USED=$(grep -oE '\bpath:[[:space:]]*"sections\.[^"]+"' src/lib/editor/page-builders.ts \
      | sed -E 's/^path:[[:space:]]*"//; s/"$//' \
      | sort -u)

    # Alle catalog-paths extrahieren.
    CATALOG=$(grep -oE 'path:[[:space:]]*"sections\.[^"]+"' src/lib/editor/binding-catalog.ts \
      | sed -E 's/^path:[[:space:]]*"//; s/"$//' \
      | sort -u)

    # Diff: in USED aber nicht in CATALOG.
    MISSING=$(comm -23 <(echo "$USED") <(echo "$CATALOG"))

    if [ -n "$MISSING" ]; then
      echo "[binding-catalog-consistency] WARN: page-builders.ts referenziert audit-bindings die NICHT in BINDING_CATALOG sind:"
      echo "$MISSING" | sed 's/^/  - /'
      echo ""
      echo "Folge: Editor zeigt '(statisch)' fuer diese Blocks, Save zerstoert das audit-Binding."
      echo "Fix: passende Eintraege zu src/lib/editor/binding-catalog.ts hinzufuegen."
    else
      USED_COUNT=$(echo "$USED" | grep -c .)
      echo "[binding-catalog-consistency] alle $USED_COUNT audit-bindings in page-builders.ts sind catalog-mapped ✓"
    fi
    ;;
  *)
    # Nicht-relevante Datei - silent skip.
    ;;
esac

exit 0
