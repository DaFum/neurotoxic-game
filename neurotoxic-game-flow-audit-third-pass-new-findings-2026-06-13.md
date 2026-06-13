# Neurotoxic Game Flow Audit - Third Pass New Findings

Date: 2026-06-13  
Snapshot reviewed: `/workspace/memory/snapshots/neurotoxic-game`  
Scope: Absolute-depth third pass over game-flow state transitions, reducer boundaries, persistence, economy, minigames, contraband, and shop flows.

This report is additive. It intentionally excludes the findings already listed in:

- `output/neurotoxic-game-flow-audit-2026-06-13.md`
- `output/neurotoxic-game-flow-audit-new-findings-2026-06-13.md`

## Summary

This pass found six additional issues that were not listed in the prior markdown reports. The highest-risk cluster is reducer authority: several flows rely on UI or hook guards while reducers still accept stale or impossible game actions. The second cluster is persistence and economy consistency: rival-band pressure is live gameplay state but is dropped on save/load, and Roadie contraband rewards can be generated from stash presence without consuming or identifying any delivered item.

## Top Findings

### Major - Blood-bank donations can mint money even when the band cannot pay the costs

**Evidence**

- `src/hooks/useBloodBank.ts:45-76` computes `canDonate` / `canDonateMarrow` in the hook and only dispatches when the UI-level validation passes.
- `src/utils/bloodBankUtils.ts:11-23` requires `band.harmony > harmonyCost` and every member to have at least `staminaCost + 10`.
- `src/context/reducers/clinicReducer.ts:199-297` accepts the donation payload, validates only that player/band/social and `band.members` exist, then adds `moneyGain` and clamps harmony/stamina after subtracting costs.
- `tests/reducers/clinicReducer.bloodBank.test.js:34-99` currently codifies the unsafe behavior: the reducer is expected to grant money even when a member has only 10 stamina for a 20-stamina cost, and when harmony is 10 for a 50-harmony cost.

**What is wrong**

The reducer is not the final authority for the blood-bank transaction. If the action is stale, replayed, dispatched outside the modal, or produced by a future UI path that misses the hook validation, the band can receive the money reward while only paying clamped partial costs. Harmony can fall to the minimum and stamina can fall to zero, but the transaction still succeeds.

**Why it matters**

The blood bank is part of the softlock/economy escape design. Allowing impossible donations turns it from an emergency tradeoff into a money mint under invalid state. This also makes tests misleading because they assert the exploitable behavior as correct.

**Smallest safe fix**

Move the affordability validation into `handleBloodBankDonate`. Reuse `validateBloodBankDonation(state.band, { harmonyCost, staminaCost })` or equivalent reducer-local checks after payload normalization and before applying `moneyGain`. If validation fails, return `state` and optionally append a deterministic failure toast from a separate action path.

**Test gap**

Replace the current clamp-success tests with reducer tests that assert no money, harmony, stamina, controversy, or success toast changes when harmony or any member stamina cannot pay the configured cost.

### Major - Setup minigame completion reducers can replay rewards, penalties, and quest progress after completion

**Evidence**

- `src/context/reducers/minigameReducer.ts:414-466` completes Amp Calibration without checking `state.minigame.active` or `state.minigame.type`.
- `src/context/reducers/minigameReducer.ts:500-543` completes Kabelsalat without checking `state.minigame.active` or `state.minigame.type`.
- `src/context/reducers/minigameReducer.ts:552-636` completes Roadie without checking `state.minigame.active` or `state.minigame.type`.
- The shared result helper at `src/context/reducers/minigameReducer.ts:379-404` explicitly sets `minigame.active: false`, but a second completion action still applies another economy result because no handler treats inactive state as terminal.
- `src/context/useMinigameDispatchActions.ts:69-120` exposes completion dispatchers that directly dispatch the completion actions.
- Existing tests assert first completion effects, but there is no reducer-level idempotency coverage for already-inactive minigames.

