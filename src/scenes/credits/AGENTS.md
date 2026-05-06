# src/scenes/credits - Agent Instructions

## Scope

Applies to `src/scenes/credits/**`.

## Rules

- No async fetches or randomized credit ordering.

## Gotchas

- Credit rows are rendered via dedicated entry/header/footer components; keep ordering/layout concerns in those components instead of introducing route-level state logic.
