# Code-Quality Audit — `src/` (2026-10-14)

This is a read-only audit of `main` at `6e5bd42`, prepared as input for an autonomous fix pass. The follow-up fixes on branch `claude/blissful-goodall-00ww9s` are listed separately in §0.

**Baseline.** The previous audit is `docs/code-quality-audit-2026-10-05.md`, written at `ac2b303cf`. 374 commits have landed since then. Every one of its rows was re-checked here, and each row below is marked **NEW**, **STILL OPEN** or **CHANGED**. Items that `docs/dead-code-triage.md` already records as intentional keeps are left out.

## Method

- **Default `pnpm exec knip`:** 7 findings, within the budget of 7. All 7 are the intentional keeps listed in the triage doc.
- **Production-only knip:** a second pass with only `src/main.tsx!` and `api/**!` as entries. It found **0 unreachable files** and about 170 exports with no production import. A script then split each export into one of four groups: used in its own file, used only by tests, used only by scripts, or not used at all. Each split was confirmed with `rg -w` across `src/`, `tests/`, `scripts/`, `api/`, `lib/` and `.claude/`.
- **Five parallel read-only lanes:**
  - integration and dispatch surface
  - duplicates
  - state-handling inconsistencies
  - i18n and UI conventions
  - dead code and stale test references
- **Locale and test-reference scripts:** a TS-AST script checked code against locale keys (1,248 `t()` keys, 3,015 `ns:key` literals and 171 template patterns). A second TS-AST script checked all 698 test files for mocks or imports that point at missing modules or missing exports.
- **Locale tests:**
  - `tests/locale/full.test.js`: 15/15 passed
  - `tests/locale/smoke.test.js`: 21/21 passed
- **Severity:**
  - **HIGH:** player-visible bug, unreachable feature, or a type hole.
  - **MED:** a convention violation with a real failure mode.
  - **LOW:** cleanup.

## Executive summary

The codebase is in much better shape than on 2026-10-05:

- Nearly every HIGH and MED row from that audit is **FIXED**, including:
  - the `.d.ts` type hole
  - the Expedition quest offers and Ascension
  - Kabelsalat skip
  - the `extract` crisis choice
  - `c_diy_overdrive` and `neuro_overclock`
  - all of §3.6 (i18n) and §2.4 (stale test mocks)
- **No HIGH findings remain open.** There are 6 MED and about 30 LOW.
- The only player-visible bug found in this pass, raw i18n keys in Tour Prep, is fixed on the branch (§0).

| #   | Sev | Finding                                                                                                                                                    | Action                                  |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | MED | `social.brandReputation` has no clamp authority. Load and `UPDATE_SOCIAL` accept any finite value, and five writers bound it in five different ways (§3.1) | FIX + MERGE                             |
| 2   | MED | 14 quest event types are emitted but no quest consumes them (§5.1)                                                                                         | INTEGRATE or document                   |
| 3   | MED | `hasMetaUnlockMilestone = false` is a constant flag, so the meta-unlock tour token can never be awarded (§4.1)                                             | INTEGRATE (run-scoped record) or DELETE |
| 4   | MED | `UPDATE_PLAYER` does not re-clamp `van.breakdownChance` (§3.1)                                                                                             | FIX                                     |
| 5   | MED | The "extreme controversy ≥ 80" tier is hardcoded twice, with no `BALANCE_CONFIG` entry (§1.4)                                                              | MERGE                                   |
| 6   | MED | `ADVANCE_QUEST` is a production reducer case that only tests can reach (§5.2)                                                                              | DELETE, or record it as a seam          |
| 7   | LOW | NaN recovery defaults for mood, stamina and harmony differ by code path (§3.1)                                                                             | MERGE                                   |
| 8   | LOW | `minigameReducer` re-implements `getStashStackCount`; `isStashEntry` is a test-only guard (§1.2, §2.1)                                                     | MERGE                                   |

---

## 0. Fixed on branch `claude/blissful-goodall-00ww9s` (follow-up request)

