# src/context - Agent Instructions

## Scope

Applies to `src/context/**` unless a deeper `AGENTS.md` overrides it.

## State Rules

- All mutations go through action creators and reducers; consumers must not hand-write action payload shapes.
- New actions require updates to `actionTypes`, action creator return types, reducer handling, and tests in the same change.
- Action creators own bounded-state clamps via `src/utils/gameStateUtils.ts`; reducers must not re-clamp.
- Reducer default branches call `assertNever(action)`.

## TypeScript

- Action creators return `Extract<GameAction, { type: typeof ActionTypes.X }>` to preserve discriminated unions.
- Sanitize untrusted payloads by whitelisting fields; never spread unknown records into state.
- Preserve `0`, `''`, and `false` where valid; use nullish checks instead of truthy fallbacks.

## Gotchas

- `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel`.
- `useReducer` dispatch is not synchronous for `stateRef`; derive toast values from pre-dispatch state.
- Toast `options` values must be primitive-only: `string | number | boolean | null`.
