# Dead-code triage — 2026-08-03

Triage of the 78-finding knip baseline captured on 2026-08-02 (issue #2677).
After this pass the report is down to **11 findings**, and `.ci/dead-code-budget.json`
`max` is lowered to match.

Everything left in the report is listed below with the reason it stays. There is
no untriaged remainder.

## Resolved (67)

### Broken script (1)

`scripts/benchmark-fast-paths.cjs` imported `../src/utils/randomUtils.js`, a file
that does not exist, and called `pickRandomSubset(arr, k)` without the required
`random` argument — the script crashed on every run. Repointed at
`src/utils/mapGenerator/mathUtils.ts` and given a deterministic LCG so the timings
measure the subset picker rather than the RNG.

### Config false positives (5)

Real usages knip's project globs cannot see. Added to `knip.json`:

| Finding                                                         | Why it is used                                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rg` (unlisted binary)                                          | `scripts/check-ts-nocheck-budget.mjs` shells out to ripgrep behind a `findWithRg()` fallback that returns `null` when it is absent — an optional binary by design. `ignoreBinaries`. |
| `@iarna/toml`                                                   | Imported by `.claude/skills/skilltest/scripts/skilltest-lib.mjs` and its `.agents/` twin, outside `project`.                                                                         |
| `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` | Reached through the `typescript-eslint` meta-package in `eslint.config.js` (`tseslint.parser`, `tseslint.plugin`), never imported by name. Kept as pins.                             |
| `markdownlint-cli2`                                             | Run as a binary by the `mega-lint-snapshot` skill's `MARKDOWN` target.                                                                                                               |

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

## Remaining (11) — intentional, keep

### Deliberate exports (3)

| Symbol                                                       | Why it stays                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EFFECT_HANDLERS` (`src/utils/purchaseLogicUtils.ts`)        | Fixture for `tests/node/updateSymbols.test.js`, which asserts `referencedInFile === true` for it. Unexporting drops it from `symbols.json` and breaks the extractor's own coverage.                                                                                   |
| `QUEST_SLOT_LIMITS` (`src/domain/questAcceptance.ts`)        | Same — the `updateSymbols` test uses it as the "referenced only from module-private helpers" case.                                                                                                                                                                    |
| `AudioEngineProvider` (`src/context/AudioEngineContext.tsx`) | The only writer for `AudioEngineContext`. Nothing currently mounts it (the app relies on the `toneAudioEngine` default), but removing it would delete the audio-engine injection seam, which is a design decision rather than a cleanup. Flagged for a separate call. |

### Duplicate export (1)

`src/utils/balanceTuning.ts` exports `DEFAULT_BALANCE_TUNING` as an alias of
`ORIGINAL_CONTROL_BALANCE_TUNING`. Both names are load-bearing:
`src/utils/dailyTickLogic.ts` and `src/utils/postGig/derivations.ts` default to
`DEFAULT_BALANCE_TUNING`, while `scripts/game-balance-experiments.mjs` names
`ORIGINAL_CONTROL_BALANCE_TUNING` explicitly as the control arm. Collapsing them
would erase that distinction.

### Unused dependencies (7)

`flatted`, `motion-dom`, `motion-utils` (`dependencies`); `benchmark`,
`eslint-plugin-react-refresh`, `rollup-plugin-visualizer`, `serialize-javascript`
(`devDependencies`).

No source, config, script, or skill references any of them —
`eslint.config.js` does not register `react-refresh`, `vite.config.js` does not
use `visualizer`, and `scripts/benchmark-fast-paths.cjs` uses `console.time`
rather than the `benchmark` package. They look like transitive packages that were
promoted to direct entries by accident.

Left in place deliberately: `AGENTS.md` requires dependency changes to be
discussed first, and these are pinned. Removing all seven would take the report
to 4. That is a follow-up decision, not part of this triage.