**What is wrong**

Amp Calibration, Kabelsalat, and Roadie completion actions remain economically active after the minigame is already complete. A second `COMPLETE_AMP_CALIBRATION` can add the reward again, a second failed Kabelsalat can subtract harmony again and emit progress again, and a second Roadie completion can apply repair costs, contraband bonus, and delivery quest progress again.

The happy-path hooks have local guards in places, but reducer invariants should not depend on every caller never dispatching twice. The repo's local guidance already says StrictMode can replay effects and one-shot completion handlers need guards; the reducer is the safest place to make the completion action terminal.

**Why it matters**

These minigames feed pre-gig modifiers, player money, band harmony, repair costs, and quest events. A replayed completion can corrupt the gig setup state before the gig starts, especially for quest progression and money/harmony totals.

**Smallest safe fix**

At the top of each affected completion reducer, require the expected active minigame:

```typescript
if (
  state.minigame?.active !== true ||
  state.minigame?.type !== MINIGAME_TYPES.AMP_CALIBRATION
) {
  return state
}
```

Apply the corresponding type for Kabelsalat and Roadie. Keep Tourbus separate because it relies on `targetDestination` and already returns early when the target is gone, though an explicit active/type guard would still make the contract clearer.

**Test gap**

Add reducer tests that call each completion handler twice and assert the second call returns the same state or at least produces no additional economy, modifier, toast, or quest-progress changes.

### Major - Rival-band state is live gameplay but is dropped by save/load

**Evidence**

- `src/context/initialState.ts:234` includes `rivalBand` in `GameState`.
- `src/context/reducers/rivalReducer.ts:15-93` spawns, moves, checks, and updates the active rival band.
- `src/hooks/useArrivalLogic.ts:94-98` moves the rival and checks for encounters after arrival.
- `src/hooks/useRhythmGameLogic.ts:74-88` applies the rival crowd-pressure penalty when the rival is at the gig node.
- `src/utils/brandDealLogic.ts:199-209` and `src/utils/brandDealLogic.ts:265-325` apply rival pressure to brand-deal offer selection and negotiation outcomes.
- `src/context/usePersistence.ts:23-55` omits `rivalBand` from `LOADABLE_SAVE_KEYS`.
- `src/context/usePersistence.ts:85-155` omits `rivalBand` from `createPersistedState`.
- `src/context/reducers/systemReducer.ts:1614-1670` constructs the loaded safe state without sanitizing or assigning `loadedState.rivalBand`.

**What is wrong**

The rival band is a live campaign system, but it is not persisted. Saving and loading resets the campaign to `rivalBand: null` from the initial state, after which the Overworld spawn hook can create a new rival instead of preserving the existing one.

**Why it matters**

This silently wipes rival location, power, and identity. That changes map pressure, rhythm-game crowd decay, brand-deal odds, negotiation penalties, and encounter toasts across reloads. It also lets players clear an unfavorable rival position by saving and reloading.

**Smallest safe fix**

Persist and hydrate `rivalBand` like other campaign fields:

- Add `rivalBand` to `LOADABLE_SAVE_KEYS`.
- Include `rivalBand` in `createPersistedState`.
- Add a `sanitizeRivalBand` path in `handleLoadGame` that accepts only known `RivalBandState` fields and clamps numeric power.
- Add migration behavior for missing/legacy saves that keeps `null`.

**Test gap**

Add a save/load test that starts with a rival at a known node and power level, persists the save, loads it, and asserts the same rival state drives the rhythm-game and brand-deal selectors after hydration.

### Major - Roadie contraband delivery rewards are generated from stash presence without consuming or identifying delivered stash

**Evidence**

