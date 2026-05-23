# src/context - Agent Instructions

## Actions & Toasts

- `useGameDispatch()` and `useGameActions()` expose named action methods, not raw reducer dispatch. New context-level actions must be added to `GameDispatchActions`, implemented in `GameStateProvider`, included in `dispatchValue`, and covered by tests.
- Toast `options` values must be primitive-only: `string | number | boolean | null`. Sanitizers drop non-primitive and forbidden-key entries; do not preserve them by stringifying.
- `UPDATE_SOCIAL` accepts both `Partial<SocialState>` and a functional updater `(prev) => Partial<SocialState>`. `socialReducer` evaluates the function against current state at reducer time; do not pre-compute against `stateRef` in the caller.
- `createUpdateSocialAction` pre-sanitizes both payload shapes: hostile keys (`__proto__`, `constructor`, `prototype`) are stripped and non-finite values are dropped on the numeric `SocialState` fields listed in `SOCIAL_NUMERIC_FIELDS` (`instagram`, `tiktok`, `youtube`, `newsletter`, `viral`, `controversyLevel`, `loyalty`, `zealotry`, `reputationCooldown`, plus the `last*Day` fields where `null` is preserved). The functional updater is wrapped so sanitization also runs after the updater resolves. Reducer-side checks (`trend`, `activeDeals`, clamps) remain final authority — do not remove them.
- `createUpdateSettingsAction` whitelists the same keys as `sanitizeSettingsPayload` in `systemReducer.ts` (`crtEnabled`, `tutorialSeen`, `logLevel`). When adding a new settings field, extend both the action-creator whitelist (`ALLOWED_SETTINGS_KEYS`) and the reducer sanitizer together.

## Persistence

- Autosave is centralized in `usePersistence`'s `shouldAutosaveOnTransition` effect (fires on `GIG → POST_GIG` and `POST_GIG → (GAMEOVER | OVERWORLD)`). Do not add explicit `saveGame()` calls to handlers that perform those same transitions; intentional travel/arrival/Overworld manual saves are separate.
- Save key is `SAVE_KEY = 'neurotoxic_v3_save'`; `createRawLoadPayload` whitelists `LOADABLE_SAVE_KEYS` only. New persisted fields require this checklist:
  1. Add the field to `LOADABLE_SAVE_KEYS`.
  2. Include it in `createPersistedState`.
  3. Sanitize/read it in the reducer's `LOAD_GAME` handler.
- `neurotoxic_inject_marker` localStorage flag is a screenshot/E2E-only hydration channel; the marker is removed in a `useEffect` after mount (not in `initGameState`) to survive StrictMode's double-invoked lazy initializer.
- `normalizeLoadedGameMap` coerces stringy node `x`/`y` back to numbers for legacy saves. When adding persisted `GameMap` or map-node fields that old saves may contain, extend this normalizer rather than the reducer's load path.
