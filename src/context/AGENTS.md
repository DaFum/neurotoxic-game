# src/context - Agent Instructions

## Actions & Toasts

- `useGameDispatch()` and `useGameActions()` expose named action methods, not raw reducer dispatch. New context-level actions must be added to `GameDispatchActions`, implemented in `GameStateProvider`, included in `dispatchValue`, and covered by tests.
- Toast `options` values must be primitive-only: `string | number | boolean | null`. Sanitizers drop non-primitive and forbidden-key entries; do not preserve them by stringifying.
- `UPDATE_SOCIAL` accepts both `Partial<SocialState>` and a functional updater `(prev) => Partial<SocialState>`. `socialReducer` evaluates the function against current state at reducer time; do not pre-compute against `stateRef` in the caller.
- `createUpdateSocialAction` pre-sanitizes both payload shapes: hostile keys (`__proto__`, `constructor`, `prototype`) are stripped and non-finite values are dropped on the numeric `SocialState` fields listed in `SOCIAL_NUMERIC_FIELDS` (`instagram`, `tiktok`, `youtube`, `newsletter`, `viral`, `controversyLevel`, `loyalty`, `zealotry`, `reputationCooldown`, plus the `last*Day` fields where `null` is preserved). The functional updater is wrapped so sanitization also runs after the updater resolves. Reducer-side checks (`trend`, `activeDeals`, clamps) remain final authority — do not remove them.
- `createUpdateSettingsAction` whitelists the same keys as `sanitizeSettingsPayload` (the canonical sanitizer in `src/utils/settingsSanitizer.ts`, shared by the reducer's `LOAD_GAME`/`UPDATE_SETTINGS` handling and the global-storage write) (`crtEnabled`, `tutorialSeen`, `logLevel`). When adding a new settings field, extend both the action-creator whitelist (`ALLOWED_SETTINGS_KEYS`) and `sanitizeSettingsPayload` together.
- `updateSettings` must run `sanitizeSettingsPayload(updates)` before `writeGlobalSettings`; never spread raw `updates` into global storage, or malformed/unknown keys (e.g. a non-numeric `logLevel`) bypass the reducer's validation and persist globally.

## Persistence

- Autosave is centralized in `usePersistence`'s `shouldAutosaveOnTransition` effect (fires on `GIG → POST_GIG` and `POST_GIG → (GAMEOVER | OVERWORLD)`). Do not add explicit `saveGame()` calls to handlers that perform those same transitions; intentional travel/arrival/Overworld manual saves are separate.
- Save key is `SAVE_KEY = 'neurotoxic_v3_save'`; `createRawLoadPayload` whitelists `LOADABLE_SAVE_KEYS` only. New persisted fields require this checklist:
  1. Add the field to `LOADABLE_SAVE_KEYS`.
  2. Include it in `createPersistedState` — **both** the destructure of `currentState` and the returned object.
  3. Sanitize/read it in the reducer's `LOAD_GAME` handler (`handleLoadGame` in `systemReducer.ts`).
- Adding a **required** top-level `GameState` field (not just persisted) also needs a default in `initialState` (and a fresh reset in `createInitialState` for arrays/objects, to avoid shared-reference mutation) and an entry in the playwright screenshot `BASE_STATE` (`.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`). `tests/node/playwright-screenshot-fixture-validation.test.js` asserts `BASE_STATE` mirrors every `initialState` field and fails CI otherwise.
- `neurotoxic_inject_marker` localStorage flag is a screenshot/E2E-only hydration channel; the marker is removed in a `useEffect` after mount (not in `initGameState`) to survive StrictMode's double-invoked lazy initializer.
- `normalizeLoadedGameMap` coerces stringy node `x`/`y` back to numbers for legacy saves. When adding persisted `GameMap` or map-node fields that old saves may contain, extend this normalizer rather than the reducer's load path.

## Long-Term Assets

- Asset action creators (`assetActionCreators.ts`) normalize payloads via `finiteNumberOr` and strip prototype keys before validation. DIY+loan returns `PURCHASE_CHASSIS_FAILED` (typed) — never `null`.
- `purchaseChassis` enforces loan-profile eligibility against `state.player.fame` (NOT `state.band.fame`) and `state.social.scenePresence`; ineligible profiles return `PURCHASE_CHASSIS_FAILED` with reason `LOAN_PROFILE_INELIGIBLE`. Add new gating fields to the same union when extending `LoanProfile`.
- `purchaseChassis` rejects `mode: 'crowdfund'` (`CROWDFUND_REQUIRES_CAMPAIGN`) and `handlePurchaseChassis` only accepts `cash`/`loan` payloads — crowdfund acquisition exists solely via `startCrowdfund` + `processCrowdfundTick`. Without both guards a crowdfund-mode dispatch would mint a free chassis (neither payment branch fires).
- `startCrowdfund` clamps `plannedSuccessProbability` into `[0.05, 0.95]` and `plannedSuccessRoll` into `[0, 1]` before stamping the campaign payload. Callers MUST pass the probability the UI shows the player so the tick can resolve `roll < probability` against the displayed odds.
- IDs for slots (chassis + dynamically-added) and crowdfund asset materialization are generated in the action creator (`getSafeUUID`) and passed via payload. The reducer reads them 1:1.
- `advanceDay(state)` (in `actionCreators.ts`) is the only entry point that produces the `ADVANCE_DAY` action with `{ dayRngStream, nextRngSeed }` payload. Migrate any remaining `createAdvanceDayAction()` callers to this signature — RNG determinism depends on it.
- `INSTALL_MODULE` validation chain: existing module → existing asset → existing slot → empty slot → matching slotType → unlocked → no `exclusiveWithGroup` conflict → `maxPerAsset` not exceeded. Flavor-mix between module and chassis is **allowed** (legit module on DIY chassis is intentional).
- `GameDispatchActions` exposes asset helpers (`purchaseChassis`, `installModule`, `sellChassis`, etc.) that read `stateRef.current` so the validation snapshot matches the reducer's view.