- `src/hooks/minigames/useRoadieLogic.ts:195-203` sets `hasContraband` from `!!(band?.stash && !isEmptyObject(band.stash))` and initializes the Roadie run with a synthetic contraband item whenever any stash entry exists.
- `src/hooks/minigames/useRoadieLogic.ts:89-106` creates the initial Roadie cargo list with `{ id: 'contraband', type: 'CONTRABAND', weight: 1.5 }` when `hasContraband` is true.
- `src/utils/minigames/roadieUtils.ts:124-141` increments `game.contrabandCount` when that synthetic cargo is delivered.
- `src/context/reducers/minigameReducer.ts:552-636` turns `contrabandDelivered` into money and an `item.delivered` quest event.
- `src/utils/economy/minigameLogic.ts:65-69` pays `contrabandDelivered * 50`.
- No Roadie completion path removes an item from `band.stash` or records which stash item was delivered.
- The quest copy says "Move 10 units of contraband through the roadie hustle" in `public/locales/en/events.json:46-47`, and the quest registry listens to `item.delivered` at `src/data/questRegistry.ts:476-484`.

**What is wrong**

The Roadie minigame treats any non-empty stash as permission to deliver one generic contraband unit. Completion pays the bonus and emits quest progress, but the actual stash is unchanged. A single retained contraband item can therefore keep enabling future Roadie contraband deliveries without being consumed or tied to a real inventory unit.

**Why it matters**

This creates a repeatable money and quest-progress loop from stash presence rather than stash quantity. It also makes the Roadie quest ambiguous: progress says contraband was delivered, but no contraband left the band's stash.

**Smallest safe fix**

Decide the intended model and encode it explicitly:

- If Roadie delivers the band's stash, select a concrete stash item at minigame start and consume one stack on successful delivery before paying the bonus/progress.
- If Roadie delivers contact cargo independent of stash, gate it by an explicit quest/cargo flag instead of arbitrary stash presence, and do not imply that stash contraband was delivered.

Either path should make `contrabandDelivered` a reducer-validated outcome rather than a free numeric payload.

**Test gap**

Add an integration test for a band with one stash item that completes Roadie twice. The test should assert either the stash is consumed and the second run has no contraband bonus, or that a separate cargo flag is consumed instead.

### Minor - Contraband stash shows success even when the reducer rejects the use action

**Evidence**

- `src/hooks/useContrabandStash.ts:30-63` validates only member selection and missing `item.id`, dispatches `useContraband`, then immediately adds a success toast.
- `src/context/reducers/bandReducer.ts:673-711` can reject the action for several legitimate reducer reasons: missing stash entry, forbidden key, instance ID mismatch, already-applied item, invalid target member, or effect application failure.
- `tests/ui/useContrabandStash.test.jsx:147-180` asserts the hook shows success immediately after dispatch, but does not verify that the reducer actually changed state.
- `src/ui/ContrabandStash.tsx:179-193` hides the button for already-applied items in normal rendering, but stale UI, double-clicks, or delayed state updates can still hit the dispatch path.

**What is wrong**

The hook reports "Used" or "Applied" before it knows the reducer accepted the item. If the item was already consumed, the selected member disappeared, the instance ID is stale, or the reducer no-ops for another invariant, the player still gets a success toast.

**Why it matters**

This is a state/UI consistency bug. It can make players believe a consumable or temporary effect applied when the authoritative reducer rejected it. It also hides reducer-boundary failures during testing because success is asserted at the hook layer only.

**Smallest safe fix**

Move the success toast into the reducer action result path, or make the hook derive success from the post-dispatch state change. The reducer already has the authoritative knowledge of whether stash, active effects, member stats, or `applied` changed.

**Test gap**

Add tests for stale instance ID and already-consumed item paths where `handleUseContraband` returns unchanged state and the UI does not emit a success toast.

### Minor - Supply-stop purchases bypass the BandHQ purchase processing lock

**Evidence**

