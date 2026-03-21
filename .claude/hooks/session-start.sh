#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install Node.js dependencies
npm install --legacy-peer-deps

# Install Python dependencies
uv sync

# Bundle project data (generates src/data/projects.json)
uv run bundle
