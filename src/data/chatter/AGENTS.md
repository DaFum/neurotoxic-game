# src/data/chatter — Agent Instructions

## Scope

Applies to `src/data/chatter/**`.

## Chatter Data Responsibilities

- Keep chatter entries deterministic and translation-key based.
- Preserve stable key naming and parity between locale files/tests.

## TypeScript Notes

- Condition callbacks should use explicit state typing (`(state: GameState) => ...`) to avoid implicit `any` under CheckJS.
- Prefer helper functions for repeated guards (location, mood, stamina, inventory) to keep condition typing consistent.

## Gotchas

- City/location checks must support canonical venue IDs and legacy formats used by migrations.
- Avoid assumptions about display names vs IDs in condition matching.
