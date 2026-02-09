#!/usr/bin/env bash
set -euo pipefail

echo "Checking for hardcoded colors (hex/rgb/hsl)..."
rg -n "#[0-9a-fA-F]{3,8}|rgb\(|hsl\(" src || true

echo "Checking for Tailwind palette classes that may bypass CSS variables..."
rg -n "\b(text|bg|border)-(red|green|blue|yellow|orange|pink|purple|indigo|gray|slate|zinc|neutral|stone)-[0-9]{2,3}\b" src || true

echo "Checking for Tailwind v3-style CSS variable syntax..."
rg -n "\b(bg|text|border)-\[var\(--" src || true
