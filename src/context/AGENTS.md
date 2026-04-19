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
