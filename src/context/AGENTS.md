# src/context - Agent Instructions

## Scope

Applies to `src/context/**` unless a deeper `AGENTS.md` overrides it.

## State Rules

- All mutations go through action creators and reducers; consumers must not hand-write action payload shapes.
- New actions require updates to `actionTypes`, action creator return types, reducer handling, and tests in the same change.
- Action creators sanitize raw payload fields as early as possible (using inline `Math.max` or `gameStateUtils.ts` helpers). Clamp or normalize direct user/input values such as costs, rewards, deltas, ids, and toast payloads before dispatch when the invariant is local to the payload itself.
- Reducers remain the final authority for state integrity. When a reducer computes next bounded state from prior state plus a payload, it must still apply canonical clamps from `src/utils/gameStateUtils.ts` to the final stored value.
- Do not remove terminal reducer clamps just because an action creator also sanitizes input. Early payload sanitation and final-state clamping serve different purposes and may both be required.

## TypeScript

- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>` to preserve discriminated unions.
- Sanitize untrusted payloads by whitelisting fields; never spread unknown records into state.
- Preserve `0`, `''`, and `false` where valid; use nullish checks instead of truthy fallbacks.

## Gotchas

- `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel`.
- `useReducer` dispatch is not synchronous for `stateRef`; derive toast values from pre-dispatch state.
- Toast `options` values must be primitive-only: `string | number | boolean | null`.
