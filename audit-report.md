# Neurotoxic Code-Quality Audit Resolution Report

Audit scope: complete `src/` tree, with tests used for reference and regression verification.

## Resolution summary

All 14 findings from the categorized audit were re-verified against the current repository before changes. Ten produced code or test changes. Four apparent orphan/dead-code findings were resolved by documenting or retaining intentional public/test/fallback contracts after repository instructions and existing regression coverage showed that deletion would be incorrect.

| ID | Category | Severity | Status | Resolution |
| --- | --- | --- | --- | --- |
| D-1 | Duplicate quest-offer metadata | MED | **Fixed** | Added `defineQuestOfferEvent`, which derives `category`, `trigger`, `chance`, and eligibility from `QUEST_REGISTRY`; event entries now contain presentation/choice data only. |
| D-2 | Duplicate travel-arrival pipeline | MED | **Guarded / retained** | The nested hook instructions define this as an intentional animation failsafe. It remains protected by `travelArrivalParity.test.js`; removing it would contradict the scoped contract. |
| D-3 | Reimplemented bounded random index | LOW | **Fixed** | Routed rhythm lanes, map venue/count/connection choices, shuffle indices, and rival ID suffixes through `pickBoundedIndex` without changing RNG call counts. |
| O-1 | `resetLastMinigameFallback` test-only export | LOW | **Documented / retained** | Marked it as an internal test-support API. The module-level anti-repeat state otherwise has no deterministic test isolation boundary. |
| O-2 | `transformSongsData` test-only external consumer | LOW | **Documented / retained** | It was already explicitly documented as a deliberate fixture-driven parser test seam; keeping it permits malformed-input tests without mocking JSON modules. |
| O-3 | Mutable contraband validation diagnostic | LOW | **Fixed** | Replaced the exported mutable array with `getContrabandValidationFailures()`, which returns a readonly snapshot. |
| O-4 | `VENUE_CHATTER_DB` test-only external consumer | LOW | **Documented / retained** | It was already explicitly documented as the raw-data test seam used for locale/data-contract validation while production uses the lookup map. |
| O-5 | Locally consumed exported types | LOW | **Partially fixed by contract** | Made `Milestone` private. Retained `CraftingRecipe` and `ContrabandValidationResult` because they are explicit return contracts of exported functions (`getCraftingRecipe` and `validateContrabandItem`); hiding those types would weaken the public API. |
| I-1 | Non-finite social post deltas | MED | **Fixed** | `resolvePost` now drops non-finite values for every returned numeric side-effect field before downstream hooks/reducers see them. Existing reducer clamps remain intact. |
| I-2 | Non-finite loaded map version | LOW | **Fixed** | Map sanitation now accepts string versions or finite numeric versions only. |
| I-3 | Hard-coded quest IDs | LOW | **Fixed** | All quest effects now use the already imported `QUEST_*` constants. |
| U-1 | Normal-play-unreachable travel fallback | MED | **Guarded / retained** | Reclassified from dead code to an intentional failsafe per `src/hooks/AGENTS.md`; parity coverage verifies its shared side effects and gig-node policy. |
| M-1 | Unused `getAvailableOffers` API | MED | **Fixed** | Deleted the uncalled registry scanner and its test. Production integration now occurs at quest-event definition time through `defineQuestOfferEvent`, eliminating the duplicated metadata it was meant to consume. |
| M-2 | Travel failsafe not normally selected | MED | **Guarded / retained** | Preserved as the documented animation failure path rather than inventing a new trigger or deleting a scoped compatibility contract. Existing parity coverage is the integration guard. |

## Implementation process

### 1. Baseline and finding verification

1. Read root and scoped `AGENTS.md` guidance for `src/utils`, `src/context`, `src/context/reducers`, `src/hooks`, `src/data`, `src/domain`, and `src/schemas`.
2. Ran the relevant node suites before implementation: social engine, rhythm utilities, shuffle, map generation, system reducer load sanitation, quest engine/events/system, contraband schema, songs, chatter, and travel-arrival parity.
3. Re-ran `rg` for every orphan/missing-integration symbol. This exposed three important corrections to the audit:
   - `transformSongsData` and `VENUE_CHATTER_DB` were already documented deliberate test seams.
   - `CraftingRecipe` and `ContrabandValidationResult` are named return contracts of exported functions, not accidental exports.
   - The travel fallback is explicitly required to remain aligned by `src/hooks/AGENTS.md` and has a dedicated parity regression test.

### 2. RED regression checks

Added tests and observed the expected failures before production changes:

- `resolvePost drops non-finite numeric side effects` failed because `moneyChange` returned `NaN`.
- `clamps an out-of-range RNG result to a valid lane` failed because an RNG value of `1` produced lane index `3`.
- `shuffleInPlace clamps an out-of-range RNG without reporting a sparse entry` failed because index `items.length` triggered the sparse-entry callback.
- `drops a non-finite loaded gameMap version` failed because `Infinity` survived load sanitation.
- The quest source-of-truth gate failed while event entries still declared `category`, `trigger`, and `chance` inline.

### 3. Numeric and random-selection fixes

