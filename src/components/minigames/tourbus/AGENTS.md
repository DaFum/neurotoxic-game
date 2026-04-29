# src/components/minigames/tourbus — Agent Instructions

## Scope

Applies to `src/components/minigames/tourbus/**`.

## Domain Gotchas

- Tourbus end-state UI must route through shared finalize callbacks; scene transitions should not be hardcoded in presentational components.
- Keep translated overlay copy key-based and preserve EN/DE parity when adding or changing user-facing strings.

## Recent Findings (2026-04)

- Timeout and button-complete paths must converge to the same completion callback to keep travel-to-gig routing deterministic.
