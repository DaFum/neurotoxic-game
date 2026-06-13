# Neurotoxic Game Flow Audit - Consolidated Verified Findings

Date: 2026-06-13  
Snapshot verified: `/workspace/memory/snapshots/neurotoxic-game`  
Snapshot commit from original audit: `cd3255cddd7d12a91da55b5f21306fe6952f8299`  
Input audits consolidated:

- `01-neurotoxic-game-flow-audit-third-pass-new-findings-2026-06-13.md`
- `02-neurotoxic-game-flow-audit-new-findings-2026-06-13.md`
- `03-neurotoxic-game-flow-audit-2026-06-13.md`

## Verification Summary

The uploaded audits are accurate against the current internal snapshot. I did not find a major finding that is stale or unsupported.

One wording adjustment is important: Post-Gig Continue is not completely unguarded. It has a ref guard, but that guard is released in `finally` before the queued scene transition runs, and `PostGig` does not pass the processing state into `CompletePhase`. The duplicate-submit risk is still valid, but the exact failure mode is a guard lifetime and UI wiring issue.

No runtime test suite or typecheck was run during this verification pass. The conclusions below are based on direct source inspection.

## Major Findings

### Major - Blood-bank donations can mint money when the band cannot pay the costs

Status: Confirmed.

Evidence:

- `src/hooks/useBloodBank.ts` validates affordability before dispatch.
- `src/utils/bloodBankUtils.ts` requires harmony above cost and each member to have enough stamina to survive the drain.
- `src/context/reducers/clinicReducer.ts:199-297` normalizes payload numbers, adds `moneyGain`, clamps harmony and stamina, and adds success feedback, but does not reject unaffordable donations.
- Existing reducer tests codify clamp-success behavior for underfunded stamina/harmony cases.

Risk:

The reducer is not the final authority for the blood-bank transaction. A stale, replayed, direct, or future action path can grant money while only partially paying the intended stamina/harmony costs.

Smallest safe fix:

Move affordability validation into `handleBloodBankDonate` after payload normalization and before applying `moneyGain`. Reuse `validateBloodBankDonation` or an equivalent reducer-local check. If validation fails, return the original state.

Highest-value tests:

- Reducer rejects donation when harmony cannot pay.
- Reducer rejects donation when any member cannot pay stamina cost plus survival buffer.
- Rejected donation leaves money, harmony, stamina, controversy, and success toasts unchanged.

### Major - Setup minigame completion reducers can replay rewards, penalties, and quest progress

Status: Confirmed.

Evidence:

- `src/context/reducers/minigameReducer.ts:414-466` completes Amp Calibration without checking active/type state.
- `src/context/reducers/minigameReducer.ts:500-543` completes Kabelsalat without checking active/type state.
- `src/context/reducers/minigameReducer.ts:552-636` completes Roadie without checking active/type state.
- Each handler sets `minigame.active` false as part of the result, but a second completion action still applies economy and quest effects.

Risk:

Completion actions remain economically active after the minigame is already complete. Replays can duplicate money, harmony/stress penalties, damaged gear modifiers, contraband bonuses, and quest progress.

Smallest safe fix:

At the top of each completion reducer, require the expected terminal precondition:

```typescript
if (
  state.minigame?.active !== true ||
  state.minigame?.type !== MINIGAME_TYPES.AMP_CALIBRATION
) {
  return state
}
```

Use the corresponding type for Kabelsalat and Roadie. Consider applying the same explicit guard to Tourbus for contract clarity even if it has other early exits.

Highest-value tests:

- Call each completion handler twice and assert the second call has no additional economy, modifier, toast, or quest-progress effects.

### Major - Rival-band state is live gameplay but is dropped by save/load

Status: Confirmed.

Evidence:

