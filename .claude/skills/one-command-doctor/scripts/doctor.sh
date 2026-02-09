#!/usr/bin/env bash
set -euo pipefail

node -v
npm -v
npm install
npm run lint
npm run test
npm run build
