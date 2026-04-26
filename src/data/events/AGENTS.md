# src/data/events — Agent Instructions

## Scope

Applies to `src/data/events/**`.

## Event Pool Rules

- Keep event objects declarative and deterministic (no side effects in module scope).
- Preserve stable event IDs and categories to avoid save/test drift.
- Keep event copy i18n-key based (`events:*`), never hardcoded UI strings.

## Domain Gotchas

- Condition callbacks must be explicitly typed as `(state: GameState) => boolean` in strict CheckJS paths to avoid implicit-`any` regressions.
- When adding cooldown or composite effects, always provide a non-empty `effects` array; empty composites are rejected by validation tests.

## Recent Findings (2026-04)

- Event-reachability regressions often come from menu/scene refactors; remove unreachable events intentionally or keep the trigger path wired in the same PR.