- `src/ui/bandhq/hooks/useBandHQLogic.ts:50-57` owns `processingItemIdRef` and `processingItemId`.
- `src/ui/bandhq/hooks/useBandHQLogic.ts:117-154` wraps `handleBuy` with `handleBuyWithLock`, preventing purchase re-entry for the same item and exposing processing state.
- `src/ui/bandhq/BandHQContentArea.tsx:123-170` passes `handleBuyWithLock` and `processingItemId` to BandHQ shop/upgrade items.
- `src/ui/bandhq/ShopItem.tsx:75-84` disables purchase when any processing item is active, but only if the caller supplies `processingItemId`.
- `src/ui/SupplyStopModal.tsx:51-74` uses `usePurchaseLogic` directly and calls `purchaseLogic.handleBuy(item)` without the BandHQ lock.
- `src/ui/SupplyStopModal.tsx:113-120` renders `ShopItem` without `processingItemId`, so `ShopItem` always sees `isAnyProcessing === false`.

**What is wrong**

SupplyStop and black-market purchases reuse the same purchase engine as BandHQ but not the same re-entry lock. This creates a behavior split between normal shop purchases and travel supply-stop purchases. A fast repeated click can dispatch repeated purchase attempts from the same rendered affordability snapshot and can duplicate purchase side effects such as toasts and black-market consequences.

**Why it matters**

Today, many purchase patches are absolute-state patches, which limits some double-charge/duplicate-inventory outcomes. But the modal is bypassing an established safety primitive in a shared economy path. Future purchase effects, functional updates, analytics, quest triggers, or async consequences would inherit a different safety profile in SupplyStop than in BandHQ.

**Smallest safe fix**

Extract the processing lock into a small reusable purchase wrapper that both BandHQ and SupplyStop use, or let `usePurchaseLogic` own the lock internally and expose `processingItemId`. SupplyStop should pass `processingItemId` to `ShopItem`.

**Test gap**

Add a SupplyStop test that double-invokes the same item handler and asserts only one purchase attempt and one consequence toast can occur while processing is active.

## Type System Audit

The most important type-system issue in this pass is boundary trust, not missing annotations. Several reducers accept payloads that are type-shaped but not state-valid:

- `BloodBankDonatePayload` is numerically sanitized but not validated against current resources.
- Minigame completion payloads are sanitized by action creators, but reducers do not require the matching active minigame state.
- `contrabandDelivered` is a number, but the reducer does not prove that any concrete contraband unit exists or was delivered.
- `rivalBand` is present in `GameState` but absent from the persistence contract, which lets a typed live field disappear at a storage boundary.

## Architecture And Logic

The recurring pattern is that UI hooks are doing the first validation pass, but reducers are not always enforcing the same invariant. For this codebase, reducers are the durable contract: they receive actions from UI, effects, dev helpers, tests, replayed callbacks, load flows, and future code paths. Any flow that changes money, quest progress, inventory, or scene-critical state should be idempotent or reject impossible state at reducer level.

The rival-band omission is a different architectural issue: the campaign model and persistence model have drifted. `rivalBand` affects Overworld, rhythm scoring, and brand deals, so it must be treated as persisted campaign state rather than transient UI state.

## Test Gaps

- Reducer-level rejection tests for impossible blood-bank donations.
- Idempotency tests for Amp Calibration, Kabelsalat, and Roadie completion reducers.
- Save/load regression for `rivalBand`.
- Roadie contraband delivery test proving stash consumption or explicit non-stash cargo behavior.
- Contraband stash UI tests where the reducer rejects the use action and no success toast is shown.
- SupplyStop double-click/re-entry test matching the BandHQ purchase lock behavior.

## Suggested Fix Order

1. Fix blood-bank reducer validation and update the existing tests that currently codify the exploit.
2. Add active/type guards to setup minigame completion reducers and cover replayed completion.
3. Persist and sanitize `rivalBand`.
4. Decide the Roadie contraband model and make stash/cargo consumption explicit.
5. Move contraband-use success feedback behind reducer-confirmed success.
6. Reuse the purchase processing lock in SupplyStop.

## Verdict

[REQUEST CHANGES]
