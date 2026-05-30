#!/bin/bash
pnpm run test:vitest:node
pnpm run test:vitest:ui
pnpm run typecheck:core
pnpm run typecheck
pnpm run lint
