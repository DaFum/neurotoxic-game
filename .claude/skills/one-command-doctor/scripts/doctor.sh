#!/usr/bin/env bash
set -euo pipefail

node -v
pnpm -v
pnpm install
pnpm run lint
pnpm run test
pnpm run build
