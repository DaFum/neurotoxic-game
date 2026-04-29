# tests/ui/bandhq/hooks — Agent Instructions

## Scope

Applies to `tests/ui/bandhq/hooks/**`.

## Domain Gotchas

- Hook tests must verify lock/unlock cleanup (`processingItemId`-style state) on success and failure paths.
- Assert toast content against actually applied deltas from resolved effects, not requested payload values.

## Recent Findings (2026-04)

- The most valuable regressions here cover early-throw paths before `try/finally`; ensure lock cleanup still executes when validation fails pre-effect.
