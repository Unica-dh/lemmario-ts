#!/bin/bash
# PreToolUse hook: ensures GHCR tags use lowercase repository owner
# Catches the recurring issue of uppercase GHCR tags breaking deploys

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // empty')

# Check for GHCR references in edited files or bash commands
if echo "$INPUT" | grep -qi 'ghcr\.io/[A-Z]'; then
  echo "GHCR tag contains uppercase characters in repository owner!" >&2
  echo "GHCR tags MUST use lowercase. Change to lowercase before proceeding." >&2
  exit 2
fi

exit 0
