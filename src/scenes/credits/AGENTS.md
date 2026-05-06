# src/scenes/credits - Agent Instructions

## Scope

Applies to `src/scenes/credits/**`.

## Gotchas

- Credit rows are rendered via dedicated entry/header/footer components; keep ordering/layout concerns in those components instead of introducing route-level state logic.
- Keep credits static and deterministic; avoid async fetches or randomized order that can break snapshot-style UI tests.