- `src/context/initialState.ts` includes `rivalBand` in `GameState`.
- `src/context/reducers/rivalReducer.ts` manages rival spawning, movement, encounter checks, and updates.
- `src/hooks/useRhythmGameLogic.ts`, `src/utils/brandDealLogic.ts`, and arrival/overworld hooks consume rival state for gameplay effects.
- `src/context/usePersistence.ts:23-55` omits `rivalBand` from `LOADABLE_SAVE_KEYS`.
- `src/context/usePersistence.ts:85-140` omits `rivalBand` from `createPersistedState`.
- `src/context/reducers/systemReducer.ts:1614-1670` does not hydrate or sanitize `loadedState.rivalBand`.

Risk:

Saving and loading resets an active rival to `null`. That silently clears rival identity, location, and power, changing map pressure, rhythm-game crowd decay, brand-deal odds, negotiation penalties, and encounter behavior.

Smallest safe fix:

Persist and hydrate `rivalBand` using the repository persistence checklist:

- Add `rivalBand` to `LOADABLE_SAVE_KEYS`.
- Include it in `createPersistedState`.
- Add a `sanitizeRivalBand` path in `handleLoadGame`.
- Preserve `null` for legacy or missing saves.

Highest-value tests:

- Save/load preserves rival id, name, location, and clamped power level.
- Hydrated rival still affects rhythm-game and brand-deal selectors.

### Major - Travel and tourbus arrivals can overwrite a bankruptcy `GAMEOVER` scene

Status: Confirmed.

Evidence:

- `src/context/reducers/systemReducer.ts:1997-2008` sets `currentScene: GAMEOVER` when daily bankruptcy triggers.
- `src/context/reducers/systemReducer.ts:2211` applies the bankruptcy check at the end of `handleAdvanceDay`.
- `src/hooks/useArrivalLogic.ts:72-127` calls `advanceDay()`, then continues saving, processing events/rival behavior, and finally calls `changeScene(arrivalResult.scene)` for non-gig arrivals.
- `src/hooks/travel/useTravelActions.ts:219-228` calls `advanceDay()`, then processes travel events and routes through `handleNodeArrivalCallback`, which calls `changeScene(result.scene)`.

Risk:

The reducer can correctly produce `GAMEOVER`, but caller-side arrival routing can immediately overwrite it with `OVERWORLD`, `BAND_HQ`, `PRE_GIG`, or another arrival scene.

Smallest safe fix:

Make day-advance callers observe the resulting scene before routing. Prefer returning a reducer-computed next state or outcome from the `advanceDay` action wrapper. If that is too invasive, move arrival routing into an effect keyed on updated state and short-circuit when `currentScene === GAMEOVER`.

Highest-value tests:

- Travel completion where daily tick bankrupts the player must not dispatch later `changeScene(OVERWORLD)`.
- Tourbus arrival must stop arrival routing when `advanceDay` produces `GAMEOVER`.

### Major - Tourbus arrival saves before arrival side effects finish

Status: Confirmed.

Evidence:

- `src/hooks/useArrivalLogic.ts:72-76` calls `advanceDay()` and immediately `saveGame(false)`.
- The same handler then applies harmony regen, travel events, rival movement, encounter checks, node-arrival effects, HQ/supply-stop pending flags, gig start, and scene routing.
- `saveGame(false)` defaults to `stateRef.current`, which is not guaranteed to include dispatches immediately issued earlier in the same callback.

Risk:

A crash or reload after Tourbus completion can preserve a partially completed arrival state: travel completion may be saved while daily effects, arrival routing, pending flags, rival movement, or gig start are missing.

Smallest safe fix:

Move `saveGame(false)` to the end of `handleArrivalSequence`, after all arrival side effects. Stronger long-term fix: model arrival as one reducer transaction or pass an explicit `nextState` snapshot to `saveGame`.

Highest-value tests:

- Tourbus completion plus arrival saves a snapshot that includes destination, day advance, daily effects, arrival flags/routing, and gig start when applicable.

### Major - Event modal Continue can resolve the same event multiple times

