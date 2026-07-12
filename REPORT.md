# Neurotoxic Codebase Audit Report

**Date:** 2026-07-12
**Scope:** `src/` (excluding tests, dist, node_modules)

## 1. DUPLICATES

*(No exact duplicates or identical duplicated components found. Several utility re-implementations were identified and categorized under INCONSISTENCIES.)*

## 2. ORPHANED / UNINTEGRATED CODE

### Utils & Core Logic
- **[MED]** /app/src/utils/svgTokenUtils.ts:54 - `resetSvgTokenStyleCacheForTesting`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/utils/merchUtils.ts:7 - `HQItemDef`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/utils/questProgress.ts:21 - `LegacyQuestProgressEvent`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### Hooks & Integrations
- **[HIGH]** /app/src/hooks/postGig/handlers/useProcessingGuard.ts:4 - `ProcessingGuardReturn`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### UI & Components
- **[MED]** /app/src/ui/BandHQ.tsx:15 - `BandHQProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/overworld/EventLog.tsx:8 - `EventLogProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/overworld/OverworldHUD.tsx:19 - `OverworldHUDProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /app/src/ui/bandhq/SetlistTab.tsx:98 - `SetlistTabProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### Data, Types & Schemas
- **[LOW]** /app/src/data/songs.ts:42 - `transformSongsData`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/data/craftingRecipes.ts:66 - `CraftingRecipeId`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/context/useGameDispatchActions.ts:82 - `BaseGameDispatchActions`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/types/quest.d.ts:260 - `QuestCommon`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /app/src/types/callbacks.d.ts:17 - `AsyncCallback`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

## 3. INCONSISTENCIES

- **[HIGH]** /app/src/context/reducers/clinicReducer.ts:193
  - **Description**: Arithmetic-then-clamp path `clampMemberMood(prevMood + moodGain)` lacks `finiteNumberOr` wrapper on the addends, violating state payload safety.
  - **Recommendation**: FIX: Wrap persisted values with `finiteNumberOr(value, fallback)` before arithmetic and clamping.

- **[MED]** /app/src/utils/questProgress.ts:429
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/questProgress.ts:431
  - **Description**: Re-implemented numeric narrowing `typeof context.condition === 'number' ? context.condition : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/questProgress.ts:434
  - **Description**: Re-implemented numeric narrowing `typeof context.harmony === 'number' ? context.harmony : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/audio/midiPlayback.ts:567
  - **Description**: Re-implemented numeric narrowing `typeof midiRec.duration === 'number' ? midiRec.duration : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts:72
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/hecklerLogic.ts:136
  - **Description**: Re-implemented numeric narrowing `typeof stats.combo === 'number' ? stats.combo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:65
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.accuracy === 'number' ? gigStats.accuracy : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:66
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.misses === 'number' ? gigStats.misses : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:69
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.maxCombo === 'number' ? gigStats.maxCombo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /app/src/utils/unlockCheck.ts:135
  - **Description**: Re-implemented numeric narrowing `typeof ctx.gearCount === 'number' ? ctx.gearCount : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[LOW]** /app/src/components/stage/stageRenderUtils.ts:308
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/components/stage/pixiAppTeardown.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/components/overworld/utils.ts:24
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/components/postGig/SocialOptionButton.tsx:73
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/scenes/Overworld.tsx:112
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/scenes/PostGig.tsx:113
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:99
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/unlockCheck.ts:110
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:136
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:147
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:148
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:149
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:158
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:168
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/unlockCheck.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:310
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:346
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:355
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/purchaseLogicUtils.ts:717
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:37
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/dailyTickLogic.ts:137
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:196
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:204
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:214
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:218
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:222
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:227
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:276
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/dailyTickLogic.ts:368
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/socialEngine.ts:487
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/eventEngine/resolveChoice.ts:70
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/eventEngine/eventSelection.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/eventEngine/eventSelection.ts:232
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:69
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:92
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/audio/gigPhysics.ts:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/audio/assets.ts:126
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:22
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/audio/songSequencer.ts:25
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:28
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/audio/songSequencer.ts:29
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/utils/audio/songSequencer.ts:32
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/utils/audio/songSequencer.ts:36
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/data/postOptions.ts:43
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/data/postOptions.ts:209
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/postOptions.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/postOptions.ts:254
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/postOptions.ts:255
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/songs.ts:81
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/data/songs.ts:122
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/events/consequences.ts:87
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/events/consequences.ts:88
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/events/consequences.ts:135
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/data/events/consequences.ts:206
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/ui/shared/BrutalistUI.tsx:423
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:379
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:380
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/ui/bandhq/hooks/usePurchaseLogic.ts:505
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/ui/bandhq/detailedStats/components/SocialReachSection.tsx:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/actionCreators.ts:625
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:626
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:852
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:859
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:864
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:941
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/actionCreators.ts:945
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/tradeReducer.ts:74
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/gigReducer.ts:274
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:286
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:294
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:392
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:401
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:411
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/gigReducer.ts:422
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` (or use `finiteNumberOr(..., 0)` if parsing invalid numerics).

- **[LOW]** /app/src/context/reducers/socialReducer.ts:228
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:232
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:237
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:321
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:324
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:344
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:576
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:577
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:578
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:670
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:671
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

- **[LOW]** /app/src/context/reducers/socialReducer.ts:672
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` to explicitly collapse `NaN` to 0.

## 4. DEAD / UNREACHABLE CODE

*(No statically determinable unreachable switch cases or `if (false)` blocks found during this pass.)*

## 5. MISSING INTEGRATION

*(A previous scan suggested several handlers and modals were missing integration, but further repo-wide verification confirmed they are actively wired (e.g., `usePostGigHandlers` orchestrates the post-gig hooks, and `OverworldModals` renders the relevant modals). No major unintegrated features were found in this pass.)*
