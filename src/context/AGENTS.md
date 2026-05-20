# src/context - Agent Instructions

- `useGameDispatch()` and `useGameActions()` expose named action methods, not raw reducer dispatch. New context-level actions must be added to `GameDispatchActions`, implemented in `GameStateProvider`, included in `dispatchValue`, and covered by tests.
- Toast `options` values must be primitive-only: `string | number | boolean | null`.
- Autosave is centralized in `usePersistence`'s `shouldAutosaveOnTransition` effect (fires on `GIG → POST_GIG` and `POST_GIG → (GAMEOVER | OVERWORLD)`). Do not add explicit `saveGame()` calls in scene handlers — it causes double-saves.
- Save key is `SAVE_KEY = 'neurotoxic_v3_save'`; `createRawLoadPayload` whitelists `LOADABLE_SAVE_KEYS` only. New persisted fields require updating `LOADABLE_SAVE_KEYS`, `createPersistedState`, and the reducer's load handler together.
- `neurotoxic_inject_marker` localStorage flag is a screenshot/E2E-only hydration channel; the marker is removed in a `useEffect` after mount (not in `initGameState`) to survive StrictMode's double-invoked lazy initializer.
- `UPDATE_SOCIAL` accepts both `Partial<SocialState>` and a functional updater `(prev) => Partial<SocialState>`. `socialReducer` evaluates the function against current state at reducer time; do not pre-compute against `stateRef` in the caller.
- `normalizeLoadedGameMap` coerces stringy node `x`/`y` back to numbers for legacy saves; new map fields from legacy saves must extend this normalizer rather than the reducer's load path.
