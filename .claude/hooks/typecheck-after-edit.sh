#!/bin/bash
# PostToolUse hook: runs TypeScript check after editing .ts/.tsx files
# Exit 0 = allow, Exit 2 = block with error message to Claude

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check TypeScript files in packages/
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Skip node_modules, dist, .next
if [[ "$FILE_PATH" =~ (node_modules|/dist/|/\.next/) ]]; then
  exit 0
fi

# Determine which package was edited
if [[ "$FILE_PATH" =~ packages/payload-cms/ ]]; then
  cd "$CLAUDE_PROJECT_DIR/packages/payload-cms" 2>/dev/null || exit 0
  ERRORS=$(npx tsc --noEmit 2>&1 | head -20)
elif [[ "$FILE_PATH" =~ packages/frontend/ ]]; then
  cd "$CLAUDE_PROJECT_DIR/packages/frontend" 2>/dev/null || exit 0
  ERRORS=$(npx tsc --noEmit 2>&1 | head -20)
else
  exit 0
fi

if [ $? -eq 0 ]; then
  exit 0
else
  echo "TypeScript errors found after editing $FILE_PATH:" >&2
  echo "$ERRORS" >&2
  echo "" >&2
  echo "Fix these TypeScript errors before proceeding." >&2
  exit 2
fi
