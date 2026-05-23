# Neurotoxic Game Codebase Audit Report

## 1. DUPLICATES

### Missing Sanitization Duplicates
**Severity:** MEDIUM
**Locations:**
- `src/context/useGameDispatchActions.ts` (multiple hooks duplicating actionCreator sanitization inline or skipping it entirely)
**Description:** Action creators are the single source of truth for sanitization per `AGENTS.md`. However, many hooks implement inline validation instead of relying on the action creators, leading to duplicated or missed logic.
**Recommended Action:** MERGE inline validation logic into `actionCreators.ts` and ensure all dispatches use the provided action creators.

## 2. ORPHANED / UNINTEGRATED SYMBOLS

### Audio Subsystem Cleanup Helpers
**Severity:** LOW
**Locations:**
- `src/utils/audio/cleanupUtils.ts` - `clearTransportEvent`
- `src/utils/audio/cleanupUtils.ts` - `stopAndDisconnectSource`
**Description:** Audio cleanup utilities defined but never called, suggesting potential memory/event leaks during audio lifecycle changes.
**Recommended Action:** INTEGRATE into `audioEngine.ts` teardown flows or DELETE if superseded by Tone.js garbage collection.

### Minigame Configs & Physics Helpers
**Severity:** MEDIUM
**Locations:**
- `src/hooks/minigames/useTourbusLogic.ts` - `HIT_DAMAGE_BASE`, `HIT_DAMAGE_ARMOR`, `HIT_DAMAGE_BULLBAR`
- `src/hooks/minigames/useRoadieLogic.ts` - `checkCollision`, `handleCrash`, `handlePickup`, `handleDelivery`
- `src/scenes/kabelsalat/components/HardwareProps.tsx` - `RackScrew`
**Description:** Multiple minigames have logic stubs and exported constants that are never used by the main loop, suggesting incomplete implementation or dead code from a previous refactor.
**Recommended Action:** DELETE if unused, or INTEGRATE into the minigame tick loops if these are missing physics/damage features.

### Contraband Drop Tuning
**Severity:** LOW
**Locations:**
- `src/utils/contrabandUtils.ts` - `DROP_BASE_CHANCE`, `LUCK_MOD_PER_POINT`, `MAX_DROP_CHANCE`, `BUST_CHANCE_BY_RARITY`, `pickRarity`, `pickRandomContrabandByRarity`
**Description:** Complex contraband generation math is fully defined but never imported anywhere.
**Recommended Action:** INTEGRATE into the post-gig or travel event drop generation loops.

### Gig Effects & Visuals
**Severity:** LOW
**Locations:**
- `src/hooks/useGigEffects.ts` - `calculateChaosStyle`, `playBandMemberAnimation`, `applyChaosJitter`
**Description:** Visual effect calculations are implemented but never bound to the React component render paths.
**Recommended Action:** INTEGRATE into `PixiStageController` or `GigHUD` rendering layers.

## 3. INCONSISTENCIES

### Reducer Case Fallthrough & Organization
**Severity:** HIGH
**Locations:**
- `src/context/gameReducer.ts` vs `src/context/reducers/bandReducer.ts`
**Description:** Most actions are handled via the `reducerMap` in `gameReducer.ts`. However, band-related actions (e.g., `UPDATE_BAND`, `UNLOCK_TRAIT`, `CONSUME_ITEM`, `USE_CONTRABAND`, `TOGGLE_NEURO_DECIMATOR`) bypass this map entirely and fall through to a legacy `switch` statement in `bandReducer`.
**Recommended Action:** FIX by refactoring `bandReducer` actions into the main `reducerMap` pattern for consistency and O(1) dispatch.

### Nullish Coalescing vs Logical OR (Falsy Preservation)
**Severity:** MEDIUM
**Locations:**
- `src/context/actionCreators.ts` (multiple lines: 481, 482, 637, 644, 649, 724, 728)
**Description:** `AGENTS.md` explicitly dictates: "Preserve valid falsy values with nullish checks (??), not truthy fallbacks (||)". Action creators like `createCompleteRoadieMinigameAction`, `createAddQuestAction`, and `createClinicHealAction` use `Number(val) || 0` which destroys valid `0` values (though `|| 0` results in `0`, it is an anti-pattern that violates the rule).
**Recommended Action:** FIX by replacing `|| 0` with `?? 0` and explicitly checking for `NaN`.

### Hardcoded Colors
**Severity:** MEDIUM
**Locations:**
- `src/components/overworld/OverworldMap.tsx` (Lines 56-59)
**Description:** Contains hardcoded hex colors (`#0a0a0a`, `#ffffff`, `#00ff41`, `#888888`) contrary to the `AGENTS.md` rule "Do not hardcode colors. Use CSS vars or Pixi token helpers".
**Recommended Action:** FIX by replacing hex codes with `getPixiColorFromToken('--color-name')`.

## 4. DEAD / UNREACHABLE

### Unreachable Reducer Exports
**Severity:** LOW
**Locations:**
- `src/context/reducers/questReducer.ts` - `handleFailQuests`
- `src/context/reducers/bandReducer.ts` - `handleUpdateBand`, `handleUnlockTrait`, `handleConsumeItem`, `handleUseContraband`, `handleToggleNeuroDecimator`
**Description:** These reducer handlers are exported but only used internally within their own module's switch statement (or not at all for `handleFailQuests`).
**Recommended Action:** FIX by removing `export` keyword or migrating to `gameReducer` map.

## 5. MISSING INTEGRATION (USER'S PRIMARY INTEREST)

### Contraband System
**Severity:** HIGH
**Locations:**
- `src/utils/contrabandUtils.ts`
**Description:** The entire drop table and generation logic for Contraband (Base chance, Luck modifiers, Rarity picking) is fully implemented but completely orphaned. Players cannot actually acquire contraband through normal game loops because the generation math is never called.
**Recommended Action:** INTEGRATE `pickRandomContraband` and drop logic into `postGigUtils.ts` or travel event generation.

### Roadie Minigame Mechanics
**Severity:** HIGH
**Locations:**
- `src/hooks/minigames/useRoadieLogic.ts`
**Description:** The core physics and game loop for the Roadie minigame (`checkCollision`, `handleCrash`, `handlePickup`, `handleDelivery`) are orphaned. The minigame likely renders but cannot be played or won because the interaction logic is unhooked.
**Recommended Action:** INTEGRATE into the `useRoadieLogic` tick/update loop.

### Gig Chaos Visuals
**Severity:** HIGH
**Locations:**
- `src/hooks/useGigEffects.ts`
**Description:** Visual feedback for high-chaos or negative gig states (`calculateChaosStyle`, `applyChaosJitter`, `playBandMemberAnimation`) exists but is never applied to the UI components.
**Recommended Action:** INTEGRATE into `GigHUD.tsx` or `PixiStage.tsx` render passes.
