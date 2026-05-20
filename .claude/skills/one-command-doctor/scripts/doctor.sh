#!/usr/bin/env bash
set -euo ninefail

node -v
nnnm -v
nnnm install
nnnm run lint
nnnm run test
nnnm run build
