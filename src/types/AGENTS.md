# src/types - Agent Instructions

## Scope

Applies to `src/types/**`.

## Rules

- Shared domain contracts live here; do not duplicate structural clones in consumers.
- Keep action payload, state, and consumer optionality aligned in the same change.
- Prefer discriminated unions and literal-safe maps over wide records.
- Use `import type` for type-only consumers.

## Gotchas

- `GameState.lastGigStats` and `SET_LAST_GIG_STATS` payload fields must expose matching optional fields: `score`, `accuracy`, `combo`, `health`, `overload`.
- Shared audio UI contracts belong in `src/types/audio.d.ts`; component-local copies drift quickly.
- Callback prop names ending in `Callback` are shared UI contracts; rename only with all consumers and tests updated together.
