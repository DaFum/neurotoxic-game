#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run test
npm run build
