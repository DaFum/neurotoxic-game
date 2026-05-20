#!/usr/bin/env bash
set -euo pipefail

node -v
pnpm -v
pnpm install --frozen-lockfile
pnpm run lint
pnpm run test
pnpm run build
