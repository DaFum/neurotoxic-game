# Dead-code triage — 2026-08-03, refreshed 2026-10-06, 2026-10-11 and 2026-10-14

Triage of the 78-finding knip baseline captured on 2026-08-02 (issue #2677).
After the original pass the report was down to **10 findings**. The 2026-10-06
code-quality audit pass (`docs/code-quality-audit-2026-10-05.md`) brought it to
**8**. By the 2026-10-11 refresh Knip no longer flags `lint-staged`, so the live
report is **7**, and `.ci/dead-code-budget.json` `max` is lowered to match.

Everything left in the report is listed below with the reason it stays. There is
no untriaged remainder. Items knip does not report but that look dead to a
production-only reachability scan are recorded in
[Intentionally kept: test oracles, seams and tooling](#intentionally-kept-test-oracles-seams-and-tooling).

## 2026-10-06 refresh

Since the original pass:

- `AudioEngineProvider` is no longer a finding: `App.tsx` mounts it, so it is
  reachable from `src/main.tsx`. The earlier "nothing mounts it" claim is gone.
- `ValidatedMap` (`src/utils/mapValidation.ts`) was demoted to module-private in
  the original pass, re-exported by `682160f92`, and is module-private again.
  Knip's default run flagged it each time it was exported.
- `motion-dom` and `motion-utils` no longer appear: `217d6957b` (the Motion
  refactor and dependency cleanup, while `motion` was still pinned at 13.1.1)
  removed them from `package.json`. `vite.config.js` still names them in a
  manual-chunk `test` pattern, which matches by path and needs no dependency.
- `lint-staged` is a new unused-devDependency finding. It is a false positive:
  `.husky/pre-commit` runs `npx lint-staged` and `package.json` carries the
  `lint-staged` config block, but Knip does not see the `npx` call. It is
  recorded here and left in place — `AGENTS.md` requires dependency changes to
  be discussed first.
- The unused-export demotions from the audit (§2.3) are done: `DRUM_HANDLERS`,
  `GameStore`, the `{Asset,Career,Expedition,Minigame}DispatchActions` slices,
  `PurchaseChassisInput` / `InstallModuleInput` / `StartCrowdfundInput`,
  `SectionView`, `AssetSectionTab`, `ArrivalNode` / `GigArrivalNode` /
  `ArrivalResult`, `ChassisTierConfig` / `ChassisKindConfig`, `AmpGameRefs` /
  `AmpGameSetters` and `ChassisDescriptor` lost their `export`. The dead
  re-exports of `GameDispatchActions` (`GameState.tsx`),
  `GeneratedMapNode` / `MapGeneratorState` / `VenuePools` (`mapGenerator.ts`),
  `ExpeditionCargo*` (`cargo.ts`) and `ExpeditionChassis*` (`chassis.ts`) were
  deleted; the definitions live in `src/types/*.d.ts` or their leaf modules.
  `GameDispatchActions` itself stays exported from `useGameDispatchActions.ts`
  because the slice hooks and a context test import it there.
- `HQ_FACILITY_IDS` and `EXPEDITION_UNLOCK_SET_IDS` are production code now:
  `ExpeditionMetaTab` renders both lists, so they are not test-only any more.

Count against the 78-finding baseline: the original pass resolved 68 (listed
below) and left 10. The refresh resolved 3 more of those 10
(`AudioEngineProvider`, `motion-dom`, `motion-utils`), so 71 of the 78 are
resolved and 7 remain. `lint-staged` is not part of the baseline; it brought the
live report to 8 on 2026-10-06 and dropped out again by 2026-10-11, leaving the
7 listed under [Remaining](#remaining-7--intentional-keep).

## 2026-10-11 refresh

Cleanup from the 2026-10-09 `src/` findings report (§2.1, §2.4). None of these
were Knip findings; they were production-only reachability hits.

- Test-convenience re-exports deleted: `ActionTypes` from
  `src/context/gameReducer.ts` and `CHATTER_DB` / `ALLOWED_DEFAULT_SCENES` from
  `src/data/chatter/index.ts`. Production already imported the leaf modules;
  the tests now import `src/context/actionTypes.ts` and
  `src/data/chatter/standardChatter.ts` directly.
- `export * from './OverworldModals'` removed from
  `src/components/overworld/index.ts`; `Overworld.tsx` imports the leaf.
- `DARK_WEB_LEAK_CONFIG` and `PIRATE_RADIO_CONFIG` are module-private, like
  `CULT_INDOCTRINATION_CONFIG`: `OverworldModals` and the hook tests read them
  from the hook's return value.
- `clampMemberSkill` is production code again: `addClampedMemberSkill` routes
  its result through it.
- 33 own-file-only `*Props` / `*Return` / `*Result` types lost their `export`
  (each checked by name across `src/`, `tests/`, `scripts/`, `api/`, `lib/` and
  `.claude/skills`; `src/types/**` and `.d.ts` files were left alone), plus
  `CrowdTextures` once the `CrowdManager.textures` alias was deleted.
- `DarkWebLeakModal` and `CultIndoctrinationModal` were deleted;
  `ZealotryActionModal` resolves their labels from an `i18nPrefix`.

## 2026-10-14 refresh

Cleanup from `docs/code-quality-audit-2026-10-14.md` (§2). None were Knip
findings; the live report is still **7**.

- Six own-file-only type aliases lost their `export`: `NormalizedQuestEvent`,
  `LogEvent`, `ExpeditionAccessTier`, `ExpeditionLegacyHqPolicy`,
  `PressureDirectorContext`, `BalanceRecommendationHold`.
- `isStashEntry` (`src/utils/gameState/checks.ts`) is production code: the
  Roadie stash decrement in `minigameReducer` gates on it.
- `safeStorageOperation` (`src/utils/storage.ts`) is now a re-export alias of
  `runSafeStorageOperation` rather than a forwarding copy of its overloads.
- `META_UNLOCK_QUEST_TOKEN` is live: settlement pays it from the run-scoped
  `expedition.metaUnlockQuestCompletedRunId` record.
- Every canonical quest event type in `src/data/questEventTypes.ts` now has a
  quest consumer, so the "emitted but unconsumed" list from the 2026-10-05
  audit (§4) is empty.
- New seams are recorded under [Test seams](#test-seams): `setGameMap`,
  `setScreenshotMode`, `setActiveEvent`, `createAdvanceQuestAction` /
  `ADVANCE_QUEST`, `getExpeditionAccessLock`.

## Resolved in the original pass (68)

### Broken script (1)

`scripts/benchmark-fast-paths.cjs` imported `../src/utils/randomUtils.js`, a file
that does not exist, and called `pickRandomSubset(arr, k)` without the required
`random` argument — the script crashed on every run. Repointed at
`src/utils/mapGenerator/mathUtils.ts` and given a deterministic LCG so the timings
measure the subset picker rather than the RNG. It had no registered entry point
either, so `pnpm run bench:fastPaths` now runs it through `tsx` alongside the
existing `bench:eventEngine`.

### Config false positives (6)

These are real usages that Knip's project globs cannot see. Fixed in `knip.json`:

| Finding                                                         | Why it is used                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rg` (unlisted binary)                                          | `scripts/check-ts-nocheck-budget.mjs` shells out to ripgrep behind a `findWithRg()` fallback that returns `null` when it is absent — an optional binary by design. `ignoreBinaries`. |
| `@iarna/toml`                                                   | Imported by `.claude/skills/skilltest/scripts/skilltest-lib.mjs` and its `.agents/` twin, outside `project`.                                                                         |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` | Reached through the `typescript-eslint` meta-package in `eslint.config.js` (`tseslint.parser`, `tseslint.plugin`), never imported by name. Kept as pins.                             |
| `markdownlint-cli2`                                             | Run as a binary by the `mega-lint-snapshot` skill's `MARKDOWN` target.                                                                                                               |
| `benchmark`                                                     | Required by `tests/performance/filterCars.benchmark.cjs`. The `tests/**` entry glob omitted `cjs`, so Knip never parsed the file; the glob now includes it.                          |

### Dead barrel re-exports (20)

The underlying symbol is alive; every consumer imports the concrete module, so
only the barrel entry was dead. Removed the re-export, left the definition:

- `src/utils/gameState/index.ts` — `FORBIDDEN_KEYS`, `isPlainRecord`, `copySafePrimitiveEntries` (consumers import `../objectUtils`)
- `src/domain/questLifecycle.ts` — `QUEST_SLOT_LIMITS`, `CanAcceptQuestResult` (consumers import `./questAcceptance`)
- `src/utils/brandOfferFlavor/index.ts` — `generateCampaignCodename`, `BuildBrandOfferContext`
- `src/hooks/useTravelLogic.ts` — `TravelLogicParams`
- `src/hooks/useRhythmGameLogic.ts` — `RhythmUiState`
- `src/hooks/rhythmGame/useRhythmGameState.ts` — `RhythmLiveStats`, `RhythmModifiers`, `RhythmNote` (consumers import `src/types/rhythmGame`)
- `src/ui/shared/index.tsx` — `VolumeSlider`, `SegmentedSlider`, `ToggleSwitch`, `UIFrameCorner`, `RazorPlayIcon`, `VoidSkullIcon`, `AlertIcon`, `DeadmanButton`

The `src/ui/shared` barrel keeps its dual-import contract: the primitives still
re-exported there are the ones something actually imports from the barrel; the
eight above are only ever imported from their leaf modules
(`./Icons`, `./BrutalistUI`, `./VolumeSlider`, …).

### Demoted to module-private (39)

Referenced only inside their own file. Dropped the `export` keyword; no behaviour
change.

Values: `HQ_DUPLICATE_LEGACY_IDS`, `RNG_ROLLS_PER_ASSET`, `SAVE_QUARANTINE_KEY_PREFIX`,
`GLOBAL_SETTINGS_KEY`, `BUST_CHANCE_BY_RARITY`, `BASE_MERCH_CAPACITY`,
`hasDailySocialActionRunToday`, `validateDailySocialActionEligibility`,
`createSocialPostResolvedQuestEvent`, `sanitizeBandInventory`,
`sanitizeActiveEventOption`, `canOfferQuest`, `TUTORIAL_STEPS`, `TOTAL_STEPS`,
`CULT_INDOCTRINATION_CONFIG`, `eventPoolMapCache`, `TEMPLATE_REGEX`,
`EVENT_EFFECT_HANDLERS`, `sanitizeContextValue`.

Types: `ChassisFlavorConfig`, `DailySocialActionThreshold`,
`DailySocialActionEligibilityInput`, `StartGigParams`, `LegacyQuestProgressEvent`,
`AttendanceConfig`, `PenaltiesConfig`, `ModifiersConfig`, `CapsConfig`,
`ValidatedMapNode`, `ValidatedMapConnection`, `ValidatedMap`, `RecordGuard`,
`QuestIdPayload`, `InlineQuestPayload`, `QuestPayloadRejection`, `RoadieSpawner`,
`SlotOverride`, `ZealotryActionModalLabels`, `MapConnection`.

Notes:

- `canOfferQuest` is still reachable — callers use the `QuestOfferEngine` object
  (`src/data/events/quests.ts`, `src/data/events/consequences.ts`), which is what
  hid the named export from knip in the first place.
- `TUTORIAL_STEPS` / `TOTAL_STEPS` are returned by `useTutorial()`; `TutorialManager`
  destructures them from the hook and never imported the module constants.
- `CULT_INDOCTRINATION_CONFIG` reaches `OverworldModals` the same way, through
  `useCultIndoctrination()`.

### Deleted outright (2)

- `FALLBACK_MAP` (`src/utils/fallbackMap.ts`) — an unreferenced alias of the
  imported `fallbackMapData`. `tests/node/fallbackMap.test.js` exercises
  `loadFallbackMap` / `validateFallbackMap`, both untouched, so the "cannot rot
  silently" guarantee in the removed docstring is still enforced.
- `BreakdownLabelKey` (`src/utils/economy/breakdownLabelKeys.ts`) — derived type
  with no reference anywhere, including its own file.

## Remaining (7) — intentional, keep

### Deliberate exports (2)

| Symbol                                                | Why it stays                                                                                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EFFECT_HANDLERS` (`src/utils/purchaseLogicUtils.ts`) | Fixture for `tests/node/updateSymbols.test.js`, which asserts `referencedInFile === true` for it. Unexporting drops it from `symbols.json` and breaks the extractor's own coverage. |
| `QUEST_SLOT_LIMITS` (`src/domain/questAcceptance.ts`) | Same — the `updateSymbols` test uses it as the "referenced only from module-private helpers" case.                                                                                  |

### Duplicate export (1)

`src/utils/balanceTuning.ts` exports `DEFAULT_BALANCE_TUNING` as an alias of
`ORIGINAL_CONTROL_BALANCE_TUNING`. Both names are load-bearing:
`src/utils/dailyTickLogic.ts` and `src/utils/postGig/derivations.ts` default to
`DEFAULT_BALANCE_TUNING`, while `scripts/game-balance-experiments.mjs` names
`ORIGINAL_CONTROL_BALANCE_TUNING` explicitly as the control arm. Collapsing them
would erase that distinction.

### Unused dependencies (4)

`flatted` (`dependencies`); `eslint-plugin-react-refresh`,
`rollup-plugin-visualizer`, `serialize-javascript` (`devDependencies`).

No source, config, script, or skill references `flatted`, `react-refresh`,
`visualizer` or `serialize-javascript` — `eslint.config.js` does not register
`react-refresh` and `vite.config.js` does not use `visualizer`. They look like
transitive packages that were promoted to direct entries by accident.

`lint-staged` was listed here on 2026-10-06 as a false positive
(`.husky/pre-commit` runs `npx lint-staged` against the config block in
`package.json`); Knip no longer reports it. It is used and stays.

Left in place deliberately: `AGENTS.md` requires dependency changes to be
discussed first, and these are pinned. Removing the four would take the report
to 3. That is a follow-up decision, not part of this triage.

## Intentionally kept: test oracles, seams and tooling

These have no production import, or none that Knip counts, and are **kept on
purpose**. They are not Knip findings (the `tests/**` and `scripts/**` entries
reach them), but a production-only reachability scan lists them, so each one is
recorded here.

### Test oracles and script tooling

Plan- or script-backed helpers whose only callers are tests or the balance
scripts in `scripts/`.

| Symbol                                                                                 | Consumer                                                                                  |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `findExpeditionRewardsWithUnreachableTarget` (`src/domain/expedition/rewardLedger.ts`) | `tests/node/expeditionRewardLedger.test.js` — reward-ledger oracle                        |
| `getContrabandValidationFailures` (`src/data/contraband.ts`)                           | `tests/node/contraband.schema.test.js` — schema oracle                                    |
| `BASE_EXPEDITION_REGION_ID` (`src/domain/expedition/defaults.ts`)                      | Expedition map and cargo tests                                                            |
| `GIG_CLOCK_DRIFT_TOLERANCE_MS` (`src/utils/audio/constants.ts`)                        | `tests/node/audioEngineGigClock.test.js`                                                  |
| `doesLegacyHqItemTouchExpedition` (`src/domain/expedition/legacyHqPolicy.ts`)          | `scripts/game-balance-expedition-career.mjs` and the legacy-HQ policy tests               |
| `resolveBalanceTuning`, `BALANCE_RECOMMENDATION_HOLD` (`src/utils/balanceTuning.ts`)   | `scripts/game-balance-experiments.mjs` and its tests                                      |
| `CANONICAL_LEADERBOARD_IDS` (`lib/leaderboardSongIds.js`)                              | `tests/api/leaderboard.song.test.js` — pins the canonical song-id list                    |
| `REGION_FAMILIARITY_REPUTATION` (`src/domain/expedition/nodeIntel.ts`)                 | `scripts/game-balance-expedition-fog-probe.mjs`                                           |
| `resetSecureRandomBatch` (`src/utils/crypto.ts`)                                       | `scripts/game-balance-simulation.mjs` — required before each reseed (`scripts/AGENTS.md`) |

### Test seams

Explicit dependency-injection or reset seams. Production uses the defaults.

- `ClockProvider`, `createFixedClock` — `IClock` injection (`src/context/ClockContext.tsx`, `src/utils/clock.ts`).
- `StorageProvider`, `NoopAdapter` — storage adapter injection (`src/context/StorageContext.tsx`, `src/utils/storageAdapter.ts`).
- `resetStorageFallback` (`src/utils/storage.ts`) — resets the in-memory fallback between tests.
- `NullAudioEngine`, `createStubAudioEngine` (`src/utils/audio/audioEngineInterface.ts`) — substitutable `IAudioEngine` surface; see `src/utils/audio/AGENTS.md`.
- `__testInternals` (`src/utils/crypto.ts`, `src/utils/unlockManager.ts`) — test-only access to module-private state.
- `resetLastMinigameFallback` (`src/hooks/preGig/preGigUtils.ts`) — resets the pre-gig minigame fallback memo.
- `useArrivalLogic` options `onShowHQ`, `onShowSupplyStop` and `rng` (`src/hooks/useArrivalLogic.ts`) — production (`TourbusScene`) passes no options; the TSDoc on each marks it a test seam.
- `migrateLoadedSave` (`src/context/usePersistence.ts`) and `getQuarantineKey` (`src/utils/saveQuarantine.ts`) — used in-module by the load path and `quarantineSave`; exported so `tests/context/saveMigrationRecovery.test.tsx` can drive migration and read the quarantine slot directly.
- `executeAudioAction` (`src/hooks/audioControlUtils.ts`) — used in-module by `createAudioHandlers`; exported for `tests/ui/audioControlUtils.test.jsx`.
- `setGameMap` (`src/context/useGameDispatchActions.ts`) — no production caller; `tests/integration/GameState.comprehensive.test.jsx` drives it as a map-injection seam.
- `setScreenshotMode` (`src/context/useGameDispatchActions.ts`) — no `src/` caller; the Playwright screenshot skill calls it through the DEV-only `window.gameState` exposure.
- `setActiveEvent` (`src/context/useGameDispatchActions.ts`) — used inside `src/context` by `useEventSystem`; on the public dispatch surface only so tests can stage an event. Marked `@internal`.
- `createAdvanceQuestAction` / `ADVANCE_QUEST` (`src/context/actionCreators.ts`, `questReducer`) — production quest progress flows through `APPLY_QUEST_EVENT`; the creator is `@internal` and the reducer case is reachable only from tests.
- `getExpeditionAccessLock` (`src/domain/expedition/fame.ts`) — the in-module body of `getExpeditionNodeBookingLock` and `getExpeditionContractAccessLock`, which production uses; exported for `tests/node/expeditionAccessTier.test.js`.

### Blanket rule: test-only value exports

About 116 value exports have no production reference outside their own file and
are exported only so tests (about 101) or the balance scripts in `scripts/`
(about 15) can reach them; the largest groups are `failure.ts` (9),
`assetConfig.ts` (8) and `purchaseLogicUtils.ts` (8). The in-file callers that
were sampled are all live, so these are test or tooling seams, not dead code.

They are kept and not listed one by one. The rule:

- A value export whose only out-of-file consumers are under `tests/` or
  `scripts/` is an intentional seam while its own module still uses it (or a
  sibling module does). Do not demote it just because a production-only scan
  flags it; that breaks the test or script that reaches it.
- It becomes dead, and should be deleted with its tests, once nothing in its
  own module or elsewhere in `src/` uses it any more.
- A symbol that only exists for a test or script and has no in-module use at
  all (an oracle or a reset hook) gets its own row in the tables above.
- Type-only exports referenced only in their own file are not covered by this
  rule; demote them (see the 2026-10-11 refresh).

### Composition-only Crew dispatch wrappers

`recordExpeditionRelationshipOutcome`, `advanceExpeditionCrewInjury`,
`advanceExpeditionBandInjury` and `createContactIntelGrant` have complete
reducer paths but no UI caller **by design**. They are applied inside
`applyResolvedCrewEventOutcome` when a resolved Crew event is committed, and a
standalone dispatch is refused by `hasResolvedEventProof`. The dispatch methods
stay as the typed intent surface and are documented as composition-only in
`src/context/useGameDispatchActions.ts`.

`recordExpeditionArchiveDiscovery` is kept for the same reason from the other
side: the START and terminal transitions already sweep every provable Archive
observation through `recordExpeditionArchiveObservations`, so a standalone
dispatch is a redundant no-op for anything the run has met. It stays as the
typed intent surface for Archive discoveries.

`advanceExpeditionRoute`, `addExpeditionReward` and
`acquireExpeditionCrewSignature` are composition-only the same way. Arrival
advances the route through `applyExpeditionRouteAdvance` inside the travel
reducer (`minigameReducer`); every reward source banks its ledger entry through
`resolveExpeditionReward` in the reducer commit that proves it; and the
Between-Tour `crew_debrief -> develop_signature` answer applies
`handleAcquireExpeditionCrewSignature` inside the decision resolution. The
dispatch methods stay as typed intent surfaces (the `advanceExpeditionRoute`
creator also backs `scripts/game-balance-expedition-legendary.mjs`) and are
documented as composition-only in `src/context/useGameDispatchActions.ts`.

### Standalone defect action constructors

`revealExpeditionDefect`, `triggerExpeditionDefect`, and
`resolveExpeditionDefect` (`src/context/expeditionActionCreators.ts`) remain
as a typed standalone action API, exercised by `tests/node/expeditionDefects.test.js`.
Production inspection, gig, and repair owners compose `applyExpeditionDefectReveal`,
`evaluateExpeditionDefectTriggers`, and `applyExpeditionDefectResolution` directly.
The unused constructors do not imply missing defect gameplay or require UI wrappers.

### `audioEngine.ts` barrel re-exports

`src/utils/audio/audioEngine.ts` is the declared public facade of the audio
stack: `src/utils/audio/AGENTS.md` requires every import from outside
`src/utils/audio/` to go through it. Tests live outside that directory, so the
16 re-exports that only tests reach (`getRawAudioContext`, `withAudioContext`,
`safeDispose`, `calculateGigTimeMs`, `startGigClock`, `playMidiFile`,
`NOTE_TAIL_MS`, …) are part of that contract and stay. Repointing the tests at
the leaf modules would break the rule the barrel exists to enforce.