| Sev         | file:line                                     | Fix                                                                                                                                                                                                                                                                   | Verification                                                                                     |
| ----------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| HIGH        | `src/ui/expedition/TourPrepLoadout.tsx:1099`  | Contraband names showed the raw key (`items:contraband.c_void_energy.name`). They now go through `t(contrabandInfo.name, { defaultValue: stashKey })`, matching `ContrabandStash`.                                                                                    | New test in `tests/ui/TourPrepLoadout.test.tsx` fails without the fix and passes with it (13/13) |
| LOW         | `src/types/components.d.ts:556`               | The `unlock_hq` effect is now typed `Omit<EffectBase, 'id'> & { type: 'unlock_hq' }`. That surfaced one reader of `effect.id` on the full union: `applyUnlockUpgrade` (`src/utils/purchaseLogicUtils.ts:570`), now narrowed with `'id' in effect`. No runtime change. | `typecheck:core`, reducer `typecheck`, 6 purchase/HQ node suites green                           |
| LOW         | `src/ui/DebugLogViewer.tsx:160`               | TSDoc `Ctrl+`` with an unmatched backtick is now "Ctrl plus the backtick key". TSDoc has no double-backtick spans, so a code span was not an option.                                                                                                                  | `eslint` reports 0 `tsdoc/syntax` warnings                                                       |
| — (product) | `src/components/postGig/CompletePhase.tsx:37` | The post-gig scandal check uses `> 50`, while crisis events use `isScandalControversy` (`>= 50`). **Resolved after a product decision:** Spin Story now uses `isScandalControversy` as well (see the resolution table).                                               | —                                                                                                |

---

## 1. DUPLICATES

### 1.1 Exact duplicates

| Sev | Locations                                                                                                                   | Description                                                                                                                                                              | Status | Action                                |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------- |
| LOW | `src/utils/storage.ts:34-58` (`safeStorageOperation`) ↔ `src/utils/errors/safeStorage.ts:17-82` (`runSafeStorageOperation`) | Both have the same 4-overload signature, and the `storage.ts` version only forwards to the other. The only callers of `runSafeStorageOperation` are inside `storage.ts`. | NEW    | MERGE: keep one name and re-export it |

### 1.2 Near-duplicates (divergent)

| Sev  | Locations                                                                                                                                                                                                          | Description                                                                                                                                                                                                  | Status               | Action                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------ |
| LOW  | `src/context/reducers/minigameReducer.ts:759-771` ↔ `src/utils/contrabandStashUtils.ts:85` (`getStashStackCount`)                                                                                                  | The reducer re-derives the stash stack count inline, although the helper's TSDoc calls it "the single stash-count reader". The two differ on a truthy non-object entry: the reducer returns 1, the helper 0. | NEW                  | MERGE: call `getStashStackCount`                 |
| LOW  | `src/domain/expedition/crewStress.ts:28` ↔ `src/domain/expedition/condition.ts:42` (`clampCondition`, rounds) ↔ `src/utils/gameState/clamps.ts:122` (`clamp0to100`, floors) / `:140` (`clampPercent`, no rounding) | 0..100 clamps now come in three rounding flavours, and `crewStress` re-inlines the rounding one.                                                                                                             | NEW                  | MERGE: `crewStress` should call `clampCondition` |
| LOW  | `src/ui/overworld/OverworldMenu.tsx:600-633` ↔ `src/ui/shared/useModalBehavior.ts:243-312`                                                                                                                         | The menu still hand-rolls its window Escape handler and Tab trap. It now reuses `getFocusableElements` and `getTabWrapTarget`, but gets no modal stack, `inert` or focus restore.                            | STILL OPEN (CHANGED) | MERGE, or document the exception                 |
| INFO | `src/utils/eventEngine/eventSelection.ts:291-297` ↔ `src/utils/selectionUtils.ts:66` (`pickWeighted`)                                                                                                              | The inline roll keeps "no event" probability mass, which `pickWeighted` cannot express. The divergence is intentional.                                                                                       | NEW                  | none (optional cross-ref comment)                |

### 1.3 Re-implemented utilities

| Sev | Locations                                                                                               | Description                                                                                                                   | Status  | Action                          |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------- |
| LOW | `src/utils/postGig/dealHandlers.ts:95,100` ↔ `clamps.ts:140,159` (`clampPercent` / `addClampedPercent`) | Brand-reputation clamps are one-sided: `Math.min(100, rep+5)` and `Math.max(0, rep-3)`. See §3.1 #1.                          | NEW     | FIX                             |
| LOW | `src/utils/dailyTickLogic.ts:157-160` ↔ `clampVanBreakdownChance`                                       | The 0..0.5 clamp is written inline instead of calling the helper.                                                             | NEW     | MERGE                           |
| LOW | `src/utils/mapGenerator.ts:58-60` (LCG) ↔ `src/utils/seededRng.ts:19` (`mulberry32`)                    | The seed handling is fixed. The second RNG algorithm stays on purpose, because switching it would change every generated map. | CHANGED | Keep; migrate only deliberately |

### 1.4 Duplicated constants

| Sev | Locations                                                                                                                                                                              | Description                                                                                                                                       | Status  | Action                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| MED | `src/utils/socialEngine.ts:390` (`controversyLevel >= 80`) ↔ `src/utils/dailyTickLogic.ts:151` (`controversySnapshot >= 80`); related `>= 85` at `src/data/events/consequences.ts:429` | The "extreme controversy" tier is hardcoded. The neighbouring tiers (40, 50) already come from `BALANCE_CONFIG.social` via `socialThresholds.ts`. | NEW     | MERGE: add `extremeControversyThreshold` and `isExtremeControversy()` |
| —   | Repair price per point: `assetConfig.ts:97` (8), `betweenTour.ts:68` (12), `repairs.ts:37` (10), `balance.ts:200` (6)                                                                  | Each is now a named constant for a separate concept.                                                                                              | CHANGED | none                                                                  |

**UI duplicates and duplicated types:** none new. Every `role='tablist'` uses `createRovingTabs`. The only inline progress fill is `DeadmanButton`, which has `role='progressbar'`. No exported type name is declared in more than one file.

---

## 2. ORPHANED / UNINTEGRATED CODE

Counted against production reachability from `src/main.tsx` and `api/**`. **No orphaned files.** Every export with no in-file use and no production import is one of three things already recorded in `docs/dead-code-triage.md`: a test seam (`ClockProvider`, `StorageProvider`, `NoopAdapter`, `createFixedClock`, `resetStorageFallback`, `__testInternals`, `NullAudioEngine`, `createStubAudioEngine`), a test or script oracle (`findExpeditionRewardsWithUnreachableTarget`, `getContrabandValidationFailures`, `BASE_EXPEDITION_REGION_ID`, `GIG_CLOCK_DRIFT_TOLERANCE_MS`, `doesLegacyHqItemTouchExpedition`, `resolveBalanceTuning`, `BALANCE_RECOMMENDATION_HOLD`), or part of the 16-line `audioEngine.ts` facade. The defect-constructor trio is also in that doc. The rows below are the exceptions.

### 2.1 Clear orphans and test-only exports

| Sev | Symbol                             | File:line                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                       | Status | Action                                                                              |
| --- | ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| LOW | `isStashEntry`                     | `src/utils/gameState/checks.ts:13`                                        | Only caller is `tests/node/gameStateUtils.test.js:17,62-69`; no use in its own module. Production checks stash stacks inline in about 5 places (`minigameReducer.ts:766`, `bandReducer.ts:528,713`, `systemReducer.ts:650`, `stateSanitizers.ts:204`). Under the triage doc's rule ("dead once nothing in its own module uses it") it is dead. | NEW    | INTEGRATE into the stash sanitizer or reducers, or DELETE it together with its test |
| LOW | `setActiveEvent` (dispatch member) | `src/context/useGameDispatchActions.ts:126` (also returned at `:876,903`) | No consumer outside `src/context`. Used internally by `useEventSystem.ts:258,317`; 4 test files call it through `useGameActions`.                                                                                                                                                                                                              | NEW    | Mark it `@internal` test seam, or drop it from the public type                      |
| —   | `setGameMap`, `setScreenshotMode`  | `useGameDispatchActions.ts:578,136`                                       | `setGameMap` now has its seam test (`GameState.comprehensive.test.jsx:168-204`); `setScreenshotMode` is driven by `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`.                                                                                                                                                   | FIXED  | Add both to the triage seam list                                                    |

### 2.2 Type-only exports used only in their own file

The triage doc's rule says these get demoted: "Type-only exports referenced only in their own file … demote them". Each of these has 0 references in `src/`, `tests/`, `scripts/`, `api/`, `lib/` or `.claude/`.

| Sev | Symbol                      | File:line                                    | Action   |
| --- | --------------------------- | -------------------------------------------- | -------- |
| LOW | `NormalizedQuestEvent`      | `src/utils/questProgress.ts:147`             | UNEXPORT |
| LOW | `LogEvent`                  | `src/utils/logger.ts:264`                    | UNEXPORT |
| LOW | `ExpeditionAccessTier`      | `src/domain/expedition/fame.ts:94`           | UNEXPORT |
| LOW | `ExpeditionLegacyHqPolicy`  | `src/domain/expedition/legacyHqPolicy.ts:22` | UNEXPORT |
| LOW | `PressureDirectorContext`   | `src/domain/expedition/pressure.ts:15`       | UNEXPORT |
| LOW | `BalanceRecommendationHold` | `src/utils/balanceTuning.ts:61`              | UNEXPORT |

### 2.3 Fixed since 2026-10-05

- **Deleted:** `buildAcceptDealQuestEvents` (the whole file), `useGameStore`, `FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP`, the `stopAmbientPlayback` barrel line, the `EVENT_CATEGORIES` re-export, and the `AudioState` / `AudioControls` re-exports.
- **Now have production callers:** `getExpeditionCrisisChoices`, `canPerformExpeditionGig`, `validateExpeditionCrewSelection`, `resolveExpeditionInsuranceClaim`, `isStoryFlag`, `materializeCommittedContracts`, `isExpeditionFinaleReachable`, `getExpeditionNodePublicFacts`, `isRegisteredBreakdownLabelKey`.
- **Now used:** the `QUEST_EXPEDITION_*` constants.
- **Now private:** `HQ_FACILITY_IDS` / `EXPEDITION_UNLOCK_SET_IDS`, which are now rendered by `ExpeditionMetaTab`, and the 33 `*Props`/`*Return` types.

### 2.4 Stale test references

**None.** All 698 test files were checked with the TS checker's export resolution, `export *` included. There are 0 missing modules and 0 missing mocked or imported names; the 2 hits were false positives: a `?query` script import and a `.webm` asset import. Every §2.4 row from 2026-10-05 is FIXED. Not checked: mocks whose factory returns a variable or a helper-built object rather than an inline object literal.

---

## 3. INCONSISTENCIES

### 3.1 Same field handled differently across paths

| Sev | file:line                                                                                                                                                                                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                     | Status | Action                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| MED | `src/context/reducers/sanitizers/stateSanitizers.ts:1443-1452`; `src/context/reducers/socialReducer.ts:219-310` (`UPDATE_SOCIAL`)                                                                                          | **`social.brandReputation` has no clamp authority.** Load accepts any finite value and `UPDATE_SOCIAL` merges it raw. The writers each bound it differently:<br>• `questEffects.ts:93`: `clamp0to100`, floors<br>• `expeditionReducer.ts:2787`: inline min/max, no floor<br>• `dealHandlers.ts:95`: top only<br>• `dealHandlers.ts:100` and `socialReducer.ts:403`: bottom only<br>`brandDealLogic.ts:163` reads the value raw. | NEW    | FIX: add `clampBrandReputation`, apply it in the sanitizer, the reducer and every writer |
| MED | `src/context/reducers/playerReducer.ts:68-87`                                                                                                                                                                              | `UPDATE_PLAYER` re-clamps `van.fuel` and `van.condition` but not `van.breakdownChance`. Load clamps that field to [0, 0.5] (`stateSanitizers.ts:795`), so a raw dispatch can persist NaN or out-of-range values until the next load.                                                                                                                                                                                            | NEW    | FIX: `clampVanBreakdownChance`                                                           |
| LOW | `src/utils/purchaseLogicUtils.ts:307-312`                                                                                                                                                                                  | Van stat modifiers clamp only at 0, so `gear.ts:228` (+5 condition) previews 105. The patch also spreads `player.van` rather than the accumulated patch, so two van effects in one purchase overwrite each other.                                                                                                                                                                                                               | NEW    | FIX: van clamps, and chain the patch                                                     |
| LOW | `dailyTickLogic.ts:337,348`, `useContinueHandler.ts:208` vs `delta.ts:791-794`, `assetTicks.ts:195-200`, `arrivalUtils.ts:213-216`, `purchaseLogicUtils.ts:710-742`, `socialResolution.ts:336-341`, `systemReducer.ts:851` | **NaN recovery defaults diverge.** The daily tick recovers mood to 50 and stamina to 100; every other path recovers to 0.                                                                                                                                                                                                                                                                                                       | NEW    | MERGE: one `readMemberMood` / `readMemberStamina`                                        |
| LOW | `src/utils/socialEngine.ts:284`                                                                                                                                                                                            | Harmony fallback is `finiteNumberOr(harmony, 0)`, while `bandReducer.ts:756` and `socialReducer.ts:178` use 1 (the `clampBandHarmony` floor).                                                                                                                                                                                                                                                                                   | NEW    | MERGE                                                                                    |
| LOW | `stateSanitizers.ts:1226-1248`                                                                                                                                                                                             | Minigame load accepts any finite `equipmentRemaining`, `accumulatedDamage` or `score`, while runtime clamps them to 0..100 (`roadieUtils.ts:89`).                                                                                                                                                                                                                                                                               | NEW    | FIX                                                                                      |
| LOW | `src/utils/gameState/delta.ts:598-599`                                                                                                                                                                                     | The relationship base is `current ?? DEFAULT`. With a NaN base, the clamp returns DEFAULT and the delta is lost. AGENTS.md requires `finiteNumberOr`.                                                                                                                                                                                                                                                                           | NEW    | FIX                                                                                      |

### 3.2 `??` / `typeof` letting NaN through (AGENTS.md: use `finiteNumberOr`)

| Sev | file:line                                 | Failure mode                                                                                               | Status | Action |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ | ------ |
| LOW | `src/utils/gigModifiersUtils.ts:227`      | One NaN stamina makes the average NaN, so the low-stamina drag never applies.                              | NEW    | FIX    |
| LOW | `src/utils/socialEngine.ts:122`           | A NaN `reputationCooldown` looks inactive (fails open).                                                    | NEW    | FIX    |
| LOW | `src/utils/purchaseLogicUtils.ts:409,448` | A NaN `controversyLevel` locks reputation items (fails closed). `contraband.ts:554` uses `finiteNumberOr`. | NEW    | FIX    |
| LOW | `src/domain/expedition/authority.ts:28`   | `(van?.fuel ?? 0) >= 10`: NaN fuel hides the detour exit.                                                  | NEW    | FIX    |
| LOW | `src/hooks/useLeaderboardSync.ts:89-92`   | The follower sum uses `?? 0`, so a NaN is serialized as `null` in the leaderboard payload.                 | NEW    | FIX    |

No `|| <number>` falsy-value bugs were found in `context/`, `utils/`, `domain/` or `hooks/`. No `Number()` coercion is left in sanitizers or creators; the remaining `Number`/`parseInt` calls all run after a regex or safe-integer guard.

### 3.3 Action-creator sanitization

| Sev | file:line                                                                   | Description                                                                                                                   | Status | Action         |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------- |
| LOW | `src/context/actionCreators.ts:391-397` (`createAddToastActionWithId`)      | Spreads the raw payload, unlike `createAddToastAction` (`:411`). The reducer re-validates, so this is a consistency gap only. | NEW    | MERGE          |
| LOW | `src/context/reducers/socialReducer.ts:461-463` (`handleAddVenueBlacklist`) | Destructures its payload without a guard. Internal-only (called from `gigReducer.ts:491`).                                    | NEW    | optional guard |

### 3.4 i18n and UI conventions

- **EN/DE parity:** 0 keys missing in either direction across 10 namespaces. 0 placeholder mismatches, 0 plural mismatches.
- **Code to locale:** 0 missing keys and 0 masking `defaultValue`s.
- **Conventions:** 0 hardcoded colours, 0 `any`, 0 `@ts-ignore`, 0 `.propTypes`. Every money interpolation goes through `formatCurrency`.

| Sev       | file:line                                                               | Description                                                                                                        | Status     | Action                                         |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------- |
| LOW       | `public/locales/de/economy.json` (`brandFlavor.reps.*.*.title`)         | DE keeps the English rep job titles ("VP Partnerships", "Head of Synergy", …). May be intentional jargon.          | NEW        | Confirm, or translate                          |
| LOW       | `src/components/ChatterOverlay.tsx:249-252`                             | The inline `defaultValue: 'Band Feed'` disagrees with the locale `ui:chatter_labels.default_fallback` ("Unknown"). | NEW        | FIX: drop the `defaultValue` or align the copy |
| LOW (DEV) | `src/ui/DebugLogViewer.tsx:118`                                         | Visible "COPY LOGS" text is hardcoded; its `aria-label` already uses `ui:action_copy_logs`.                        | NEW        | FIX                                            |
| —         | `src/components/postGig/CompletePhase.tsx:37` vs `isScandalControversy` | `> 50` vs `>= 50` (see §0).                                                                                        | documented | Product decision                               |

All §3.1 to §3.7 rows from 2026-10-05 are FIXED, including:

- the `.d.ts` imports (a `skipLibCheck:false` probe reports 0 errors in `src/`)
- the chassis loan re-check and the payload guards
- the `Number()` coercion
- the NaN `??` sites
- the clock, RNG and region rules
- all i18n rows
- the `ActionButton` variant union
- `FrameCorners`

---

## 4. DEAD / UNREACHABLE CODE

### 4.1 Findings

| Sev | file:line                                                                                                  | Description                                                                                                                                                                                                                                                 | Status  | Action                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| MED | `src/domain/expedition/meta.ts:292,298` (+ `META_UNLOCK_QUEST_TOKEN` at `:43`)                             | `const hasMetaUnlockMilestone = false`, so the `+META_UNLOCK_QUEST_TOKEN` term can never fire and the constant has no other reader. The comment at `:279-291` explains why: there is no run-scoped completion record. This is a known gap, not an accident. | NEW     | INTEGRATE (persist a run-scoped quest-completion record) or DELETE the dead term and the constant                           |
| LOW | `src/context/actionCreators.ts:891-915`, `src/context/gameReducer.ts:231`, `src/context/actionTypes.ts:46` | `ADVANCE_QUEST`: the `advanceQuest` dispatch member is gone and the creator is tagged `@internal` test-only, so the production reducer case is reachable only from 2 test files or a raw dispatch.                                                          | CHANGED | DELETE the type, creator and case and test `questLifecycle.advanceQuest` directly, or record it in the triage doc as a seam |

### 4.2 Sweeps with no findings

- **Action types:** all 115 have a reducer case and a creator. There are no switch arms for nonexistent types.
- **Constant flags:** no constant conditions other than `meta.ts`. Every `import.meta.env` flag in use is wired.
- **CSS:** 0 unreferenced classes across all 4 CSS files. `overworld.css` shrank from more than 1,066 lines to 641.
- **Data ids:** no dangling item, quest, trait, venue or unlock ids in `src/data`, `src/quests`, `src/domain` or `src/utils`.

### 4.3 Fixed since 2026-10-05

- `c_diy_overdrive` is a real contraband entry.
- `neuro_overclock` is a registered trait.
- Kabelsalat skip branches are live.
- `salvageRights` is wired.
- `GameState.npcs` is removed.
- `banterEvents` is now read and sanitized.
- The `unlock_hq` `effect.id`s are gone; the policy is keyed on item ids and includes `hq_room_diy_soundproofing`.
- `fame.ts` falls back to `UNKNOWN_FAME_PROFILE`.
- The `CrisisModal` placeholder props and `ui:crisis.*` keys are removed.
- The `AssetsScene` dead branch is removed.
- `rare_vinyl` is registry-backed.
- The stale Köln chatter keys are removed.
- The `GigModifierButton` `disabled` prop is wired.

---

## 5. MISSING INTEGRATION (primary interest)

### 5.1 MED — 14 quest event types emitted with no consumer

- **Where:** `src/data/questEventTypes.ts:9-48`, emitted from `src/quests/producers/*`.
- **Types:**
  - `social.loyaltyChanged`, `social.controversyChanged`, `social.trendMatched`
  - `brand.offerAccepted`
  - `asset.acquired`, `asset.repaired`, `asset.moduleInstalled`, `asset.conditionChanged`
  - `item.used`
  - `minigame.completed`, `minigame.failed`
  - `venue.gigCompleted`, `venue.goodGig`
  - `expedition.extracted`
- **Evidence:** each type appears in exactly one `src/` file outside the registry, and that file is its producer (for example `assetQuestEvents.ts:18`, `minigameQuestEvents.ts:18`, `expeditionQuestEvents.ts:30`). No `progressRules` entry anywhere in `src/data/quests/**` uses any of them.
- **Related:** `createFollowersGainedQuestEvent` (`src/quests/producers/socialQuestEvents.ts:36`) is reached only through its own module's emitter and a test.
- **Action:** INTEGRATE quests that consume them, starting with `expedition.extracted` and `minigame.completed`. Otherwise record them in the triage doc as deliberate extension points, so later audits stop flagging them.

### 5.2 MED — `ADVANCE_QUEST` reducer path

See §4.1. Quest progress in production flows only through `APPLY_QUEST_EVENT`, so `ADVANCE_QUEST` is a second, test-only route into `questReducer`.

### 5.3 MED — Meta-unlock tour token

See §4.1. The token is specified ("once per run for a validated milestone") but cannot be minted until a run-scoped quest-completion record is persisted. Check the binding plan section (`docs/superpowers/plans/roguelite-expedition/05-*`) before building or deleting it.

### 5.4 Correction to a lane finding: the Fame access gate IS integrated

`getExpeditionAccessLock` (`src/domain/expedition/fame.ts:188`) has no production import, but it is the in-module body of `getExpeditionNodeBookingLock` and `getExpeditionContractAccessLock`. Those two are used by:

- `src/scenes/Overworld.tsx:52`
- `src/domain/expedition/failure.ts:160`
- `src/domain/expedition/loadout.ts:456,759`
- `src/ui/expedition/TourPrepLoadout.tsx:358`

So the 2026-10-05 §5.3 gap is **FIXED**, and `getExpeditionAccessLock` falls under the triage doc's test-only-export rule.

### 5.5 Fixed since 2026-10-05

- §5.1: Expedition quest offers exist (`src/data/events/quests.ts:525-580`), so Ascension is reachable.
- §5.2: `revealExpeditionNodeIntel` and `createSocialIntelGrant` are wired in `ExpeditionIntelPanel`. `purchaseExpeditionHqFacility` and `purchaseExpeditionUnlockSet` are wired in `ExpeditionMetaTab`. The rest are triaged as composition-only.
- §5.4: Kabelsalat calls `useMinigameSceneLogic` and renders `MinigameSkipButton`.
- §5.5: `extract` is offered, accepted by the reducer and rendered.
- §5.6: every item is fixed. That includes the void-trader controversy gate, which is now enforced in `tradeReducer.ts:57`.

---

## Coverage limits

- There was no AST-level clone detection, so structurally identical blocks with different names may have been missed.
- Not swept:
  - WeakSet cycle safety of every recursive utility.
  - `Object.hasOwn` on payload-keyed registry lookups in `careerReducer`, `crewReducer`, `minigameReducer` and `assetReducer`.
  - Per-creator review of the pass-through creators `SET_MAP`, `SET_GIG`, `START_GIG`, `BLOOD_BANK`, `DARK_WEB_LEAK`, `MERCH_PRESS` and `CULT`.
  - Reachability of the item, trait and module registries.
  - Reverse locale scan (unreferenced keys).
- Some template locale-key families were checked by pattern only: `expedition.prep.reject.*`, `meta.blocked.*`, `risk.event.*`, `roadieRun.itemTypes.*`.

## Suggested fix-pass ordering

1. **State authority:** `brandReputation` clamp authority (§3.1); `UPDATE_PLAYER` `breakdownChance`; the purchase van-patch chaining.
2. **NaN safety:** the five `??` sites (§3.2); unify the mood, stamina and harmony recovery defaults.
3. **Decisions (plan check first):** the quest event consumers (§5.1), the `ADVANCE_QUEST` seam (§4.1), and the meta-unlock token (§5.3).
4. **Merges:** the extreme-controversy tier; `getStashStackCount` in `minigameReducer`; `crewStress` → `clampCondition`; `safeStorageOperation` → `runSafeStorageOperation`.
5. **Cleanup:** the 6 type UNEXPORTs; `isStashEntry`; `setActiveEvent` surface; the ChatterOverlay fallback; DebugLogViewer button text; then refresh `docs/dead-code-triage.md` (seam list: `setGameMap`, `setScreenshotMode`, `getExpeditionAccessLock`) and run `pnpm run deadcode:check` and `pnpm run deadcode:budget`.

---

## Resolution (branch `claude/blissful-goodall-00ww9s`)

Wherever this report offered DELETE or INTEGRATE, the item was INTEGRATED. Items whose only options were DELETE or recording a seam (`ADVANCE_QUEST`, `setActiveEvent`) were recorded as seams.

| Finding                                                                     | Resolution                                                                                                                                                                                | Commit               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| §0 raw contraband keys in Tour Prep, `unlock_hq` type, DebugLogViewer TSDoc | Fixed                                                                                                                                                                                     | `b7fe2d6`            |
| §1.1 `safeStorageOperation` pass-through                                    | Now a re-export alias of `runSafeStorageOperation`                                                                                                                                        | `2be867e`            |
| §1.2 `minigameReducer` stash count                                          | Calls `getStashStackCount`; malformed entries grant no bonus                                                                                                                              | `2be867e`            |
| §1.2 `crewStress` clamp                                                     | New `clampPercentRounded` (`clampCondition` maps Infinity to 0, so it differed)                                                                                                           | `2be867e`            |
| §1.2 `OverworldMenu` focus handling | Kept hand-rolled (non-modal HUD panel; `useModalBehavior` would mark the map `inert`). A follow-up test found that a dialog opened above the still-open menu ("Crash in van" → `advanceDay()` → risk event or foreclosure) lost Escape to the menu. The menu now ignores keys while its branch is `inert`, so the modal stack owns them | `2be867e`, (this commit) |
| §1.2 `eventSelection` weighted roll                                         | Cross-reference comment added                                                                                                                                                             | `2be867e`            |
| §1.3 `dealHandlers` clamps, `dailyTickLogic` breakdown clamp                | Use `clampBrandReputation` / `clampVanBreakdownChance`                                                                                                                                    | `154df83`, `c934008` |
| §1.3 map-generator LCG                                                      | Kept: switching would change every generated map                                                                                                                                          | —                    |
| §1.4 extreme-controversy tier                                               | `BALANCE_CONFIG.social.extremeControversyThreshold` plus `isExtremeControversy()`. `BALANCE_CONFIG_VERSION` goes from 6 to 7. The separate `>= 85` gate in `consequences.ts` is unchanged | `171ecd0`            |
| §2.1 `isStashEntry`                                                         | Integrated: it gates the Roadie stash decrement                                                                                                                                           | `2be867e`            |
| §2.1 `setActiveEvent`, `setGameMap`, `setScreenshotMode`                    | Documented as seams (`@internal`, triage doc)                                                                                                                                             | `e830c78`, `5f19059` |
| §2.2 six type-only exports                                                  | Un-exported                                                                                                                                                                               | `e830c78`            |
| §3.1 `brandReputation`                                                      | `clampBrandReputation` in load, `UPDATE_SOCIAL` and every writer                                                                                                                          | `154df83`            |
| §3.1 `UPDATE_PLAYER` `breakdownChance`; purchase van patch                  | Re-clamped; van effects use the van clamps and chain                                                                                                                                      | `c934008`            |
| §3.1 NaN mood/stamina/harmony defaults                                      | `readMemberMood` / `readMemberStamina` (50/100, as on load); harmony writers recover to 1                                                                                                 | `3683921`, `3705d6e` |
| §3.1 minigame load ranges                                                   | `score` / `accumulatedDamage` 0..100, `equipmentRemaining` ≥ 0                                                                                                                            | `650a182`            |
| §3.1 relationship base                                                      | `finiteNumberOr`                                                                                                                                                                          | `3683921`            |
| §3.2 five `??` NaN sites                                                    | `finiteNumberOr`                                                                                                                                                                          | `3683921`            |
| §3.3 `createAddToastActionWithId`, `handleAddVenueBlacklist`                | Sanitized / guarded                                                                                                                                                                       | `88f5d97`, `39cf652` |
| §3.4 DE rep titles, chatter fallback, COPY LOGS                             | Translated / aligned / `t()`                                                                                                                                                              | `e830c78`            |
| §3.4 post-gig scandal `> 50` vs `>= 50`                                     | Product decision: aligned. Spin Story uses `isScandalControversy`, so it appears from controversy 50 like every other scandal gate                                                        | `ad4e802`            |
| §4.1 / §5.3 meta-unlock token                                               | Integrated: the run-scoped `expedition.metaUnlockQuestCompletedRunId` record is read at settlement                                                                                        | `0f8b847`            |
| §4.1 / §5.2 `ADVANCE_QUEST`                                                 | Recorded as a test seam (`@internal`, triage doc)                                                                                                                                         | `5f19059`            |
| §5.1 14 unconsumed quest event types                                        | Integrated: 8 new quests consume them, all offered                                                                                                                                        | `98341a7`, `d7c9cfc` |
| (found while integrating) `social.trendMatched` never emitted in gameplay   | Now emitted when a resolved social post matches the current trend                                                                                                                         | `d7c9cfc`            |

**Review round** (fresh-context review of `b7fe2d6..b4455bf`, then fixed):

| Review finding                                                                                     | Resolution                                                                                          | Commit               |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------- |
| New quests had no `progressSource`. The registry test failed, and the quest UI showed no hint line | Eight new source ids were added, with EN/DE `ui:quests.progressSource.*` and `hint.nextStep.*` keys | `3e677d6`            |
| `quest_hard_knocks` completed from ordinary travel (TOURBUS)                                       | Rules now match only `ROADIE`, `AMP_CALIBRATION` and `KABELSALAT`                                   | `3e677d6`            |
| `UPDATE_SOCIAL` emitted `social.trendMatched` on every trend rotation                              | Emit removed. The social-post handler is the only producer                                          | `06d0928`            |
| `createCorporateQuest` rewarded `brandReputation.corporate`, a key nothing reads                   | Keys are now `'CORPORATE'`, which also repairs the existing corporate quests                        | `06d0928`, `1149858` |
| `quest_preventive_maintenance` comment did not match its rule                                      | Comment fixed; the rule stays broad                                                                 | `3e677d6`            |

**Left for follow-up:**

- `tests/social/extendedSocial.test.js` imports Vitest, but no Vitest include pattern matches `tests/social/`.
- `reports/game-balance-simulation-baseline.json` still records `questsAvailable: 35`. The quest pool has grown, so regenerate it with `pnpm run simulate:balance:baseline`.
