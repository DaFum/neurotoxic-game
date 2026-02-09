#!/usr/bin/env bash
set -euo pipefail

echo "Scanning for import.meta.glob usage..."
rg -n "import\.meta\.glob" src || true

echo "Scanning for new URL(..., import.meta.url) usage..."
rg -n "new URL\(.*import\.meta\.url" src || true

echo "Scanning for direct /assets or /public paths..."
rg -n "(/assets/|/public/)" src public || true
