#!/bin/bash
# PostToolUse hook: Run `tsc --noEmit` after edits to schema-relevant files.
# Output goes back to Claude as additional context. Exit 0 = non-blocking.
#
# Triggers on edit/write of:
#   - src/lib/types.ts
#   - src/lib/agent/schema.ts
#   - src/lib/agent/prompts.ts
#   - src/lib/editor/template-types.ts
#   - src/lib/editor/binding-catalog.ts

set +e

# Hook input arrives on stdin as JSON. Parse the file_path.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .input.file_path // empty' 2>/dev/null)

# Only fire on schema-relevant files
case "$FILE" in
  *src/lib/types.ts | \
  *src/lib/agent/schema.ts | \
  *src/lib/agent/prompts.ts | \
  *src/lib/editor/template-types.ts | \
  *src/lib/editor/binding-catalog.ts)
    PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
    cd "$PROJECT_DIR" || exit 0
    OUT=$(npx tsc --noEmit 2>&1)
    if [ -n "$OUT" ]; then
      echo "[tsc-on-schema-edit] errors after editing $FILE:"
      echo "$OUT" | head -30
    else
      echo "[tsc-on-schema-edit] tsc clean after $FILE"
    fi
    ;;
  *)
    # Not a schema-relevant file - silent skip.
    ;;
esac

exit 0