Status: Confirmed.

Evidence:

- `src/ui/EventModal.tsx:131-165` stores a precomputed outcome and calls `onOptionSelect` whenever Continue is clicked.
- `src/ui/EventModal.tsx:311-317` renders the Continue button without disabled state or consumed guard.
- `src/context/useEventSystem.ts:211-223` resolves and dispatches event actions without first checking whether the active event was already cleared.
- `src/domain/eventResolver.ts` applies deltas, quest/unlock/cooldown actions, side effects, and finally clears `activeEvent`.

Risk:

A fast double-click can resolve the same precomputed event twice before the modal rerenders or unmounts. Outcomes can duplicate money/stat deltas, quests, unlock toasts, cooldowns, save/gameover side effects, or regular outcome toasts.

Smallest safe fix:

Add a one-shot ref guard in `EventModal` and disable Continue after the first click. Also make `resolveEventCallback` no-op when `stateRef.current.activeEvent` is already null.

Highest-value tests:

- Double-click Continue fires `onOptionSelect` once.
- A second context-level `resolveEvent` after `activeEvent` is cleared cannot apply another delta.

### Major - Post-Gig Continue can duplicate rewards and side effects before scene transition

Status: Confirmed with wording adjustment.

Adjustment:

The original audit should not say this flow has no guard. `useContinueHandler` has `isProcessingActionRef`, but the guard is reset in `finally` before queued `changeScene(...)` callbacks run. `PostGig` also does not pass `isProcessingAction` into `CompletePhase`, so the button remains visually active during processing.

Evidence:

- `src/scenes/PostGig.tsx:33-52` destructures handlers from `usePostGigLogic` but not `isProcessingAction`.
- `src/scenes/PostGig.tsx:123-130` renders `CompletePhase` without `isProcessingAction`.
- `src/components/postGig/CompletePhase.tsx` has an `isProcessingAction` prop and disables Continue/Spin buttons when it is true.
- `src/hooks/postGig/handlers/useContinueHandler.ts:158-290` sets the ref guard, performs merch/money/fame/quest/leaderboard/scene side effects, queues normal scene changes via `queueMicrotask`, then resets the guard in `finally`.

Risk:

A second activation in the window before scene transition can duplicate settlement side effects, including merch deduction, fame/quest progress, leaderboard submission, story quest creation, or final routing.

Smallest safe fix:

- Destructure and pass `isProcessingAction` from `PostGig` to `CompletePhase`.
- Keep the Continue guard set until scene transition/unmount, or otherwise add a durable "settled" flag for this post-gig result.

Highest-value tests:

- Calling `handleContinue()` twice synchronously only applies settlement once.
- `PostGig` passes `isProcessingAction` through to `CompletePhase`.

### Major - Post-gig Social, Deal, and Spin actions are re-entrant

Status: Confirmed.

Evidence:

- `src/hooks/postGig/handlers/useSocialPostHandler.ts:202-248` sets a processing guard but resets it immediately after setting the next phase.
- `src/components/postGig/SocialPhase.tsx:7-58` has no processing/disabled prop.
- `src/hooks/postGig/handlers/useDealHandlers.ts:94-149` accepts a brand deal without a processing guard.
- `src/components/postGig/DealCard.tsx` leaves Accept active.
- `src/hooks/postGig/handlers/useMinorHandlers.ts:58-95` guards Spin but resets the guard immediately after dispatching updates.

Risk:

Fast repeated clicks can duplicate one-shot post-gig actions: social-post effects, brand deal acceptance, quest events, money changes, and PR spin effects.

Smallest safe fix:

Keep the processing lock until the phase changes or component unmounts, and pass disabled/processing props to `SocialPhase`, `DealCard`, and the spin surface. Make brand-deal acceptance share the same one-shot guard.

Highest-value tests:

- Double-call `handlePostSelection`, `handleAcceptDeal`, and `handleSpinStory`; each should dispatch side effects once.
- Component-level tests assert buttons are disabled while processing.

