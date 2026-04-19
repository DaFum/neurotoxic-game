# src/types — Agent Instructions

## Scope

Applies to `src/types/**`.

## Type Modeling Rules

- This directory is the single source of truth for cross-module domain contracts (`game`, `audio`, `components`, `callbacks`, `rhythmGame`). Do not duplicate structural shapes inline in consumer modules — import and reuse.
- `.d.ts` files are ambient declarations; `.ts` files may hold runtime exports. Keep them aligned with live shapes in `src/context`, `src/data`, and `src/utils/audio`.
- Prefer `interface` for extendable object shapes and declaration merging; use `type` for unions, intersections, tuples, and computed/mapped types.
- Derive action/payload types from the discriminated union via `Extract<GameAction, { type: typeof ActionTypes.X }>`; do not hand-write parallel payload shapes.
- Consumers must import types with `import type` (required by `isolatedModules: true`). Mixed imports use `import { Value, type Shape }`.

## TypeScript Best Practices for `src/types/**`

- Keep reusable domain contracts narrow but flexible: model known fields explicitly and use `[key: string]: unknown` only where runtime truly accepts arbitrary keys.
- Prefer extending existing domain types (e.g., `Pick<PlayerState, ...>`, `Partial<BandState>`) over introducing new ad-hoc structural duplicates.
- If a runtime contract changes (example: object-ref vs function-ref), update both the type contract **and** corresponding runtime validators/PropTypes in the same PR.
- For literal unions derived from constants, require source constants to use `as const` so downstream `(typeof CONST)[number]` types remain literal unions.

## Change Rules

- Favor additive, backward-compatible edits. Breaking a contract requires updating `actionTypes`, reducer handling, and `actionCreators` in the same PR.
- Avoid re-exporting third-party types wholesale — re-exports leak dependency surface and defeat tree-shaking.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

## TypeScript Best Practices (Repo)

- Keep TS interfaces and runtime validators/PropTypes synchronized in the same PR; optional vs required mismatches are contract bugs.
- Prefer `unknown` at untrusted boundaries (`JSON.parse`, storage, API payloads) and narrow with guards; never use `any`.
- Use `Object.hasOwn()` for untrusted property checks instead of `in`/`hasOwnProperty` to avoid prototype-chain pollution.
- Under strict CheckJS + `noUncheckedIndexedAccess`, guard indexed reads (`array[i]`) before use.
- Preserve discriminated-union safety in reducers/action creators (`Extract<...>`, `assertNever(action)`) when adding new action variants.
- Use `import type` for type-only imports (`isolatedModules: true`) and keep type-only refactors behavior-preserving.
- Prefer `??` over `||` when `0`/`''` are valid values.
- Use `@ts-expect-error <reason>` only with a tracked follow-up; never use `@ts-ignore`.
