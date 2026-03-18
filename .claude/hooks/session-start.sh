#!/bin/bash
set -euo pipefail

# Neurotoxic Game - Claude Code Web Session Startup Hook
# Installs dependencies so tests and linters work immediately

# Install pnpm dependencies
# This is idempotent and caches in the container after completion
pnpm install --frozen-lockfile

echo "✓ Dependencies installed successfully"