### Major - Practice completion opens Band HQ even when returning to Main Menu

Status: Confirmed.

Evidence:

- `src/context/gameConstants.ts:126-129` allows practice return scenes `OVERWORLD` and `MENU`.
- `src/context/reducers/systemReducer.ts:1421-1445` preserves valid loaded practice `sourceScene`, including `MENU`.
- `src/context/useGameDispatchActions.ts:552-560` always calls `setPendingBandHQOpen(true)` for practice completion, then changes to the target scene.

Risk:

A practice run with `sourceScene: MENU` can return to Main Menu and still open Band HQ. That contradicts the scene contract and is especially relevant because load sanitization treats `MENU` as a valid practice return target.

Smallest safe fix:

Only set `pendingBandHQOpen` when `targetScene === GAME_PHASES.OVERWORLD`, or remove `MENU` from the allowed return set if HQ should always be the post-practice destination.

Highest-value tests:

- Practice return matrix for `OVERWORLD`, `MENU`, and invalid/missing `sourceScene`.
- Assert Band HQ pending is only set for the intended return target.

### Major - Roadie contraband rewards are generated from stash presence without consuming or identifying delivered stash

Status: Confirmed.

Evidence:

- `src/hooks/minigames/useRoadieLogic.ts:89-117` creates a synthetic `{ id: 'contraband', type: 'CONTRABAND' }` cargo item.
- `src/hooks/minigames/useRoadieLogic.ts:195-203` injects that cargo whenever `band.stash` is non-empty.
- `src/utils/minigames/roadieUtils.ts:124-141` increments `contrabandCount` when synthetic contraband is delivered.
- `src/context/reducers/minigameReducer.ts:552-636` turns `contrabandDelivered` into money and `item.delivered` quest progress.
- `src/utils/economy/minigameLogic.ts:65-67` pays `contrabandDelivered * 50`.
- No Roadie completion path consumes or identifies a real stash item.

Risk:

One retained stash item can repeatedly enable generic contraband deliveries, generating money and quest progress without consuming inventory or proving any concrete unit was delivered.

Smallest safe fix:

Choose and encode one model:

- If Roadie delivers the band's stash, select a concrete stash item at minigame start and consume one stack on successful delivery before paying/progressing.
- If Roadie delivers contact cargo independent of stash, gate it by explicit cargo/quest state instead of arbitrary stash presence, and do not imply stash contraband was delivered.

Highest-value tests:

- Band with one stash item completes Roadie twice. Assert either stash/cargo is consumed and second run has no contraband bonus, or that an explicit non-stash cargo source is consumed.

## Minor Findings

### Minor - Contraband stash shows success even when the reducer rejects the use action

Status: Confirmed.

Evidence:

- `src/hooks/useContrabandStash.ts:30-63` dispatches `useContraband` and immediately adds success feedback.
- `src/context/reducers/bandReducer.ts:673-711` can return the original state for missing stash entry, forbidden key, instance mismatch, already-applied item, invalid target, or effect failure.

Risk:

Players can see "Used" or "Applied" even when the authoritative reducer rejected the item.

Smallest safe fix:

Move success feedback into an accepted reducer result path, or have the hook derive success from post-dispatch state change.

Highest-value tests:

- Stale instance id and already-applied item do not emit success.

### Minor - Supply-stop purchases bypass the BandHQ purchase processing lock

Status: Confirmed.

Evidence:

- `src/ui/bandhq/hooks/useBandHQLogic.ts` owns `processingItemId` and `handleBuyWithLock`.
- `src/ui/SupplyStopModal.tsx:51-74` uses `usePurchaseLogic` directly.
- `src/ui/SupplyStopModal.tsx:113-120` renders `ShopItem` without `processingItemId`.

Risk:

