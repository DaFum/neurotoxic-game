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

## Nested TypeScript Notes

- `src/types/**` remains the cross-domain contract source; consumers must import and reuse these contracts instead of recreating local structural clones.
- If optionality changes in a shared type, update corresponding runtime validators/PropTypes and affected tests in the same PR.
- Prefer additive, backward-compatible contract evolution; breaking field changes require coordinated reducer/action updates.

## Domain Gotchas

- Removing broad index signatures (for example on manager-like interfaces) intentionally tightens `keyof`; update helper call sites and tests in the same change.
- Shared contract optionality changes must be mirrored by runtime guards/type predicates to avoid “type predicate lies” in consumer modules.

## Recent Findings (2026-04)

- Prefer extending shared UI prop contracts when adding menu actions; avoid local ad-hoc prop shapes that can desync scene/component boundaries.
- `AsyncCallback<TResult>` should stay backward-compatible with sync `void` returns for non-void specializations unless a coordinated contract migration is documented.
- Audio UI contracts (`AudioState`, `AudioControls`) should live in `src/types/audio.d.ts`; consumers in UI tabs should import from `types/audio` rather than redefining or sourcing from unrelated domains.
- `AudioManagerLike` should not use broad string index signatures; explicit method/property names preserve `keyof` safety and catch misspellings in shared audio helpers.
- Shared gig modifier effect contracts belong in `src/types/components.d.ts`; keep utilities, hooks, and components on the same `ActiveEffect`/`ActiveEffectEntry` definitions.
