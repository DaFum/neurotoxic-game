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
- `useGameDispatch()` and `useGameActions()` expose named action methods, not raw reducer dispatch. New context-level actions must be added to `GameDispatchActions`, implemented in `GameStateProvider`, included in `dispatchValue`, and covered by tests.
- Autosave is centralized in `usePersistence`'s `shouldAutosaveOnTransition` effect (fires on `GIG → POST_GIG` and `POST_GIG → (GAMEOVER | OVERWORLD)`). Do not add explicit `saveGame()` calls in scene handlers — it causes double-saves.
- The save key is `SAVE_KEY = 'neurotoxic_v3_save'` and `createRawLoadPayload` whitelists `LOADABLE_SAVE_KEYS` only. New persisted state fields require updating `LOADABLE_SAVE_KEYS`, `createPersistedState`, and the reducer's load handler together.
- `neurotoxic_inject_marker` localStorage flag is a screenshot/E2E-only hydration channel; player loads go through MENU → "Load Game". The marker is removed in a `useEffect` after mount (not in `initGameState`) to survive React StrictMode's double-invoked lazy initializer.
- `UPDATE_SOCIAL` accepts both `Partial<SocialState>` and a functional updater `(prev: SocialState) => Partial<SocialState>` (see `GameAction` union in `src/types/game.d.ts`). `socialReducer` evaluates the function against current state at reducer time; do not pre-compute against `stateRef` in the caller — that's the bug `2f15bc3e` / `78709491` fixed.
- `normalizeLoadedGameMap` (called from the load handler) coerces stringy node `x`/`y` back to numbers; new map fields that arrive from legacy saves must extend that normalizer rather than the reducer's load path.