Supply-stop purchases have a different re-entry safety profile from BandHQ purchases. Current absolute-state patches limit some damage, but repeated clicks can duplicate purchase attempts, toasts, and black-market consequences.

Smallest safe fix:

Extract the processing lock into a reusable purchase wrapper or move it into `usePurchaseLogic`, then pass `processingItemId` to `ShopItem` from SupplyStop.

Highest-value tests:

- Double-invoking the same SupplyStop purchase only produces one purchase attempt and one consequence toast while processing is active.

### Minor - Asset risk and foreclosure modal state has no global owner outside Assets scene

Status: Confirmed as design/UX ownership issue.

Evidence:

- `src/context/reducers/systemReducer.ts:2035-2046` appends pending foreclosure notices during `advanceDay`.
- `src/context/reducers/systemReducer.ts:2081-2085` stores the first pending asset risk event.
- `src/components/assets/AssetsScene.tsx:24-106` is the only owner rendering `RiskEventModal` and `ForeclosureModal`.
- `src/App.tsx:127-155` owns global overlays but does not render asset risk/foreclosure modals.

Risk:

Players can continue through other scenes with pending asset consequences represented only by toasts until they eventually open Assets.

Smallest safe fix:

Either make these pending states explicitly Assets-only/deferred, or mount a global asset-notification owner near `App`/`SceneRouter`.

Highest-value tests:

- Shell-level test for the chosen behavior: global acknowledgement or intentionally deferred Assets-only acknowledgement.

### Minor - Settings updates persist raw values even though the reducer sanitizes them

Status: Confirmed.

Evidence:

- `src/context/reducers/systemReducer.ts:1780-1788` merges `sanitizeSettingsPayload(payload)` into runtime state.
- `src/context/useGameDispatchActions.ts:566-585` dispatches the sanitized action path but writes `{ ...readGlobalSettings(), ...updates }` using raw updates.

Risk:

Invalid settings and unknown keys can enter global storage even though runtime state rejects them. Boot sanitization limits direct gameplay risk, but storage no longer matches the state contract.

Smallest safe fix:

Persist the same sanitized payload accepted by the reducer. A shared settings sanitizer would keep action creator, reducer, initial load, and global storage aligned.

Highest-value tests:

- `updateSettings({ logLevel: 'bad', unknown: true })` does not write unknown or invalid values to global settings storage.

### Minor - Pre-Gig start lacks a synchronous re-entry guard

Status: Confirmed.

Evidence:

- `src/hooks/usePreGigLogic.ts:399-455` sets `isStarting` via React state, awaits `audioService.ensureAudioContext()`, then dispatches a start-minigame action.
- The button disable state only takes effect after rerender.

Risk:

Multiple same-window activations can trigger multiple audio initializations and potentially multiple start-minigame actions.

Smallest safe fix:

Add an `isStartingRef` checked synchronously at the top of `handleStartShow`. Reset it only on failure; successful start can keep it set because the scene changes.

Highest-value tests:

- Calling `handleStartShow()` twice before the audio promise resolves dispatches exactly one start-minigame action.

## Follow-Up / Lower-Confidence Risks

These are real observations in the current code, but they should be treated as follow-up checks or design consistency work rather than confirmed merge-blocking defects without a specific failing scenario.

### Travel fallback and Tourbus arrival have different event policy

Status: Confirmed observation.

Evidence:

- `src/hooks/travel/useTravelActions.ts:221-223` calls `processTravelEvents(node, triggerEvent, { includeGigNodes: true })`.
- `src/hooks/useArrivalLogic.ts:84-92` calls `processTravelEvents(currentNode, triggerEvent)` and relies on the default gig-node skip policy.

Risk:

If both paths remain user-reachable, the same arrival can produce different pre-gig event behavior depending on travel path.

Suggested direction:

Either align the policies or explicitly mark the fallback as legacy-only with test coverage for the intentional difference.

### Travel completed quest event ownership is split across alternate paths

Status: Confirmed observation.

