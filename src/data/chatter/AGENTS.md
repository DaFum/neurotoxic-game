# src/data/chatter — Agent Instructions

## Scope

Applies to `src/data/chatter/**`.

## Chatter Data Responsibilities

- Keep chatter entries deterministic and translation-key-based.
- Preserve stable key naming and parity between locale files/tests.

## TypeScript Notes

- Condition callbacks should use explicit state typing (`(state: GameState) => ...`) to avoid implicit `any` under CheckJS.
- Prefer helper functions for repeated guards (location, mood, stamina, inventory) to keep condition typing consistent.

## Gotchas

- City/location checks must support canonical venue IDs and legacy formats used by migrations.
- Avoid assumptions about display names vs IDs in condition matching.
- Default chatter scenes are limited to `MENU`, `OVERWORLD`, `PREGIG`, and `POSTGIG`; `GIG` entries are not included by default.
- `GIG` chatter must use explicit `condition` matching to participate in arrival routing/filtering — do not assume default inclusion for new `GIG` rules.

## Recent Findings (2026-04)

- Chatter additions tied to new scene actions should be keyed to reachable states only; avoid introducing lines for actions that no longer have UI affordances.
- `entry.weight` nullish fallback semantics (`?? 1`) mean `weight: 0` fully disables an entry; do not use zero unless intentional suppression is desired.
- Venue chatter ingestion must fail loudly for non-string or empty lines; silent `''` fallbacks hide malformed data and produce blank bubbles.
