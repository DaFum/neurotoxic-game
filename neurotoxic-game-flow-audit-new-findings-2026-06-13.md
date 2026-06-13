# Neurotoxic Game Flow Audit - New Findings Only

Date: 2026-06-13  
Scope: deeper second-pass audit of the current snapshot at `memory/snapshots/neurotoxic-game`.  
Exclusion rule: this file intentionally omits the findings already listed in `output/neurotoxic-game-flow-audit-2026-06-13.md`.

## Summary

This second pass found additional flow issues around day-advance routing, duplicate user actions, asset-system feedback ownership, and settings persistence hygiene. The highest-risk issues are the scene-routing overwrite after `advanceDay()` and repeated resolution of one-shot choices before React has a chance to unmount or rerender the phase.

## Top Findings

### Major - Travel and tourbus arrivals can overwrite a bankruptcy `GAMEOVER` scene

Evidence:

- `src/context/reducers/systemReducer.ts:1997`-`2008` sets `currentScene: GAMEOVER` when the daily bankruptcy check trips.
- `src/context/reducers/systemReducer.ts:2211` runs that bankruptcy check at the end of `handleAdvanceDay`.
- `src/context/useGameDispatchActions.ts:384`-`388` dispatches `advanceDayAction(currentState)` but does not return the resulting state or scene.
- `src/hooks/useArrivalLogic.ts:72`-`76` calls `advanceDay()` and immediately saves; `src/hooks/useArrivalLogic.ts:126`-`128` then calls `changeScene(arrivalResult.scene)` for non-gig arrivals.
- `src/hooks/travel/useTravelActions.ts:219` calls `advanceDay()`, and `src/hooks/travel/useTravelActions.ts:228` routes through `handleNodeArrivalCallback`; that callback calls `changeScene(result.scene)` at `src/hooks/travel/useTravelActions.ts:112`-`114`.

What is wrong:

`advanceDay()` can produce a `GAMEOVER` state, but both normal travel completion and tourbus arrival continue to run arrival routing against the pre-dispatch snapshot. The following `changeScene(...)` dispatch can overwrite the `GAMEOVER` scene with `OVERWORLD`, `BAND_HQ`, `PRE_GIG`, or another arrival scene.

Why it matters:

The travel gate already allows the player to arrive with exactly enough money to cover travel plus daily obligations. In that case daily costs can clamp the balance to `0`, and `shouldTriggerBankruptcy(..., totalDailyObligations)` treats that as bankrupt when obligations remain. The reducer correctly detects this, but the caller can immediately route away from the bankruptcy screen.

Smallest safe fix:

Make the day-advance caller observe the resulting scene before doing any arrival routing. The cleanest local direction is for the `advanceDay` action wrapper to return the reducer-computed next state or at least an outcome flag, then `useArrivalLogic` and `useTravelActions` should abort save/rival/event/arrival routing when the result is `GAMEOVER`. If returning next state is too invasive, defer arrival routing into an effect keyed on the updated state and short-circuit when `currentScene === GAMEOVER`.

Regression tests:

- Add a travel completion test where the daily tick bankrupts the player and assert no later `changeScene(OVERWORLD)` or node-arrival scene is dispatched.
- Add the same case for `useArrivalLogic` / tourbus arrival, because it has its own `advanceDay -> saveGame -> arrivalResult -> changeScene` chain.

### Major - Event modal continue can resolve the same event multiple times

Evidence:

- `src/ui/EventModal.tsx:131`-`150` stores the precomputed choice outcome in local `outcome`.
- `src/ui/EventModal.tsx:158`-`165` calls `onOptionSelect(...)` whenever `outcome` is present; there is no consumed/resolving ref.
- `src/ui/EventModal.tsx:311`-`317` renders the Continue button without a disabled state or click guard.
- `src/context/useEventSystem.ts:211`-`223` resolves the choice and dispatches every returned action without checking whether the active event has already been consumed.
- `src/domain/eventResolver.ts:206`-`277` can apply deltas, add quests, add unlocks, add cooldowns, emit toasts, save game-over state, and finally clear `activeEvent`.

What is wrong:

The UI relies on React rerendering/unmounting the modal after `SET_ACTIVE_EVENT(null)` to prevent a second click. A fast double-click on Continue can call `onOptionSelect` twice with the same precomputed result before that rerender lands.

Why it matters:

Most event outcomes are not idempotent. A duplicated resolution can double-apply money/stat deltas, duplicate quest progress side effects, emit repeated toasts, or run game-over save/scene side effects twice. The cooldown action does not protect the first resolution because the second call happens before the modal stops accepting clicks.

Smallest safe fix:

Add a one-shot guard at the event resolution boundary. A local `isResolvingRef` in `EventModal` should disable/ignore Continue after the first click, and `resolveEventCallback` should also no-op when there is no current `activeEvent` so the central event API remains safe.

Regression tests:

- Extend `tests/ui/EventModal.test.jsx` with a double-click on Continue and assert `onOptionSelect` fires once.
- Add a hook/context-level test around `resolveEvent` if possible, asserting a second resolution after `activeEvent` has been cleared cannot apply another event delta.

### Major - Post-gig Social, Deal, and Spin actions are still re-entrant

Evidence:

- `src/hooks/postGig/handlers/useSocialPostHandler.ts:202`-`207` starts a processing guard, but `src/hooks/postGig/handlers/useSocialPostHandler.ts:245`-`248` resets it immediately in `finally` after setting the next phase.
- `src/components/postGig/SocialPhase.tsx:7`-`12` does not accept any processing/disabled prop, and `src/components/postGig/SocialPhase.tsx:50`-`58` passes live buttons straight through to `onSelect`.
- `src/hooks/postGig/handlers/useDealHandlers.ts:94`-`149` accepts a brand deal without any processing guard, then applies money, band, social, quest events, toasts, clears offers, and sets phase COMPLETE.
- `src/components/postGig/DealCard.tsx:301`-`306` leaves the Accept button active and calls `handleAcceptDeal(displayDeal)` directly.
- `src/hooks/postGig/handlers/useMinorHandlers.ts:58`-`95` guards `handleSpinStory`, but resets the guard immediately after dispatching updates.