Evidence:

- Tourbus completion emits `createTravelCompletedQuestEvent` in `src/context/reducers/minigameReducer.ts`.
- The old travel fallback emits the same quest event in `src/hooks/travel/useTravelActions.ts`.

Risk:

Currently the paths are alternative, so this is not a confirmed duplicate. Future integration could accidentally connect both and double-progress travel quests.

Suggested direction:

Pick one owner for "travel completed" quest progress and route both paths through it.

### Save/load forces Overworld while preserving `currentGig` and `lastGigStats`

Status: Confirmed observation.

Evidence:

- `src/context/reducers/systemReducer.ts:1644-1646` forces `currentScene: OVERWORLD` but hydrates `currentGig` and `lastGigStats`.

Risk:

This may be intentional to avoid mid-scene loads. The residual risk is stale gig data influencing Overworld-adjacent systems unexpectedly.

Suggested direction:

Add a regression test proving loaded Overworld state with old `currentGig`/`lastGigStats` does not reopen gig/post-gig UI, resubmit leaderboard data, or affect practice return.

### MinigameSceneFrame DEV backdoor uses inconsistent minigame type sources

Status: Confirmed DEV-only nit.

Evidence:

- `src/components/MinigameSceneFrame.tsx:84-99` reads minigame type first from `logic.gameStateRef.current.minigame`, then from `window.gameState.minigame`.

Risk:

Debug-only behavior can be confusing when minigame logic refs do not consistently include `minigame`.

Suggested direction:

Pass the minigame type explicitly as a prop, or read it from one canonical game-state source.

## Type System Audit

The main type-system issue is boundary trust, not missing annotations:

- Reducers accept type-shaped payloads that are not state-valid.
- `BloodBankDonatePayload` is numerically sanitized but not checked against current resources.
- Setup minigame completion payloads are sanitized by action creators, but reducers do not require a matching active minigame state.
- `contrabandDelivered` is a number without proof that a concrete contraband unit exists or was delivered.
- `rivalBand` exists in `GameState` but is missing from the persistence contract.
- Settings updates are sanitized for reducer state but not for global settings storage.

This conflicts with the repository's reducer-boundary guidance: action creators normalize early, but reducers remain the final authority and must reject impossible or hostile payloads.

## Architecture And Logic

The recurring pattern is UI/hook validation without an equally strong reducer or transaction boundary. That is risky in this codebase because reducers receive actions from UI, effects, tests, replayed callbacks, persistence flows, and future helpers.

The biggest architectural fixes are:

- Make one-shot transactions idempotent at the reducer or central handler boundary.
- Treat save/load as a typed persistence contract that includes all live gameplay state.
- Avoid relying on rerender or scene transition timing to prevent duplicate user actions.
- Give global pending gameplay consequences a clear owner, or document and test intentional deferred ownership.

## Suggested Fix Order

1. Fix blood-bank reducer affordability validation and replace tests that codify the exploit.
2. Add active/type guards to setup minigame completion reducers and cover replayed completion.
3. Protect travel/tourbus routing after `advanceDay()` produces `GAMEOVER`.
4. Fix event modal and post-gig one-shot re-entry guards.
5. Persist and sanitize `rivalBand`.
6. Move Tourbus arrival save to the end of the arrival transaction or save an explicit final snapshot.
7. Decide and encode the Roadie contraband model.
8. Fix practice return Band HQ pending behavior.
9. Align contraband success feedback with reducer-accepted state changes.
10. Reuse the purchase processing lock in SupplyStop.
11. Sanitize settings before writing global settings storage.
12. Resolve asset modal ownership as global or intentionally deferred.
13. Add tests for the lower-confidence travel fallback, stale gig data, and DEV backdoor notes as appropriate.

## Verdict

The consolidated audit findings are valid against the current snapshot. The confirmed Major findings materially reduce merge confidence until fixed.

[REQUEST CHANGES]
