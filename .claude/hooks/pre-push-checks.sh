#!/bin/bash
# PreToolUse hook: validates before git push
# Runs lint + typecheck to catch errors before they hit CI

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git push commands
if [[ ! "$COMMAND" =~ ^git\ push ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

echo "Running pre-push validation..." >&2

# Check TypeScript
echo "Checking TypeScript..." >&2
TSC_OUTPUT=$(pnpm typecheck 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  echo "TypeScript check FAILED. Fix errors before pushing:" >&2
  echo "$TSC_OUTPUT" | head -30 >&2
  exit 2
fi

# Check lint
echo "Checking ESLint..." >&2
LINT_OUTPUT=$(pnpm lint 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  echo "Lint check FAILED. Fix errors before pushing:" >&2
  echo "$LINT_OUTPUT" | head -30 >&2
  exit 2
fi

echo "All pre-push checks passed." >&2
exit 0