- Used `isFiniteNumber` at the unknown `postOption.resolve()` result boundary for all numeric side effects.
- Preserved the existing money/harmony arithmetic clamps after validation.
- Tightened loaded map-version validation with `Number.isFinite`.
- Replaced inline bounded-index calculations with `pickBoundedIndex`, including method wrappers where required to preserve the `MapGenerator` receiver.

### 4. Quest integration and duplication removal

- Added a small `defineQuestOfferEvent(questId, presentation)` helper.
- The helper reads offer metadata from `getQuestDefinition(questId)`, constructs the eligibility condition through `QuestOfferEngine.canOfferQuest`, and fails during module initialization if a quest event points at a registry entry without offer metadata.
- Removed all duplicated event-level `category`, `trigger`, and `chance` declarations.
- Replaced 21 literal quest IDs with `QUEST_*` constants.
- Removed `QuestOfferEngine.getAvailableOffers`, whose only caller was its unit test. Its intended registry integration is now performed directly by production event construction.
- Added a source-level content gate preventing duplicated offer metadata from returning.

### 5. Public/test surface decisions

- Replaced the mutable contraband diagnostics export with an immutable snapshot getter and updated schema coverage.
- Made the unused `Milestone` interface module-private.
- Retained explicitly justified parser/data test seams and public function return contracts rather than deleting useful or required API surfaces merely because their external consumers are tests.
- Documented the PreGig fallback reset as internal test support.

### 6. Travel fallback decision

No travel code was removed. The original audit classified the fallback as unreachable in normal play, but the scoped repository guidance defines it as an intentional animation failsafe and requires it to remain behaviorally aligned. `tests/node/travelArrivalParity.test.js` already verifies daily advancement, travel-event policy, rival movement/checks, and shared arrival side effects. The autonomous pass therefore treats D-2/U-1/M-2 as one guarded compatibility path, not three deletion tasks.

## Verification commands

### Baseline

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/socialEngine.test.js \
  tests/node/rhythmGameLogic.test.js \
  tests/node/rhythmUtils.test.js \
  tests/node/shuffleUtils.test.js \
  tests/node/mapGenerator.test.js \
  tests/node/systemReducer.test.js \
  tests/node/domain/questOfferEngine.test.js \
  tests/node/questSystem.test.js \
  tests/events/quests.test.js \
  tests/node/contraband.schema.test.js \
  tests/node/songsData.test.js \
  tests/node/chatterData.test.js \
  tests/node/travelArrivalParity.test.js
```

### Targeted RED/GREEN suites

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/socialEngine.test.js \
  tests/node/rhythmUtils.test.js \
  tests/node/shuffleUtils.test.js \
  tests/node/mapGenerator.test.js \
  tests/node/systemReducer.test.js \
  tests/node/questSystem.test.js \
  tests/events/quests.test.js \
  tests/node/domain/questOfferEngine.test.js \
  tests/node/contraband.schema.test.js
```

### Static resolution checks

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/auditReportRegression.test.js \
  tests/node/questSystem.test.js
pnpm run symbols:update
pnpm run symbols:check
git diff --check
```

### Final quality gates

```bash
pnpm run lint
pnpm run typecheck:core
pnpm run typecheck
pnpm run test
pnpm run build
```

## Durable-instruction review

No new `AGENTS.md` rule was added. The work followed existing durable rules for canonical random selection, finite-number boundaries, quest registry authority, public return types, and travel-fallback parity; the fixes did not reveal a new non-obvious repository invariant.

## Review follow-up verification

The follow-up review was checked against the current code rather than applied mechanically:

- **Fixed:** `pickBoundedIndex` and `pickIndex` returned `NaN` for non-finite RNG rolls. Both now normalize the roll, and `MapGenerator.random()` also prevents a finite but overflowing `Number.MAX_VALUE` seed from poisoning later layout rolls.
- **Fixed:** `resolvePost` now sanitizes invalid `followers` to `0`.
- **Fixed:** the earlier numeric guard incorrectly removed boolean `allMembersMoodChange` / `allMembersStaminaChange` flags and string/null `egoDrop` values. Their actual contracts are now preserved while invalid shapes are dropped.
- **Fixed:** `defineQuestOfferEvent` accepts `QuestRegistryId`, exported from the registry, so invalid static IDs fail type checking.
- **Fixed:** `QuestOfferEngine` now consumes the typed `getQuestDefinition()` result without a redundant cast.
- **Fixed:** the brittle quest source-format assertion was removed. Behavioral registry parity remains in `questSystem.test.js`, while AST-based audit regression tests detect duplicated offer fields, literal quest IDs regardless of quote style, and inline random-index calculations regardless of whitespace or line breaks.
- **Fixed:** the baseline command now includes `systemReducer.test.js`, matching the documented load-sanitation baseline scope.
- **Skipped:** no changes were made for the emitted Pixi/audio/secure-random warning lines because the provided output did not show a failure in those systems, and they are unrelated to the reviewed audit changes. The actionable post-gig failure was reproduced and its stale expectation was updated to assert boundary sanitation instead of an exception.
