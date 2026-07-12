# Neurotoxic Codebase Audit Report

**Date:** 2026-07-12
**Scope:** `src/` (excluding tests, dist, node_modules)

## 1. DUPLICATES

*(No exact duplicates or identical duplicated components found. Several utility re-implementations were identified and categorized under INCONSISTENCIES.)*

## 2. ORPHANED / UNINTEGRATED CODE

### Utils & Core Logic
- **[MED]** /home/user/neurotoxic-game/src/utils/questProgress.ts:21 - `LegacyQuestProgressEvent`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### Hooks & Integrations
- **[HIGH]** /home/user/neurotoxic-game/src/hooks/postGig/handlers/useProcessingGuard.ts:4 - `ProcessingGuardReturn`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### UI & Components
- **[MED]** /home/user/neurotoxic-game/src/ui/BandHQ.tsx:15 - `BandHQProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /home/user/neurotoxic-game/src/ui/overworld/EventLog.tsx:8 - `EventLogProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /home/user/neurotoxic-game/src/ui/overworld/OverworldHUD.tsx:19 - `OverworldHUDProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[MED]** /home/user/neurotoxic-game/src/ui/bandhq/SetlistTab.tsx:98 - `SetlistTabProps`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

### Data, Types & Schemas
- **[LOW]** /home/user/neurotoxic-game/src/data/songs.ts:42 - `transformSongsData`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /home/user/neurotoxic-game/src/data/craftingRecipes.ts:66 - `CraftingRecipeId`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /home/user/neurotoxic-game/src/context/useGameDispatchActions.ts:82 - `BaseGameDispatchActions`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /home/user/neurotoxic-game/src/types/quest.d.ts:260 - `QuestCommon`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.
- **[LOW]** /home/user/neurotoxic-game/src/types/callbacks.d.ts:17 - `AsyncCallback`
  - **Description**: Appears to be a true orphan without tests or docs. (Internal component/util)
  - **Recommendation**: DELETE as it is an unintegrated internal item.

## 3. INCONSISTENCIES

- **[MED]** /home/user/neurotoxic-game/src/utils/questProgress.ts:429
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/questProgress.ts:431
  - **Description**: Re-implemented numeric narrowing `typeof context.condition === 'number' ? context.condition : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/questProgress.ts:434
  - **Description**: Re-implemented numeric narrowing `typeof context.harmony === 'number' ? context.harmony : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/audio/midiPlayback.ts:567
  - **Description**: Re-implemented numeric narrowing `typeof midiRec.duration === 'number' ? midiRec.duration : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts:72
  - **Description**: Re-implemented numeric narrowing `typeof context.loyalty === 'number' ? context.loyalty : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/hecklerLogic.ts:136
  - **Description**: Re-implemented numeric narrowing `typeof stats.combo === 'number' ? stats.combo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:65
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.accuracy === 'number' ? gigStats.accuracy : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:66
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.misses === 'number' ? gigStats.misses : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:69
  - **Description**: Re-implemented numeric narrowing `typeof gigStats.maxCombo === 'number' ? gigStats.maxCombo : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[MED]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:135
  - **Description**: Re-implemented numeric narrowing `typeof ctx.gearCount === 'number' ? ctx.gearCount : 0` instead of using the canonical `finiteNumberOr` helper.
  - **Recommendation**: MERGE: Import and use `finiteNumberOr` from `src/utils/finiteNumber.ts`.

- **[LOW]** /home/user/neurotoxic-game/src/components/stage/pixiAppTeardown.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/components/overworld/utils.ts:24
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/components/postGig/SocialOptionButton.tsx:73
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/scenes/Overworld.tsx:112
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/scenes/PostGig.tsx:113
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:99
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:110
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:136
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:147
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:148
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:149
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:158
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:168
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/unlockCheck.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/purchaseLogicUtils.ts:310
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/purchaseLogicUtils.ts:346
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/purchaseLogicUtils.ts:355
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/purchaseLogicUtils.ts:717
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:37
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:38
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:137
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:175
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:196
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:204
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:214
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:218
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:222
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:227
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:276
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/dailyTickLogic.ts:368
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/socialEngine.ts:487
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/eventEngine/resolveChoice.ts:70
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/eventEngine/eventSelection.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/eventEngine/eventSelection.ts:232
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:69
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/economy/gigLogic/calculators/calculateTicketIncome.ts:92
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/gigPhysics.ts:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/assets.ts:126
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:22
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:25
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:28
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:29
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:32
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/utils/audio/songSequencer.ts:36
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/data/postOptions.ts:43
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/data/postOptions.ts:209
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/postOptions.ts:231
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/postOptions.ts:254
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/postOptions.ts:255
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/songs.ts:81
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/data/songs.ts:122
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/events/consequences.ts:87
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/events/consequences.ts:88
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/events/consequences.ts:135
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/data/events/consequences.ts:206
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/ui/shared/BrutalistUI.tsx:423
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/ui/bandhq/hooks/usePurchaseLogic.ts:379
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/ui/bandhq/hooks/usePurchaseLogic.ts:380
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/ui/bandhq/hooks/usePurchaseLogic.ts:505
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/ui/bandhq/detailedStats/components/SocialReachSection.tsx:85
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:625
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:626
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:852
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:859
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:864
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:941
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/actionCreators.ts:945
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/tradeReducer.ts:74
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/gigReducer.ts:392
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/gigReducer.ts:401
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/gigReducer.ts:411
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/gigReducer.ts:422
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Replace `|| 0` with `?? 0` only where the source is truly nullish; otherwise use `finiteNumberOr`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:321
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:324
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:344
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:576
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:577
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:578
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:670
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:671
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

- **[LOW]** /home/user/neurotoxic-game/src/context/reducers/socialReducer.ts:672
  - **Description**: Mixed use of `||` vs `??` for numeric fallbacks where `0` is a valid falsy value, violating TS and TypeScript rules.
  - **Recommendation**: FIX: Use `finiteNumberOr(..., 0)` where parsing invalid numerics must collapse to 0 to avoid preserving `NaN`.

## 4. DEAD / UNREACHABLE CODE

*(No statically determinable unreachable switch cases or `if (false)` blocks found during this pass.)*

## 5. MISSING INTEGRATION

- **[HIGH]** /home/user/neurotoxic-game/src/hooks/minigames/useAmpLogic.ts
  - **Description**: The `updateAmpGameState` hook and associated `AmpGameRefs` / `AmpGameSetters` logic are fully implemented but remain unimported in any minigame component. The `useAmpLogic` wrapper hook itself appears unintegrated.
  - **Recommendation**: INTEGRATE into the `AmpCalibration` minigame view or DELETE if replaced by an alternative implementation.

- **[HIGH]** /home/user/neurotoxic-game/src/hooks/minigames/useTourbusLogic.ts
  - **Description**: The Tourbus minigame damage constants (`HIT_DAMAGE_BASE`, `HIT_DAMAGE_ARMOR`, etc.) and `getHitDamage` logic are fully built but not imported in the corresponding `TourbusStageController` or `useTourbusLogic` integration paths.
  - **Recommendation**: INTEGRATE into the tourbus hit resolution flow.