What is wrong:

These post-gig actions mutate game state and then rely on phase changes or rerenders to remove the old buttons. The guards that exist are released before the UI has actually left the phase, and brand-deal acceptance has no guard at all.

Why it matters:

A player can double-click or double-tap within the same frame window and apply one-shot post-gig choices more than once. That can duplicate social-post rewards/penalties, accept the same brand offer multiple times, apply duplicate quest events, or spend/apply the PR spin repeatedly before the phase updates visually.

Smallest safe fix:

Keep the post-gig processing lock until the phase has changed or the component unmounts, and pass a disabled/processing prop into `SocialPhase`, `DealCard`, and the spin action surface. Brand deal acceptance should share the same one-shot guard used by the other handlers.

Regression tests:

- In `tests/ui/usePostGigLogic.test.jsx`, call `handlePostSelection`, `handleAcceptDeal`, and `handleSpinStory` twice synchronously and assert the relevant dispatchers fire once per one-shot action.
- Add a component-level assertion that Social and Deal buttons are disabled while processing.

### Minor - Asset risk and foreclosure modal state has no global owner outside the Assets scene

Evidence:

- `src/context/reducers/systemReducer.ts:2035`-`2046` appends daily foreclosure notices during `advanceDay`.
- `src/context/reducers/systemReducer.ts:2081`-`2085` stores the first daily asset risk event in `pendingRiskEvent`.
- `src/hooks/useForeclosureModal.ts:15`-`29` derives modal state from `pendingForeclosureNotices`.
- `src/components/assets/AssetsScene.tsx:24`-`31` reads `pendingRiskEvent`, and `src/components/assets/AssetsScene.tsx:92`-`106` is the only place rendering `RiskEventModal` and `ForeclosureModal`.
- `src/components/assets/AGENTS.md:16`-`17` explicitly notes that these modals are reusable surfaces and are not automatically mounted by the daily tick.

What is wrong:

Daily systems create persistent pending modal state during normal game flow, but the modal owner exists only inside `AssetsScene`. If the player advances days through travel, post-gig, or overworld flow and does not open Assets, the actual risk/foreclosure acknowledgement remains latent.

Why it matters:

The state model says there is a pending risk event or foreclosure notice, but the main game shell has no global surface to present or clear it. Players can continue making routing and money decisions while important asset consequences are only represented as transient toasts, and the pending modal may appear much later out of the context that caused it.

Smallest safe fix:

Decide ownership explicitly. Either make these pending states toast-only outside the Assets hub and stop persisting modal state globally, or mount a small global asset-notification owner near `App` / `SceneRouter` that can present and clear `pendingRiskEvent` and `pendingForeclosureNotices` regardless of the current scene.

Regression tests:

- Add a shell-level test that advances a day with `pendingRiskEvent` or `pendingForeclosureNotices` and verifies the chosen global behavior.
- If the intended design is Assets-only acknowledgement, add a test and code comment that the pending state is deliberately deferred until `AssetsScene`.

### Minor - Settings updates persist raw values even though the reducer sanitizes them

Evidence:

- `src/context/actionCreators.ts:213`-`217` limits settings action payloads to `crtEnabled`, `tutorialSeen`, and `logLevel`.
- `src/context/reducers/systemReducer.ts:1780`-`1788` applies `sanitizeSettingsPayload(payload)` before updating runtime state.
- `src/context/useGameDispatchActions.ts:566`-`585` dispatches the sanitized action path, but then writes `{ ...readGlobalSettings(), ...updates }` to global storage using the original raw `updates`.
- `src/context/initialState.ts:195`-`223` sanitizes loaded settings again, so bad persisted values are ignored on boot.

What is wrong:

The runtime state is sanitized, but global settings storage is not. Unknown keys and invalid values can be written to `neurotoxic_global_settings` even though they were dropped or rejected by the reducer path.

Why it matters:

This is not a direct gameplay break today because initial load sanitizes again. It is still an inconsistency at a persistence boundary: tooling, migrations, debugging, or future settings fields can observe polluted storage that does not match the in-memory settings contract.

Smallest safe fix:

Persist the same sanitized payload that the reducer accepts. A small shared helper for settings sanitization would keep `createUpdateSettingsAction`, `handleUpdateSettings`, `createInitialState`, and `writeGlobalSettings` aligned.

Regression tests:

- Add a settings action test that calls `updateSettings({ logLevel: 'bad', unknown: true })` and asserts global storage receives neither the unknown key nor the invalid log level.

## Cross-Cutting Test Gaps

- One-shot UI actions need explicit double-click/double-submit tests. The current tests cover happy-path click flow for EventModal and post-gig handlers, but they do not assert idempotency under repeated synchronous calls.
- Day-advance scene routing needs a regression fixture where `advanceDay` produces `GAMEOVER` and every caller that normally routes afterward proves it stops.
- Asset daily feedback needs one owner-level test matching the chosen UX: global acknowledgement, or intentionally deferred acknowledgement in the Assets hub.

## Verification Notes

This was a read-only audit of the current snapshot. I did not rerun the full test suite for this second-pass report; the findings above are grounded in direct source inspection and existing test search results.

## Verdict

These new issues include confirmed Major correctness risks in scene routing and one-shot action idempotency.

[REQUEST CHANGES]
