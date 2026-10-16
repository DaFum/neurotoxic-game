# Code simplification review — 2026-10-15

This document preserves the complete code review requested in chat. The review
covered source modules, hooks, UI, state management, backend handlers, tests, and
tooling. It identified duplicated decisions, redundant state, and repeated
processing. It was a static review with targeted probes, not an exhaustive proof
that every possible simplification has been found.

The original reviewed commit was `2d0e7a921`. Locations below refer to that
snapshot; they may move as fixes land. Implementation started from the newer
`main` commit `1bdb7fea6` and was updated to `67bb1cac4` after PRs #3120 and #3121
merged. Backlog descriptions preserve the original findings; status and caveats
below reflect the subsequent verification. Revalidate open suggestions against
current code before implementation.

## Five simplifications that also address correctness

This PR adds C01, C03, C04, and C05 and verifies the existing C02 fix.
Its duplicate-report follow-up also implements B33 and shares the selected asset
tab shadow. The upstream status of the other findings is tracked below.

### C01 — Remove the incomplete map-node comparison

- Location: `src/components/MapNodeView.tsx:551`.
- Finding: the custom `memo` comparator omits displayed fog fields, including
  `onwardRouteCount` and `exactWearCost`.
- Evidence: a real-state probe changed onward routes from 2 to 3 while the exact
  comparator still returned `true`, suppressing rendering.
- Change: use ordinary `memo` and regression-test fog-only rerenders. Stabilize
  complete immutable projections upstream only if profiling warrants it.
- Status: implemented in this PR with regression tests.

### C02 — Stop destroying shared crowd textures

- Locations: `src/components/stage/CrowdTextureManager.ts:61,106`;
  `src/components/stage/stageRenderUtils.ts:354`.
- Finding: crowd teardown and late-load handling destroy textures owned by shared
  caches, potentially invalidating another consumer.
- Change: retain disposal guards and clear local references without destroying
  shared textures, matching the note/effect texture managers.
- Status: already fixed upstream in the implementation base. Existing lifecycle
  tests cover ordinary disposal and disposal during loading; this PR verifies
  that fix rather than reapplying it.

### C03 — Parse the actual duplicate-report format

- Location: `scripts/analyze-duplicates.js:39`.
- Finding: the analyzer supports speculative schemas but ignores the pinned
  jscpd format, `duplicates[].firstFile/secondFile`.
- Evidence: the original scanner report contained four duplicate clusters, but
  the analyzer printed “No significant duplicates found.”
- Change: parse the installed scanner's actual format and test the CLI against a
  report produced by that scanner. Preserve summary limits and valid-empty
  behavior; malformed reports must not imply a clean scan.
- Status: implemented in this PR with regression tests.

### C04 — Share member-delta resolution between preview and application

- Locations: `src/utils/gameState/delta.ts:470,794`.
- Finding: preview uses zero fallbacks for malformed mood/stamina, while
  application uses canonical readers with mood/stamina defaults of 50/100.
- Evidence: malformed stamina plus a positive delta can display a gain while
  application recovers to an already-full baseline.
- Change: resolve canonical baseline and next values once through shared logic,
  preserving finite-number checks, clamps, malformed-input behavior, and no-op
  references.
- Status: implemented in this PR with regression tests.

### C05 — Pass resolved player identity through the start flow

- Location: `src/scenes/mainmenu/hooks/useMainMenuStart.ts:46`.
- Finding: both callers already know the identity, dispatch it before reset,
  reread storage, then dispatch it again. Reset discards the first update; a
  failed subsequent read can lose the identity.
- Change: pass the resolved identity to `proceedToTour`, reset once, then apply
  identity once. Retain name validation, prompts, fullscreen behavior, storage
  fallback, and fire-and-forget audio.
- Status: implemented in this PR with regression tests.

## Implementation status — 2026-10-16

The user-provided verification dated 2026-10-15 was checked against the merged PR
bodies and changed files. B01–B30 were processed in these PRs; this does not mean
all thirty were implemented:

