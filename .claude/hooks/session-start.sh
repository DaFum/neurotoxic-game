#!/bin/bash
set -euo pipefail

# Neurotoxic Game - Claude Code Web Session Startup Hook
# Installs dependencies so tests and linters work immediately
# Runs in async mode to prevent blocking session startup

echo '{"async": true, "asyncTimeout": 300000}'

# Install pnpm dependencies
# This is idempotent and caches in the container after completion
pnpm install --frozen-lockfile

echo "✓ Dependencies installed successfully"
