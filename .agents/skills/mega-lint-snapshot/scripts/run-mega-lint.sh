#!/usr/bin/env bash
# TODO: Implement this
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/format-report.mjs" "$@"
