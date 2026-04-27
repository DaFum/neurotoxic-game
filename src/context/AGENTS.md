# src/context — Agent Instructions

## Scope

Applies to `src/context/**`.

## State Update Contract

- If adding/changing an action, update all three together in one PR:
  1. `actionTypes`
  2. reducer handling (`gameReducer` and/or slice reducer)
  3. `actionCreators`
- Prefer dispatching action creators; do not wire direct reducer calls from UI/hooks.

## TypeScript Patterns (project idioms)

- `ActionTypes` is a frozen `as const` object; the `ActionType` union is derived via `(typeof ActionTypes)[keyof typeof ActionTypes]`. The `as const` is load-bearing — without it the discriminated union collapses to `string`.
- Action creators must return `Extract<GameAction, { type: typeof ActionTypes.X }>` so the creator is automatically forced to match the reducer's payload shape. Do not hand-write `{ type, payload }` types in creator signatures.
- The reducer switch must be exhaustive. Put `assertNever(action)` in `default` so a new action variant fails compile at every missing case.
- For untrusted update inputs, use `Object.hasOwn(updates, 'key')` before touching a property — `in` and `hasOwnProperty` walk the prototype chain and tests assert forbidden keys (e.g. `__proto__`) are stripped.

## Bounded State Rules

- Keep `player.money` clamped to `>= 0`.
- Keep `band.harmony` clamped to `1..100`.
- Apply clamps **once**, in the action creator, via helpers in `src/utils/gameStateUtils.ts`. Reducers must not re-clamp — double-clamping hides bugs in creators.

## Change Rules

- For type-only PRs, preserve serialized state keys and payload shapes (saves and tests depend on them).

## Nested TypeScript Notes

- New actions must preserve discriminated union safety: update `ActionTypes`, action creators (`Extract<...>`), reducer handling, and `assertNever` coverage together.
- For load/reset/update reducers, whitelist fields from untrusted payloads instead of spreading generic objects into state.
- Keep runtime clamps and action payload types aligned so reducers remain predictable and testable.

## Recent Findings (2026-04)

- UI refactors that add/remove actionable entries should audit action creators for orphaned dispatch paths and keep contracts explicit.
- Context boundary effects should catch and recover from strict utility failures (map/event generation) so invariant throws never blank the provider tree.
- Map generation recovery should prefer bounded retry before committing an empty-map fallback; empty fallback prevents provider crashes but should only happen after retry budget is exhausted.
