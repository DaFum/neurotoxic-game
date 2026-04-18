# src/types — Agent Instructions

## Scope

Applies to `src/types/**`.

## Type Modeling Rules

- This directory is the single source of truth for cross-module domain contracts (`game`, `audio`, `components`, `callbacks`, `rhythmGame`). Do not duplicate structural shapes inline in consumer modules — import and reuse.
- `.d.ts` files are ambient declarations; `.ts` files may hold runtime exports. Keep them aligned with live shapes in `src/context`, `src/data`, and `src/utils/audio`.
- Prefer `interface` for extendable object shapes and declaration merging; use `type` for unions, intersections, tuples, and computed/mapped types.
- Derive action/payload types from the discriminated union via `Extract<GameAction, { type: typeof ActionTypes.X }>`; do not hand-write parallel payload shapes.
- Consumers must import types with `import type` (required by `isolatedModules: true`). Mixed imports use `import { Value, type Shape }`.

## Change Rules

- Favor additive, backward-compatible edits. Breaking a contract requires updating `actionTypes`, reducer handling, and `actionCreators` in the same PR.
- Avoid re-exporting third-party types wholesale — re-exports leak dependency surface and defeat tree-shaking.