- [PR #3120](https://github.com/DaFum/neurotoxic-game/pull/3120) implemented
  B02–B08, B10, B11, and B13–B15. B01 and B09 were deferred; B12 was explicitly
  excluded and remains open.
- [PR #3121](https://github.com/DaFum/neurotoxic-game/pull/3121) implemented
  B16, B17, B19–B23, and B25–B30. B18 and B24 were deferred.
- B19 deliberately retains full clicked-asset snapshots in the discriminated
  dialog state. Switching dialogs to current asset IDs was not implemented.
- B22 addresses size changes by resetting on prompt, width, and height, rather
  than introducing the originally proposed URL-keyed loader.
- B01's original claim that loading always restores `OVERWORLD` was incorrect
  for the verified implementation base: terminal conditions can restore
  `GAMEOVER`. Save timing and loaded-scene behavior must be preserved explicitly.
- B09's functional-setter API must survive any replacement reducer, or callers
  must be deliberately migrated. Concrete production arguments alone do not
  justify removing that API behavior.
- B12's original target is the local `dispatchers` memo in
  `usePostGigHandlers.ts`; the PR exclusion discusses dispatch-context identity.
  Recheck the exact target and callback-identity contract before deciding on it.

Thus 25 of B01–B30 are implemented, and B01, B09, B12, B18, and B24 remain open.
B33 is implemented in this PR as part of the duplicate-report follow-up. The
B31–B45 entries other than B33 were implemented in the subsequent follow-up
described below. S01–S16 are implemented in the smaller-cleanup follow-up.
B01, B09, B12, B18, B24, and H01 remain open.
C01–C05 have their own status above.

## Other substantial opportunities

| ID  | Original location                                                                                                                                                                                  | Simplification and constraints                                                                                                                                                                                                                                                                                                                                       | Status                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| B01 | `src/context/useEventSystem.ts:293`                                                                                                                                                                | Stop eagerly replaying every event action through `gameReducer` before dispatching it. Only saving consumes the snapshot. Reuse `saveGameAfterStateCommit`; if the old serialized scene must be preserved exactly, replay lazily only when saving. Loading can select `GAMEOVER` for terminal states; preserve the save-timing and loaded-scene contract explicitly. | Open — excluded/deferred in #3120                                         |
| B02 | `src/context/initialState.ts:224,288`                                                                                                                                                              | Replace the initial-state template plus reset overrides with one fresh-state factory. Original calls shared several arrays and `social.regionalGigHistory`. Preserve null-prototype stash/trait construction.                                                                                                                                                        | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B03 | `src/context/reducers/expeditionSanitizers.ts:743,972,996`                                                                                                                                         | Normalize obligation IDs, social proofs, gig outcomes, and pressure once and reuse them. Obligation IDs undergo equivalent processing six times. Keep every proof, bounds, and registry check.                                                                                                                                                                       | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B04 | `src/context/reducers/systemReducer.ts:590`                                                                                                                                                        | Replace nine repeated effect-field names and regex-based reconstruction with guarded lookup in `ADDITIVE_BAND_EFFECT_FIELDS`. Keep harmony/stress and other special-case clamps.                                                                                                                                                                                     | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B05 | `src/utils/gameState/delta.ts:775,888`                                                                                                                                                             | Replace duplicate change flags with reference comparisons and lazy array allocation. Remove writes that restore unchanged members already present in the copied array. Preserve no-op identities and validation.                                                                                                                                                     | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B06 | `src/context/reducers/expeditionReducer.ts:1388,1477`                                                                                                                                              | Reuse the crisis already derived by each handler instead of deriving it again in `isCurrentExpeditionFailureId`. Preserve fresh derivation and strict stale-ID rejection.                                                                                                                                                                                            | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B07 | `src/utils/gameState/regionalGigHistory.ts:77,109`                                                                                                                                                 | Normalize the entire history once, then normalize only the changed region. Retain eviction, invalid-day behavior, and forbidden-key handling.                                                                                                                                                                                                                        | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B08 | `src/context/reducers/minigameReducer.ts:605,700`                                                                                                                                                  | Share completed/perfect/failed quest emission through the existing completion helper. Preserve success versus perfect and leave navigation with continuation callbacks.                                                                                                                                                                                              | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B09 | `src/hooks/rhythmGame/useRhythmGameState.ts:50,130,302`                                                                                                                                            | Replace twelve setter action variants and repetitive reducer cases with a typed partial-state patch. Production callers provide concrete values, but the setter API also supports updater functions. Preserve or explicitly migrate that behavior, stable setters, combined corruption updates, and the separate high-frequency state ref.                           | Open — excluded/deferred in #3120                                         |
| B10 | `src/hooks/minigames/useAmpLogic.ts:335,369`                                                                                                                                                       | Use one synchronous completion guard: `finishCalledRef` and `isCompleteRef` are always changed together. Remove the extra completion wrapper while preserving one-shot completion.                                                                                                                                                                                   | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B11 | `src/hooks/minigames/useTourbusLogic.ts:222,263`                                                                                                                                                   | Route normal and forced completion through one guarded callback. Retain their display synchronization, raw damage/items payload, and routing ownership.                                                                                                                                                                                                              | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B12 | `src/hooks/usePostGigHandlers.ts:147`                                                                                                                                                              | Remove the dispatcher-bundle `useMemo` and duplicated dependency list. All receiving hooks destructure it and depend on individual callbacks, not bundle identity.                                                                                                                                                                                                   | Open — excluded/deferred in #3120                                         |
| B13 | `src/hooks/useDealNegotiation.ts:86`                                                                                                                                                               | Resolve the outcome first, then perform one negotiated-deal update and toast instead of four repeated branches. Preserve failed using the original deal and revoked storing null.                                                                                                                                                                                    | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B14 | `src/hooks/useGigSession.ts:121`                                                                                                                                                                   | Remove the nine-field reconstruction before `buildGigStatsSnapshot`; the helper already normalizes consumed fields. Use a partial-or-absent stats input contract. Preserve undefined inputs, `failed: true`, and the `finally` continuation.                                                                                                                         | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B15 | `src/hooks/rhythmGame/useRhythmGameAudio.ts:119,143,387`                                                                                                                                           | Let physics setup return success/failure, then set internal and UI failure status in the caller's single failure branch. Keep initialization and cancellation guards.                                                                                                                                                                                                | Implemented — [#3120](https://github.com/DaFum/neurotoxic-game/pull/3120) |
| B16 | `src/ui/bandhq/hooks/usePurchaseLogic.ts:452`; `src/ui/bandhq/CatalogTab.tsx:87`; `src/ui/SupplyStopModal.tsx:134`                                                                                 | Compute one `PurchaseDecision` per item and derive disabled state from it. Preserve the additional Expedition policy gate. Remove redundant callback plumbing through catalog components/types.                                                                                                                                                                      | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B17 | `src/utils/purchaseLogicUtils.ts:412,451`                                                                                                                                                          | Share purchase-rule evaluation between UI decisions and transaction validation. Reputation, ownership, and primary effects are evaluated repeatedly. Retain purchase-time validation, error priority, finite checks, and consumable versus one-time ownership rules.                                                                                                 | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B18 | `src/ui/bandhq/hooks/usePurchaseLogic.ts:380`; `src/utils/purchaseLogicUtils.ts:512,538`                                                                                                           | Consolidate ownership marking in effect processing. Fame purchases receive overlapping idempotent ownership updates. Preserve money purchases and distinct HQ/inventory rules.                                                                                                                                                                                       | Open — deferred in #3121                                                  |
| B19 | `src/components/assets/AssetSectionPanel.tsx:72`                                                                                                                                                   | Replace five independent dialog states with one discriminated target containing kind, asset ID, and optional slot ID. Resolve current asset data instead of storing full snapshots.                                                                                                                                                                                  | Implemented; snapshots retained — #3121                                   |
| B20 | `src/components/assets/AssetSectionDeck.tsx:75,107`; `src/components/assets/AssetSectionPanel.tsx:93`                                                                                              | Render repair, upgrade, and acquisition buttons once with conditional styling, disabled state, and tooltip content. Existing Tooltip handles absent content. Preserve accessible disabled-button wrappers.                                                                                                                                                           | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B21 | `src/ui/shared/VolumeSlider.tsx:19`; `src/ui/settings/AudioSettings.tsx:31`                                                                                                                        | Expose a numeric callback. The slider fabricates events that AudioSettings converts back into numbers through three callbacks. Parse/validate/clamp actual events inside the slider; preserve zero volume and focus behavior.                                                                                                                                        | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B22 | `src/ui/shared/GeneratedImagePanel.tsx:43`                                                                                                                                                         | Associate loading/error state with the complete requested URL, eliminating the prompt-only reset effect and covering size changes. Retain fallback failure stopping behavior.                                                                                                                                                                                        | Addressed via dimension reset — #3121                                     |
| B23 | `src/ui/shared/BrutalistUI.tsx:74`                                                                                                                                                                 | Replace hover-only state and callbacks with CSS `group-hover`. Preserve the unsafe-URL navigation guard.                                                                                                                                                                                                                                                             | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B24 | `src/utils/assetTicks.ts:264`                                                                                                                                                                      | Consolidate repeated paid-liability and default/foreclosure branches. Preserve Career versus Expedition partial payments, protected cash, amortization, final payoff, term decrement rules, and one fame penalty per asset.                                                                                                                                          | Open — deferred in #3121                                                  |
| B25 | `src/utils/assetSelectors/assetFinancials.ts:36,62`; `src/utils/assetTicks.ts:588`; `src/utils/imageGen.ts:423`; `src/utils/assetSelectors/moduleUnlock.ts:325,334`                                | Replace copied guarded lookups with existing `getRegisteredModule`. Use the chassis getter for sale quotes. Retain prompt own-key checks and registry enumeration guards.                                                                                                                                                                                            | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B26 | `src/utils/economy/gigLogic/calculators/calculateGigExpenses.ts:28`                                                                                                                                | Replace five repeated modifier-expense blocks with a small typed descriptor list and one loop. Preserve expense order, active-only items, and soundcheck asset discounts.                                                                                                                                                                                            | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B27 | `src/utils/eventEngine/processOptions.ts:14`; `src/context/useEventSystem.ts:252`                                                                                                                  | Remove the identity function, facade entry, and redundant pipeline/null branch. It implements no current transformation; update its mocks and no-op tests.                                                                                                                                                                                                           | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B28 | `src/utils/audio/playbackStrategies.ts:38,92`                                                                                                                                                      | Share pure OGG/MIDI excerpt and note-tail duration calculation. Preserve last-note/excerpt fallback priority, backend lifecycle, per-await cancellation, timing, and unit conversion. Do not apply authored excerpt rules to procedural playback.                                                                                                                    | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B29 | `src/domain/expedition/condition.ts:155`                                                                                                                                                           | Cache by condition buckets instead of exact values. Integer-value keys allow 1,030,301 entries although output depends on at most 64 bucket combinations. Consumers use profile values, not identity.                                                                                                                                                                | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B30 | `src/domain/expedition/effectiveRules.ts:73`; `archive.ts:33`; `cargo.ts:166`; `loadout.ts:509`                                                                                                    | Share chassis lookup, accepting an explicit asset ID for committed and candidate loadouts. Preserve boundary guards and ID/kind checks; avoid circular imports.                                                                                                                                                                                                      | Implemented — [#3121](https://github.com/DaFum/neurotoxic-game/pull/3121) |
| B31 | `src/domain/expedition/eventProof.ts:23`                                                                                                                                                           | Build result and condition indexes together instead of traversing/narrowing the registry twice. Preserve conditions on options without Expedition results.                                                                                                                                                                                                           | Implemented — subsequent follow-up                                        |
| B32 | `src/data/events/index.ts:109`                                                                                                                                                                     | Populate `KNOWN_EVENT_IDS` after successful validation/insertion. Remove the IIFE and second traversal. Do not reuse `seenIds`, which deliberately includes rejected IDs.                                                                                                                                                                                            | Implemented — subsequent follow-up                                        |
| B33 | `src/domain/expedition/betweenTour.ts:176`                                                                                                                                                         | Choose the eligible-or-fallback pool once, then share sorting, seeded selection, and guards. Preserve order, RNG salt, and branch-specific option IDs.                                                                                                                                                                                                               | Implemented in this PR — duplicate-report follow-up                       |
| B34 | `src/domain/expedition/extraction.ts:111`                                                                                                                                                          | Replace the parallel requested-ID array and set with one filtered set. Ledger order determines carry selection; preserve malformed-entry filtering.                                                                                                                                                                                                                  | Implemented — subsequent follow-up                                        |
| B35 | `src/domain/expedition/pressure.ts:173,195`; `src/domain/expedition/extraction.ts:168,183,210`                                                                                                     | Resolve effective rules once per operation and reuse numeric/flag values instead of rebuilding the capability graph. Include carry-slot resolution in settlement reuse.                                                                                                                                                                                              | Implemented — subsequent follow-up                                        |
| B36 | `src/components/stage/TourbusStageController.ts:118`                                                                                                                                               | Load independent controller/effect assets concurrently with `Promise.all`, following Roadie. Capture manager ownership and retain the final disposal check before drawing.                                                                                                                                                                                           | Implemented — subsequent follow-up                                        |
| B37 | `src/components/stage/NoteSpritePool.ts:37,68,146,154`                                                                                                                                             | Fold the single-consumer sprite factory into the pool and configure each acquired sprite once. Preserve external texture ownership, jitter, dimensions, anchor, and pooling.                                                                                                                                                                                         | Implemented — subsequent follow-up                                        |
| B38 | `scripts/game-balance-simulation.mjs:4058`                                                                                                                                                         | Reuse existing `describe(values, format)` for lowest money, peak money, and drawdown statistics instead of repeating full statistic objects. Preserve output/rounding semantics; percentile methods elsewhere differ and are not interchangeable.                                                                                                                    | Implemented — subsequent follow-up                                        |
| B39 | `scripts/game-balance-simulation.mjs:2667,3772`                                                                                                                                                    | Create execution-coverage objects through one factory. Every call must create independent sets and counters.                                                                                                                                                                                                                                                         | Implemented — subsequent follow-up                                        |
| B40 | `api/leaderboard/song.js`; `api/leaderboard/stats.js`                                                                                                                                              | Share limit parsing, rate-limit mechanics, player validation, and leaderboard response assembly. Keep endpoint-specific errors, opaque public references, song allowlisting, batch validation, and the deliberate `GT` difference.                                                                                                                                   | Implemented — subsequent follow-up                                        |
| B41 | `scripts/run-fast-tests.mjs:16`; `scripts/run-all-tests.mjs:112`                                                                                                                                   | Share the identical cross-platform pnpm spawn/result helper. Keep worker allocation, overrides, and execution policies distinct.                                                                                                                                                                                                                                     | Implemented — subsequent follow-up                                        |
| B42 | `vitest.config*.js`                                                                                                                                                                                | Share common test settings and aliases. The performance config already inherits the alias and need not rebuild it. Preserve runner environments and suite ownership.                                                                                                                                                                                                 | Implemented — subsequent follow-up                                        |
| B43 | `scripts/lint-fix-preview.sh:44`                                                                                                                                                                   | Remove the unused base-branch fetch and full-history fallback. The actual formatter preview compares with `HEAD`.                                                                                                                                                                                                                                                    | Implemented — subsequent follow-up                                        |
| B44 | `scripts/check-dead-code-budget.mjs:16`; `.github/workflows/dead-code-report.yml:85`                                                                                                               | Let the budget checker consume CI's already-generated report instead of running Knip twice. Preserve parse-error handling and local CLI behavior.                                                                                                                                                                                                                    | Implemented — subsequent follow-up                                        |
| B45 | `tests/performance/MainMenuStability.test.jsx:58`; `proceedToTour.bench.jsx:51`; `proceedToTourTime.bench.test.jsx:48`; `tests/ui/MainMenu.identity.test.jsx:37`; `useLeaderboardSync.test.jsx:14` | Extract the approximately 32-line storage-error mock repeated five times. Create independent mock instances per suite and respect mock hoisting.                                                                                                                                                                                                                     | Implemented — subsequent follow-up                                        |

## Smaller cleanups

| ID  | Original location                                                                | Cleanup and constraints                                                                                                                                                                             | Status                                  |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| S01 | `src/hooks/useGigInput.ts:116`                                                   | Collapse touch-start/end wrappers into lane input. Preserve audio-unlock, input registration, and animation ordering.                                                                               | Implemented — smaller-cleanup follow-up |
| S02 | `src/hooks/preGig/usePreGigDerivations.ts:29`; `src/hooks/usePreGigLogic.ts:143` | Remove unused `technicalCondition` input and its computation. The actual profile comes from Expedition state.                                                                                       | Implemented — smaller-cleanup follow-up |
| S03 | `src/hooks/travel/actions/useHandleTravel.ts:268`                                | Reuse `clearPendingTravel` as the timeout callback instead of repeating resets.                                                                                                                     | Implemented — smaller-cleanup follow-up |
| S04 | `src/hooks/travel/actions/useGetLocationName.ts:23`                              | Replace the hook with a stable module-level resolver; it has no reactive dependencies and resolves current i18n when invoked.                                                                       | Implemented — smaller-cleanup follow-up |
| S05 | `src/hooks/useContrabandStash.ts:18`                                             | Reuse existing `useDisclosure` for modal state.                                                                                                                                                     | Implemented — smaller-cleanup follow-up |
| S06 | `src/hooks/useLeaderboardSync.ts:20`                                             | Use one endpoint-unavailable flag for disabling requests and logging once. Check it before logging, then set it; preserve in-flight deduplication and HMR reset.                                    | Implemented — smaller-cleanup follow-up |
| S07 | `src/hooks/rhythmGame/useRhythmGameAudio.ts:181,400`                             | Validate lane/window pairs in one indexed pass before mutation, retaining strict finite checks. Remove the immediately repeated abort check with no intervening await.                              | Implemented — smaller-cleanup follow-up |
| S08 | `src/hooks/minigames/useRoadieLogic.ts:208,273`                                  | Replace the stash-selection IIFE with `Object.keys(band?.stash ?? {})[0] ?? null`; pass `finishRoadie` directly.                                                                                    | Implemented — smaller-cleanup follow-up |
| S09 | `src/hooks/rhythmGame/scoring/useHandleMiss.ts:125`                              | Remove the field copied unchanged from the object already spread above it.                                                                                                                          | Implemented — smaller-cleanup follow-up |
| S10 | `src/utils/mapGenerator/mathUtils.ts:86`                                         | Return the selected slice directly. Previous validated swaps guarantee completed entries; retain sparse-array defenses, RNG draws, and deterministic branches.                                      | Implemented — smaller-cleanup follow-up |
| S11 | `src/utils/postGig/storySpinHandlers.ts:41`                                      | Replace the argument-free, zero-capture updater factory with its updater. Preserve finite-number and controversy clamps. Other factories capture inputs and should remain factories.                | Implemented — smaller-cleanup follow-up |
| S12 | `src/domain/questAdvance.ts:46`                                                  | Avoid cloning the target quest before both callers immediately clone it again. Retain the array/state copies and treat the original quest as read-only.                                             | Implemented — smaller-cleanup follow-up |
| S13 | `src/domain/questAdd.ts:82`                                                      | Remove the size-dependent Set/IIFE branch. Do not blindly substitute `addStoryFlags`, which handles empty strings and duplicate additions differently.                                              | Implemented — smaller-cleanup follow-up |
| S14 | `src/domain/expedition/modules.ts:72`                                            | Spread the neutral profile plus authored overrides rather than repeating defaults. Preserve the invariant that unset overrides are omitted, not explicitly `undefined`.                             | Implemented — smaller-cleanup follow-up |
| S15 | `src/domain/expedition/condition.ts:330`                                         | Use existing `ActiveEffect[]` instead of repeating its anonymous shape twice.                                                                                                                       | Implemented — smaller-cleanup follow-up |
| S16 | `src/utils/translationUtils.ts:49,67`                                            | Optionally handle translated string leaves once inside recursion. Preserve top-level string passthrough, own/forbidden-key checks, cycle handling, sparse arrays, and repeated non-cyclic children. | Implemented — smaller-cleanup follow-up |

## Candidate requiring a contract decision

**H01:** `src/hooks/usePreGigLogic.ts:87` and
`src/hooks/postGig/usePostGigDerivations.ts:141` independently convert Expedition
cargo into merch inventory. Their malformed-entry guards differ. Agree on the
invalid-data contract before introducing a shared selector.

## Review evidence and exclusions

- Caller inspection and targeted probes supported the selected correctness
  findings. The map comparator probe used real Expedition state and projection.
- The original jscpd scan found four clusters at a 12-line/90-token threshold;
  that is an exact-duplication signal, not a measure of all semantic duplication.
- Knip matched the seven documented baseline findings in
  `docs/dead-code-triage.md`: two deliberate exports, one deliberate duplicate
  export, and four unused pinned dependencies retained pending discussion.
- Keep intentional test seams, composition-only dispatch APIs, the public audio
  facade, creator/reducer validation, finite-number defenses, own-key checks,
  cycle guards, save migration, deterministic RNG, and async cancellation rules.
- No useful structural simplification was recommended for static asset/config
  tables, the contraband schema, or the short explicit quest producer contracts.
- The original review changed no repository files and did not run the full test
  suite. Implementation verification is recorded in the accompanying PR.

## Duplicate-report follow-up — 2026-10-16

The CI scan on `461824a80` was reproduced with the workflow's exact thresholds:
`jscpd src --min-lines 8 --min-tokens 60` and the workflow ignore list. It reports
10 clusters; the user-facing summary displays only the largest eight. This
follow-up inspected all ten, including the two omitted from that summary.

| Original cluster | Location on `461824a80`                                                         | Decision                                                                                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | `src/data/questRegistry.ts:2–46,51–95`                                          | Retain. Named imports and explicit registry membership serve different purposes. A namespace spread would automatically register future barrel exports and change the membership contract.                                                                                                                                            |
| 2                | `src/hooks/usePostGigHandlers.ts:60–93`; `src/hooks/usePostGigLogic.ts:165–198` | Retain. This is the typed dependency-injection boundary: one call passes the values that the other function receives. It is not duplicated processing, and it is separate from B12's local dispatcher memo.                                                                                                                           |
| 3, 4, 5, 7       | `src/index.css:18–82`                                                           | Retain the Azeret faces for weights 500/700/800 and Latin/Latin Extended subsets. Both shipped fonts support a 100–900 axis, but advertising that entire range changes matching: ordinary buttons inherit weight 400, which currently matches the declared 500 face. Deduplication through a continuous range would change rendering. |
| 6                | `src/context/reducers/careerReducer.ts:340–350,370–380`                         | Retain separate completion/rollback handlers. Their short shared receipt guard precedes distinct operations: grant without refund versus refund the receipted debit without granting. A helper adds indirection without removing duplicate business logic.                                                                            |
| 8                | `src/domain/expedition/betweenTour.ts:177–186,189–196`                          | Implemented as B33. Choose the eligible-or-fallback pool once, then share sorting, mapping, seeded selection, and the undefined guard. Preserve option eligibility and the RNG salt.                                                                                                                                                  |
| 9                | `src/components/assets/assetsHub.css:234–242,246–254`                           | Implemented. Define the selected-tab shadow once in a local custom property; the focus-visible state adds its two focus rings to the same shadow. Expanded shadow values remain identical in both states.                                                                                                                             |
| 10               | `src/ui/shared/BrutalistUI.tsx:165–173,197–205`                                 | Retain. Two SVG icons share their title/accessibility scaffolding but have different graphics and view boxes. A generic wrapper solely for these few attributes would add another component/API without simplifying their behavior.                                                                                                   |

The identical scan after these changes reports **8 clusters**, down from 10. No
scanner exclusions, thresholds, or source comments were added to hide findings.
The remaining eight clusters are the intentional overlaps explained above.

Characterization coverage now explicitly exercises both Crew pools, least-loyal
selection, deterministic tie choices for seeds 0 and 1, and reversed source order.
Asset-tab shadow expressions were compared before/after custom-property expansion;
selected and focus-visible values are unchanged. Focused tests, style/type checks,
and build results are recorded in the PR.

## Subsequent simplification follow-up — 2026-10-16

This working-tree pass starts from merged `main` at `c0d1df5cf` (PR #3137) and
implements B31–B45 except the already-completed B33:

- **B31, B32:** Build option-result and condition indexes in one registry pass,
  and collect playable event IDs during successful admission. Rejected IDs
  remain separate from playable IDs; conditions on ordinary options remain
  enforced.
- **B34, B35:** Use a filtered Set for requested carry IDs, preserving ledger
  order, and resolve effective rules once for each pressure/settlement operation,
  including the shared rare-carry cap.
- **B36, B37:** Load independent Tourbus assets concurrently with disposal guards;
  fold note-sprite construction into the pool while preserving shared-texture
  ownership, dimensions, anchor, jitter, and reuse.
- **B38, B39:** Reuse the existing summary-statistics helper and create independent
  execution-coverage sets/counters through one factory.
- **B40:** Share leaderboard limit parsing, rate buckets, player validation, and
  public response assembly. Endpoint validation/error contracts and song-only
  Redis `GT` remain intact.
- **B41, B42:** Share cross-platform pnpm spawning and common Vitest settings,
  preserving worker policies, environments, and suite ownership.
- **B43, B44:** Remove unused lint-preview branch fetching and let the dead-code
  budget checker reuse CI's existing JSON report. Its no-argument local scan and
  report/error handling remain available.
- **B45:** Share the storage-error mock factory, creating a separate instance for
  each suite through its mock factory.

The 48-run deterministic simulator comparison (four runs in each of 12 scenarios)
produced byte-identical run data, summaries, and merged coverage before and after
B38/B39. Focused tests cover event admission/option conditions, ledger ordering,
Tourbus loading/disposal, note pooling, leaderboard contracts, runner policies,
and storage fallback behavior.

Verification for this follow-up:

- Production Node suite: 5,507 tests passed.
- Full logic suite: 47 files / 841 tests passed.
- Full UI suite: 232 files / 1,458 tests passed.
- Tooling suite: 400 Node tests and 5 Vitest tests passed.
- Affected performance suites: 2 files / 2 tests passed; the standalone
  `proceedToTour.bench.jsx` check also passed.
- Core, reducer, and server typechecks passed.
- Build, no-check guard, Markdownlint, Prettier, and `git diff --check` passed.
- Lint passed with no errors and five existing warnings in unchanged tests.
- Knip reported the same seven baseline findings within budget seven; the budget
  checker successfully consumed that existing report.

The initial combined `test:all` invocation hit a five-second dynamic-import
timeout in `tests/security/randomness.test.js` while other verification jobs ran.
Its Node phase completed successfully. Without changing code or timeout settings,
the isolated security suite passed all three tests and the entire logic suite
passed on rerun. The UI suite was run separately after the failed combined
invocation skipped its UI phase.

## Smaller-cleanup follow-up — 2026-10-16

This pass builds on `41d9620e6` (PR #3139) and implements all sixteen S01–S16
entries. H01 remains a separate contract decision.

- **S01–S09:** Remove redundant wrappers, unused input, duplicated pending-travel
  resets, and duplicated modal/endpoint flags. The location resolver is a stable
  module function using the current i18n context. Rhythm initialization validates
  all three lane/window pairs before changing lane windows and retains its
  cancellation guards; Roadie completion still uses its one-shot guard.
- **S10, S11, S16:** Return the already-validated sampled slice, pass the story-spin
  social updater directly, and translate nested string leaves in one recursion
  path. Sampling preserves its RNG draws and sparse-entry checks; translation
  preserves top-level string passthrough, own/forbidden-key checks, sparse holes,
  ancestor-cycle handling, and repeated non-cyclic descendants.
- **S12–S15:** Read the original quest without an intermediate clone, retain the
  existing empty/duplicate start-flag semantics, compose module defaults with
  authored overrides, and reuse the shared `ActiveEffect[]` type.

Targeted characterization covers gesture ordering, rejected lane/window pairs,
cancellation, current-language resolution, travel timeout/ref cleanup, stable
stash callbacks, concurrent 404 responses, seeded sampling, sparse/cyclic
translation, immutable quest progress, and empty/duplicate start flags.

Verification for the smaller-cleanup follow-up:

- Production Node suite: 5,522 tests passed.
- Full logic suite: 47 files / 841 tests passed.
- Full UI suite: 233 files / 1,482 tests passed.
- The combined `NODE_TEST_CONCURRENCY=8 VITEST_MAX_WORKERS=2 pnpm run test:all`
  command passed all three production tiers.
- Core, reducer, and server typechecks passed.
- Lint and build passed; lint reports only the same five warnings in unchanged
  tests.
- Knip remains at seven baseline findings within budget seven; no-check guard,
  Markdownlint, Prettier, and `git diff --check` passed.
- Independent review found no remaining S01–S16 findings.

## S08 review correction — 2026-10-16

Review of PR #3140 found that S08 had dropped the original missing-band guard.
`Object.keys(band?.stash ?? {})[0] ?? null` restores initialization with an empty
stash when the band is nullish. The regular `test:all` gate does not include the
separate performance suite; its existing Roadie fixture exposed the regression.

The added `undefined` and `null` band cases both failed before the fix and passed
afterward (6 Roadie UI tests total). The existing Roadie performance test also
failed before and passed after the fix. The added cases assert normal equipment
initialization without a contraband item.

The complete local performance suite passed: 18 files / 22 tests. Core typecheck,
scoped ESLint, Prettier, Markdownlint, and `git diff --check` also passed.
